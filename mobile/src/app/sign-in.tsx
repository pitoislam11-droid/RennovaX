import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { Button, Notice, Screen, TextField } from '@/components/ui';
import { supabase } from '@/data/backend/client';
import { GUTTER, space, type } from '@/theme';

/**
 * Passwordless sign-in: we email a 6-digit code, and new emails get an account automatically.
 * "Use a password" exists for accounts created with a password in Supabase, such as the demo
 * account app-store reviewers need, since they can't receive our emails.
 */
export default function SignIn() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [password, setPassword] = useState('');
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

  const signInWithPassword = async () => {
    setBusy(true);
    setError('');
    const { error: e } = await supabase!.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (e) setError('That email and password don’t match.');
    else router.replace('/');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        contentStyle={{ paddingTop: 72 }}
        footer={
          step === 'email' ? (
            <>
              <Button label={busy ? 'Sending…' : 'Email me a code'} onPress={sendCode} disabled={!validEmail || busy} />
              <Button label="Use a password instead" variant="ghost" small onPress={() => setStep('password')} />
            </>
          ) : step === 'password' ? (
            <>
              <Button label={busy ? 'Signing in…' : 'Sign in'} onPress={signInWithPassword} disabled={!validEmail || password.length < 6 || busy} />
              <Button label="Email me a code instead" variant="ghost" small onPress={() => setStep('email')} />
            </>
          ) : (
            <>
              <Button label={busy ? 'Checking…' : 'Sign in'} onPress={verify} disabled={code.trim().length < 6 || busy} />
              <Button label="Use a different email" variant="ghost" small onPress={() => { setStep('email'); setCode(''); }} />
            </>
          )
        }>
        <View style={{ paddingHorizontal: GUTTER, gap: space.lg }}>
          <Text style={type.hero}>{step === 'code' ? 'Check your email' : 'Welcome to Rennova'}</Text>
          <Text style={type.body}>
            {step === 'email' && 'Enter your email and we’ll send you a sign-in code. No password needed.'}
            {step === 'password' && 'Sign in with your email and password.'}
            {step === 'code' && `We sent a 6-digit code to ${email.trim()}. It expires in an hour.`}
          </Text>
          {step !== 'code' ? (
            <TextField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
          ) : null}
          {step === 'password' ? (
            <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="current-password" textContentType="password" />
          ) : null}
          {step === 'code' ? (
            <TextField label="Code" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} placeholder="123456" keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" />
          ) : null}
          {error ? <Notice icon="alert-circle-outline">{error}</Notice> : null}
          <Text style={[type.meta, { textAlign: 'center', marginTop: space.md }]}>
            By continuing you agree to our{' '}
            <Link href="/legal/terms" style={type.metaStrong}>Terms</Link> and{' '}
            <Link href="/legal/privacy" style={type.metaStrong}>Privacy Policy</Link>.
          </Text>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
