import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { Platform } from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js';

import { notificationPath, type PushNotice } from '@/data/notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let currentToken: string | null = null;

function projectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

/** Ask for permission and, on Android, create the channel the server sends to. */
export async function prepareNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Rennova',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status !== 'granted') await Notifications.requestPermissionsAsync();
}

/**
 * Store this phone's Expo push token for the signed-in member.
 * Remote push needs an EAS project id (a development or store build). Expo Go without one
 * still shows the local demo notifications.
 */
export async function registerPushToken(db: SupabaseClient): Promise<void> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
  await prepareNotifications();
  const id = projectId();
  if (!id) return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId: id })).data;
  currentToken = token;
  const { error } = await db.rpc('register_push_token', { p_token: token, p_platform: Platform.OS });
  if (error) throw error;
}

/** Drop this phone's token before signing out, so the next person on it is not told about this account. */
export async function unregisterPushToken(db: SupabaseClient): Promise<void> {
  if (!currentToken) return;
  const token = currentToken;
  currentToken = null;
  await db.rpc('unregister_push_token', { p_token: token });
}

/** Show a notification immediately. Used in demo mode, where there is no server to send one. */
export async function presentLocal(notice: PushNotice): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title: notice.title, body: notice.body, data: { kind: notice.kind, url: notice.url }, sound: 'default' },
      trigger: null,
    });
  } catch {
    // Permission denied, or a simulator that cannot present notifications. The action itself still stands.
  }
}

function openFromResponse(response: Notifications.NotificationResponse | null): void {
  if (!response) return;
  const path = notificationPath(response.notification.request.content.data as Record<string, unknown>);
  if (path) router.push(path as Href);
}

/** Open the right screen when someone taps a notification, including one that launched the app. */
export function listenForNotificationOpens(): () => void {
  if (Platform.OS === 'web') return () => undefined;
  const sub = Notifications.addNotificationResponseReceivedListener(openFromResponse);
  Notifications.getLastNotificationResponseAsync().then(openFromResponse).catch(() => undefined);
  return () => sub.remove();
}
