import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { BriefcaseBusiness, ChevronRight } from 'lucide-react-native';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusPill } from '@/components/ui/status-pill';
import { EmptyState, ErrorState, LoadingView } from '@/components/ui/state-view';
import { PageTitle } from '@/components/ui/typography';
import { api } from '@/lib/api/api';
import type { OpportunityListItem } from '@/lib/contracts';
import { colors, typefaces } from '@/lib/design/tokens';
import { useQuietEntrance } from '@/lib/motion';
import { queryKeys } from '@/lib/query-keys';

export default function ContractorQuotesScreen() {
  const { enter } = useQuietEntrance();
  const opportunitiesQuery = useQuery({
    queryKey: queryKeys.opportunities,
    queryFn: () => api.get<OpportunityListItem[]>('/api/opportunities'),
  });

  if (opportunitiesQuery.isLoading) return <LoadingView label="Loading your quotes…" testID="contractor-quotes-loading" />;
  if (opportunitiesQuery.isError) {
    return (
      <SafeAreaView className="flex-1 justify-center px-6" style={{ backgroundColor: colors.canvas }}>
        <ErrorState message={opportunitiesQuery.error.message} onRetry={() => void opportunitiesQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const quoted = (opportunitiesQuery.data ?? []).filter((item) => item.myQuote);

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: colors.canvas }} testID="contractor-quotes-screen">
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
        refreshControl={<RefreshControl onRefresh={() => void opportunitiesQuery.refetch()} refreshing={opportunitiesQuery.isRefetching} tintColor={colors.ink} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={enter(0)} className="pt-2">
          <PageTitle
            subtitle="Submitted quotations stay private to the homeowner until they choose someone."
            title="Quotes"
          />
        </Animated.View>

        {quoted.length === 0 ? (
          <View className="mt-10">
            <EmptyState
              actionLabel="Browse jobs"
              body="When you send a private quote, it will show here so you can track responses."
              icon={BriefcaseBusiness}
              onAction={() => router.push('/(app)/(contractor-tabs)')}
              testID="contractor-quotes-empty"
              title="No quotes yet"
            />
          </View>
        ) : (
          <Animated.View entering={enter(60)} className="mt-7 overflow-hidden rounded-[24px] border border-[#E3DED2] bg-[#FFFDF8]">
            {quoted.map((item, index) => (
              <View key={item.id}>
                {index > 0 ? <View className="ml-5 h-px bg-[#E8E3D8]" /> : null}
                <Pressable
                  className="min-h-[88px] flex-row items-center px-5 py-4 active:bg-black/5"
                  onPress={() => router.push(`/(app)/opportunity/${item.id}`)}
                  testID={`quoted-opportunity-${item.id}`}
                >
                  <View className="flex-1 pr-3">
                    <Text className="text-[16px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>{item.title}</Text>
                    <Text className="mt-1 text-[13px]" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
                      {item.myQuote?.status === 'ACCEPTED' ? 'Selected by homeowner' : 'Awaiting homeowner'}
                    </Text>
                  </View>
                  <StatusPill
                    label={item.myQuote?.status === 'ACCEPTED' ? 'Won' : 'Sent'}
                    tone={item.myQuote?.status === 'ACCEPTED' ? 'won' : 'new'}
                  />
                  <ChevronRight color={colors.muted} size={18} style={{ marginLeft: 8 }} />
                </Pressable>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
