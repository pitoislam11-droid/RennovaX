import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';
import { colors, typefaces } from '@/lib/design/tokens';

type ButtonProps = {
  label: string;
  onPress: () => void;
  testID: string;
  variant?: 'primary' | 'dark' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
};

export function Button({
  label,
  onPress,
  testID,
  variant = 'dark',
  loading = false,
  disabled = false,
  icon: Icon,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const backgroundColor = variant === 'primary'
    ? colors.yellow
    : variant === 'dark'
      ? colors.ink
      : variant === 'danger'
        ? colors.red
        : variant === 'secondary'
          ? colors.paper
          : 'transparent';
  const foreground = variant === 'dark' || variant === 'danger' ? colors.paper : colors.ink;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      testID={testID}
      className={cn(
        'min-h-14 flex-row items-center justify-center rounded-2xl px-5 active:scale-[0.98]',
        isDisabled && 'opacity-45',
        variant === 'secondary' && 'border border-[#DDD8CC]',
      )}
      style={{ backgroundColor }}
    >
      {loading ? (
        <ActivityIndicator testID={`${testID}-loading`} color={foreground} />
      ) : (
        <View className="flex-row items-center">
          {Icon ? <Icon size={19} color={foreground} strokeWidth={2.2} /> : null}
          <Text
            className={Icon ? 'ml-2 text-base' : 'text-base'}
            style={{ color: foreground, fontFamily: typefaces.demi }}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
