import { Text, View } from 'react-native';

import { colors, typefaces } from '@/lib/design/tokens';

/** Page-level title — no eyebrow kickers (DESIGN.md). */
export function PageTitle({
  title,
  subtitle,
  testID,
}: {
  title: string;
  subtitle?: string;
  testID?: string;
}) {
  return (
    <View testID={testID}>
      <Text className="text-[34px] leading-10 tracking-[-1px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>
        {title}
      </Text>
      {subtitle ? (
        <Text className="mt-2 max-w-[340px] text-[15px] leading-6" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function SectionHeading({
  title,
  actionLabel,
  onAction,
  testID,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}) {
  return (
    <View className="mb-4 flex-row items-end justify-between" testID={testID}>
      <Text className="text-[26px] tracking-[-0.5px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Text
          accessibilityRole="button"
          className="py-1 text-[15px]"
          onPress={onAction}
          style={{ color: colors.ink, fontFamily: typefaces.demi }}
        >
          {actionLabel}
        </Text>
      ) : null}
    </View>
  );
}
