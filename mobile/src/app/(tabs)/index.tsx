import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { GlassIconButton } from '@/components/Glass';
import { ContractorCard, ProjectCard, relativeTime } from '@/components/marketplace';
import { Badge, Card, CategoryTile, Chip, EmptyState, Photo, Row, RoundButton, Screen, Section } from '@/components/ui';
import { CATEGORIES } from '@/data/categories';
import { canSubmitQuote, isOpenOpportunity, visibleQuotes } from '@/data/rules';
import { useStore } from '@/data/store';
import { colors, GUTTER, space, type } from '@/theme';

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function HomeTab() {
  const { state } = useStore();
  return state.session.role === 'homeowner' ? <HomeownerHome /> : <ContractorHome />;
}

function HomeownerHome() {
  const { state, me, viewer } = useStore();
  const active = state.projects.filter((p) => p.ownerId === me.id && p.stage !== 'completed');
  const pendingCalls = state.callRequests.filter((r) => r.status === 'pending').length;
  const topRated = [...state.contractors].sort((a, b) => b.rating - a.rating).slice(0, 4);

  return (
    <Screen tabs>
      <Row style={{ paddingHorizontal: GUTTER, justifyContent: 'space-between' }}>
        <View>
          <Text style={type.meta}>{greeting()}</Text>
          <Text style={type.title}>{me.firstName} 👋</Text>
        </View>
        <View>
          <GlassIconButton icon="notifications-outline" label="Notifications" onPress={() => router.push('/(tabs)/messages')} />
          {pendingCalls > 0 ? <View style={{ position: 'absolute', top: 8, right: 10, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.danger }} /> : null}
        </View>
      </Row>

      <View style={{ paddingHorizontal: GUTTER, marginTop: space.xl }}>
        <Card style={{ gap: space.md, padding: space.xl }}>
          <Text style={type.heading}>What do you need done?</Text>
          <Text style={type.meta}>Post a project and get quotes from trusted local contractors.</Text>
          <Pressable
            accessibilityRole="search"
            onPress={() => router.push('/new')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.sunk, borderRadius: 999, paddingLeft: 16, paddingRight: 5, height: 54, marginTop: 4 }}>
            <Ionicons name="search" size={18} color={colors.ink3} />
            <Text style={[type.body, { flex: 1, color: colors.ink3 }]} numberOfLines={1}>e.g. Paint my flat, new bathroom…</Text>
            <RoundButton icon="arrow-forward" label="Start a project" onPress={() => router.push('/new')} />
          </Pressable>
        </Card>
      </View>

      <View style={{ paddingHorizontal: GUTTER, marginTop: space.xxl, gap: 18 }}>
        {[0, 4].map((start) => (
          <Row key={start} gap={4} style={{ alignItems: 'flex-start' }}>
            {CATEGORIES.slice(start, start + 4).map((c) => (
              <CategoryTile key={c.id} category={c} onPress={() => router.push({ pathname: '/new/[category]', params: { category: c.id } })} />
            ))}
          </Row>
        ))}
      </View>

      <Section title="Your projects" action={active.length ? 'See all' : undefined} onAction={() => router.push('/(tabs)/projects')}>
        {active.length === 0 ? (
          <Card>
            <EmptyState icon="add-circle-outline" title="No projects yet" body="Describe your job once and let contractors come to you." />
          </Card>
        ) : (
          active.map((p) => (
            <ProjectCard key={p.id} project={p} quoteCount={visibleQuotes(viewer, p, state.quotes).length} onPress={() => router.push(`/project/${p.id}`)} />
          ))
        )}
      </Section>

      <Section title="Top rated near you" action="See all" onAction={() => router.push('/find')}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -GUTTER }} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 12, paddingBottom: 12 }}>
          {topRated.map((c) => (
            <View key={c.id} style={{ width: 280 }}>
              <ContractorCard contractor={c} />
            </View>
          ))}
        </ScrollView>
      </Section>

      <Section title="Why Rennova">
        <Card style={{ gap: 14 }}>
          {[
            { icon: 'lock-closed-outline' as const, text: 'Your phone number stays private until you approve a call.' },
            { icon: 'eye-off-outline' as const, text: 'Quotes are private. Contractors never see each other’s prices.' },
            { icon: 'shield-checkmark-outline' as const, text: 'Every review comes from a completed Rennova project.' },
          ].map((t) => (
            <Row key={t.text} style={{ alignItems: 'flex-start' }}>
              <Ionicons name={t.icon} size={20} color={colors.verified} />
              <Text style={[type.body, { flex: 1 }]}>{t.text}</Text>
            </Row>
          ))}
        </Card>
      </Section>
    </Screen>
  );
}

