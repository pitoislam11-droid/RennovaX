import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronRight, HardHat, Home, LogOut, Mail, ShieldCheck, UserRound, FileText, Info, Trash2 } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, LoadingView } from '@/components/ui/state-view';
import { api } from '@/lib/api/api';
import { authClient } from '@/lib/auth/auth-client';
import { useInvalidateSession } from '@/lib/auth/use-session';
import type { Profile, UserRole } from '@/lib/contracts';
import { colors, shadows, typefaces } from '@/lib/design/tokens';
import { contractorHomeHref } from '@/lib/navigation';
import { useProfile } from '@/lib/profile';
import { queryKeys } from '@/lib/query-keys';

export default function MoreScreen() {
  const profileQuery = useProfile();
  const queryClient = useQueryClient();
  const invalidateSession = useInvalidateSession();
  const roleMutation = useMutation({
    mutationFn: (role: UserRole) => api.post<{ activeRole: UserRole; roles: UserRole[] }, { role: UserRole }>('/api/profile/roles', { role }),
    onSuccess: async (data) => {
      const refreshed = await queryClient.fetchQuery({
        queryKey: queryKeys.profile,
        queryFn: () => api.get<Profile>('/api/profile'),
      });
      if (data.activeRole === 'CONTRACTOR') router.replace(contractorHomeHref(refreshed));
    },
  });
  const signOutMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message ?? 'Could not sign out.');
    },
    onSuccess: async () => {
      await invalidateSession();
      queryClient.removeQueries({ queryKey: queryKeys.profile });
      queryClient.removeQueries({ queryKey: queryKeys.projects });
    },
  });

  if (profileQuery.isLoading) return <LoadingView label="Loading your account…" testID="more-loading" />;
  if (profileQuery.isError || !profileQuery.data) {
    return <SafeAreaView className="flex-1 justify-center px-6" style={{ backgroundColor: colors.canvas }}><ErrorState message={profileQuery.error?.message ?? 'Your profile could not be loaded.'} onRetry={() => void profileQuery.refetch()} /></SafeAreaView>;
  }
  const profile = profileQuery.data;
  const initials = profile.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: colors.canvas }} testID="more-screen">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        <Text className="pt-2 text-[34px] leading-10 tracking-[-1px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>More</Text>
        <Text className="mt-2 text-[15px] leading-6" style={{ color: colors.muted, fontFamily: typefaces.regular }}>Account, roles and trust.</Text>

        <View className="mt-7 flex-row items-center rounded-[28px] bg-[#FFFDF8] p-5" style={shadows.soft} testID="profile-card">
          <View className="h-16 w-16 items-center justify-center rounded-[22px] bg-[#1D1D1B]">
            <Text className="text-xl" style={{ color: colors.yellow, fontFamily: typefaces.demi }}>{initials || 'R'}</Text>
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-xl" style={{ color: colors.ink, fontFamily: typefaces.demi }}>{profile.name}</Text>
            <View className="mt-1 flex-row items-center"><Mail color={colors.muted} size={14} /><Text className="ml-1.5 text-sm" numberOfLines={1} style={{ color: colors.muted, fontFamily: typefaces.regular }}>{profile.email}</Text></View>
          </View>
          <UserRound color={colors.muted} size={20} />
        </View>

        <Text className="mb-3 ml-1 mt-8 text-[14px]" style={{ color: colors.muted, fontFamily: typefaces.medium }}>Your roles</Text>
        <View className="overflow-hidden rounded-[24px] border border-[#E3DED2] bg-[#FFFDF8]">
          <Pressable accessibilityLabel="Switch to homeowner" accessibilityRole="button" className="min-h-[76px] flex-row items-center px-4 active:bg-black/5" onPress={() => roleMutation.mutate('HOMEOWNER')} testID="switch-homeowner-role-button">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF2A8]"><Home color={colors.ink} size={21} /></View>
            <View className="ml-3 flex-1"><Text className="text-base" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Homeowner</Text><Text className="mt-0.5 text-xs" style={{ color: colors.muted, fontFamily: typefaces.regular }}>{profile.roles.includes('HOMEOWNER') ? 'Added to your account' : 'Add this role'}</Text></View>
            <View className="flex-row items-center">{profile.activeRole === 'HOMEOWNER' ? <Text className="mr-2 text-xs" style={{ color: colors.green, fontFamily: typefaces.demi }}>Active</Text> : null}<ChevronRight color={colors.muted} size={19} /></View>
          </Pressable>
          <View className="ml-[70px] h-px bg-[#E8E3D8]" />
          <Pressable accessibilityLabel="Switch to contractor" accessibilityRole="button" className="min-h-[76px] flex-row items-center px-4 active:bg-black/5" onPress={() => roleMutation.mutate('CONTRACTOR')} testID="switch-contractor-role-button">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#1D1D1B]"><HardHat color={colors.paper} size={21} /></View>
            <View className="ml-3 flex-1"><Text className="text-base" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Contractor</Text><Text className="mt-0.5 text-xs" style={{ color: colors.muted, fontFamily: typefaces.regular }}>{profile.roles.includes('CONTRACTOR') ? 'Switch to contractor view' : 'Add this role'}</Text></View>
            <ChevronRight color={colors.muted} size={19} />
          </Pressable>
        </View>
        {roleMutation.error ? <Text className="mt-3 text-sm" style={{ color: colors.red, fontFamily: typefaces.medium }} testID="role-switch-error">{roleMutation.error.message}</Text> : null}

        <Text className="mb-3 ml-1 mt-8 text-[14px]" style={{ color: colors.muted, fontFamily: typefaces.medium }}>Trust & legal</Text>
        <View className="overflow-hidden rounded-[24px] border border-[#E3DED2] bg-[#FFFDF8]">
          <Pressable accessibilityLabel="Privacy" accessibilityRole="button" className="min-h-[68px] flex-row items-center px-4 active:bg-black/5" onPress={() => router.push('/(app)/privacy')} testID="open-privacy">
            <ShieldCheck color={colors.green} size={21} />
            <Text className="ml-3 flex-1 text-base" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Privacy</Text>
            <ChevronRight color={colors.muted} size={18} />
          </Pressable>
          <View className="ml-[52px] h-px bg-[#E8E3D8]" />
          <Pressable accessibilityLabel="Terms of use" accessibilityRole="button" className="min-h-[68px] flex-row items-center px-4 active:bg-black/5" onPress={() => router.push('/(app)/terms')} testID="open-terms">
            <FileText color={colors.ink} size={20} />
            <Text className="ml-3 flex-1 text-base" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Terms of use</Text>
            <ChevronRight color={colors.muted} size={18} />
          </Pressable>
          <View className="ml-[52px] h-px bg-[#E8E3D8]" />
          <Pressable accessibilityLabel="About Rennova" accessibilityRole="button" className="min-h-[68px] flex-row items-center px-4 active:bg-black/5" onPress={() => router.push('/(app)/about')} testID="open-about">
            <Info color={colors.ink} size={20} />
            <Text className="ml-3 flex-1 text-base" style={{ color: colors.ink, fontFamily: typefaces.demi }}>About Rennova</Text>
            <ChevronRight color={colors.muted} size={18} />
          </Pressable>
          <View className="ml-[52px] h-px bg-[#E8E3D8]" />
          <Pressable accessibilityLabel="Delete account" accessibilityRole="button" className="min-h-[68px] flex-row items-center px-4 active:bg-black/5" onPress={() => router.push('/(app)/delete-account')} testID="open-delete-account">
            <Trash2 color={colors.red} size={20} />
            <Text className="ml-3 flex-1 text-base" style={{ color: colors.red, fontFamily: typefaces.demi }}>Delete account</Text>
            <ChevronRight color={colors.muted} size={18} />
          </Pressable>
        </View>

        <Pressable accessibilityLabel="Sign out" accessibilityRole="button" className="mt-8 min-h-14 flex-row items-center justify-center rounded-2xl border border-[#E8BDB7] bg-[#FFF1EE] active:opacity-70" disabled={signOutMutation.isPending} onPress={() => signOutMutation.mutate()} testID="sign-out-button">
          <LogOut color={colors.red} size={19} /><Text className="ml-2 text-base" style={{ color: colors.red, fontFamily: typefaces.demi }}>{signOutMutation.isPending ? 'Signing out…' : 'Sign out'}</Text>
        </Pressable>
        {signOutMutation.error ? <Text className="mt-3 text-center text-sm" style={{ color: colors.red, fontFamily: typefaces.medium }} testID="sign-out-error">{signOutMutation.error.message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
