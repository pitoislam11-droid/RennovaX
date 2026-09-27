import { Stack } from 'expo-router';

import { colors } from '@/lib/design/tokens';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ animation: 'fade_from_bottom', contentStyle: { backgroundColor: colors.canvas }, headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="role-select" />
      <Stack.Screen name="contractor-setup" />
      <Stack.Screen name="contractor-next" />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(contractor-tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="new-project" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="project-intake" options={{ gestureEnabled: false }} />
      <Stack.Screen name="project-review" options={{ gestureEnabled: false }} />
      <Stack.Screen name="project/[id]" />
      <Stack.Screen name="opportunity/[id]" />
      <Stack.Screen name="messages/[projectId]" />
      <Stack.Screen name="contractor/[id]" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="about" />
      <Stack.Screen name="delete-account" />
      <Stack.Screen
        name="notifications"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.42, 0.62],
          sheetGrabberVisible: true,
          headerShown: false,
        }}
      />
    </Stack>
  );
}
