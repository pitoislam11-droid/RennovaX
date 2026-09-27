import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DialogHost } from '@/components/DialogHost';
import { StoreProvider } from '@/data/store';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StoreProvider>
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
