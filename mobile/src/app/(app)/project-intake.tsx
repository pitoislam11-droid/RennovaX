import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProjectQuestionControl } from '@/components/project-question-control';
import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ErrorState } from '@/components/ui/state-view';
import { api } from '@/lib/api/api';
import type { IntakeAnswer, IntakeStep, IntakeTurn, NextIntakeRequest } from '@/lib/contracts';
import { colors, typefaces } from '@/lib/design/tokens';
import { useQuietEntrance } from '@/lib/motion';
import { useProjectDraft } from '@/lib/projects/project-store';

function answerIsValid(answer: IntakeAnswer, question: NonNullable<IntakeStep['question']>) {
  if (!question.required) return true;
  if (question.type === 'single_choice' || question.type === 'yes_no') return (answer.selectedOptionIds?.length ?? 0) >= 1;
  if (question.type === 'multi_choice') return (answer.selectedOptionIds?.length ?? 0) >= Math.max(1, question.minSelections);
  if (question.type === 'short_text') return Boolean(answer.text?.trim());
  if (question.type === 'date_choice') return question.options.length > 0
    ? (answer.selectedOptionIds?.length ?? 0) >= 1
    : Boolean(answer.text?.trim());
  if (question.type === 'measurement') return answer.value !== undefined && Number.isFinite(answer.value);
  if (question.type === 'media_upload') return (answer.mediaCount ?? 0) >= question.minSelections;
  return true;
}

export default function ProjectIntakeScreen() {
  const initialRequest = useProjectDraft((state) => state.initialRequest);
  const location = useProjectDraft((state) => state.location);
  const turns = useProjectDraft((state) => state.turns);
  const step = useProjectDraft((state) => state.step);
  const photos = useProjectDraft((state) => state.photos);
  const addTurn = useProjectDraft((state) => state.addTurn);
  const setStep = useProjectDraft((state) => state.setStep);
  const setPhotos = useProjectDraft((state) => state.setPhotos);
  const [answer, setAnswer] = useState<IntakeAnswer>({});
  const question = step?.question ?? null;
  const progress = useSharedValue(0);
  const { enter, quiet } = useQuietEntrance();

  const progressValue = useMemo(() => {
    if (!step) return 0;
    const remaining = step.progress.estimatedRemaining ?? Math.max(1, 8 - step.progress.answeredCount);
    return Math.min(0.94, step.progress.answeredCount / Math.max(1, step.progress.answeredCount + remaining));
  }, [step]);

  useEffect(() => {
    progress.value = withTiming(progressValue, { duration: quiet ? 0 : 450 });
  }, [progress, progressValue, quiet]);

  useEffect(() => {
    if (!question) return;
    if (question.type === 'measurement' && question.unitOptions[0]) {
      setAnswer({ unit: question.unitOptions[0] });
    } else if (question.type === 'date_choice' && question.options.length === 0) {
      setAnswer({ text: new Date().toISOString() });
    } else if (question.type === 'media_upload') {
      setAnswer({ mediaCount: useProjectDraft.getState().photos.length });
    } else {
      setAnswer({});
    }
  }, [question]);

  const animatedProgress = useAnimatedStyle(() => ({ width: `${Math.max(4, progress.value * 100)}%` }));

  const mutation = useMutation({
    mutationFn: async (submittedAnswer: IntakeAnswer) => {
      if (!question) throw new Error('The next question is not available.');
      const turn: IntakeTurn = { question, answer: submittedAnswer };
      const body: NextIntakeRequest = { initialRequest, location, turns: [...turns, turn] };
      const nextStep = await api.post<IntakeStep, NextIntakeRequest>('/api/intake/next', body);
      return { nextStep, turn };
    },
    onSuccess: ({ nextStep, turn }) => {
      addTurn(turn);
      setStep(nextStep);
      if (nextStep.kind === 'complete') router.replace('/(app)/project-review');
    },
  });

  if (!initialRequest || !step || !question) {
    return (
      <SafeAreaView className="flex-1 justify-center px-6" style={{ backgroundColor: colors.canvas }} testID="intake-missing-state">
        <ErrorState message="This project draft is no longer open. Start again and we’ll rebuild it with you." onRetry={() => router.replace('/(app)/new-project')} />
      </SafeAreaView>
    );
  }

  const canContinue = answerIsValid(answer, question);
  const submit = (submittedAnswer = answer) => mutation.mutate(submittedAnswer);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1" style={{ backgroundColor: colors.canvas }} testID="project-intake-screen">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScreenHeader subtitle={step.category} title="Build your brief" />
        <View className="px-5 pb-3">
          <View className="h-2 overflow-hidden rounded-full bg-[#E4DED2]" testID="intake-progress-track">
            <Animated.View className="h-2 rounded-full bg-[#FFD21C]" style={animatedProgress} testID="intake-progress-value" />
          </View>
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-xs" style={{ color: colors.muted, fontFamily: typefaces.medium }}>{step.progress.label}</Text>
            <Text className="text-xs" style={{ color: colors.muted, fontFamily: typefaces.regular }}>{step.progress.answeredCount} answered</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View entering={enter(0)} key={question.id}>
            <Text className="mt-5 text-[30px] leading-[35px] tracking-[-0.7px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>{question.title}</Text>
            {question.helperText ? <Text className="mt-3 text-[15px] leading-6" style={{ color: colors.muted, fontFamily: typefaces.regular }}>{question.helperText}</Text> : null}
            {!question.required ? <Text className="mt-2 text-[13px]" style={{ color: colors.green, fontFamily: typefaces.demi }}>Optional</Text> : null}
            <View className="mt-7">
              <ProjectQuestionControl answer={answer} onAnswerChange={setAnswer} onPhotosChange={setPhotos} photos={photos} question={question} />
            </View>
          </Animated.View>

          {mutation.error ? (
            <View className="mt-5 rounded-2xl bg-[#FFF0EC] px-4 py-3" testID="intake-error">
              <Text className="text-sm leading-5" style={{ color: colors.red, fontFamily: typefaces.medium }}>{mutation.error.message}</Text>
            </View>
          ) : null}

          <View className="mt-8">
            <Button icon={ArrowRight} label="Continue" disabled={!canContinue} loading={mutation.isPending} onPress={() => submit()} testID="intake-continue-button" variant="primary" />
            {!question.required ? (
              <View className="mt-2">
                <Button label="Skip this question" disabled={mutation.isPending} onPress={() => submit(question.type === 'media_upload' ? { mediaCount: photos.length } : {})} testID="intake-skip-button" variant="ghost" />
              </View>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
