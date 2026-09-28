import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { GlassIconButton } from '@/components/Glass';
import { PRICE_TYPE_LABEL, QuoteCard, relativeTime, shortDate, warrantyLabel } from '@/components/marketplace';
import { Avatar, Button, Card, EmptyState, Header, KeyValue, Notice, Photo, Row, Screen, Segmented } from '@/components/ui';
import { getCategory } from '@/data/categories';
import { formatAnswer, questionsFor } from '@/data/questionFlows';
import { canLeaveReview, comparisonOrder, costMatchRate, formatPrice, STAGE_LABEL, STAGE_ORDER, stageIndex, visibleQuotes } from '@/data/rules';
import { useStore } from '@/data/store';
import type { Quote } from '@/data/types';
import { showAlert } from '@/lib/dialog';
import { colors, GUTTER, space, type } from '@/theme';

type Tab = 'compare' | 'table' | 'messages';

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, viewer, project: getProject, contractor, dispatch } = useStore();
  const project = getProject(id);
  const [tab, setTab] = useState<Tab>('compare');
  const [showDetails, setShowDetails] = useState(false);

  if (!project) {
    return (
      <Screen>
        <Header />
        <EmptyState icon="alert-circle-outline" title="Project not found" body="It may have been removed." />
      </Screen>
    );
  }

  const quotes = comparisonOrder(visibleQuotes(viewer, project, state.quotes)).filter(
    (q) => !state.blockedIds.includes(contractor(q.contractorId)?.ownerId ?? ''),
  );
  const threads = state.threads.filter((t) => t.projectId === project.id);
  const selected = project.selectedContractorId ? contractor(project.selectedContractorId) : undefined;
  const cat = getCategory(project.categoryId);
  const questions = questionsFor(project.categoryId);

  const more = () =>
    showAlert(project.title, undefined, [
      { text: 'Invite a contractor', onPress: () => router.push({ pathname: '/find', params: { projectId: project.id } }) },
      { text: 'Cancel', style: 'cancel' },
    ]);

  return (
    <Screen>
      <Header title="Project quotes" right={<GlassIconButton icon="ellipsis-horizontal" label="More options" onPress={more} />} />

      <View style={{ paddingHorizontal: GUTTER, gap: space.lg }}>
        <Card style={{ gap: space.md }}>
          <Row>
            <Photo uri={project.photos[0] ?? ''} style={{ width: 72, height: 72, borderRadius: 14 }} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={type.subheading}>{project.title}</Text>
              <Row gap={4}>
                <Ionicons name="location-outline" size={13} color={colors.ink3} />
                <Text style={type.meta}>{project.location.area}</Text>
              </Row>
              <Pressable onPress={() => setShowDetails((v) => !v)} accessibilityRole="button" hitSlop={6}>
                <Row gap={2}>
                  <Text style={type.metaStrong}>{showDetails ? 'Hide project details' : 'View project details'}</Text>
                  <Ionicons name={showDetails ? 'chevron-up' : 'chevron-forward'} size={13} color={colors.ink} />
                </Row>
              </Pressable>
            </View>
          </Row>
          {showDetails ? (
            <View>
              <KeyValue label="Service" value={cat.name} />
              {questions
                .filter((q) => project.answers[q.id] !== undefined)
                .map((q) => (
                  <KeyValue key={q.id} label={q.summaryLabel} value={formatAnswer(project.answers[q.id])} />
                ))}
              {project.description ? <Text style={[type.body, { marginTop: 10 }]}>{project.description}</Text> : null}
            </View>
          ) : null}
          <StageBar stage={project.stage} />
        </Card>

        {selected ? (
          <SelectedPanel
            name={selected.name}
            initials={selected.initials}
            color={selected.logoColor}
            stage={project.stage}
            canReview={canLeaveReview(project, state.reviews)}
            onMessage={() => router.push({ pathname: '/chat/[projectId]/[contractorId]', params: { projectId: project.id, contractorId: selected.id } })}
            onCall={() => showAlert(`Call ${selected.name}`, selected.phone)}
            onStart={() => dispatch({ type: 'advanceStage', projectId: project.id, to: 'in_progress' })}
            onComplete={() =>
              showAlert('Mark job as complete?', 'Only do this once you’re happy the work is finished.', [
                { text: 'Not yet', style: 'cancel' },
                {
                  text: 'Complete',
                  onPress: () => {
                    dispatch({ type: 'advanceStage', projectId: project.id, to: 'completed' });
                    router.push(`/review/${project.id}`);
                  },
                },
              ])
            }
            onReview={() => router.push(`/review/${project.id}`)}
          />
        ) : null}

        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'compare', label: 'Compare' },
            { value: 'table', label: `Quotes (${quotes.length})` },
            { value: 'messages', label: 'Messages' },
          ]}
        />
      </View>

      <View style={{ paddingHorizontal: GUTTER, gap: 12, marginTop: space.lg }}>
        {tab !== 'messages' && quotes.length === 0 ? (
          <Card>
            <EmptyState
              icon="hourglass-outline"
              title="Waiting for quotes"
              body="Local contractors are looking at your project now. Quotes usually arrive within a day or two, and there's no deadline."
              action={<Button label="Invite a contractor" variant="secondary" small onPress={() => router.push({ pathname: '/find', params: { projectId: project.id } })} style={{ marginTop: 8 }} />}
            />
          </Card>
        ) : null}

        {tab === 'compare' && quotes.length > 0 ? (
          <>
            {quotes.map((q) => (
              <QuoteCard key={q.id} quote={q} contractor={contractor(q.contractorId)!} />
            ))}
            <Notice icon="information-circle-outline">
              Shown in the order they arrived. We never rank by price: compare reviews, warranty and what's included too.
            </Notice>
          </>
        ) : null}

        {tab === 'table' && quotes.length > 0 ? <ComparisonTable quotes={quotes} /> : null}

        {tab === 'messages' ? (
          threads.length === 0 ? (
            <Card>
              <EmptyState icon="chatbubbles-outline" title="No messages yet" body="Contractors can message you with questions about this project." />
            </Card>
          ) : (
            threads.map((t) => {
              const c = contractor(t.contractorId)!;
              const last = t.messages.at(-1)!;
              return (
                <Card key={t.id} onPress={() => router.push({ pathname: '/chat/[projectId]/[contractorId]', params: { projectId: project.id, contractorId: c.id } })}>
                  <Row>
                    <Avatar initials={c.initials} color={c.logoColor} />
                    <View style={{ flex: 1 }}>
                      <Text style={type.bodyStrong}>{c.name}</Text>
                      <Text style={type.meta} numberOfLines={1}>{last.text}</Text>
                    </View>
                    <Text style={type.caption}>{relativeTime(last.at)}</Text>
                  </Row>
                </Card>
              );
            })
          )
        ) : null}
      </View>
    </Screen>
  );
}

