import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ArrowRight, HardHat, Home } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/ui/brand';
import { api } from '@/lib/api/api';
import type { UserRole } from '@/lib/contracts';
import { colors, shadows, typefaces } from '@/lib/design/tokens';
import { contractorHomeHref, homeownerHomeHref } from '@/lib/navigation';
import { useProfile } from '@/lib/profile';
import { queryKeys } from '@/lib/query-keys';

export default function RoleSelectScreen() {
  const queryClient = useQueryClient();
  const profileQuery = useProfile();
  const mutation = useMutation({
    mutationFn: (role: UserRole) => api.post<{ activeRole: UserRole; roles: UserRole[] }, { role: UserRole }>('/api/profile/roles', { role }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      if (data.activeRole === 'HOMEOWNER') {
        router.replace(homeownerHomeHref());
      } else {
        router.replace(contractorHomeHref({ contractorProfile: profileQuery.data?.contractorProfile ?? null }));
      }
    },
  });

  const choice = (role: UserRole, title: string, detail: string) => {
    const Icon = role === 'HOMEOWNER' ? Home : HardHat;
    return (
      <Pressable
        accessibilityLabel={`${title}. ${detail}`}
        accessibilityRole="button"
        className="mb-4 flex-row items-center rounded-[28px] bg-[#FFFDF8] p-5 active:scale-[0.99]"
        disabled={mutation.isPending}
        onPress={() => mutation.mutate(role)}
        style={shadows.soft}
        testID={`select-${role.toLowerCase()}-role-button`}
      >
        <View className="h-16 w-16 items-center justify-center rounded-[22px]" style={{ backgroundColor: role === 'HOMEOWNER' ? colors.yellow : colors.ink }}>
          <Icon color={role === 'HOMEOWNER' ? colors.ink : colors.paper} size={28} />
        </View>
        <View className="ml-4 flex-1">
          <Text className="text-xl" style={{ color: colors.ink, fontFamily: typefaces.demi }}>{title}</Text>
          <Text className="mt-1 text-sm leading-5" style={{ color: colors.muted, fontFamily: typefaces.regular }}>{detail}</Text>
        </View>
        <ArrowRight color={colors.ink} size={21} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 px-6" edges={['top', 'bottom']} style={{ backgroundColor: colors.canvas }} testID="role-select-screen">
      <View className="mt-4"><BrandMark /></View>
      <View className="flex-1 justify-center">
        <Text className="text-[36px] leading-[41px] tracking-[-1px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>How will you use Rennova first?</Text>
        <Text className="mb-8 mt-3 text-[15px] leading-6" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
          You can add the other role later without creating another account.
        </Text>
        {choice('HOMEOWNER', 'Plan work on my home', 'Create a contractor-ready brief and collect quotes')}
        {choice('CONTRACTOR', 'Find the right jobs', 'Set up your storefront and quote on complete briefs')}
        {mutation.error ? <Text className="mt-2 text-center text-sm" style={{ color: colors.red, fontFamily: typefaces.medium }} testID="role-select-error">{mutation.error.message}</Text> : null}
      </View>
    </SafeAreaView>
  );
}
