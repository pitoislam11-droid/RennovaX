import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowRight, HardHat, Home } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/ui/brand';
import { colors, shadows, typefaces } from '@/lib/design/tokens';
import type { UserRole } from '@/lib/contracts';
import { useQuietEntrance } from '@/lib/motion';

const heroImage = 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=88';

function RoleChoice({
  role,
  title,
  body,
  icon: Icon,
  testID,
}: {
  role: UserRole;
  title: string;
  body: string;
  icon: typeof Home;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityLabel={`${title}. ${body}`}
      accessibilityRole="button"
      className="mb-3 min-h-[92px] flex-row items-center rounded-[24px] border border-black/5 bg-[#FFFDF8] px-4 py-4 active:scale-[0.99]"
      onPress={() => router.push({ pathname: '/auth', params: { role } })}
      style={shadows.soft}
      testID={testID}
    >
      <View className="h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: role === 'HOMEOWNER' ? colors.yellow : colors.ink }}>
        <Icon color={role === 'HOMEOWNER' ? colors.ink : colors.paper} size={25} strokeWidth={2.1} />
      </View>
      <View className="ml-4 flex-1">
        <Text className="text-lg" style={{ color: colors.ink, fontFamily: typefaces.demi }}>{title}</Text>
        <Text className="mt-1 text-sm leading-5" style={{ color: colors.muted, fontFamily: typefaces.regular }}>{body}</Text>
      </View>
      <ArrowRight color={colors.ink} size={20} />
    </Pressable>
  );
}

export default function WelcomeScreen() {
  const { enter, quiet } = useQuietEntrance();

  return (
    <View className="flex-1" style={{ backgroundColor: colors.canvas }} testID="welcome-screen">
      <View className="absolute left-0 right-0 top-0 h-[48%] overflow-hidden rounded-b-[44px]">
        <Image contentFit="cover" source={{ uri: heroImage }} style={{ height: '100%', width: '100%' }} transition={quiet ? 0 : 350} />
        <LinearGradient
          colors={['rgba(20,20,18,0.16)', 'rgba(20,20,18,0.72)']}
          locations={[0.15, 1]}
          style={{ position: 'absolute', inset: 0 }}
        />
      </View>
      <SafeAreaView className="flex-1 px-5" edges={['top', 'bottom']}>
        <Animated.View entering={enter(0)} className="mt-3">
          <BrandMark inverse />
        </Animated.View>
        <View className="flex-1 justify-end pb-2">
          <Animated.View entering={enter(80)} className="mb-7 px-1">
            <Text className="text-[38px] leading-[42px] tracking-[-1.4px]" style={{ color: colors.paper, fontFamily: typefaces.demi }}>
              Better work starts with a better brief.
            </Text>
            <Text className="mt-3 max-w-[330px] text-[15px] leading-6" style={{ color: 'rgba(255,253,248,0.82)', fontFamily: typefaces.regular }}>
              Describe the job in your own words. Rennova turns it into a clear plan people can quote with confidence.
            </Text>
          </Animated.View>
          <Animated.View entering={enter(160)}>
            <Text className="mb-3 ml-1 text-[15px]" style={{ color: colors.muted, fontFamily: typefaces.medium }}>
              I’m here as a
            </Text>
            <RoleChoice role="HOMEOWNER" title="Homeowner" body="Plan a job and find the right people" icon={Home} testID="choose-homeowner-button" />
            <RoleChoice role="CONTRACTOR" title="Contractor" body="Build your profile and win good work" icon={HardHat} testID="choose-contractor-button" />
          </Animated.View>
          <Text className="mt-1 text-center text-xs" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
            One account can switch between both roles.
          </Text>
          <View className="mt-4 flex-row justify-center gap-4">
            <Pressable accessibilityLabel="Privacy policy" accessibilityRole="link" onPress={() => router.push('/privacy')} testID="welcome-privacy">
              <Text className="text-[13px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Privacy</Text>
            </Pressable>
            <Pressable accessibilityLabel="Terms of use" accessibilityRole="link" onPress={() => router.push('/terms')} testID="welcome-terms">
              <Text className="text-[13px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Terms</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
