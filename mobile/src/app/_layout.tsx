import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DialogHost } from '@/components/DialogHost';
import { supabase } from '@/data/backend/client';
import { StoreProvider, useStore } from '@/data/store';
import { listenForNotificationOpens, prepareNotifications, registerPushToken } from '@/lib/push';
import { colors } from '@/theme';

function NotificationBridge() {
  const { live, account, state } = useStore();

  useEffect(() => listenForNotificationOpens(), []);

  useEffect(() => {
    if (!state.session.onboarded) return;
    prepareNotifications().catch(() => undefined);
  }, [state.session.onboarded]);

  useEffect(() => {
    if (!live || !account || !supabase) return;
    registerPushToken(supabase).catch(() => undefined);
  }, [live, account?.userId]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StoreProvider>
        <NotificationBridge />
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="call/[id]" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.72], sheetGrabberVisible: true, sheetCornerRadius: 28 }} />
          <Stack.Screen name="review/[projectId]" options={{ presentation: 'modal' }} />
        </Stack>
        <DialogHost />
      </StoreProvider>
    </GestureHandlerRootView>
  );
}
