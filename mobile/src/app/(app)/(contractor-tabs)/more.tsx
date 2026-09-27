import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronRight, FileText, Home, Info, LogOut, Mail, Settings2, ShieldCheck, Sparkles, Trash2, UserRound } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, LoadingView } from '@/components/ui/state-view';
import { PageTitle } from '@/components/ui/typography';
import { api } from '@/lib/api/api';
import { authClient } from '@/lib/auth/auth-client';
import { useInvalidateSession } from '@/lib/auth/use-session';
import type { UserRole } from '@/lib/contracts';
import { colors, shadows, typefaces } from '@/lib/design/tokens';
import { homeownerHomeHref } from '@/lib/navigation';
import { useProfile } from '@/lib/profile';
import { queryKeys } from '@/lib/query-keys';

export default function ContractorMoreScreen() {
  const profileQuery = useProfile();
  const queryClient = useQueryClient();
  const invalidateSession = useInvalidateSession();

  const roleMutation = useMutation({
    mutationFn: (role: UserRole) => api.post<{ activeRole: UserRole; roles: UserRole[] }, { role: UserRole }>('/api/profile/roles', { role }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      if (data.activeRole === 'HOMEOWNER') router.replace(homeownerHomeHref());
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message ?? 'Could not sign out.');
    },
    onSuccess: async () => {
      await invalidateSession();
      queryClient.clear();
    },
  });

  if (profileQuery.isLoading) return <LoadingView label="Loading your account…" testID="contractor-more-loading" />;
  if (profileQuery.isError || !profileQuery.data) {
    return (
      <SafeAreaView className="flex-1 justify-center px-6" style={{ backgroundColor: colors.canvas }}>
        <ErrorState message={profileQuery.error?.message ?? 'Your profile could not be loaded.'} onRetry={() => void profileQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const profile = profileQuery.data;
  const business = profile.contractorProfile;
  const initials = (business?.businessName ?? profile.name).split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: colors.canvas }} testID="contractor-more-screen">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        <View className="pt-2">
          <PageTitle subtitle="Business profile, roles and trust." title="More" />
        </View>

        <View className="mt-7 flex-row items-center rounded-[28px] bg-[#FFFDF8] p-5" style={shadows.soft}>
          <View className="h-16 w-16 items-center justify-center rounded-[22px] bg-[#1D1D1B]">
            <Text className="text-xl" style={{ color: colors.yellow, fontFamily: typefaces.demi }}>{initials || 'R'}</Text>
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-xl" style={{ color: colors.ink, fontFamily: typefaces.demi }}>{business?.businessName ?? profile.name}</Text>
            <View className="mt-1 flex-row items-center">
              <Mail color={colors.muted} size={14} />
              <Text className="ml-1.5 text-sm" numberOfLines={1} style={{ color: colors.muted, fontFamily: typefaces.regular }}>{profile.email}</Text>
            </View>
            {business ? (
              <Text className="mt-1 text-xs" style={{ color: colors.muted, fontFamily: typefaces.medium }}>
                {business.accountKind === 'COMPANY' ? 'Company' : 'Sole trader'} · {business.verification === 'VERIFIED' ? 'Verified' : 'Unverified'}
              </Text>
            ) : null}
          </View>
          <UserRound color={colors.muted} size={20} />
        </View>

        <Pressable
          className="mt-5 min-h-[68px] flex-row items-center rounded-[22px] border border-[#E3DED2] bg-[#FFFDF8] px-4 active:bg-black/5"
          onPress={() => router.push('/(app)/contractor-setup')}
          testID="edit-contractor-profile-button"
        >
          <Settings2 color={colors.ink} size={20} />
          <Text className="ml-3 flex-1 text-base" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Edit business profile</Text>
          <ChevronRight color={colors.muted} size={18} />
        </Pressable>

        <Pressable
          className="mt-3 min-h-[68px] flex-row items-center rounded-[22px] border border-[#E3DED2] bg-[#FFFDF8] px-4 active:bg-black/5"
          onPress={() => roleMutation.mutate('HOMEOWNER')}
          testID="switch-homeowner-from-contractor"
        >
          <Home color={colors.ink} size={20} />
          <Text className="ml-3 flex-1 text-base" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Switch to homeowner</Text>
          <ChevronRight color={colors.muted} size={18} />
        </Pressable>
        {roleMutation.error ? <Text className="mt-3 text-sm" style={{ color: colors.red, fontFamily: typefaces.medium }}>{roleMutation.error.message}</Text> : null}

        <Text className="mb-3 ml-1 mt-8 text-[14px]" style={{ color: colors.muted, fontFamily: typefaces.medium }}>Trust & legal</Text>
        <View className="overflow-hidden rounded-[24px] border border-[#E3DED2] bg-[#FFFDF8]">
          <Pressable className="min-h-[68px] flex-row items-center px-4 active:bg-black/5" onPress={() => router.push('/(app)/privacy')} testID="contractor-privacy">
            <ShieldCheck color={colors.green} size={21} />
            <Text className="ml-3 flex-1 text-base" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Privacy</Text>
            <ChevronRight color={colors.muted} size={18} />
          </Pressable>
          <View className="ml-[52px] h-px bg-[#E8E3D8]" />
          <Pressable className="min-h-[68px] flex-row items-center px-4 active:bg-black/5" onPress={() => router.push('/(app)/terms')} testID="contractor-terms">
            <FileText color={colors.ink} size={20} />
            <Text className="ml-3 flex-1 text-base" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Terms of use</Text>
            <ChevronRight color={colors.muted} size={18} />
          </Pressable>
          <View className="ml-[52px] h-px bg-[#E8E3D8]" />
          <Pressable className="min-h-[68px] flex-row items-center px-4 active:bg-black/5" onPress={() => router.push('/(app)/about')} testID="contractor-about">
            <Info color={colors.ink} size={20} />
            <Text className="ml-3 flex-1 text-base" style={{ color: colors.ink, fontFamily: typefaces.demi }}>About Rennova</Text>
            <ChevronRight color={colors.muted} size={18} />
          </Pressable>
          <View className="ml-[52px] h-px bg-[#E8E3D8]" />
          <Pressable className="min-h-[68px] flex-row items-center px-4 active:bg-black/5" onPress={() => router.push('/(app)/(contractor-tabs)/ask')} testID="contractor-open-ask">
            <Sparkles color={colors.ink} size={20} />
            <Text className="ml-3 flex-1 text-base" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Ask Rennova</Text>
            <ChevronRight color={colors.muted} size={18} />
          </Pressable>
          <View className="ml-[52px] h-px bg-[#E8E3D8]" />
          <Pressable className="min-h-[68px] flex-row items-center px-4 active:bg-black/5" onPress={() => router.push('/(app)/delete-account')} testID="contractor-delete-account">
            <Trash2 color={colors.red} size={20} />
            <Text className="ml-3 flex-1 text-base" style={{ color: colors.red, fontFamily: typefaces.demi }}>Delete account</Text>
            <ChevronRight color={colors.muted} size={18} />
          </Pressable>
        </View>

        <Pressable
          className="mt-8 min-h-14 flex-row items-center justify-center rounded-2xl border border-[#E8BDB7] bg-[#FFF1EE] active:opacity-70"
          disabled={signOutMutation.isPending}
          onPress={() => signOutMutation.mutate()}
          testID="contractor-sign-out-button"
        >
          <LogOut color={colors.red} size={19} />
          <Text className="ml-2 text-base" style={{ color: colors.red, fontFamily: typefaces.demi }}>
            {signOutMutation.isPending ? 'Signing out…' : 'Sign out'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
