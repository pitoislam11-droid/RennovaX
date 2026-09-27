import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { colors, typefaces } from '@/lib/design/tokens';

export function ScreenHeader({ title, subtitle, close = false }: { title?: string; subtitle?: string; close?: boolean }) {
  return (
    <View className="min-h-14 flex-row items-center px-5 py-2">
      <Pressable
        accessibilityLabel={close ? 'Close' : 'Go back'}
        className="h-11 w-11 items-center justify-center rounded-full bg-white/80 active:opacity-60"
        hitSlop={8}
        onPress={() => router.back()}
        testID="back-button"
      >
        <ChevronLeft color={colors.ink} size={24} />
      </Pressable>
      <View className="ml-3 flex-1">
        {title ? (
          <Text className="text-[18px] tracking-[-0.2px]" numberOfLines={1} style={{ color: colors.ink, fontFamily: typefaces.demi }}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text className="text-[13px]" numberOfLines={1} style={{ color: colors.muted, fontFamily: typefaces.medium }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
