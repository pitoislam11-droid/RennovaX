import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/ui/brand';
import { ScreenHeader } from '@/components/ui/screen-header';
import { colors, shadows, typefaces } from '@/lib/design/tokens';
import { appStoreListingDraft, launchContacts, launchVersionLabel } from '@/lib/launch';

export default function AboutScreen() {
  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']} style={{ backgroundColor: colors.canvas }} testID="about-screen">
      <ScreenHeader title="About Rennova" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="items-start rounded-[28px] bg-[#173B31] p-6" style={shadows.soft}>
          <BrandMark inverse />
          <Text className="mt-6 text-[28px] leading-8 tracking-[-0.6px]" style={{ color: colors.paper, fontFamily: typefaces.demi }}>
            {appStoreListingDraft.subtitle}
          </Text>
          <Text className="mt-3 text-[15px] leading-6" style={{ color: 'rgba(255,253,248,0.78)', fontFamily: typefaces.regular }}>
            {appStoreListingDraft.promotionalText}
          </Text>
        </View>

        <Text className="mt-8 text-[15px] leading-6" style={{ color: colors.ink, fontFamily: typefaces.regular }}>
          {launchVersionLabel}
        </Text>
        <Text className="mt-2 text-[14px] leading-5" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
          Support: {launchContacts.supportEmail}
        </Text>
        <Text className="mt-1 text-[12px] leading-5" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
          {launchContacts.userOwnedNote}
        </Text>

        <Text className="mt-8 text-[18px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>App Store listing draft</Text>
        <Text className="mt-2 text-[14px] leading-6" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
          {appStoreListingDraft.description}
        </Text>

        <Pressable className="mt-6 min-h-14 justify-center rounded-2xl border border-[#E3DED2] bg-[#FFFDF8] px-5 active:opacity-80" onPress={() => router.push('/(app)/privacy')} testID="about-privacy-link">
          <Text style={{ color: colors.ink, fontFamily: typefaces.demi }}>Privacy</Text>
        </Pressable>
        <Pressable className="mt-3 min-h-14 justify-center rounded-2xl border border-[#E3DED2] bg-[#FFFDF8] px-5 active:opacity-80" onPress={() => router.push('/(app)/terms')} testID="about-terms-link">
          <Text style={{ color: colors.ink, fontFamily: typefaces.demi }}>Terms of use</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
