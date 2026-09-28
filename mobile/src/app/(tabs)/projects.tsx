import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { ProjectCard, relativeTime } from '@/components/marketplace';
import { Badge, Button, Card, EmptyState, Row, Screen, Segmented } from '@/components/ui';
import { canLeaveReview, canReviseQuote, contractorQuoteStatusLabel, formatPrice, STAGE_LABEL, visibleQuotes } from '@/data/rules';
import { useStore } from '@/data/store';
import { colors, GUTTER, space, type } from '@/theme';

export default function ProjectsTab() {
  const { state } = useStore();
  return state.session.role === 'homeowner' ? <HomeownerProjects /> : <ContractorWork />;
}

function HomeownerProjects() {
  const { state, me, viewer } = useStore();
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const mine = state.projects.filter((p) => p.ownerId === me.id);
  const list = mine.filter((p) => (tab === 'active' ? p.stage !== 'completed' : p.stage === 'completed'));

  return (
    <Screen tabs>
      <Text style={[type.title, { paddingHorizontal: GUTTER }]}>Your projects</Text>
      <View style={{ paddingHorizontal: GUTTER, marginTop: space.lg }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'active', label: `Active (${mine.filter((p) => p.stage !== 'completed').length})` },
            { value: 'completed', label: 'Completed' },
          ]}
        />
      </View>
      <View style={{ paddingHorizontal: GUTTER, gap: 14, marginTop: space.lg }}>
        {list.length === 0 ? (
          <Card>
            <EmptyState
              icon="document-text-outline"
              title={tab === 'active' ? 'No active projects' : 'Nothing completed yet'}
              body={tab === 'active' ? 'Post a project to start receiving quotes.' : 'Finished projects and your reviews will appear here.'}
              action={tab === 'active' ? <Button label="Start a project" onPress={() => router.push('/new')} style={{ marginTop: 8, alignSelf: 'stretch' }} /> : undefined}
            />
          </Card>
        ) : (
          list.map((p) => (
            <View key={p.id} style={{ gap: 8 }}>
              <ProjectCard project={p} quoteCount={visibleQuotes(viewer, p, state.quotes).length} onPress={() => router.push(`/project/${p.id}`)} />
              {canLeaveReview(p, state.reviews) ? (
                <Button label="Leave a review" icon="star-outline" variant="secondary" small onPress={() => router.push(`/review/${p.id}`)} />
              ) : null}
            </View>
          ))
        )}
      </View>
    </Screen>
  );
}

type WorkTab = 'quotes' | 'won' | 'active' | 'completed';

function ContractorWork() {
  const { state, myBusiness } = useStore();
  const [tab, setTab] = useState<WorkTab>('quotes');
  const myQuotes = state.quotes.filter((q) => q.contractorId === myBusiness.id);
  const withProject = myQuotes
    .map((q) => ({ q, p: state.projects.find((p) => p.id === q.projectId)! }))
    .filter((x) => x.p);

  const groups: Record<WorkTab, typeof withProject> = {
    quotes: withProject.filter(({ q }) => q.status === 'submitted'),
    won: withProject.filter(({ q, p }) => q.status === 'accepted' && p.stage === 'contractor_selected'),
    active: withProject.filter(({ q, p }) => q.status === 'accepted' && p.stage === 'in_progress'),
    completed: withProject.filter(({ q, p }) => q.status === 'accepted' && p.stage === 'completed'),
  };
  const closed = withProject.filter(({ q }) => q.status === 'not_selected' || q.status === 'declined');
  const list = tab === 'quotes' ? [...groups.quotes, ...closed] : groups[tab];

  return (
    <Screen tabs>
      <Text style={[type.title, { paddingHorizontal: GUTTER }]}>My work</Text>
      <Text style={[type.meta, { paddingHorizontal: GUTTER, marginTop: 4 }]}>Find jobs → Quote → Win work</Text>
      <View style={{ paddingHorizontal: GUTTER, marginTop: space.lg }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'quotes', label: `Quotes ${groups.quotes.length}` },
            { value: 'won', label: `Won ${groups.won.length}` },
            { value: 'active', label: `Active ${groups.active.length}` },
            { value: 'completed', label: 'Done' },
          ]}
        />
      </View>
      <View style={{ paddingHorizontal: GUTTER, gap: 12, marginTop: space.lg }}>
        {list.length === 0 ? (
          <Card>
            <EmptyState icon="briefcase-outline" title="Nothing here yet" body="Quote on new opportunities to start winning work." action={<Button label="Find jobs" small onPress={() => router.push('/(tabs)')} style={{ marginTop: 8 }} />} />
          </Card>
        ) : (
          list.map(({ q, p }) => {
            const won = q.status === 'accepted';
            const lost = q.status === 'not_selected' || q.status === 'declined';
            return (
              <Card key={q.id} onPress={() => router.push(`/opportunity/${p.id}`)} style={{ gap: 10, opacity: lost ? 0.65 : 1 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={[type.bodyStrong, { flex: 1 }]} numberOfLines={1}>{p.title}</Text>
                  <Text style={type.price}>{formatPrice(q.price)}</Text>
                </Row>
                <Text style={type.meta}>{p.location.area} · Sent {relativeTime(q.submittedAt)}</Text>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Badge
                    label={won ? STAGE_LABEL[p.stage] : contractorQuoteStatusLabel(q)}
                    tone={won ? 'green' : 'neutral'}
                    icon={won ? 'checkmark-circle' : undefined}
                  />
                  {canReviseQuote(q, p) ? (
                    <Row gap={4}>
                      <Text style={[type.metaStrong]} onPress={() => router.push({ pathname: '/submit-quote/[projectId]', params: { projectId: p.id } })}>Revise</Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.ink} />
                    </Row>
                  ) : null}
                </Row>
              </Card>
            );
          })
        )}
      </View>
    </Screen>
  );
}
