import type { LucideIcon } from 'lucide-react-native';
import { CircleAlert, LoaderCircle } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { colors, typefaces } from '@/lib/design/tokens';
import { useQuietEntrance } from '@/lib/motion';

export function LoadingView({ label = 'Getting things ready…', testID = 'loading-indicator' }: { label?: string; testID?: string }) {
  const { quiet } = useQuietEntrance();
  return (
    <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: colors.canvas }} testID={testID}>
      <Animated.View entering={quiet ? undefined : FadeIn.duration(250)} className="items-center">
        <LoaderCircle color={colors.ink} size={28} />
        <Text className="mt-4 text-center text-base" style={{ color: colors.muted, fontFamily: typefaces.medium }}>
          {label}
        </Text>
      </Animated.View>
    </View>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  actionLabel,
  onAction,
  testID,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  testID: string;
}) {
  return (
    <View className="items-center rounded-[28px] border border-[#E5E0D5] bg-[#FFFDF8] px-7 py-10" testID={testID}>
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF2A8]">
        <Icon color={colors.ink} size={26} />
      </View>
      <Text className="mt-5 text-center text-xl" style={{ color: colors.ink, fontFamily: typefaces.demi }}>{title}</Text>
      <Text className="mt-2 text-center text-sm leading-5" style={{ color: colors.muted, fontFamily: typefaces.regular }}>{body}</Text>
      {actionLabel && onAction ? (
        <View className="mt-6 w-full">
          <Button label={actionLabel} onPress={onAction} testID={`${testID}-action`} variant="primary" />
        </View>
      ) : null}
    </View>
  );
}

export function ErrorState({ message, onRetry, testID = 'error-view' }: { message: string; onRetry?: () => void; testID?: string }) {
  return (
    <View className="items-center rounded-[28px] bg-[#FFF1EE] px-7 py-8" testID={testID}>
      <CircleAlert color={colors.red} size={28} />
      <Text className="mt-3 text-center text-base" style={{ color: colors.ink, fontFamily: typefaces.demi }}>We hit a snag</Text>
      <Text className="mt-2 text-center text-sm leading-5" style={{ color: colors.muted, fontFamily: typefaces.regular }}>{message}</Text>
      {onRetry ? (
        <View className="mt-5 w-full">
          <Button label="Try again" onPress={onRetry} testID={`${testID}-retry`} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}
