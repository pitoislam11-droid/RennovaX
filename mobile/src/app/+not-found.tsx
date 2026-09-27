import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

import { BrandMark } from '@/components/ui/brand';
import { colors, typefaces } from '@/lib/design/tokens';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 justify-center px-8" style={{ backgroundColor: colors.canvas }} testID="not-found-screen">
        <BrandMark />
        <Text className="mt-10 text-[32px] leading-9 tracking-[-0.8px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>
          That page isn’t here
        </Text>
        <Text className="mt-3 text-[15px] leading-6" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
          The link may be out of date. Head back to Rennova and continue from your home screen.
        </Text>
        <Link href="/" testID="go-home-link" className="mt-8">
          <View className="min-h-14 items-center justify-center rounded-2xl bg-[#FFD21C] px-6">
            <Text style={{ color: colors.ink, fontFamily: typefaces.demi }}>Back to Rennova</Text>
          </View>
        </Link>
      </View>
    </>
  );
}
