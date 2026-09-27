import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';

import { GlassIconButton } from '@/components/Glass';
import { Avatar, Badge, Button, Card, EmptyState, OptionRow, Row, Screen, Section, Stars } from '@/components/ui';
import { newId } from '@/data/reducer';
import { canLeaveReview } from '@/data/rules';
import { useStore } from '@/data/store';
import type { CostMatch } from '@/data/types';
import { colors, GUTTER, radius, space, type } from '@/theme';

const ASPECTS = [
  { key: 'quality', label: 'Quality of work' },
  { key: 'communication', label: 'Communication' },
  { key: 'timekeeping', label: 'Timekeeping' },
  { key: 'cleanliness', label: 'Cleanliness' },
  { key: 'value', label: 'Value for money' },
] as const;

type AspectKey = (typeof ASPECTS)[number]['key'];

const COST_OPTIONS: { value: CostMatch; label: string }[] = [
  { value: 'exact', label: 'Yes, exactly as quoted' },
  { value: 'less', label: 'It came in under the quote' },
  { value: 'more_agreed', label: 'A little more, agreed beforehand' },
  { value: 'more_unagreed', label: 'More than quoted, without agreement' },
];

export default function LeaveReview() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { state, me, dispatch, project: getProject, contractor } = useStore();
  const project = getProject(projectId);
  const c = project?.selectedContractorId ? contractor(project.selectedContractorId) : undefined;

  const [overall, setOverall] = useState(0);
  const [aspects, setAspects] = useState<Record<AspectKey, number>>({ quality: 0, communication: 0, timekeeping: 0, cleanliness: 0, value: 0 });
  const [costMatch, setCostMatch] = useState<CostMatch | null>(null);
  const [text, setText] = useState('');

  if (!project || !c || !canLeaveReview(project, state.reviews)) {
    return (
      <Screen>
        <EmptyState icon="star-outline" title="Review not available" body="You can review a contractor once, after the project is marked complete." action={<Button label="Close" onPress={() => router.back()} />} />
      </Screen>
    );
  }

  const complete = overall > 0 && Object.values(aspects).every((v) => v > 0) && costMatch !== null && text.trim().length >= 10;

  const submit = () => {
    if (!costMatch) return;
    dispatch({
      type: 'addReview',
      review: {
        id: newId('r'),
        projectId: project.id,
        contractorId: c.id,
        authorName: `${me.firstName}, ${project.location.area.split(',')[0]}`,
        overall,
        ...aspects,
        costMatch,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      },
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen contentStyle={{ paddingTop: 16 }} footer={<Button label="Post review" onPress={submit} disabled={!complete} />}>
        <Row style={{ paddingHorizontal: GUTTER, justifyContent: 'space-between' }}>
          <Badge label="Verified project" tone="green" icon="shield-checkmark" />
          <GlassIconButton icon="close" label="Close" onPress={() => router.back()} />
        </Row>

        <View style={{ alignItems: 'center', gap: 12, paddingHorizontal: GUTTER, marginTop: space.lg }}>
          <Avatar initials={c.initials} color={c.logoColor} size={72} />
          <Text style={[type.title, { textAlign: 'center' }]}>How did {c.name} do?</Text>
          <Stars value={overall} onChange={setOverall} size={40} />
        </View>

        <Section>
          <Card style={{ paddingVertical: 4 }}>
            {ASPECTS.map((a, i) => (
              <Row key={a.key} style={{ justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: i === ASPECTS.length - 1 ? 0 : 1, borderBottomColor: colors.line }}>
                <Text style={type.bodyStrong}>{a.label}</Text>
                <Stars value={aspects[a.key]} onChange={(v) => setAspects((s) => ({ ...s, [a.key]: v }))} size={22} />
              </Row>
            ))}
          </Card>
        </Section>

        <Section title="Did the final cost match the quote?">
          {COST_OPTIONS.map((o) => (
            <OptionRow key={o.value} label={o.label} selected={costMatch === o.value} onPress={() => setCostMatch(o.value)} />
          ))}
        </Section>

        <Section title="Tell others about it">
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            placeholder="What went well? Anything others should know?"
            placeholderTextColor={colors.ink3}
            accessibilityLabel="Written review"
            style={{ minHeight: 130, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 16, fontSize: 16, color: colors.ink, textAlignVertical: 'top' }}
          />
          <Text style={type.meta}>Shown with your first name and area only.</Text>
        </Section>
      </Screen>
    </KeyboardAvoidingView>
  );
}
