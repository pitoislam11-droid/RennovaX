import { fetch } from 'expo/fetch';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
const cookieStorageKey = 'rennova_auth_cookie';

type AuthError = { message: string; code?: string };
type AuthResult<T> = { data: T | null; error: AuthError | null };

type SessionData = {
  user: { id: string; name: string; email: string; image?: string | null };
  session: { id: string; userId: string; expiresAt: string };
};

type CookieRecord = Record<string, string>;

async function readCookieRecord(): Promise<CookieRecord> {
  if (Platform.OS === 'web') return {};
  const value = await SecureStore.getItemAsync(cookieStorageKey);
  if (!value) return {};
  try {
    return JSON.parse(value) as CookieRecord;
  } catch {
    return {};
  }
}

async function persistResponseCookies(header: string | null) {
  if (Platform.OS === 'web' || !header) return;
  const current = await readCookieRecord();
  const matches = header.matchAll(/(?:^|,\s*)((?:__Secure-)?better-auth\.[^=;,\s]+)=([^;,\s]*)/g);
  let changed = false;
  for (const match of matches) {
    const [, name, value] = match;
    if (!name) continue;
    changed = true;
    if (!value) delete current[name];
    else current[name] = value;
  }
  if (changed) await SecureStore.setItemAsync(cookieStorageKey, JSON.stringify(current));
}

async function getCookie() {
  const entries = Object.entries(await readCookieRecord());
  return entries.map(([name, value]) => `${name}=${value}`).join('; ');
}

async function authRequest<T>(path: string, body?: object): Promise<AuthResult<T>> {
  if (!baseUrl) return { data: null, error: { message: 'The Rennova service is not configured yet.' } };
  try {
    const cookie = await getCookie();
    const response = await fetch(`${baseUrl}/api/auth${path}`, {
      method: body ? 'POST' : 'GET',
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...(Platform.OS === 'web' ? {} : { 'expo-origin': Linking.createURL('', { scheme: 'rennova' }), 'x-skip-oauth-proxy': 'true' }),
      },
    });
    await persistResponseCookies(response.headers.get('set-cookie'));
    const payload = await response.json().catch(() => null) as (T & { message?: string; code?: string }) | null;
    if (!response.ok) {
      return {
        data: null,
        error: {
          message: payload?.message ?? 'We could not complete that request.',
          code: payload?.code,
        },
      };
    }
    return { data: payload as T, error: null };
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : 'Unable to connect to Rennova.' } };
  }
}

export const authClient = {
  getCookie,
  getSession: () => authRequest<SessionData | null>('/get-session'),
  signUp: {
    email: (input: { name: string; email: string; password: string }) => authRequest('/sign-up/email', input),
  },
  signIn: {
    email: (input: { email: string; password: string }) => authRequest('/sign-in/email', input),
  },
  signOut: async () => {
    const result = await authRequest('/sign-out', {});
    if (!result.error && Platform.OS !== 'web') await SecureStore.deleteItemAsync(cookieStorageKey);
    return result;
  },
  emailOtp: {
    requestPasswordReset: (input: { email: string }) => authRequest('/email-otp/request-password-reset', input),
    resetPassword: (input: { email: string; otp: string; password: string }) => authRequest('/email-otp/reset-password', input),
  },
};
