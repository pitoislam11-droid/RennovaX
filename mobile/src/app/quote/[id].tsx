import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { PRICE_TYPE_LABEL, relativeTime, shortDate, warrantyLabel } from '@/components/marketplace';
import { Avatar, Badge, Button, Card, EmptyState, Header, Rating, Row, Screen, Section, VerifiedTick, type IconName } from '@/components/ui';
import { formatPrice, visibleQuotes } from '@/data/rules';
import { useStore } from '@/data/store';
import { showAlert } from '@/lib/dialog';
import { colors, GUTTER, space, type } from '@/theme';

function Tile({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <Card style={{ flex: 1, gap: 6 }}>
      <Ionicons name={icon} size={20} color={colors.ink} />
      <Text style={type.meta}>{label}</Text>
      <Text style={type.bodyStrong}>{value}</Text>
    </Card>
  );
}

export default function QuoteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, viewer, project: getProject, contractor, dispatch } = useStore();
  const raw = state.quotes.find((q) => q.id === id);
  const project = raw ? getProject(raw.projectId) : undefined;
  // Sealed quotes: resolve through the visibility rule, never by id alone.
  const quote = raw && project ? visibleQuotes(viewer, project, state.quotes).find((q) => q.id === id) : undefined;

  if (!quote || !project) {
    return (
      <Screen>
        <Header />
        <EmptyState icon="lock-closed-outline" title="Quote not available" body="Quotes are private to the homeowner and the contractor who sent them." />
      </Screen>
    );
  }

  const c = contractor(quote.contractorId)!;
  const isOwner = viewer.role === 'homeowner';
  const open = quote.status === 'submitted' && (project.stage === 'receiving_quotes' || project.stage === 'published');

  const choose = () =>
    showAlert(`Choose ${c.name}?`, `We'll let ${c.name} know and share your address and phone number with them. Other contractors are told politely that you've chosen someone else.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Choose',
        onPress: () => {
          dispatch({ type: 'selectQuote', quoteId: quote.id });
          router.replace(`/project/${project.id}`);
        },
      },
    ]);

  const decline = () =>
    showAlert('Decline this quote?', `${c.name} will be told you've decided not to go ahead with them.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: () => { dispatch({ type: 'declineQuote', quoteId: quote.id }); router.back(); } },
    ]);

  return (
    <Screen
      footer={
        isOwner && open ? (
          <>
            <Button label={`Choose ${c.name}`} onPress={choose} />
            <Row gap={8}>
              <Button label="Message" icon="chatbubble-outline" variant="secondary" small style={{ flex: 1 }} onPress={() => router.push({ pathname: '/chat/[projectId]/[contractorId]', params: { projectId: project.id, contractorId: c.id } })} />
              <Button label="Decline" variant="ghost" small style={{ flex: 1 }} onPress={decline} />
            </Row>
          </>
        ) : undefined
      }>
      <Header title="Quote" subtitle={project.title} />

      <View style={{ paddingHorizontal: GUTTER }}>
        <Card onPress={() => router.push(`/contractor/${c.id}`)}>
          <Row>
            <Avatar initials={c.initials} color={c.logoColor} />
            <View style={{ flex: 1, gap: 2 }}>
              <Row gap={5}>
                <Text style={type.bodyStrong}>{c.name}</Text>
                {c.verifiedBusiness ? <VerifiedTick size={15} /> : null}
              </Row>
              <Rating value={c.rating} count={c.reviewCount} />
            </View>
            <Text style={type.metaStrong}>Profile</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.ink} />
          </Row>
        </Card>
      </View>

      <View style={{ paddingHorizontal: GUTTER, marginTop: space.xxl, gap: 8 }}>
        <Text style={type.meta}>Total price</Text>
        <Text style={{ fontSize: 48, fontWeight: '800', letterSpacing: -1.5, color: colors.ink }}>{formatPrice(quote.price)}</Text>
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          <Badge label={PRICE_TYPE_LABEL[quote.priceType]} tone="green" />
          <Badge label={quote.vatIncluded ? 'Inc. VAT' : 'Ex. VAT'} />
          <Badge label={quote.materialsIncluded ? 'Materials included' : 'Materials not included'} />
          {quote.revision > 1 ? <Badge label={`Revised ${quote.revision - 1}×`} tone="blue" /> : null}
        </Row>
      </View>

      <View style={{ paddingHorizontal: GUTTER, marginTop: space.xl, gap: 10 }}>
        <Row gap={10}>
          <Tile icon="calendar-outline" label="Duration" value={`${quote.durationDays} working days`} />
          <Tile icon="time-outline" label="Earliest start" value={shortDate(quote.earliestStart)} />
        </Row>
        <Row gap={10}>
          <Tile icon="shield-checkmark-outline" label="Warranty" value={warrantyLabel(quote.warrantyMonths)} />
          <Tile icon="business-outline" label="Business" value={c.businessType === 'company' ? 'Company' : 'Sole trader'} />
        </Row>
      </View>

      {quote.included.length > 0 ? (
        <Section title="What's included">
          {quote.included.map((line) => (
            <Row key={line} style={{ alignItems: 'flex-start' }}>
              <Ionicons name="checkmark-circle" size={18} color={colors.verified} />
              <Text style={[type.body, { flex: 1, color: colors.ink }]}>{line}</Text>
            </Row>
          ))}
        </Section>
      ) : null}

      {quote.exclusions.length > 0 ? (
        <Section title="Not included">
          {quote.exclusions.map((line) => (
            <Row key={line} style={{ alignItems: 'flex-start' }}>
              <Ionicons name="close-circle-outline" size={18} color={colors.ink3} />
              <Text style={[type.body, { flex: 1 }]}>{line}</Text>
            </Row>
          ))}
        </Section>
      ) : null}

      {quote.assumptions ? (
        <Section title="Assumptions">
          <Card><Text style={type.body}>{quote.assumptions}</Text></Card>
        </Section>
      ) : null}

      {quote.notes ? (
        <Section title={`Note from ${c.name}`}>
          <Card><Text style={[type.body, { color: colors.ink }]}>{quote.notes}</Text></Card>
          <Text style={type.meta}>Sent {relativeTime(quote.submittedAt)}</Text>
        </Section>
      ) : null}
    </Screen>
  );
}
