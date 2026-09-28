import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { relativeTime } from '@/components/marketplace';
import { Avatar, Card, EmptyState, Row, Screen } from '@/components/ui';
import { useStore } from '@/data/store';
import { colors, GUTTER, space, type } from '@/theme';

export default function MessagesTab() {
  const { state, me, myBusiness, contractor, project } = useStore();
  const isHomeowner = state.session.role === 'homeowner';

  const threads = state.threads
    .filter((t) => {
      const p = project(t.projectId);
      if (!p) return false;
      const other = isHomeowner ? contractor(t.contractorId)?.ownerId : p.ownerId;
      if (other && state.blockedIds.includes(other)) return false;
      return isHomeowner ? p.ownerId === me.id : t.contractorId === myBusiness.id;
    })
    .sort((a, b) => (b.messages.at(-1)?.at ?? '').localeCompare(a.messages.at(-1)?.at ?? ''));

  const pendingCalls = isHomeowner
    ? state.callRequests.filter(
        (r) =>
          r.status === 'pending' &&
          project(r.projectId)?.ownerId === me.id &&
          !state.blockedIds.includes(contractor(r.contractorId)?.ownerId ?? ''),
      )
    : [];

  return (
    <Screen tabs>
      <Text style={[type.title, { paddingHorizontal: GUTTER }]}>Messages</Text>

      {pendingCalls.length > 0 ? (
        <View style={{ paddingHorizontal: GUTTER, gap: 10, marginTop: space.lg }}>
          {pendingCalls.map((r) => {
            const c = contractor(r.contractorId)!;
            return (
              <Card key={r.id} onPress={() => router.push(`/call/${r.id}`)} style={{ borderWidth: 2, borderColor: colors.ink }}>
                <Row>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.verifiedTint, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="call-outline" size={20} color={colors.verified} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={type.bodyStrong}>{c.name} would like to call</Text>
                    <Text style={type.meta}>Your number stays hidden until you approve</Text>
                  </View>
                  <Text style={type.metaStrong}>Review</Text>
                </Row>
              </Card>
            );
          })}
        </View>
      ) : null}

      <View style={{ paddingHorizontal: GUTTER, marginTop: space.lg }}>
        {threads.length === 0 ? (
          <Card>
            <EmptyState icon="chatbubbles-outline" title="No messages yet" body="Conversations about your projects appear here." />
          </Card>
        ) : (
          <Card padded={false} style={{ paddingHorizontal: space.lg }}>
            {threads.map((t, i) => {
              const c = contractor(t.contractorId)!;
              const p = project(t.projectId)!;
              const last = t.messages.at(-1)!;
              const unread = last.from !== state.session.role;
              const owner = state.homeowners.find((h) => h.id === p.ownerId);
              const name = isHomeowner ? c.name : owner?.firstName ?? 'Homeowner';
              return (
                <Pressable
                  key={t.id}
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/chat/[projectId]/[contractorId]', params: { projectId: t.projectId, contractorId: t.contractorId } })}
                  style={{ flexDirection: 'row', gap: 12, paddingVertical: 14, borderBottomWidth: i === threads.length - 1 ? 0 : 1, borderBottomColor: colors.line }}>
                  {isHomeowner ? <Avatar initials={c.initials} color={c.logoColor} /> : <Avatar initials={name.slice(0, 1)} color="#5B6270" />}
                  <View style={{ flex: 1, gap: 2 }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Text style={type.bodyStrong}>{name}</Text>
                      <Text style={type.caption}>{relativeTime(last.at)}</Text>
                    </Row>
                    <Text style={[type.meta, unread && { color: colors.ink, fontWeight: '600' }]} numberOfLines={1}>
                      {last.from === state.session.role ? 'You: ' : ''}{last.text}
                    </Text>
                    <Text style={type.caption}>{p.title}</Text>
                  </View>
                  {unread ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.blue, marginTop: 6 }} /> : null}
                </Pressable>
              );
            })}
          </Card>
        )}
      </View>
    </Screen>
  );
}
