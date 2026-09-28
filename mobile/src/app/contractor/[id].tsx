import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassIconButton } from '@/components/Glass';
import { relativeTime } from '@/components/marketplace';
import { Avatar, Button, Card, Chip, EmptyState, Header, Photo, Rating, Row, Screen, Segmented, Stars, VerifiedTick, type IconName } from '@/components/ui';
import { costMatchRate } from '@/data/rules';
import { useStore } from '@/data/store';
import { showAlert } from '@/lib/dialog';
import { askToBlock, askToReport } from '@/lib/safety';
import { colors, GUTTER, radius, shadow, space, type } from '@/theme';

type Tab = 'portfolio' | 'reviews' | 'about' | 'services';

function TrustTile({ icon, label, tint }: { icon: IconName; label: string; tint: { bg: string; fg: string } }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.bg }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: tint.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={18} color={tint.fg} />
      </View>
      <Text style={[type.caption, { textAlign: 'center', color: colors.ink2, fontWeight: '600' }]}>{label}</Text>
    </View>
  );
}

export default function ContractorProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, contractor: getContractor, me, dispatch } = useStore();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('portfolio');
  const [saved, setSaved] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const c = getContractor(id);

  if (!c) {
    return (
      <Screen>
        <Header />
        <EmptyState icon="alert-circle-outline" title="Contractor not found" body="This profile is no longer available." />
      </Screen>
    );
  }

  const reviews = state.reviews.filter((r) => r.contractorId === c.id);
  const matchRate = costMatchRate(reviews);
  const isHomeowner = state.session.role === 'homeowner';
  const openProjects = state.projects.filter(
    (p) => p.ownerId === me.id && (p.stage === 'published' || p.stage === 'receiving_quotes'),
  );

  const invite = () => {
    if (openProjects.length === 0) {
      showAlert('Post a project first', `Create a project and ${c.name} will be invited to quote.`, [
        { text: 'Not now', style: 'cancel' },
        { text: 'Start a project', onPress: () => router.push('/new') },
      ]);
      return;
    }
    showAlert(`Invite ${c.name} to quote`, 'Which project?', [
      ...openProjects.map((p) => ({
        text: p.title,
        onPress: () => {
          dispatch({ type: 'inviteContractor', projectId: p.id, contractorId: c.id });
          showAlert('Invitation sent', `${c.name} will see your project at the top of their opportunities.`);
        },
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  return (
    <Screen
      contentStyle={{ paddingTop: 0 }}
      footer={
        isHomeowner ? (
          <Row>
            <View style={{ flex: 1 }}>
              <Text style={type.bodyStrong}>Free, no obligation</Text>
              <Text style={type.meta}>Replies in {c.replyTime}</Text>
            </View>
            <Button label="Invite to quote" onPress={invite} />
          </Row>
        ) : undefined
      }>
      <Photo uri={c.cover} style={{ height: 300 }}>
        <Row style={{ position: 'absolute', top: insets.top + 8, left: GUTTER, right: GUTTER, justifyContent: 'space-between' }}>
          <GlassIconButton icon="chevron-back" label="Back" variant="clear" onPress={() => router.back()} />
          <Row gap={10}>
            <GlassIconButton icon="share-outline" label="Share" variant="clear" onPress={() => Share.share({ message: `${c.name} on Rennova` })} />
            <GlassIconButton icon="ellipsis-horizontal" label="More" variant="clear" onPress={() =>
                showAlert(c.name, undefined, [
                  { text: 'Report this business', onPress: () => askToReport(dispatch, 'contractor', c.id, c.name) },
                  state.blockedIds.includes(c.ownerId)
                    ? { text: `Unblock ${c.name}`, onPress: () => dispatch({ type: 'unblock', profileId: c.ownerId }) }
                    : { text: `Block ${c.name}`, style: 'destructive', onPress: () => askToBlock(dispatch, c.ownerId, c.name) },
                  { text: 'Cancel', style: 'cancel' },
                ])
              }
            />
          </Row>
        </Row>
      </Photo>

      <View style={{ marginTop: -48, marginHorizontal: 12, backgroundColor: colors.surface, borderRadius: 28, padding: space.xl, gap: space.md, ...shadow }}>
        <Row style={{ alignItems: 'flex-start' }}>
          <Avatar initials={c.initials} color={c.logoColor} size={64} />
          <View style={{ flex: 1, gap: 4, paddingTop: 4 }}>
            <Row gap={6}>
              <Text style={[type.heading, { flexShrink: 1 }]}>{c.name}</Text>
              {c.verifiedBusiness ? <VerifiedTick size={20} /> : null}
            </Row>
            <Rating value={c.rating} count={c.reviewCount} />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={saved ? 'Unsave' : 'Save'} onPress={() => setSaved((s) => !s)} hitSlop={8} style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={saved ? colors.danger : colors.ink} />
          </Pressable>
        </Row>
        <Text style={type.meta}>
          {c.services[0]} · {c.baseArea}{'\n'}
          {c.businessType === 'company' ? 'Company' : 'Sole trader'} · {c.yearsExperience}+ years experience
        </Text>
        <Text style={type.body} numberOfLines={aboutOpen ? undefined : 3}>{c.about}</Text>
        <Text style={type.metaStrong} onPress={() => setAboutOpen((v) => !v)}>{aboutOpen ? 'Show less' : 'Read more'}</Text>

        <Row gap={8}>
          {c.verifiedBusiness ? <TrustTile icon="checkmark-circle" label={'Verified\nbusiness'} tint={{ bg: '#E7F0FF', fg: colors.blue }} /> : null}
          {c.insured ? <TrustTile icon="shield-checkmark" label={'Fully\ninsured'} tint={{ bg: colors.verifiedTint, fg: colors.verified }} /> : null}
          <TrustTile icon="trophy" label={`${c.yearsExperience}+ years\nexperience`} tint={{ bg: '#FFF4DB', fg: '#D99A00' }} />
          <TrustTile icon="home" label={`${c.projectsCompleted}+\nprojects`} tint={{ bg: '#F0F0EE', fg: colors.ink }} />
        </Row>
      </View>

      <View style={{ paddingHorizontal: GUTTER, marginTop: space.xl }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'portfolio', label: 'Portfolio' },
            { value: 'reviews', label: 'Reviews' },
            { value: 'about', label: 'About' },
            { value: 'services', label: 'Services' },
          ]}
        />
      </View>

      <View style={{ paddingHorizontal: GUTTER, marginTop: space.lg, gap: 12 }}>
        {tab === 'portfolio' ? (
          <>
            <Text style={type.subheading}>Recent projects</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {c.portfolio.map((p) => (
                <Pressable key={p.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/portfolio/[contractorId]/[itemId]', params: { contractorId: c.id, itemId: p.id } })} style={{ width: '47.8%', gap: 6 }}>
                  <Photo uri={p.after} style={{ height: 130, borderRadius: 16 }} />
                  <Text style={type.metaStrong} numberOfLines={1}>{p.title}</Text>
                  <Row gap={3}>
                    <Ionicons name="location-outline" size={12} color={colors.ink3} />
                    <Text style={type.caption}>{p.area}</Text>
                  </Row>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {tab === 'reviews' ? (
          <>
            <Card style={{ gap: 6 }}>
              <Row gap={10} style={{ alignItems: 'baseline' }}>
                <Text style={{ fontSize: 40, fontWeight: '800', color: colors.ink }}>{c.rating.toFixed(1)}</Text>
                <Text style={type.meta}>{c.reviewCount} verified reviews</Text>
              </Row>
              {matchRate !== null ? <Text style={type.meta}>{matchRate}% said the final cost matched the quote</Text> : null}
            </Card>
            {reviews.length === 0 ? <Text style={type.meta}>Written reviews will appear here.</Text> : null}
            {reviews.map((r) => (
              <Card key={r.id} style={{ gap: 8 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={type.bodyStrong}>{r.authorName}</Text>
                  <Text style={type.caption}>{relativeTime(r.createdAt)}</Text>
                </Row>
                <Stars value={r.overall} size={14} />
                <Text style={[type.body, { color: colors.ink }]}>{r.text}</Text>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Row gap={4}>
                    <Ionicons name="shield-checkmark" size={12} color={colors.verified} />
                    <Text style={[type.caption, { color: colors.verified, fontWeight: '600' }]}>Verified Rennova project</Text>
                  </Row>
                  <Text style={type.caption} onPress={() => askToReport(dispatch, 'review', r.id, 'this review')} accessibilityRole="button">
                    Report
                  </Text>
                </Row>
              </Card>
            ))}
          </>
        ) : null}

        {tab === 'about' ? (
          <Card style={{ gap: 12 }}>
            <Text style={type.body}>{c.about}</Text>
            <Text style={type.bodyStrong}>Checked by Rennova</Text>
            {[
              c.verifiedBusiness && 'Identity and business registration checked',
              c.insured && `${c.insuranceCover} insurance on file`,
              `${c.projectsCompleted}+ completed projects`,
            ]
              .filter(Boolean)
              .map((line) => (
                <Row key={String(line)}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.verified} />
                  <Text style={[type.body, { flex: 1 }]}>{line}</Text>
                </Row>
              ))}
            <Text style={type.bodyStrong}>Areas covered</Text>
            <Text style={type.body}>{c.areas.join(', ')}</Text>
          </Card>
        ) : null}

        {tab === 'services' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {c.services.map((s) => (
              <Chip key={s} label={s} />
            ))}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
