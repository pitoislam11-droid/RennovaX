import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight, Lightbulb, MapPin, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { api } from '@/lib/api/api';
import type { IntakeStep, NextIntakeRequest } from '@/lib/contracts';
import { colors, shadows, typefaces } from '@/lib/design/tokens';
import { useQuietEntrance } from '@/lib/motion';
import { useProjectDraft } from '@/lib/projects/project-store';

const examples = [
  'I want to redo my bathroom',
  'I need my flat painted',
  'My flat roof is leaking',
] as const;

export default function NewProjectScreen() {
  const params = useLocalSearchParams<{ draft?: string }>();
  const [request, setRequest] = useState('');
  const [location, setLocation] = useState('');
  const setStart = useProjectDraft((state) => state.setStart);
  const setStep = useProjectDraft((state) => state.setStep);
  const { enter } = useQuietEntrance();

  useEffect(() => {
    if (typeof params.draft === 'string' && params.draft.trim()) {
      setRequest(params.draft.trim());
    }
  }, [params.draft]);

  const mutation = useMutation({
    mutationFn: async () => {
      const cleanRequest = request.trim();
      if (cleanRequest.length < 3) throw new Error('Add a little more about what you would like done.');
      const body: NextIntakeRequest = { initialRequest: cleanRequest, location: location.trim(), turns: [] };
      return api.post<IntakeStep, NextIntakeRequest>('/api/intake/next', body);
    },
    onSuccess: (step) => {
      setStart(request.trim(), location.trim());
      setStep(step);
      router.push(step.kind === 'complete' ? '/(app)/project-review' : '/(app)/project-intake');
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      style={{ backgroundColor: colors.canvas }}
      testID="new-project-screen"
    >
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScreenHeader title="New project" />
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={enter(0)} className="pt-4">
            <View className="h-14 w-14 items-center justify-center rounded-[20px] bg-[#FFD21C]">
              <Sparkles color={colors.ink} size={25} />
            </View>
            <Text
              className="mt-6 text-[34px] leading-[39px] tracking-[-1px]"
              style={{ color: colors.ink, fontFamily: typefaces.demi }}
            >
              What would you like done?
            </Text>
            <Text className="mt-3 text-[15px] leading-6" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
              Write naturally. No measurements or trade terms needed — Rennova asks the rest.
            </Text>
          </Animated.View>

          <Animated.View entering={enter(80)} className="mt-7 rounded-[28px] bg-[#FFFDF8] p-5" style={shadows.soft}>
            <TextInput
              className="min-h-[150px] text-[18px] leading-7"
              maxLength={1000}
              multiline
              onChangeText={setRequest}
              placeholder="For example: I want to replace the bath with a walk-in shower…"
              placeholderTextColor="#9B988F"
              style={{ color: colors.ink, fontFamily: typefaces.regular, textAlignVertical: 'top' }}
              testID="project-description-input"
              value={request}
            />
            <View className="mt-3 flex-row items-center justify-between border-t border-[#ECE7DD] pt-3">
              <View className="flex-row items-center">
                <Lightbulb color={colors.muted} size={16} />
                <Text className="ml-2 text-xs" style={{ color: colors.muted, fontFamily: typefaces.medium }}>
                  Plain English is perfect
                </Text>
              </View>
              <Text className="text-xs" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
                {request.length}/1000
              </Text>
            </View>
          </Animated.View>

          <View className="mt-5 min-h-14 flex-row items-center rounded-2xl border border-[#DDD8CC] bg-[#FFFDF8] px-4">
            <MapPin color={colors.muted} size={20} />
            <TextInput
              className="ml-3 flex-1 py-4 text-base"
              maxLength={120}
              onChangeText={setLocation}
              placeholder="Town or postcode (optional)"
              placeholderTextColor="#9B988F"
              style={{ color: colors.ink, fontFamily: typefaces.regular }}
              testID="project-location-input"
              value={location}
            />
          </View>

          <Text className="mb-3 ml-1 mt-7 text-[14px]" style={{ color: colors.muted, fontFamily: typefaces.medium }}>
            Or start from one of these
          </Text>
          <View className="gap-2">
            {examples.map((example, index) => (
              <Pressable
                className="min-h-12 flex-row items-center justify-between rounded-2xl border border-[#E3DED2] bg-[#FFFDF8] px-4 active:bg-[#FFF2A8]"
                key={example}
                onPress={() => setRequest(example)}
                testID={`project-example-${index + 1}`}
              >
                <Text className="flex-1 text-sm" style={{ color: colors.ink, fontFamily: typefaces.medium }}>
                  {example}
                </Text>
                <ArrowRight color={colors.muted} size={17} />
              </Pressable>
            ))}
          </View>

          {mutation.error ? (
            <View className="mt-5 rounded-2xl bg-[#FFF0EC] px-4 py-3" testID="project-start-error">
              <Text className="text-sm leading-5" style={{ color: colors.red, fontFamily: typefaces.medium }}>
                {mutation.error.message}
              </Text>
            </View>
          ) : null}

          <View className="mt-7">
            <Button
              icon={ArrowRight}
              label="Continue with Rennova"
              loading={mutation.isPending}
              onPress={() => mutation.mutate()}
              testID="start-intake-button"
              variant="primary"
            />
          </View>
          <Text className="mt-3 text-center text-xs" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
            Only the questions contractors genuinely need
          </Text>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
