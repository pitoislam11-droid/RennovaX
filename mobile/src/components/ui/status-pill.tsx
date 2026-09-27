import { Text, View } from 'react-native';

import { colors, typefaces } from '@/lib/design/tokens';

type Tone = 'neutral' | 'live' | 'won' | 'warn' | 'new';

const tones: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: '#F1EEE5', fg: colors.muted },
  live: { bg: '#E1EFE8', fg: colors.green },
  won: { bg: '#E1EFE8', fg: colors.green },
  warn: { bg: '#FFF0EC', fg: colors.red },
  new: { bg: colors.yellowSoft, fg: colors.ink },
};

export function StatusPill({ label, tone = 'neutral', testID }: { label: string; tone?: Tone; testID?: string }) {
  const palette = tones[tone];
  return (
    <View className="self-start rounded-full px-3 py-1.5" style={{ backgroundColor: palette.bg }} testID={testID}>
      <Text className="text-[12px]" style={{ color: palette.fg, fontFamily: typefaces.demi }}>
        {label}
      </Text>
    </View>
  );
}
