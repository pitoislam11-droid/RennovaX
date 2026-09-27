import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingView } from '@/components/ui/state-view';
import { api } from '@/lib/api/api';
import type { AppNotification } from '@/lib/contracts';
import { colors, typefaces } from '@/lib/design/tokens';
import { useProfile } from '@/lib/profile';
import { queryKeys } from '@/lib/query-keys';

function openNotification(item: AppNotification, activeRole?: string | null) {
  const projectId = item.dataJson && typeof item.dataJson === 'object' ? item.dataJson.projectId : undefined;
  if (!projectId) {
    router.back();
    return;
  }
  if (activeRole === 'CONTRACTOR') {
    router.replace(`/(app)/opportunity/${projectId}`);
    return;
  }
  router.replace(`/(app)/project/${projectId}`);
}

export default function NotificationsSheet() {
  const queryClient = useQueryClient();
  const profileQuery = useProfile();
  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => api.get<AppNotification[]>('/api/notifications'),
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.post<{ ok: boolean }>('/api/notifications/read-all', {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });

  const readOneMutation = useMutation({
    mutationFn: (id: string) => api.post<AppNotification>(`/api/notifications/${id}/read`, {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });

  if (notificationsQuery.isLoading) {
    return <LoadingView label="Checking notifications…" testID="notifications-loading" />;
  }

  if (notificationsQuery.isError) {
    return (
      <SafeAreaView className="flex-1 justify-center px-6" edges={['top', 'bottom']} style={{ backgroundColor: colors.paper }} testID="notifications-error-screen">
        <ErrorState
          message={notificationsQuery.error.message}
          onRetry={() => void notificationsQuery.refetch()}
          testID="notifications-error"
        />
        <View className="mt-6">
          <Button label="Close" onPress={() => router.back()} testID="notifications-error-close" variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  const items = notificationsQuery.data ?? [];
  const unread = items.filter((item) => !item.readAt).length;

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']} style={{ backgroundColor: colors.paper }} testID="notifications-sheet">
      <View className="mt-2 h-1 w-10 self-center rounded-full bg-[#DDD8CC]" />
      <View className="mt-5 flex-row items-end justify-between px-6">
        <Text className="text-[28px] leading-8 tracking-[-0.6px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>
          Notifications
        </Text>
        {unread > 0 ? (
          <Pressable
            accessibilityLabel="Mark all as read"
            accessibilityRole="button"
            onPress={() => readAllMutation.mutate()}
            testID="mark-all-notifications-read"
          >
            <Text className="text-[13px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>
              {readAllMutation.isPending ? 'Updating…' : 'Mark all read'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView className="mt-4 flex-1 px-6" contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <EmptyState
            body="New private quotations, call requests and messages will appear here as your projects move."
            icon={Bell}
            testID="notifications-empty"
            title="You’re all caught up"
          />
        ) : (
          items.map((item) => (
            <Pressable
              accessibilityLabel={item.title}
              accessibilityRole="button"
              className="mb-3 rounded-[22px] border border-[#E3DED2] px-4 py-4 active:opacity-80"
              key={item.id}
              onPress={() => {
                if (!item.readAt) readOneMutation.mutate(item.id);
                openNotification(item, profileQuery.data?.activeRole);
              }}
              style={{ backgroundColor: item.readAt ? colors.paper : '#FFFDF8' }}
              testID={`notification-${item.id}`}
            >
              <View className="flex-row items-start">
                {!item.readAt ? <View className="mt-1.5 mr-2 h-2 w-2 rounded-full bg-[#FFD21C]" /> : null}
                <View className="flex-1">
                  <Text className="text-[15px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>{item.title}</Text>
                  <Text className="mt-1 text-[13px] leading-5" style={{ color: colors.muted, fontFamily: typefaces.regular }}>{item.body}</Text>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      <View className="px-6 pb-2">
        <Button label="Done" onPress={() => router.back()} testID="notifications-done" variant="dark" />
      </View>
    </SafeAreaView>
  );
}