function StageBar({ stage }: { stage: (typeof STAGE_ORDER)[number] }) {
  const i = stageIndex(stage);
  return (
    <View style={{ gap: 8 }}>
      <Row gap={4}>
        {STAGE_ORDER.map((s, idx) => (
          <View key={s} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: idx < i ? colors.verified : idx === i ? colors.ink : colors.line }} />
        ))}
      </Row>
      <Text style={type.meta}>
        <Text style={type.metaStrong}>{STAGE_LABEL[stage]}</Text> · Stage {i + 1} of {STAGE_ORDER.length}
      </Text>
    </View>
  );
}

function SelectedPanel(props: {
  name: string;
  initials: string;
  color: string;
  stage: string;
  canReview: boolean;
  onMessage: () => void;
  onCall: () => void;
  onStart: () => void;
  onComplete: () => void;
  onReview: () => void;
}) {
  return (
    <Card style={{ gap: space.md }}>
      <Row>
        <Avatar initials={props.initials} color={props.color} />
        <View style={{ flex: 1 }}>
          <Text style={type.meta}>Your contractor</Text>
          <Text style={type.subheading}>{props.name}</Text>
        </View>
      </Row>
      <Row gap={8}>
        <Button label="Message" icon="chatbubble-outline" variant="secondary" small onPress={props.onMessage} style={{ flex: 1 }} />
        <Button label="Call" icon="call-outline" variant="secondary" small onPress={props.onCall} style={{ flex: 1 }} />
      </Row>
      {props.stage === 'contractor_selected' ? <Button label="Work has started" onPress={props.onStart} /> : null}
      {props.stage === 'in_progress' ? <Button label="Mark job as complete" onPress={props.onComplete} /> : null}
      {props.canReview ? <Button label="Leave a verified review" icon="star-outline" variant="green" onPress={props.onReview} /> : null}
    </Card>
  );
}

