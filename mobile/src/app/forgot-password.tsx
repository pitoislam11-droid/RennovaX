import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { authClient } from '@/lib/auth/auth-client';
import { colors, typefaces } from '@/lib/design/tokens';

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState<string>(params.email ?? '');
  const mutation = useMutation({
    mutationFn: async () => {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed.includes('@')) throw new Error('Enter the email address for your account.');
      const result = await authClient.emailOtp.requestPasswordReset({ email: trimmed });
      if (result.error) throw new Error(result.error.message ?? 'We could not send a reset code.');
      return trimmed;
    },
    onSuccess: (trimmedEmail) => router.push({ pathname: '/reset-password', params: { email: trimmedEmail } }),
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1" style={{ backgroundColor: colors.canvas }} testID="forgot-password-screen">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScreenHeader subtitle="Account help" title="Reset password" />
        <View className="flex-1 px-6 pt-10">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF2A8]">
            <Mail color={colors.ink} size={25} />
          </View>
          <Text className="mt-6 text-[32px] leading-[37px] tracking-[-0.8px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>
            We’ll email you a one-time code.
          </Text>
          <Text className="mt-3 text-[15px] leading-6" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
            Use the email linked to your Rennova account. The code expires shortly for your security.
          </Text>
          <View className="mt-8 min-h-14 flex-row items-center rounded-2xl border border-[#DDD8CC] bg-[#FFFDF8] px-4">
            <Mail color={colors.muted} size={20} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              className="ml-3 flex-1 py-4 text-base"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor="#9A978F"
              style={{ color: colors.ink, fontFamily: typefaces.regular }}
              testID="reset-email-input"
              textContentType="emailAddress"
              value={email}
            />
          </View>
          {mutation.error ? (
            <Text className="mt-3 text-sm" style={{ color: colors.red, fontFamily: typefaces.medium }} testID="forgot-password-error">
              {mutation.error.message}
            </Text>
          ) : null}
          <View className="mt-5">
            <Button label="Send reset code" loading={mutation.isPending} onPress={() => mutation.mutate()} testID="send-reset-code-button" variant="primary" />
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