function ContractorHome() {
  const { state, myBusiness } = useStore();
  const [filter, setFilter] = useState<'all' | 'invited' | 'new'>('all');

  const opportunities = useMemo(() => {
    const open = state.projects.filter((p) => isOpenOpportunity(p, myBusiness));
    if (filter === 'invited') return open.filter((p) => p.invitedContractorIds.includes(myBusiness.id));
    if (filter === 'new') return open.filter((p) => canSubmitQuote(myBusiness.id, p, state.quotes));
    return open;
  }, [state.projects, state.quotes, myBusiness, filter]);

  return (
    <Screen tabs>
      <Row style={{ paddingHorizontal: GUTTER, justifyContent: 'space-between' }}>
        <View>
          <Text style={type.meta}>{myBusiness.name}</Text>
          <Text style={type.title}>New opportunities</Text>
        </View>
        <GlassIconButton icon="notifications-outline" label="Notifications" onPress={() => router.push('/(tabs)/messages')} />
      </Row>
      <Text style={[type.meta, { paddingHorizontal: GUTTER, marginTop: 6 }]}>
        Free to view and quote. No lead fees, no commission.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 8, marginTop: space.lg }}>
        <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="Invited you" selected={filter === 'invited'} onPress={() => setFilter('invited')} />
        <Chip label="Not quoted yet" selected={filter === 'new'} onPress={() => setFilter('new')} />
      </ScrollView>

      <View style={{ paddingHorizontal: GUTTER, gap: 14, marginTop: space.lg }}>
        {opportunities.length === 0 ? (
          <Card>
            <EmptyState icon="search-outline" title="Nothing here right now" body="New projects in your trades and area appear here as soon as homeowners publish them." />
          </Card>
        ) : (
          opportunities.map((p) => {
            const quoted = !canSubmitQuote(myBusiness.id, p, state.quotes);
            const invited = p.invitedContractorIds.includes(myBusiness.id);
            return (
              <Card key={p.id} padded={false} onPress={() => router.push(`/opportunity/${p.id}`)} style={{ overflow: 'hidden' }}>
                <Photo uri={p.photos[0] ?? ''} style={{ height: 150 }}>
                  <View style={{ position: 'absolute', left: 12, top: 12, flexDirection: 'row', gap: 6 }}>
                    {invited ? <Badge label="Invited you" tone="green" /> : null}
                    {quoted ? <Badge label="Quoted" tone="dark" /> : null}
                  </View>
                </Photo>
                <View style={{ padding: space.lg, gap: 8 }}>
                  <Text style={type.subheading}>{p.title}</Text>
                  <Row gap={4}>
                    <Ionicons name="location-outline" size={13} color={colors.ink3} />
                    <Text style={type.meta}>{p.location.area} · {p.location.postcode} · {relativeTime(p.publishedAt ?? p.createdAt)}</Text>
                  </Row>
                  <Row gap={6} style={{ flexWrap: 'wrap' }}>
                    {['property_type', 'rooms', 'materials', 'start']
                      .map((k) => p.answers[k])
                      .filter((v) => v !== undefined)
                      .map((v) => (
                        <Badge key={String(v)} label={badgeLabel(v)} />
                      ))}
                  </Row>
                </View>
              </Card>
            );
          })
        )}
      </View>
    </Screen>
  );
}

function badgeLabel(v: unknown): string {
  if (typeof v === 'number') return `${v} rooms`;
  if (v === 'The contractor') return 'You supply materials';
  if (v === 'I will') return 'Homeowner supplies materials';
  return String(v);
}
