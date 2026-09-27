import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';

import { DEMO_MODE, demoQuotesFor } from './demo';
import { reducer, type Action } from './reducer';
import { createSeed } from './seed';
import type { AppState, Contractor, Homeowner, Project, Viewer } from './types';

const STORAGE_KEY = 'rennova/state/v1';

interface StoreValue {
  state: AppState;
  dispatch: (action: Action) => void;
  viewer: Viewer;
  me: Homeowner;
  myBusiness: Contractor;
  contractor: (id: string) => Contractor | undefined;
  project: (id: string) => Project | undefined;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => createSeed());
  const [ready, setReady] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) dispatch({ type: 'hydrate', state: JSON.parse(raw) as AppState });
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [state, ready]);

  const value = useMemo<StoreValue>(() => {
    const wrapped = (action: Action) => {
      dispatch(action);
      if (DEMO_MODE && action.type === 'publishProject') {
        demoQuotesFor(action.project, state.contractors).forEach((quote, i) => {
          timers.current.push(setTimeout(() => dispatch({ type: 'submitQuote', quote }), 4000 + i * 5000));
        });
      }
    };
    const viewer: Viewer =
      state.session.role === 'homeowner'
        ? { role: 'homeowner', homeownerId: state.session.homeownerId }
        : { role: 'contractor', contractorId: state.session.contractorId };
    return {
      state,
      dispatch: wrapped,
      viewer,
      me: state.homeowners.find((h) => h.id === state.session.homeownerId)!,
      myBusiness: state.contractors.find((c) => c.id === state.session.contractorId)!,
      contractor: (id) => state.contractors.find((c) => c.id === id),
      project: (id) => state.projects.find((p) => p.id === id),
    };
  }, [state]);

  if (!ready) return null;
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
