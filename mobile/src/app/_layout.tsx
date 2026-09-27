import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { ErrorState } from '@/components/ui/state-view';
import { useSession } from '@/lib/auth/use-session';
import { colors } from '@/lib/design/tokens';
import { useColorScheme } from '@/lib/useColorScheme';

export const unstable_settings = {
  initialRouteName: 'index',
};

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: true },
    mutations: { retry: 0 },
  },
});

const rennovaTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.canvas,
    card: colors.paper,
    primary: colors.ink,
    text: colors.ink,
    border: colors.line,
  },
};

function RootLayoutNav({ colorScheme: _colorScheme }: { colorScheme: 'light' | 'dark' | null | undefined }) {
  const { data: session, error, isError, isLoading, refetch } = useSession();

  if (isLoading) return null;
  if (isError) {
    return (
      <ThemeProvider value={rennovaTheme}>
        <View
          className="flex-1 justify-center px-6"
          onLayout={() => {
            void SplashScreen.hideAsync();
          }}
          style={{ backgroundColor: colors.canvas }}
          testID="session-error-screen"
        >
          <ErrorState message={error.message} onRetry={() => void refetch()} testID="session-error" />
        </View>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={rennovaTheme}>
      <View
        className="flex-1"
        onLayout={() => {
          void SplashScreen.hideAsync();
        }}
        style={{ backgroundColor: colors.canvas }}
      >
        <Stack screenOptions={{ animation: 'fade', contentStyle: { backgroundColor: colors.canvas }, headerShown: false }}>
          <Stack.Screen name="privacy" />
          <Stack.Screen name="terms" />
          <Stack.Protected guard={Boolean(session?.user)}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
          <Stack.Protected guard={!session?.user}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="reset-password" />
          </Stack.Protected>
        </Stack>
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <StatusBar style="dark" />
          <RootLayoutNav colorScheme={colorScheme} />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
