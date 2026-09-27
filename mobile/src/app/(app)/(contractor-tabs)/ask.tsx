import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ClipboardList,
  HardHat,
  Layers3,
  Package,
  TriangleAlert,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';
import { PaperSurface } from '@/components/ui/surface';
import { PageTitle } from '@/components/ui/typography';
import { api } from '@/lib/api/api';
import type { AskCard, AskRequest, AskResponse } from '@/lib/contracts';
import { colors, typefaces } from '@/lib/design/tokens';
import { useQuietEntrance } from '@/lib/motion';

const prompts = [
  { label: 'Structure my quote', prompt: 'Help me structure a clear private quotation for this brief' },
  { label: 'Materials checklist', prompt: 'What material categories should I confirm before quoting?' },
  { label: 'What’s missing?', prompt: 'What details are still missing from this homeowner brief?' },
  { label: 'Risks to flag', prompt: 'What risks or assumptions should I call out in my quote?' },
] as const;

function cardIcon(kind: AskCard['kind']) {
  switch (kind) {
    case 'quote_structure':
      return ClipboardList;
    case 'materials_categories':
      return Package;
    case 'risk_notes':
      return TriangleAlert;
    case 'next_step':
      return HardHat;
    default:
      return Layers3;
  }
}

export default function AskRennovaScreen() {
  const params = useLocalSearchParams<{ projectId?: string | string[]; title?: string | string[] }>();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;
  const projectTitle = Array.isArray(params.title) ? params.title[0] : params.title;
  const { quiet, enter } = useQuietEntrance();
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<AskResponse | null>(null);

  const contextLine = useMemo(
    () => (projectTitle ? `Helping with ${projectTitle}` : 'Quote prep, materials thinking, brief clarity'),
    [projectTitle],
  );

  const askMutation = useMutation({
    mutationFn: (body: AskRequest) => api.post<AskResponse, AskRequest>('/api/ask/help', body),
    onSuccess: (data) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResult(data);
    },
  });

  const runAsk = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 3) return;
    setPrompt(trimmed);
    askMutation.mutate({ prompt: trimmed, projectId });
  };

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']} style={{ backgroundColor: colors.canvas }} testID="ask-rennova-screen">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {projectId ? (
          <Pressable onPress={() => router.back()} hitSlop={8} testID="ask-back">
            <Text className="mb-4 text-[15px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Back</Text>
          </Pressable>
        ) : (
          <BrandMark />
        )}

        <Animated.View entering={enter(0)} className={projectId ? '' : 'mt-6'}>
          <PageTitle subtitle={contextLine} title="Ask Rennova" />
        </Animated.View>

        <Animated.View entering={enter(60)} className="mt-7">
          <PaperSurface style={{ padding: 18 }}>
            <TextInput
              className="min-h-[96px] text-[16px] leading-6"
              multiline
              onChangeText={setPrompt}
              placeholder="e.g. Help me break down labour vs materials for this bathroom…"
              placeholderTextColor="#9A958A"
              style={{ color: colors.ink, fontFamily: typefaces.regular, textAlignVertical: 'top' }}
              testID="ask-prompt-input"
              value={prompt}
            />
            <View className="mt-4">
              <Button
                disabled={prompt.trim().length < 3}
                label="Ask Rennova"
                loading={askMutation.isPending}
                onPress={() => runAsk(prompt)}
                testID="ask-submit-button"
                variant="primary"
              />
            </View>
          </PaperSurface>
        </Animated.View>

        <Animated.View entering={enter(100)} className="mt-5 flex-row flex-wrap gap-2" testID="ask-prompt-chips">
          {prompts.map((item) => (
            <Pressable
              key={item.label}
              className="min-h-11 items-center justify-center rounded-full border border-[#E0DACD] bg-[#FFFDF8] px-4 active:bg-[#FFF2A8]"
              onPress={() => runAsk(item.prompt)}
              testID={`ask-chip-${item.label}`}
            >
              <Text style={{ color: colors.ink, fontFamily: typefaces.medium }}>{item.label}</Text>
            </Pressable>
          ))}
        </Animated.View>

        {askMutation.error ? (
          <Text className="mt-5 text-sm" style={{ color: colors.red, fontFamily: typefaces.medium }} testID="ask-error">
            {askMutation.error.message}
          </Text>
        ) : null}

        {result ? (
          <Animated.View entering={quiet ? undefined : FadeInDown.duration(380).springify().damping(22)} className="mt-8">
            <Text className="text-[17px] leading-6" style={{ color: colors.ink, fontFamily: typefaces.medium }}>
              {result.acknowledgement}
            </Text>
            <View className="mt-5 gap-3">
              {result.cards.map((card) => {
                const Icon = cardIcon(card.kind);
                return (
                  <PaperSurface key={`${card.kind}-${card.title}`} style={{ padding: 18 }} testID={`ask-card-${card.kind}`}>
                    <View className="flex-row items-center">
                      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF2A8]">
                        <Icon color={colors.ink} size={20} />
                      </View>
                      <Text className="ml-3 flex-1 text-[18px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>
                        {card.title}
                      </Text>
                    </View>
                    {card.items.map((item, index) => (
                      <View className="mt-3 flex-row" key={`${card.title}-${index}`}>
                        <View className="mt-2 h-1.5 w-1.5 rounded-full bg-[#FFD21C]" />
                        <Text className="ml-3 flex-1 text-[14px] leading-5" style={{ color: colors.ink, fontFamily: typefaces.regular }}>
                          {item}
                        </Text>
                      </View>
                    ))}
                    {card.note ? (
                      <Text className="mt-4 text-[13px] leading-5" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
                        {card.note}
                      </Text>
                    ) : null}
                  </PaperSurface>
                );
              })}
            </View>
            <Text className="mt-5 text-center text-[12px] leading-5" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
              Live supplier prices appear only when connected — Rennova never invents them.
            </Text>
          </Animated.View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
