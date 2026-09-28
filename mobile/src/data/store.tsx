import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session as AuthSession } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { AppState as RNAppState } from 'react-native';

import { showAlert } from '@/lib/dialog';

import { backendEnabled, supabase } from './backend/client';
import { deleteAccount, loadSnapshot, performRemote } from './backend/remote';
import { buildState } from './backend/rows';
import { DEMO_MODE, demoQuotesFor } from './demo';
import { reducer, type Action } from './reducer';
import { createSeed } from './seed';
import type { AppState, Contractor, Homeowner, Project, Viewer } from './types';

const DEMO_STORAGE_KEY = 'rennova/state/v1';
const ONBOARDED_KEY = 'rennova/onboarded';
/** The role picked on the welcome screens, used to preselect it after sign-in. */
export const INTENDED_ROLE_KEY = 'rennova/intended-role';

/** Present only when running against the live backend. */
export interface Account {
  userId: string;
  email: string;
  profileComplete: boolean;
  hasBusiness: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

interface StoreValue {
  state: AppState;
  dispatch: (action: Action) => void;
  viewer: Viewer;
  me: Homeowner;
  myBusiness: Contractor;
  contractor: (id: string) => Contractor | undefined;
  project: (id: string) => Project | undefined;
  /** True when connected to Supabase; false on demo data. */
  live: boolean;
  account: Account | null;
}

const StoreContext = createContext<StoreValue | null>(null);

const EMPTY_STATE: AppState = {
  session: { onboarded: false, role: 'homeowner', homeownerId: '', contractorId: '' },
  homeowners: [],
  contractors: [],
  projects: [],
  quotes: [],
  callRequests: [],
  threads: [],
  reviews: [],
  blockedIds: [],
};

const NOBODY: Homeowner = { id: '', firstName: '', lastName: '', email: '', phone: '', postcode: '' };
const NO_BUSINESS: Contractor = {
  id: '', ownerId: '', name: '', initials: '', logoColor: '#5B6270', businessType: 'company', categories: [], rating: 0, reviewCount: 0,
  yearsExperience: 0, projectsCompleted: 0, verifiedBusiness: false, insured: false, insuranceCover: '', about: '', services: [],
  areas: [], baseArea: '', replyTime: '', phone: '', cover: '', portfolio: [],
};

function makeValue(state: AppState, dispatch: (a: Action) => void, live: boolean, account: Account | null): StoreValue {
  const viewer: Viewer =
    state.session.role === 'homeowner'
      ? { role: 'homeowner', homeownerId: state.session.homeownerId }
      : { role: 'contractor', contractorId: state.session.contractorId };
  return {
    state,
    dispatch,
    viewer,
    me: state.homeowners.find((h) => h.id === state.session.homeownerId) ?? NOBODY,
    myBusiness: state.contractors.find((c) => c.id === state.session.contractorId) ?? NO_BUSINESS,
    contractor: (id) => state.contractors.find((c) => c.id === id),
    project: (id) => state.projects.find((p) => p.id === id),
    live,
    account,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  return backendEnabled ? <LiveStoreProvider>{children}</LiveStoreProvider> : <DemoStoreProvider>{children}</DemoStoreProvider>;
}

/* ------------------------------------------------------------------------------------------ */
/* Demo: everything on the device                                                             */
/* ------------------------------------------------------------------------------------------ */

function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => createSeed());
  const [ready, setReady] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(DEMO_STORAGE_KEY)
      .then((raw) => {
        if (raw) dispatch({ type: 'hydrate', state: JSON.parse(raw) as AppState });
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [state, ready]);

  const value = useMemo(() => {
    const wrapped = (action: Action) => {
      dispatch(action);
      if (DEMO_MODE && action.type === 'publishProject') {
        demoQuotesFor(action.project, state.contractors).forEach((quote, i) => {
          timers.current.push(setTimeout(() => dispatch({ type: 'submitQuote', quote }), 4000 + i * 5000));
        });
      }
    };
    return makeValue(state, wrapped, false, null);
  }, [state]);

  if (!ready) return null;
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/* ------------------------------------------------------------------------------------------ */
/* Live: Supabase                                                                             */
/* ------------------------------------------------------------------------------------------ */

function LiveStoreProvider({ children }: { children: ReactNode }) {
  const db = supabase!;
  const [auth, setAuth] = useState<AuthSession | null | undefined>(undefined);
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [loaded, setLoaded] = useState(false);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const userId = auth?.user.id ?? null;
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY)
      .then((v) => setOnboarded(v === '1'))
      .catch(() => setOnboarded(false));
    db.auth.getSession().then(({ data }) => setAuth(data.session));
    const { data: sub } = db.auth.onAuthStateChange((_event, session) => setAuth(session));
    // Refresh tokens only while the app is in the foreground.
    const appSub = RNAppState.addEventListener('change', (s) => (s === 'active' ? db.auth.startAutoRefresh() : db.auth.stopAutoRefresh()));
    return () => {
      sub.subscription.unsubscribe();
      appSub.remove();
    };
  }, [db]);

  const reload = useCallback(async () => {
    if (!userId) return;
    try {
      setState(buildState(await loadSnapshot(db, userId)));
    } catch (e) {
      showAlert('Could not load your data', e instanceof Error ? e.message : String(e));
    } finally {
      setLoaded(true);
    }
  }, [db, userId]);

  useEffect(() => {
    setLoaded(false);
    if (userId) reload();
    else {
      setState(EMPTY_STATE);
      setLoaded(true);
    }
  }, [userId, reload]);

  // Live updates: new quotes, messages, call requests and stage changes.
  useEffect(() => {
    if (!userId) return;
    const soon = () => {
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
      reloadTimer.current = setTimeout(reload, 400);
    };
    const channel = db.channel(`rennova-${userId}`);
    for (const table of ['projects', 'quotes', 'call_requests', 'messages']) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, soon);
    }
    channel.subscribe();
    return () => {
      db.removeChannel(channel);
    };
  }, [db, userId, reload]);

  const dispatch = useCallback(
    (action: Action) => {
      if (action.type === 'onboard') {
        setOnboarded(true);
        AsyncStorage.setItem(ONBOARDED_KEY, '1').catch(() => undefined);
        return;
      }
      if (!userId) return;
      // Show the change straight away, then let the server confirm it.
      setState((s) => reducer(s, action));
      performRemote(db, userId, action)
        .catch((e) => showAlert('That didn’t save', e instanceof Error ? e.message : String(e)))
        .finally(reload);
    },
    [db, userId, reload],
  );

  const value = useMemo(() => {
    const withFlags: AppState = { ...state, session: { ...state.session, onboarded: onboarded ?? false } };
    const me = state.homeowners.find((h) => h.id === userId);
    const account: Account | null = userId
      ? {
          userId,
          email: auth?.user.email ?? '',
          profileComplete: !!me?.firstName,
          hasBusiness: state.session.contractorId !== '',
          refresh: reload,
          signOut: async () => {
            await db.auth.signOut();
          },
          deleteAccount: () => deleteAccount(db, userId),
        }
      : null;
    return makeValue(withFlags, dispatch, true, account);
  }, [state, onboarded, userId, auth, dispatch, reload, db]);

  if (auth === undefined || onboarded === null || !loaded) return null;
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
