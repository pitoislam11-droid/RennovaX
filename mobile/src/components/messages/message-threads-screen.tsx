import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronRight, MessageCircleMore } from 'lucide-react-native';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, LoadingView } from '@/components/ui/state-view';
import { PageTitle } from '@/components/ui/typography';
import { api } from '@/lib/api/api';
import type { MessageThread } from '@/lib/contracts';
import { colors, typefaces } from '@/lib/design/tokens';
import { useQuietEntrance } from '@/lib/motion';
import { queryKeys } from '@/lib/query-keys';

export function MessageThreadsScreen({
  emptyBody,
  testID = 'messages-screen',
}: {
  emptyBody: string;
  testID?: string;
}) {
  const { enter } = useQuietEntrance();
  const threadsQuery = useQuery({
    queryKey: queryKeys.messageThreads,
    queryFn: () => api.get<MessageThread[]>('/api/messages/threads'),
  });

  if (threadsQuery.isLoading) return <LoadingView label="Loading messages…" testID="messages-loading" />;
  if (threadsQuery.isError) {
    return (
      <SafeAreaView className="flex-1 justify-center px-6" style={{ backgroundColor: colors.canvas }}>
        <ErrorState message={threadsQuery.error.message} onRetry={() => void threadsQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const threads = threadsQuery.data ?? [];

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: colors.canvas }} testID={testID}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 36 }}
        refreshControl={<RefreshControl onRefresh={() => void threadsQuery.refetch()} refreshing={threadsQuery.isRefetching} tintColor={colors.ink} />}
      >
        <Animated.View entering={enter(0)} className="pt-2">
          <PageTitle
            subtitle="Conversations stay beside the project they belong to."
            title="Messages"
          />
        </Animated.View>

        {threads.length === 0 ? (
          <View className="flex-1 justify-center py-10">
            <EmptyState
              body={emptyBody}
              icon={MessageCircleMore}
              testID="messages-empty-state"
              title="Quiet for now"
            />
          </View>
        ) : (
          <Animated.View entering={enter(50)} className="mt-7 overflow-hidden rounded-[24px] border border-[#E3DED2] bg-[#FFFDF8]">
            {threads.map((thread, index) => {
              const last = thread.messages[0];
              return (
                <View key={thread.id}>
                  {index > 0 ? <View className="ml-5 h-px bg-[#E8E3D8]" /> : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Open conversation for ${thread.project?.title ?? 'project'}`}
                    className="min-h-[88px] flex-row items-center px-5 py-4 active:bg-black/5"
                    onPress={() => router.push(`/(app)/messages/${thread.projectId}`)}
                    testID={`message-thread-${thread.projectId}`}
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-[16px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>
                        {thread.project?.title ?? 'Project conversation'}
                      </Text>
                      <Text className="mt-1 text-[14px]" numberOfLines={1} style={{ color: colors.muted, fontFamily: typefaces.regular }}>
                        {last?.body ?? 'No messages yet'}
                      </Text>
                    </View>
                    <ChevronRight color={colors.muted} size={18} />
                  </Pressable>
                </View>
              );
            })}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
