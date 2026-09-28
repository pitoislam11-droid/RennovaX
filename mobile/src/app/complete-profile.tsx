import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { Button, Notice, Row, Screen, Segmented, TextField } from '@/components/ui';
import { supabase } from '@/data/backend/client';
import { saveProfile } from '@/data/backend/remote';
import { INTENDED_ROLE_KEY, useStore } from '@/data/store';
import type { Role } from '@/data/types';
import { GUTTER, space, type } from '@/theme';

export default function CompleteProfile() {
  const { account, me } = useStore();
  const [firstName, setFirstName] = useState(me.firstName);
  const [lastName, setLastName] = useState(me.lastName);
  const [postcode, setPostcode] = useState(me.postcode);
  const [phone, setPhone] = useState(me.phone);
  const [role, setRole] = useState<Role>('homeowner');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(INTENDED_ROLE_KEY)
      .then((r) => r === 'contractor' && setRole('contractor'))
      .catch(() => undefined);
  }, []);

  if (!account) return null;
  const valid = firstName.trim().length > 0 && postcode.trim().length >= 2;

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await saveProfile(supabase!, account.userId, { firstName, lastName, postcode, phone, role: 'homeowner' });
      await account.refresh();
      router.replace(role === 'contractor' ? '/business-setup' : '/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen contentStyle={{ paddingTop: 56 }} footer={<Button label={busy ? 'Saving…' : 'Continue'} onPress={save} disabled={!valid || busy} />}>
        <View style={{ paddingHorizontal: GUTTER, gap: space.lg }}>
          <Text style={type.title}>About you</Text>
          <Segmented
            value={role}
            onChange={setRole}
            options={[
              { value: 'homeowner', label: 'I need work done' },
              { value: 'contractor', label: 'I’m a contractor' },
            ]}
          />
          <Row>
            <View style={{ flex: 1 }}>
              <TextField label="First name" value={firstName} onChangeText={setFirstName} autoComplete="given-name" textContentType="givenName" />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label="Last name" value={lastName} onChangeText={setLastName} autoComplete="family-name" textContentType="familyName" />
            </View>
          </Row>
          <TextField label="Postcode" value={postcode} onChangeText={setPostcode} placeholder="e.g. SW4 7AB" autoCapitalize="characters" autoComplete="postal-code" />
          <TextField
            label="Mobile number"
            value={phone}
            onChangeText={setPhone}
            placeholder="07700 900123"
            keyboardType="phone-pad"
            autoComplete="tel"
            hint="Kept private. Contractors only get it if you choose them or approve a call."
          />
          <Notice>Other members see your first name and area only.</Notice>
          {error ? <Notice icon="alert-circle-outline">{error}</Notice> : null}
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