const ROW_LABEL_WIDTH = 108;
const COL_WIDTH = 132;

function ComparisonTable({ quotes }: { quotes: Quote[] }) {
  const { contractor, state } = useStore();
  const rows: { label: string; value: (q: Quote) => string; sub?: (q: Quote) => string }[] = [
    { label: 'Price', value: (q) => formatPrice(q.price), sub: (q) => PRICE_TYPE_LABEL[q.priceType] },
    { label: 'Materials', value: (q) => (q.materialsIncluded ? 'Included' : 'Not included') },
    { label: 'Duration', value: (q) => `${q.durationDays} days`, sub: () => 'working days' },
    { label: 'Earliest start', value: (q) => shortDate(q.earliestStart) },
    { label: 'Warranty', value: (q) => warrantyLabel(q.warrantyMonths) },
    { label: 'Rating', value: (q) => `★ ${contractor(q.contractorId)!.rating.toFixed(1)}`, sub: (q) => `${contractor(q.contractorId)!.reviewCount} reviews` },
    {
      label: 'Final cost matched quote',
      value: (q) => {
        const rate = costMatchRate(state.reviews.filter((r) => r.contractorId === q.contractorId));
        return rate === null ? 'No data yet' : `${rate}%`;
      },
      sub: () => 'of reviews',
    },
    { label: 'Experience', value: (q) => `${contractor(q.contractorId)!.yearsExperience}+ years` },
    { label: 'Business', value: (q) => (contractor(q.contractorId)!.businessType === 'company' ? 'Company' : 'Sole trader') },
    { label: 'Insurance', value: (q) => contractor(q.contractorId)!.insuranceCover },
    { label: 'Replies', value: (q) => contractor(q.contractorId)!.replyTime },
  ];

  return (
    <Card padded={false} style={{ overflow: 'hidden' }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <Row gap={0} style={{ borderBottomWidth: 1, borderBottomColor: colors.line, alignItems: 'flex-start' }}>
            <View style={{ width: ROW_LABEL_WIDTH }} />
            {quotes.map((q) => {
              const c = contractor(q.contractorId)!;
              return (
                <Pressable key={q.id} onPress={() => router.push(`/quote/${q.id}`)} style={{ width: COL_WIDTH, padding: 12, gap: 6 }}>
                  <Avatar initials={c.initials} color={c.logoColor} size={34} />
                  <Text style={type.metaStrong} numberOfLines={2}>{c.name}</Text>
                </Pressable>
              );
            })}
          </Row>
          {rows.map((r, i) => (
            <Row key={r.label} gap={0} style={{ backgroundColor: i % 2 ? colors.surface : '#FAFAF9', alignItems: 'stretch' }}>
              <View style={{ width: ROW_LABEL_WIDTH, padding: 12, justifyContent: 'center' }}>
                <Text style={type.caption}>{r.label}</Text>
              </View>
              {quotes.map((q) => (
                <View key={q.id} style={{ width: COL_WIDTH, padding: 12, justifyContent: 'center' }}>
                  <Text style={[type.metaStrong, r.label === 'Price' && { fontSize: 16 }]}>{r.value(q)}</Text>
                  {r.sub ? <Text style={type.caption}>{r.sub(q)}</Text> : null}
                </View>
              ))}
            </Row>
          ))}
          <Row gap={0} style={{ padding: 12, paddingLeft: ROW_LABEL_WIDTH }}>
            {quotes.map((q) => (
              <View key={q.id} style={{ width: COL_WIDTH, paddingRight: 12 }}>
                <Button label="View" variant="secondary" small onPress={() => router.push(`/quote/${q.id}`)} />
              </View>
            ))}
          </Row>
        </View>
      </ScrollView>
    </Card>
  );
}
