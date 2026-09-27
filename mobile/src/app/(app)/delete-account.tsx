import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { api } from '@/lib/api/api';
import { authClient } from '@/lib/auth/auth-client';
import { useInvalidateSession } from '@/lib/auth/use-session';
import { colors, typefaces } from '@/lib/design/tokens';
import { launchContacts } from '@/lib/launch';
import { queryKeys } from '@/lib/query-keys';

export default function DeleteAccountScreen() {
  const [confirmed, setConfirmed] = useState(false);
  const queryClient = useQueryClient();
  const invalidateSession = useInvalidateSession();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.post<{ deleted: boolean }>('/api/profile/delete', {});
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message ?? 'Account deleted, but sign-out failed.');
    },
    onSuccess: async () => {
      queryClient.clear();
      await invalidateSession();
      router.replace('/');
    },
  });

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']} style={{ backgroundColor: colors.canvas }} testID="delete-account-screen">
      <ScreenHeader title="Delete account" subtitle="This cannot be undone" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF0EC]">
          <Trash2 color={colors.red} size={24} />
        </View>
        <Text className="mt-5 text-[28px] leading-8 tracking-[-0.6px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>
          Delete your Rennova account
        </Text>
        <Text className="mt-3 text-[15px] leading-6" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
          This removes your profile, projects, quotations, messages and portfolio from Rennova. If you only need a break, sign out instead.
        </Text>
        <Text className="mt-4 text-[14px] leading-5" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
          Questions first? Email {launchContacts.supportEmail}.
        </Text>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: confirmed }}
          className="mt-8 min-h-14 flex-row items-center rounded-2xl border border-[#E3DED2] bg-[#FFFDF8] px-4 active:opacity-80"
          onPress={() => setConfirmed((value) => !value)}
          testID="confirm-delete-checkbox"
        >
          <View
            className="h-6 w-6 items-center justify-center rounded-md border"
            style={{
              backgroundColor: confirmed ? colors.red : colors.paper,
              borderColor: confirmed ? colors.red : '#D8D2C6',
            }}
          >
            {confirmed ? <Text style={{ color: colors.paper, fontFamily: typefaces.demi }}>✓</Text> : null}
          </View>
          <Text className="ml-3 flex-1 text-[14px] leading-5" style={{ color: colors.ink, fontFamily: typefaces.medium }}>
            I understand this permanently deletes my account and data.
          </Text>
        </Pressable>

        {deleteMutation.error ? (
          <Text className="mt-4 text-sm" style={{ color: colors.red, fontFamily: typefaces.medium }} testID="delete-account-error">
            {deleteMutation.error.message}
          </Text>
        ) : null}

        <View className="mt-8">
          <Button
            disabled={!confirmed}
            label="Delete my account"
            loading={deleteMutation.isPending}
            onPress={() => deleteMutation.mutate()}
            testID="confirm-delete-account-button"
            variant="danger"
          />
        </View>
        <View className="mt-3">
          <Button label="Keep my account" onPress={() => router.back()} testID="cancel-delete-account" variant="secondary" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
