import { Text, View } from 'react-native';

import { colors, typefaces } from '@/lib/design/tokens';

export function BrandMark({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  return (
    <View className="flex-row items-center" testID="brand-mark">
      <View
        className={`${compact ? 'h-8 w-8 rounded-xl' : 'h-10 w-10 rounded-2xl'} items-center justify-center`}
        style={{ backgroundColor: colors.yellow }}
      >
        <Text style={{ color: colors.ink, fontFamily: typefaces.bold, fontSize: compact ? 17 : 21 }}>R</Text>
      </View>
      <Text
        className={`${compact ? 'ml-2 text-lg' : 'ml-3 text-2xl'} tracking-tight`}
        style={{ color: inverse ? colors.paper : colors.ink, fontFamily: typefaces.demi }}
      >
        Rennova
      </Text>
    </View>
  );
}
