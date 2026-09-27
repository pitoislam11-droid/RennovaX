import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { Button, Notice, Screen, TextField } from '@/components/ui';
import { supabase } from '@/data/backend/client';
import { GUTTER, space, type } from '@/theme';

/** Passwordless sign-in: we email a 6-digit code. New emails get an account automatically. */
export default function SignIn() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const sendCode = async () => {
    setBusy(true);
    setError('');
    const { error: e } = await supabase!.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
    setBusy(false);
    if (e) setError(e.message);
    else setStep('code');
  };

  const verify = async () => {
    setBusy(true);
    setError('');
    const { error: e } = await supabase!.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
    setBusy(false);
    if (e) setError('That code didn’t work. Check the latest email, or send a new code.');
    else router.replace('/');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        contentStyle={{ paddingTop: 72 }}
        footer={
          step === 'email' ? (
            <Button label={busy ? 'Sending…' : 'Email me a code'} onPress={sendCode} disabled={!validEmail || busy} />
          ) : (
            <>
              <Button label={busy ? 'Checking…' : 'Sign in'} onPress={verify} disabled={code.trim().length < 6 || busy} />
              <Button label="Use a different email" variant="ghost" small onPress={() => { setStep('email'); setCode(''); }} />
            </>
          )
        }>
        <View style={{ paddingHorizontal: GUTTER, gap: space.lg }}>
          <Text style={type.hero}>{step === 'email' ? 'Welcome to Rennova' : 'Check your email'}</Text>
          <Text style={type.body}>
            {step === 'email'
              ? 'Enter your email and we’ll send you a sign-in code. No password needed.'
              : `We sent a 6-digit code to ${email.trim()}. It expires in an hour.`}
          </Text>
          {step === 'email' ? (
            <TextField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
          ) : (
            <TextField label="Code" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} placeholder="123456" keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" />
          )}
          {error ? <Notice icon="alert-circle-outline">{error}</Notice> : null}
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
