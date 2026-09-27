import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';

import { GlassIconButton } from '@/components/Glass';
import { Button, Card, KeyValue, Notice, OptionRow, Photo, Row, Screen } from '@/components/ui';
import { getCategory } from '@/data/categories';
import { formatAnswer, isAnswered, questionsFor, type Question } from '@/data/questionFlows';
import { newId } from '@/data/reducer';
import { useStore } from '@/data/store';
import type { AnswerValue, CategoryId } from '@/data/types';
import { colors, GUTTER, radius, space, type } from '@/theme';

type Step = { kind: 'question'; question: Question } | { kind: 'details' } | { kind: 'photos' } | { kind: 'review' };

export default function GuidedProject() {
  const { category } = useLocalSearchParams<{ category: CategoryId }>();
  const cat = getCategory(category);
  const { dispatch, me } = useStore();
  const questions = useMemo(() => questionsFor(cat.id), [cat.id]);
  const steps: Step[] = useMemo(
    () => [...questions.map((q) => ({ kind: 'question' as const, question: q })), { kind: 'details' }, { kind: 'photos' }, { kind: 'review' }],
    [questions],
  );

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState('');
  const [postcode, setPostcode] = useState(me.postcode);
  const [photos, setPhotos] = useState<string[]>([]);

  const step = steps[index];
  const progress = (index + 1) / steps.length;

  const canContinue = (() => {
    if (step.kind === 'question') return isAnswered(step.question, answers[step.question.id]);
    if (step.kind === 'details') return title.trim().length > 2 && area.trim().length > 1 && postcode.trim().length > 1;
    return true;
  })();

  const setAnswer = (id: string, v: AnswerValue) => setAnswers((a) => ({ ...a, [id]: v }));

  const back = () => (index === 0 ? router.back() : setIndex(index - 1));
  const next = () => {
    if (step.kind !== 'review') return setIndex(index + 1);
    const now = new Date().toISOString();
    const id = newId('p');
    dispatch({
      type: 'publishProject',
      project: {
        id,
        ownerId: me.id,
        title: title.trim(),
        categoryId: cat.id,
        answers,
        description: description.trim(),
        photos,
        location: { area: area.trim(), postcode: postcode.trim().toUpperCase(), addressLine: '' },
        stage: 'published',
        createdAt: now,
        publishedAt: now,
        invitedContractorIds: [],
      },
    });
    // Replaces the whole "new project" modal with the published project.
    router.replace(`/project/${id}`);
  };

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: 12,
      quality: 0.7,
      exif: false,
    });
    if (!result.canceled) setPhotos((p) => [...p, ...result.assets.map((a) => a.uri)].slice(0, 12));
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, exif: false });
    if (!result.canceled) setPhotos((p) => [...p, ...result.assets.map((a) => a.uri)].slice(0, 12));
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        contentStyle={{ paddingTop: 16 }}
        footer={
          <Row>
            <Button label="Back" variant="secondary" onPress={back} style={{ width: 110 }} />
            <Button
              label={step.kind === 'review' ? 'Publish project' : step.kind === 'photos' && photos.length === 0 ? 'Skip for now' : 'Continue'}
              onPress={next}
              disabled={!canContinue}
              style={{ flex: 1 }}
            />
          </Row>
        }>
        <Row style={{ paddingHorizontal: GUTTER, justifyContent: 'space-between' }}>
          <Row gap={8}>
            <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: cat.tint.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={cat.icon} size={16} color={cat.tint.fg} />
            </View>
            <Text style={type.metaStrong}>{cat.name}</Text>
          </Row>
          <GlassIconButton icon="close" label="Close" onPress={() => router.dismissTo('/(tabs)')} />
        </Row>
        <View style={{ marginHorizontal: GUTTER, marginTop: space.md, height: 4, borderRadius: 2, backgroundColor: colors.line }}>
          <View style={{ width: `${progress * 100}%`, height: 4, borderRadius: 2, backgroundColor: colors.black }} />
        </View>

        <View style={{ paddingHorizontal: GUTTER, marginTop: space.xxl, gap: space.lg }}>
          {step.kind === 'question' ? (
            <QuestionStep question={step.question} value={answers[step.question.id]} onChange={(v) => setAnswer(step.question.id, v)} />
          ) : null}

          {step.kind === 'details' ? (
            <>
              <Text style={type.title}>Tell contractors about the job</Text>
              <Field label="Project title" value={title} onChange={setTitle} placeholder={`e.g. ${cat.id === 'painting' ? '2-bed flat redecoration' : cat.name}`} />
              <Field label="Anything else they should know?" value={description} onChange={setDescription} placeholder="Colours, style, problems you've noticed…" multiline />
              <Row>
                <View style={{ flex: 1 }}>
                  <Field label="Area" value={area} onChange={setArea} placeholder="e.g. Clapham, London" />
                </View>
                <View style={{ width: 110 }}>
                  <Field label="Postcode" value={postcode} onChange={setPostcode} placeholder="SW4" />
                </View>
              </Row>
              <Notice>Contractors only see your area and postcode district. Your full address is shared only with the contractor you choose.</Notice>
            </>
          ) : null}

          {step.kind === 'photos' ? (
            <>
              <Text style={type.title}>Show us the space</Text>
              <Text style={type.body}>Stand in a corner and capture each wall. Add close-ups of any damage. Good photos mean more accurate quotes and fewer questions.</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {photos.map((uri, i) => (
                  <Photo key={`${uri}-${i}`} uri={uri} style={{ width: '31.5%', aspectRatio: 1, borderRadius: 14 }}>
                    <Pressable
                      accessibilityLabel="Remove photo"
                      onPress={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                      style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(14,15,18,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="close" size={16} color="#fff" />
                    </Pressable>
                  </Photo>
                ))}
                <Pressable onPress={pickPhotos} accessibilityRole="button" accessibilityLabel="Add from library" style={tileStyle}>
                  <Ionicons name="images-outline" size={24} color={colors.ink} />
                  <Text style={type.metaStrong}>Library</Text>
                </Pressable>
                <Pressable onPress={takePhoto} accessibilityRole="button" accessibilityLabel="Take a photo" style={tileStyle}>
                  <Ionicons name="camera-outline" size={24} color={colors.ink} />
                  <Text style={type.metaStrong}>Camera</Text>
                </Pressable>
              </View>
              <Notice icon="shield-checkmark-outline">Location data is removed from your photos before they're shared.</Notice>
            </>
          ) : null}

          {step.kind === 'review' ? (
            <>
              <Text style={type.title}>Looks good?</Text>
              <Text style={type.body}>This is what contractors will see.</Text>
              <Card style={{ gap: 4 }}>
                <Text style={type.heading}>{title}</Text>
                <Text style={type.meta}>{area} · {postcode.toUpperCase()} · {cat.name}</Text>
                {description ? <Text style={[type.body, { marginTop: 8 }]}>{description}</Text> : null}
              </Card>
              <Card style={{ paddingVertical: 4 }}>
                {questions.map((q, i) => (
                  <Pressable key={q.id} onPress={() => setIndex(i)} accessibilityRole="button" accessibilityHint="Edit this answer">
                    <KeyValue label={q.summaryLabel} value={formatAnswer(answers[q.id])} last={i === questions.length - 1} />
                  </Pressable>
                ))}
              </Card>
              <Card style={{ gap: 10 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={type.bodyStrong}>Photos & videos</Text>
                  <Text style={type.metaStrong} onPress={() => setIndex(steps.length - 2)}>{photos.length} · Edit</Text>
                </Row>
                {photos.length > 0 ? (
                  <Row gap={6}>
                    {photos.slice(0, 5).map((uri, i) => (
                      <Photo key={`${uri}-${i}`} uri={uri} style={{ width: 54, height: 54, borderRadius: 12 }} />
                    ))}
                  </Row>
                ) : (
                  <Text style={type.meta}>No photos yet. Projects with photos get more quotes.</Text>
                )}
              </Card>
              <Notice>Your name, phone number and exact address stay private. Free to post, no obligation to hire.</Notice>
            </>
          ) : null}
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const tileStyle = {
  width: '31.5%' as const,
  aspectRatio: 1,
  borderRadius: 14,
  borderWidth: 1.5,
  borderStyle: 'dashed' as const,
  borderColor: '#B7B7B2',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  gap: 6,
};

function QuestionStep({ question, value, onChange }: { question: Question; value: AnswerValue | undefined; onChange: (v: AnswerValue) => void }) {
  return (
    <>
      <Text style={type.title}>{question.title}</Text>
      {question.help ? <Text style={type.body}>{question.help}</Text> : null}

      {question.type === 'single' || question.type === 'multi' ? (
        <View style={{ gap: 8 }}>
          {question.options!.map((o) => {
            const selected = question.type === 'multi' ? Array.isArray(value) && value.includes(o) : value === o;
            return (
              <OptionRow
                key={o}
                label={o}
                multi={question.type === 'multi'}
                selected={selected}
                onPress={() => {
                  if (question.type === 'single') return onChange(o);
                  const cur = Array.isArray(value) ? value : [];
                  onChange(cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o]);
                }}
              />
            );
          })}
        </View>
      ) : null}

      {question.type === 'number' ? (
        <Row gap={20} style={{ justifyContent: 'center', paddingVertical: 20 }}>
          <Stepper icon="remove" label="Fewer" onPress={() => onChange(Math.max(question.min ?? 0, (typeof value === 'number' ? value : 0) - 1))} />
          <Text style={{ fontSize: 56, fontWeight: '800', minWidth: 90, textAlign: 'center', color: colors.ink }}>{typeof value === 'number' ? value : 0}</Text>
          <Stepper icon="add" label="More" onPress={() => onChange(Math.min(question.max ?? 999, (typeof value === 'number' ? value : 0) + 1))} />
        </Row>
      ) : null}

      {question.type === 'text' ? (
        <Field label="" value={typeof value === 'string' ? value : ''} onChange={onChange} placeholder="Optional" multiline />
      ) : null}
    </>
  );
}

function Stepper({ icon, label, onPress }: { icon: 'add' | 'remove'; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={24} color={colors.ink} />
    </Pressable>
  );
}

function Field({ label, value, onChange, placeholder, multiline }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  return (
    <View style={{ gap: 8 }}>
      {label ? <Text style={type.bodyStrong}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.ink3}
        multiline={multiline}
        accessibilityLabel={label || placeholder}
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.line,
          paddingHorizontal: 16,
          paddingVertical: multiline ? 14 : 0,
          height: multiline ? 110 : 52,
          fontSize: 16,
          color: colors.ink,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}
