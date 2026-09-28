import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { Avatar, Badge, Card, KeyValue, Rating, Row, Screen, Section, type IconName } from '@/components/ui';
import { useStore } from '@/data/store';
import { SUPPORT_EMAIL } from '@/content/legal';
import { showAlert } from '@/lib/dialog';
import { colors, GUTTER, space, type } from '@/theme';

function LinkRow({ icon, label, onPress, last, value }: { icon: IconName; label: string; onPress: () => void; last?: boolean; value?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.line }}>
      <Ionicons name={icon} size={20} color={colors.ink} />
      <Text style={[type.bodyStrong, { flex: 1, fontWeight: '500' }]}>{label}</Text>
      {value ? <Text style={type.meta}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
    </Pressable>
  );
}

export default function ProfileTab() {
  const { state, me, myBusiness, dispatch, live, account } = useStore();
  const isHomeowner = state.session.role === 'homeowner';
  const [allowCalls, setAllowCalls] = useState(true);
  const [quoteAlerts, setQuoteAlerts] = useState(true);

  const switchRole = () => {
    if (live && isHomeowner && !account?.hasBusiness) {
      router.push('/business-setup');
      return;
    }
    dispatch({ type: 'setRole', role: isHomeowner ? 'contractor' : 'homeowner' });
    router.replace('/(tabs)');
  };

  const deleteAccount = () =>
    showAlert(
      'Delete your account?',
      'This permanently deletes your profile, projects, photos, messages and any contractor business. Reviews you wrote stay, without your name linked to them. This can’t be undone.',
      [
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () =>
            account
              ?.deleteAccount()
              .then(() => router.replace('/'))
              .catch((e: unknown) => showAlert('Couldn’t delete your account', e instanceof Error ? e.message : String(e))),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );

  const signOut = () =>
    showAlert('Sign out?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () =>
          account
            ?.signOut()
            .then(() => router.replace('/sign-in'))
            .catch((e: unknown) => showAlert('Couldn’t sign out', e instanceof Error ? e.message : String(e))),
      },
    ]);

  const resetDemo = () =>
    showAlert('Reset demo data?', 'This restores the sample projects, quotes and messages.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => dispatch({ type: 'reset' }) },
    ]);

  return (
    <Screen tabs>
      {isHomeowner ? (
        <Row style={{ paddingHorizontal: GUTTER, gap: 16 }}>
          <Avatar initials={`${me.firstName[0] ?? ''}${me.lastName[0] ?? ''}` || '?'} color="#34455C" size={68} />
          <View style={{ flex: 1 }}>
            <Text style={type.title}>{me.firstName} {me.lastName}</Text>
            <Text style={type.meta}>Homeowner · {me.postcode}</Text>
          </View>
        </Row>
      ) : (
        <Row style={{ paddingHorizontal: GUTTER, gap: 16 }}>
          <Avatar initials={myBusiness.initials} color={myBusiness.logoColor} size={68} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={type.title}>{myBusiness.name}</Text>
            <Rating value={myBusiness.rating} count={myBusiness.reviewCount} />
          </View>
        </Row>
      )}

      {isHomeowner ? (
        <>
          <Section title="Your details">
            <Card style={{ paddingVertical: 4 }}>
              <KeyValue label="Email" value={me.email || account?.email || '—'} />
              <KeyValue label="Phone" value={me.phone ? `${me.phone} · private` : 'Private'} />
              <KeyValue label="Postcode" value={me.postcode} last />
            </Card>
          </Section>
          <Section title="Privacy & contact">
            <Card style={{ gap: 4, paddingVertical: 8 }}>
              <Row style={{ paddingVertical: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={type.bodyStrong}>Allow call requests</Text>
                  <Text style={type.meta}>You approve every call individually</Text>
                </View>
                <Switch value={allowCalls} onValueChange={setAllowCalls} trackColor={{ true: colors.verified }} />
              </Row>
              <Row style={{ paddingVertical: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={type.bodyStrong}>New quote alerts</Text>
                  <Text style={type.meta}>Push and email</Text>
                </View>
                <Switch value={quoteAlerts} onValueChange={setQuoteAlerts} trackColor={{ true: colors.verified }} />
              </Row>
            </Card>
          </Section>
        </>
      ) : (
        <Section title="Your business">
          <Card style={{ gap: space.md }}>
            <Row gap={6} style={{ flexWrap: 'wrap' }}>
              {myBusiness.verifiedBusiness ? <Badge label="Verified business" tone="green" icon="checkmark-circle" /> : null}
              {myBusiness.insured ? <Badge label={myBusiness.insuranceCover} tone="green" /> : null}
              <Badge label="Free plan · no commission" />
            </Row>
            <LinkRow icon="storefront-outline" label="View your storefront" onPress={() => router.push(`/contractor/${myBusiness.id}`)} last />
          </Card>
        </Section>
      )}

      <Section>
        <Card style={{ paddingVertical: 2 }}>
          <LinkRow icon="search-outline" label="Browse contractors" onPress={() => router.push('/find')} />
          <LinkRow
            icon="help-circle-outline"
            label="Help & safety"
            onPress={() => showAlert('Help & safety', `Report anything worrying from the menu on any message, profile or review. For anything else, email ${SUPPORT_EMAIL}.`)}
          />
          <LinkRow icon="shield-outline" label="Privacy Policy" onPress={() => router.push('/legal/privacy')} />
          <LinkRow icon="document-text-outline" label="Terms of Use" onPress={() => router.push('/legal/terms')} />
          <LinkRow
            icon={isHomeowner ? 'briefcase-outline' : 'home-outline'}
            label={isHomeowner ? 'Switch to contractor mode' : 'Switch to homeowner mode'}
            value={live ? undefined : 'Demo'}
            onPress={switchRole}
            last
          />
        </Card>
      </Section>

      <Section>
        {live ? (
          <View style={{ gap: 4 }}>
            <Pressable onPress={signOut} accessibilityRole="button" style={{ alignItems: 'center', paddingVertical: 10 }}>
              <Text style={[type.metaStrong, { color: colors.ink }]}>Sign out</Text>
            </Pressable>
            <Pressable onPress={deleteAccount} accessibilityRole="button" style={{ alignItems: 'center', paddingVertical: 10 }}>
              <Text style={[type.metaStrong, { color: colors.danger }]}>Delete account</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={resetDemo} accessibilityRole="button" style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={[type.metaStrong, { color: colors.danger }]}>Reset demo data</Text>
          </Pressable>
        )}
      </Section>
    </Screen>
  );
}
