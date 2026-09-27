import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { Button, Chip, Header, Notice, Screen, Segmented, TextField } from '@/components/ui';
import { supabase } from '@/data/backend/client';
import { createBusiness } from '@/data/backend/remote';
import { CATEGORIES } from '@/data/categories';
import { useStore } from '@/data/store';
import type { CategoryId } from '@/data/types';
import { GUTTER, space, type } from '@/theme';

/** Contractor onboarding: the minimum a storefront needs to start receiving opportunities. */
export default function BusinessSetup() {
  const { account } = useStore();
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState<'company' | 'sole_trader'>('company');
  const [categories, setCategories] = useState<CategoryId[]>([]);
  const [baseArea, setBaseArea] = useState('');
  const [areas, setAreas] = useState('');
  const [years, setYears] = useState('');
  const [phone, setPhone] = useState('');
  const [about, setAbout] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!account) return null;
  const valid = name.trim().length >= 2 && categories.length > 0 && baseArea.trim().length >= 2;

  const toggle = (id: CategoryId) => setCategories((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await createBusiness(supabase!, account.userId, {
        name,
        businessType,
        categories,
        baseArea,
        areas: areas.split(',').map((a) => a.trim()).filter(Boolean),
        yearsExperience: Math.min(80, Math.max(0, Number(years) || 0)),
        phone,
        about,
      });
      await account.refresh();
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen footer={<Button label={busy ? 'Creating…' : 'Create my storefront'} onPress={save} disabled={!valid || busy} />}>
        <Header title="Your business" />
        <View style={{ paddingHorizontal: GUTTER, gap: space.lg }}>
          <Text style={type.title}>Win local work. Keep what you earn.</Text>
          <Text style={type.body}>Free profile, free opportunities, no commission.</Text>
          <Segmented
            value={businessType}
            onChange={setBusinessType}
            options={[
              { value: 'company', label: 'Company' },
              { value: 'sole_trader', label: 'Sole trader' },
            ]}
          />
          <TextField label="Business name" value={name} onChangeText={setName} placeholder="e.g. BrightHome Decor" />
          <View style={{ gap: 8 }}>
            <Text style={type.bodyStrong}>What do you do?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map((c) => (
                <Chip key={c.id} label={c.name} selected={categories.includes(c.id)} onPress={() => toggle(c.id)} />
              ))}
            </View>
          </View>
          <TextField label="Where are you based?" value={baseArea} onChangeText={setBaseArea} placeholder="e.g. Clapham, London" />
          <TextField label="Areas you cover" value={areas} onChangeText={setAreas} placeholder="Clapham, Battersea, Brixton" hint="Separate with commas." />
          <TextField label="Years of experience" value={years} onChangeText={setYears} keyboardType="number-pad" placeholder="e.g. 8" />
          <TextField label="Business phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="020 7946 0000" />
          <TextField label="About your business" value={about} onChangeText={setAbout} multiline placeholder="What you specialise in and how you work" />
          <Notice icon="shield-checkmark-outline">
            Verified and insured badges are added after we check your ID and insurance certificate.
          </Notice>
          {error ? <Notice icon="alert-circle-outline">{error}</Notice> : null}
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
