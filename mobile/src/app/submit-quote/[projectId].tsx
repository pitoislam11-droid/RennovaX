import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';

import { Button, Card, EmptyState, Header, Notice, OptionRow, Row, Screen, Section, Segmented } from '@/components/ui';
import { formatAnswer, questionsFor } from '@/data/questionFlows';
import { newId } from '@/data/reducer';
import { canReviseQuote, canSubmitQuote, formatPrice, visibleQuotes } from '@/data/rules';
import { useStore } from '@/data/store';
import type { PriceType } from '@/data/types';
import { colors, GUTTER, radius, type } from '@/theme';

const DAY = 24 * 60 * 60 * 1000;
const START_OPTIONS = [3, 7, 14, 21, 28];

function lines(text: string): string[] {
  return text.split('\n').map((l) => l.trim()).filter(Boolean);
}

export default function SubmitQuote() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { state, viewer, myBusiness, project: getProject, dispatch } = useStore();
  const project = getProject(projectId);
  const existing = project ? visibleQuotes(viewer, project, state.quotes)[0] : undefined;

  const scopeLines = project
    ? questionsFor(project.categoryId)
        .filter((q) => project.answers[q.id] !== undefined && !['materials', 'occupied', 'start', 'access', 'property_type'].includes(q.id))
        .map((q) => `${q.summaryLabel}: ${formatAnswer(project.answers[q.id])}`)
    : [];

  const [price, setPrice] = useState(existing ? String(existing.price) : '');
  const [vat, setVat] = useState<'inc' | 'ex'>(existing && !existing.vatIncluded ? 'ex' : 'inc');
  const [priceType, setPriceType] = useState<PriceType>(existing?.priceType ?? 'fixed');
  const [materials, setMaterials] = useState<'yes' | 'no'>(existing && !existing.materialsIncluded ? 'no' : 'yes');
  const [duration, setDuration] = useState(existing ? String(existing.durationDays) : '');
  const [startIn, setStartIn] = useState(existing ? Math.max(3, Math.round((new Date(existing.earliestStart).getTime() - Date.now()) / DAY)) : 14);
  const [warranty, setWarranty] = useState<string>(existing ? String(existing.warrantyMonths) : '12');
  const [included, setIncluded] = useState(existing ? existing.included.join('\n') : scopeLines.join('\n'));
  const [exclusions, setExclusions] = useState(existing ? existing.exclusions.join('\n') : '');
  const [assumptions, setAssumptions] = useState(existing?.assumptions ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  if (!project) {
    return (
      <Screen>
        <Header />
        <EmptyState icon="alert-circle-outline" title="Project not found" body="" />
      </Screen>
    );
  }
  const allowed = existing ? canReviseQuote(existing, project) : canSubmitQuote(myBusiness.id, project, state.quotes);
  if (!allowed) {
    return (
      <Screen>
        <Header />
        <EmptyState icon="lock-closed-outline" title="Quoting closed" body="This project isn't accepting quotes from you any more." />
      </Screen>
    );
  }

  const amount = Number(price.replace(/[^0-9.]/g, ''));
  const days = Number(duration);
  const valid = amount > 0 && days > 0 && lines(included).length > 0;

  const send = () => {
    const quote = {
      id: existing?.id ?? newId('q'),
      projectId: project.id,
      contractorId: myBusiness.id,
      price: amount,
      priceType,
      vatIncluded: vat === 'inc',
      materialsIncluded: materials === 'yes',
      durationDays: days,
      earliestStart: new Date(Date.now() + startIn * DAY).toISOString(),
      warrantyMonths: Number(warranty),
      included: lines(included),
      exclusions: lines(exclusions),
      assumptions: assumptions.trim(),
      notes: notes.trim(),
      submittedAt: existing?.submittedAt ?? new Date().toISOString(),
      status: 'submitted' as const,
      revision: existing?.revision ?? 1,
    };
    dispatch(existing ? { type: 'reviseQuote', quote } : { type: 'submitQuote', quote });
    router.replace('/(tabs)/projects');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        footer={
          <>
            <Button label={`${existing ? 'Update' : 'Send'} quote${amount > 0 ? ` · ${formatPrice(amount)}` : ''}`} onPress={send} disabled={!valid} />
            <Text style={[type.meta, { textAlign: 'center' }]}>You can revise it until the homeowner responds.</Text>
          </>
        }>
        <Header title={existing ? 'Revise your quote' : 'Your quote'} subtitle={project.title} />
        <View style={{ paddingHorizontal: GUTTER }}>
          <Notice>Only the homeowner will see this quote.</Notice>
        </View>

        <Section title="Total price">
          <Row gap={6} style={{ backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 2, borderColor: colors.ink, paddingHorizontal: 16, height: 68 }}>
            <Text style={{ fontSize: 32, fontWeight: '800', color: colors.ink3 }}>£</Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.ink3}
              accessibilityLabel="Total price in pounds"
              style={{ flex: 1, fontSize: 32, fontWeight: '800', color: colors.ink }}
            />
          </Row>
          <Segmented value={vat} onChange={setVat} options={[{ value: 'inc', label: 'Including VAT' }, { value: 'ex', label: 'Excluding VAT' }]} />
        </Section>

        <Section title="How firm is this price?">
          <OptionRow label="Fixed price" sublabel="Won't change unless the scope does" selected={priceType === 'fixed'} onPress={() => setPriceType('fixed')} />
          <OptionRow label="Firm, subject to a site visit" selected={priceType === 'site_visit'} onPress={() => setPriceType('site_visit')} />
          <OptionRow label="Estimate only" selected={priceType === 'estimate'} onPress={() => setPriceType('estimate')} />
        </Section>

        <Section title="Materials">
          <Segmented value={materials} onChange={setMaterials} options={[{ value: 'yes', label: 'Included' }, { value: 'no', label: 'Not included' }]} />
        </Section>

        <Section title="Timing">
          <Row>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={type.meta}>Duration (working days)</Text>
              <TextInput value={duration} onChangeText={setDuration} keyboardType="number-pad" placeholder="e.g. 8" placeholderTextColor={colors.ink3} accessibilityLabel="Duration in working days" style={inputStyle} />
            </View>
          </Row>
          <Text style={type.meta}>Earliest start</Text>
          <Row gap={6} style={{ flexWrap: 'wrap' }}>
            {START_OPTIONS.map((d) => (
              <View key={d} style={{ width: '31%' }}>
                <OptionRow label={d < 7 ? `${d} days` : `${d / 7} week${d > 7 ? 's' : ''}`} selected={startIn === d} onPress={() => setStartIn(d)} />
              </View>
            ))}
          </Row>
        </Section>

        <Section title="Workmanship warranty">
          <Segmented
            value={warranty}
            onChange={setWarranty}
            options={[{ value: '0', label: 'None' }, { value: '6', label: '6 mo' }, { value: '12', label: '1 yr' }, { value: '24', label: '2 yrs' }]}
          />
        </Section>

        <Section title="What's included">
          <Text style={type.meta}>One item per line. We've started from the homeowner's answers.</Text>
          <TextInput value={included} onChangeText={setIncluded} multiline accessibilityLabel="Included" style={[inputStyle, multiStyle]} />
        </Section>
        <Section title="Exclusions">
          <TextInput value={exclusions} onChangeText={setExclusions} multiline placeholder="One per line, e.g. Radiators" placeholderTextColor={colors.ink3} accessibilityLabel="Exclusions" style={[inputStyle, multiStyle]} />
        </Section>
        <Section title="Assumptions">
          <TextInput value={assumptions} onChangeText={setAssumptions} multiline placeholder="e.g. Standard trade colours, parking available" placeholderTextColor={colors.ink3} accessibilityLabel="Assumptions" style={[inputStyle, multiStyle]} />
        </Section>
        <Section title="Note to the homeowner">
          <Card padded={false}>
            <TextInput value={notes} onChangeText={setNotes} multiline placeholder="Introduce yourself and how you'd approach the job" placeholderTextColor={colors.ink3} accessibilityLabel="Note to homeowner" style={[inputStyle, multiStyle, { borderWidth: 0 }]} />
          </Card>
        </Section>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const inputStyle = {
  backgroundColor: colors.surface,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: colors.line,
  paddingHorizontal: 16,
  height: 52,
  fontSize: 16,
  color: colors.ink,
};
const multiStyle = { height: 110, paddingTop: 14, textAlignVertical: 'top' as const };
