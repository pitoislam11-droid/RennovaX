import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { api } from '@/lib/api/api';
import { authClient } from '@/lib/auth/auth-client';
import { useInvalidateSession } from '@/lib/auth/use-session';
import type { UserRole } from '@/lib/contracts';
import { colors, typefaces } from '@/lib/design/tokens';
import { useQuietEntrance } from '@/lib/motion';
import { queryKeys } from '@/lib/query-keys';

type AuthMode = 'sign-in' | 'sign-up';

function Field({
  value,
  onChangeText,
  placeholder,
  icon: Icon,
  testID,
  secureTextEntry,
  keyboardType,
  textContentType,
  right,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon: typeof Mail;
  testID: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  textContentType?: 'name' | 'emailAddress' | 'password' | 'newPassword';
  right?: React.ReactNode;
}) {
  return (
    <View className="mb-3 min-h-14 flex-row items-center rounded-2xl border border-[#DDD8CC] bg-[#FFFDF8] px-4">
      <Icon color={colors.muted} size={20} />
      <TextInput
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        autoCorrect={false}
        className="ml-3 flex-1 py-4 text-base"
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9A978F"
        secureTextEntry={secureTextEntry}
        style={{ color: colors.ink, fontFamily: typefaces.regular }}
        testID={testID}
        textContentType={textContentType}
        value={value}
      />
      {right}
    </View>
  );
}

export default function AuthScreen() {
  const params = useLocalSearchParams<{ role?: string; mode?: string; email?: string }>();
  const role: UserRole = params.role === 'CONTRACTOR' ? 'CONTRACTOR' : 'HOMEOWNER';
  const [mode, setMode] = useState<AuthMode>(params.mode === 'sign-up' ? 'sign-up' : 'sign-in');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>(params.email ?? '');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const authenticatedRef = useRef<boolean>(false);
  const { enter } = useQuietEntrance();
  const queryClient = useQueryClient();
  const invalidateSession = useInvalidateSession();

  const title = useMemo(() => mode === 'sign-up' ? 'Create your account' : 'Welcome back', [mode]);

  const authMutation = useMutation({
    mutationFn: async () => {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail.includes('@')) throw new Error('Enter a valid email address.');
      if (password.length < 8) throw new Error('Your password needs at least 8 characters.');
      if (mode === 'sign-up' && name.trim().length < 2) throw new Error('Tell us what to call you.');

      if (!authenticatedRef.current) {
        const result = mode === 'sign-up'
          ? await authClient.signUp.email({ name: name.trim(), email: trimmedEmail, password })
          : await authClient.signIn.email({ email: trimmedEmail, password });
        if (result.error) throw new Error(result.error.message ?? 'We could not sign you in.');
        authenticatedRef.current = true;
      }

      try {
        await api.post<{ activeRole: UserRole; roles: UserRole[] }, { role: UserRole }>('/api/profile/roles', { role });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'We could not finish setting up your role.';
        throw new Error(`${message} Your account is signed in — tap below to try again.`);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      await invalidateSession();
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      style={{ backgroundColor: colors.canvas }}
      testID="auth-screen"
    >
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScreenHeader />
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={enter(0)} className="mt-3">
            <BrandMark compact />
            <Text className="mt-8 text-[34px] leading-[39px] tracking-[-1px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>
              {title}
            </Text>
            <Text className="mt-2 text-[15px] leading-6" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
              {mode === 'sign-up'
                ? role === 'HOMEOWNER'
                  ? 'Create a homeowner account — a clear route from first idea to finished work.'
                  : 'Create a contractor account — win work from complete briefs.'
                : 'Pick up your projects where you left them.'}
            </Text>
          </Animated.View>

          <Animated.View entering={enter(80)} className="mt-8">
            {mode === 'sign-up' ? (
              <Field
                icon={UserRound}
                onChangeText={setName}
                placeholder="Your name"
                testID="name-input"
                textContentType="name"
                value={name}
              />
            ) : null}
            <Field
              icon={Mail}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Email address"
              testID="email-input"
              textContentType="emailAddress"
              value={email}
            />
            <Field
              icon={LockKeyhole}
              onChangeText={setPassword}
              placeholder="Password"
              right={(
                <Pressable
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={() => setShowPassword((value) => !value)}
                  testID="toggle-password-button"
                >
                  {showPassword ? <EyeOff color={colors.muted} size={20} /> : <Eye color={colors.muted} size={20} />}
                </Pressable>
              )}
              secureTextEntry={!showPassword}
              testID="password-input"
              textContentType={mode === 'sign-up' ? 'newPassword' : 'password'}
              value={password}
            />

            {mode === 'sign-in' ? (
              <Pressable
                accessibilityLabel="Forgot password"
                accessibilityRole="link"
                className="mb-5 self-end px-1 py-2"
                onPress={() => router.push({ pathname: '/forgot-password', params: { email } })}
                testID="forgot-password-link"
              >
                <Text className="text-sm" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Forgot password?</Text>
              </Pressable>
            ) : <View className="h-3" />}

            {authMutation.error ? (
              <View className="mb-4 rounded-2xl bg-[#FFF0EC] px-4 py-3" testID="auth-error">
                <Text className="text-sm leading-5" style={{ color: colors.red, fontFamily: typefaces.medium }}>
                  {authMutation.error.message}
                </Text>
              </View>
            ) : null}

            <Button
              label={authenticatedRef.current ? 'Finish setup' : mode === 'sign-up' ? 'Create account' : 'Sign in'}
              loading={authMutation.isPending}
              onPress={() => authMutation.mutate()}
              testID="auth-submit-button"
              variant="primary"
            />

            <Pressable
              accessibilityRole="button"
              className="mt-6 flex-row justify-center py-2"
              onPress={() => {
                authMutation.reset();
                setMode((value) => value === 'sign-in' ? 'sign-up' : 'sign-in');
              }}
              testID="toggle-auth-mode-button"
            >
              <Text className="text-sm" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
                {mode === 'sign-in' ? 'New to Rennova? ' : 'Already have an account? '}
              </Text>
              <Text className="text-sm" style={{ color: colors.ink, fontFamily: typefaces.demi }}>
                {mode === 'sign-in' ? 'Create account' : 'Sign in'}
              </Text>
            </Pressable>

            <Text className="mt-4 text-center text-[12px] leading-5" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
              By continuing you agree to our{' '}
              <Text onPress={() => router.push('/terms')} style={{ color: colors.ink, fontFamily: typefaces.demi }}>Terms</Text>
              {' '}and{' '}
              <Text onPress={() => router.push('/privacy')} style={{ color: colors.ink, fontFamily: typefaces.demi }}>Privacy</Text>
              .
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
