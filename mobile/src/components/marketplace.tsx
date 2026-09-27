import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { formatPrice, STAGE_LABEL, stageIndex } from '@/data/rules';
import type { Contractor, Project, Quote } from '@/data/types';
import { colors, space, type } from '@/theme';

import { Avatar, Card, Fact, Photo, Rating, Row, VerifiedTick } from './ui';

export function shortDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function relativeTime(isoDate: string): string {
  const mins = Math.round((Date.now() - new Date(isoDate).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(isoDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function warrantyLabel(months: number): string {
  if (months === 0) return 'None';
  if (months % 12 === 0) return `${months / 12} year${months > 12 ? 's' : ''}`;
  return `${months} months`;
}

export const PRICE_TYPE_LABEL: Record<Quote['priceType'], string> = {
  fixed: 'Fixed price',
  site_visit: 'Subject to site visit',
  estimate: 'Estimate',
};

/** Compact four-step progress used on project cards: Published → Quotes → Review → Select. */
export function ProjectTrack({ project, quoteCount }: { project: Project; quoteCount: number }) {
  const i = stageIndex(project.stage);
  const steps = [
    { label: 'Published', done: i >= stageIndex('published') },
    { label: quoteCount > 0 ? `${quoteCount} Quote${quoteCount === 1 ? '' : 's'}` : 'Quotes', done: quoteCount > 0 || i >= stageIndex('contractor_selected') },
    { label: 'Review', done: i >= stageIndex('contractor_selected') },
    { label: 'Select', done: i >= stageIndex('contractor_selected') },
  ];
  const current = steps.findIndex((s) => !s.done);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      {steps.map((s, idx) => {
        const isCurrent = idx === current;
        return (
          <View key={s.label} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
              <View style={[track.line, { opacity: idx === 0 ? 0 : 1 }, (s.done || isCurrent) && track.lineOn]} />
              <View style={[track.dot, s.done && track.dotDone, isCurrent && track.dotCurrent]}>
                {s.done ? <Ionicons name="checkmark" size={11} color="#fff" /> : null}
              </View>
              <View style={[track.line, { opacity: idx === steps.length - 1 ? 0 : 1 }, s.done && track.lineOn]} />
            </View>
            <Text style={[type.caption, (s.done || isCurrent) && { color: colors.ink, fontWeight: '600' }]}>{s.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const track = StyleSheet.create({
  line: { flex: 1, height: 2, backgroundColor: colors.line },
  lineOn: { backgroundColor: colors.verified },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#CFCFCB', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: colors.verified, borderColor: colors.verified },
  dotCurrent: { borderColor: colors.ink, borderWidth: 5 },
});

export function ProjectCard({ project, quoteCount, onPress }: { project: Project; quoteCount: number; onPress: () => void }) {
  const late = stageIndex(project.stage) >= stageIndex('contractor_selected');
  return (
    <Card onPress={onPress} style={{ gap: space.lg }}>
      <Row>
        <Photo uri={project.photos[0] ?? ''} style={{ width: 64, height: 64, borderRadius: 14 }} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={type.subheading} numberOfLines={1}>{project.title}</Text>
          <Row gap={4}>
            <Ionicons name="location-outline" size={13} color={colors.ink3} />
            <Text style={type.meta}>{project.location.area}</Text>
          </Row>
          {late ? <Text style={[type.metaStrong, { color: colors.verified }]}>{STAGE_LABEL[project.stage]}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.ink3} />
      </Row>
      {!late ? <ProjectTrack project={project} quoteCount={quoteCount} /> : null}
    </Card>
  );
}

/** One quote in the comparison list: who, price, duration, start, warranty and recent work. */
export function QuoteCard({ quote, contractor }: { quote: Quote; contractor: Contractor }) {
  const allPhotos = contractor.portfolio.flatMap((p) => [p.after, p.before, ...p.gallery]);
  const photos = allPhotos.slice(0, 4);
  const extra = allPhotos.length - photos.length;
  return (
    <Card onPress={() => router.push(`/quote/${quote.id}`)} style={{ gap: space.md }}>
      <Row>
        <Avatar initials={contractor.initials} color={contractor.logoColor} />
        <View style={{ flex: 1, gap: 2 }}>
          <Row gap={5}>
            <Text style={[type.bodyStrong, { flexShrink: 1 }]} numberOfLines={1}>{contractor.name}</Text>
            {contractor.verifiedBusiness ? <VerifiedTick size={15} /> : null}
          </Row>
          <Rating value={contractor.rating} count={contractor.reviewCount} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={type.price}>{formatPrice(quote.price)}</Text>
          <Text style={type.caption}>{PRICE_TYPE_LABEL[quote.priceType]}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
      </Row>
      <Row gap={8}>
        <Fact icon="calendar-outline" value={`${quote.durationDays} days`} label="Duration" />
        <Fact icon="time-outline" value={shortDate(quote.earliestStart)} label="Start date" />
        <Fact icon="shield-checkmark-outline" value={warrantyLabel(quote.warrantyMonths)} label="Warranty" />
      </Row>
      {photos.length > 0 ? (
        <Row gap={6}>
          {photos.map((uri, i) => (
            <Photo key={`${uri}-${i}`} uri={uri} style={{ width: '23%', aspectRatio: 1.35, borderRadius: 10 }}>
              {i === photos.length - 1 && extra > 0 ? (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(14,15,18,0.45)', alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>+{extra}</Text>
                </View>
              ) : null}
            </Photo>
          ))}
        </Row>
      ) : null}
      {quote.status !== 'submitted' ? (
        <Text style={[type.metaStrong, { color: quote.status === 'accepted' ? colors.verified : colors.ink3 }]}>
          {quote.status === 'accepted' ? 'Selected' : quote.status === 'declined' ? 'Declined' : 'Not selected'}
        </Text>
      ) : null}
    </Card>
  );
}

export function ContractorCard({ contractor, onInvite }: { contractor: Contractor; onInvite?: () => void }) {
  const cover = contractor.portfolio[0]?.after ?? contractor.cover;
  return (
    <Card padded={false} onPress={() => router.push(`/contractor/${contractor.id}`)} style={{ overflow: 'hidden' }}>
      <Row gap={3} style={{ height: 150 }}>
        <Photo uri={cover} style={{ flex: 2, height: '100%' }} />
        <View style={{ flex: 1, gap: 3, height: '100%' }}>
          <Photo uri={contractor.portfolio[1]?.after ?? contractor.cover} style={{ flex: 1 }} />
          <Photo uri={contractor.portfolio[2]?.after ?? contractor.cover} style={{ flex: 1 }} />
        </View>
      </Row>
      <View style={{ padding: space.lg, gap: space.md }}>
        <Row>
          <Avatar initials={contractor.initials} color={contractor.logoColor} />
          <View style={{ flex: 1, gap: 2 }}>
            <Row gap={5}>
              <Text style={type.bodyStrong}>{contractor.name}</Text>
              {contractor.verifiedBusiness ? <VerifiedTick size={15} /> : null}
            </Row>
            <Rating value={contractor.rating} count={contractor.reviewCount} />
          </View>
        </Row>
        <Text style={type.meta}>
          {contractor.businessType === 'company' ? 'Company' : 'Sole trader'} · {contractor.yearsExperience}+ years · {contractor.baseArea}
        </Text>
        {onInvite ? (
          <Text onPress={onInvite} style={[type.metaStrong, { color: colors.verified }]} accessibilityRole="button">
            Invite to quote
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
