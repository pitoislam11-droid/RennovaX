import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyRound } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { OtpInput } from 'react-native-otp-entry';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { authClient } from '@/lib/auth/auth-client';
import { colors, typefaces } from '@/lib/design/tokens';

export default function ResetPasswordScreen() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const [otp, setOtp] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmation, setConfirmation] = useState<string>('');

  const mutation = useMutation({
    mutationFn: async () => {
      if (otp.length !== 6) throw new Error('Enter the six-digit code from your email.');
      if (password.length < 8) throw new Error('Choose a password with at least 8 characters.');
      if (password !== confirmation) throw new Error('The passwords do not match.');
      const result = await authClient.emailOtp.resetPassword({ email, otp, password });
      if (result.error) throw new Error(result.error.message ?? 'That code could not be verified.');
    },
    onSuccess: () => router.replace({ pathname: '/auth', params: { email, mode: 'sign-in' } }),
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1" style={{ backgroundColor: colors.canvas }} testID="reset-password-screen">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScreenHeader subtitle="Check your email" title="Choose a new password" />
        <View className="flex-1 px-6 pt-7">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF2A8]">
            <KeyRound color={colors.ink} size={25} />
          </View>
          <Text className="mt-5 text-[30px] leading-[35px] tracking-[-0.7px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>
            Enter your code
          </Text>
          <Text className="mt-2 text-sm leading-5" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
            Sent to {email}
          </Text>
          <View className="mt-6" testID="reset-otp-input">
            <OtpInput
              numberOfDigits={6}
              onTextChange={setOtp}
              theme={{
                containerStyle: { gap: 7 },
                pinCodeContainerStyle: { width: 46, height: 54, borderRadius: 14, borderColor: colors.line, backgroundColor: colors.paper },
                pinCodeTextStyle: { color: colors.ink, fontFamily: typefaces.demi, fontSize: 20 },
                focusedPinCodeContainerStyle: { borderColor: colors.ink },
              }}
              type="numeric"
            />
          </View>
          <TextInput
            className="mt-7 min-h-14 rounded-2xl border border-[#DDD8CC] bg-[#FFFDF8] px-4 text-base"
            onChangeText={setPassword}
            placeholder="New password"
            placeholderTextColor="#9A978F"
            secureTextEntry
            style={{ color: colors.ink, fontFamily: typefaces.regular }}
            testID="new-password-input"
            textContentType="newPassword"
            value={password}
          />
          <TextInput
            className="mt-3 min-h-14 rounded-2xl border border-[#DDD8CC] bg-[#FFFDF8] px-4 text-base"
            onChangeText={setConfirmation}
            placeholder="Confirm new password"
            placeholderTextColor="#9A978F"
            secureTextEntry
            style={{ color: colors.ink, fontFamily: typefaces.regular }}
            testID="confirm-password-input"
            textContentType="newPassword"
            value={confirmation}
          />
          {mutation.error ? (
            <Text className="mt-3 text-sm" style={{ color: colors.red, fontFamily: typefaces.medium }} testID="reset-password-error">
              {mutation.error.message}
            </Text>
          ) : null}
          <View className="mt-5">
            <Button label="Update password" loading={mutation.isPending} onPress={() => mutation.mutate()} testID="update-password-button" variant="primary" />
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
