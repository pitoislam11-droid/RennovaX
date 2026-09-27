import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowRight, Bell, MapPin, Sparkles } from 'lucide-react-native';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/ui/brand';
import { StatusPill } from '@/components/ui/status-pill';
import { EmptyState, ErrorState, LoadingView } from '@/components/ui/state-view';
import { PageTitle, SectionHeading } from '@/components/ui/typography';
import { api } from '@/lib/api/api';
import type { OpportunityListItem, OpportunityStats } from '@/lib/contracts';
import { colors, shadows, typefaces } from '@/lib/design/tokens';
import { useQuietEntrance } from '@/lib/motion';
import { useProfile } from '@/lib/profile';
import { queryKeys } from '@/lib/query-keys';

export default function ContractorOpportunitiesScreen() {
  const profileQuery = useProfile();
  const { enter } = useQuietEntrance();
  const statsQuery = useQuery({
    queryKey: queryKeys.opportunityStats,
    queryFn: () => api.get<OpportunityStats>('/api/opportunities/stats'),
  });
  const opportunitiesQuery = useQuery({
    queryKey: queryKeys.opportunities,
    queryFn: () => api.get<OpportunityListItem[]>('/api/opportunities'),
  });

  if (opportunitiesQuery.isLoading || profileQuery.isLoading) {
    return <LoadingView label="Finding opportunities…" testID="opportunities-loading" />;
  }
  if (opportunitiesQuery.isError) {
    return (
      <SafeAreaView className="flex-1 justify-center px-6" style={{ backgroundColor: colors.canvas }}>
        <ErrorState message={opportunitiesQuery.error.message} onRetry={() => void opportunitiesQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const opportunities = opportunitiesQuery.data ?? [];
  const stats = statsQuery.data;
  const businessName = profileQuery.data?.contractorProfile?.businessName ?? 'your business';
  const firstName = businessName.split(' ')[0];

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: colors.canvas }} testID="contractor-opportunities-screen">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 36 }}
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              void opportunitiesQuery.refetch();
              void statsQuery.refetch();
            }}
            refreshing={opportunitiesQuery.isRefetching}
            tintColor={colors.ink}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
          <BrandMark />
          <View className="flex-row items-center gap-2">
            <Pressable
              accessibilityLabel="Notifications"
              className="h-11 w-11 items-center justify-center rounded-full bg-[#FFFDF8] active:opacity-70"
              onPress={() => router.push('/(app)/notifications')}
              style={shadows.soft}
              testID="contractor-notifications-button"
            >
              <Bell color={colors.ink} size={20} />
            </Pressable>
            <Pressable
              accessibilityLabel="Ask Rennova"
              className="h-11 items-center justify-center rounded-full bg-[#FFF2A8] px-4 active:opacity-80"
              onPress={() => router.push('/(app)/(contractor-tabs)/ask')}
              testID="open-ask-from-jobs"
            >
              <View className="flex-row items-center">
                <Sparkles color={colors.ink} size={15} />
                <Text className="ml-1.5 text-[13px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Ask</Text>
              </View>
            </Pressable>
          </View>
        </View>

        <Animated.View entering={enter(0)} className="px-5 pt-4">
          <PageTitle
            subtitle="Private briefs from homeowners — quote only when the work fits."
            title={`Hello, ${firstName}`}
          />
        </Animated.View>

        <Animated.View entering={enter(50)} className="mt-6 flex-row gap-3 px-5">
          {[
            { label: 'New', value: stats?.newOpportunities ?? '—' },
            { label: 'Awaiting', value: stats?.awaitingResponse ?? '—' },
            { label: 'Active', value: stats?.activeProjects ?? '—' },
          ].map((item) => (
            <View className="flex-1 rounded-[22px] bg-[#FFFDF8] px-3 py-4" key={item.label} style={shadows.soft}>
              <Text className="text-[24px] tracking-[-0.5px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>{item.value}</Text>
              <Text className="mt-1 text-[13px]" style={{ color: colors.muted, fontFamily: typefaces.medium }}>{item.label}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={enter(90)} className="mt-10 px-5">
          <SectionHeading title="Open briefs" />

          {opportunities.length === 0 ? (
            <EmptyState
              actionLabel="Ask Rennova"
              body="When homeowners publish projects, complete briefs appear here. Meanwhile, Ask Rennova can help you prepare how you quote."
              icon={Sparkles}
              onAction={() => router.push('/(app)/(contractor-tabs)/ask')}
              testID="opportunities-empty"
              title="No live opportunities yet"
            />
          ) : (
            opportunities.map((item) => (
              <Pressable
                className="mb-3 overflow-hidden rounded-[26px] bg-[#FFFDF8] active:scale-[0.99]"
                key={item.id}
                onPress={() => router.push(`/(app)/opportunity/${item.id}`)}
                style={shadows.soft}
                testID={`opportunity-card-${item.id}`}
              >
                {item.previewMedia[0] ? (
                  <View>
                    <Image contentFit="cover" source={{ uri: item.previewMedia[0].url }} style={{ height: 148, width: '100%' }} transition={280} />
                    <LinearGradient colors={['transparent', 'rgba(20,20,18,0.08)']} style={{ bottom: 0, height: 40, left: 0, position: 'absolute', right: 0 }} />
                  </View>
                ) : (
                  <View className="h-[96px] items-center justify-center bg-[#173B31]">
                    <Text style={{ color: colors.yellow, fontFamily: typefaces.demi }}>{item.category}</Text>
                  </View>
                )}
                <View className="p-5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[13px]" style={{ color: colors.muted, fontFamily: typefaces.medium }}>{item.category}</Text>
                    <StatusPill
                      label={item.myQuote?.status === 'ACCEPTED' ? 'Won' : item.myQuote ? 'Quoted' : 'New'}
                      tone={item.myQuote?.status === 'ACCEPTED' ? 'won' : item.myQuote ? 'live' : 'new'}
                    />
                  </View>
                  <Text className="mt-2 text-[20px] leading-6 tracking-[-0.3px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>
                    {item.title}
                  </Text>
                  <View className="mt-2 flex-row items-center">
                    <MapPin color={colors.muted} size={14} />
                    <Text className="ml-1.5 flex-1 text-[14px]" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
                      {item.locationLabel || 'Location in brief'}
                    </Text>
                  </View>
                  {item.briefPreview.summary ? (
                    <Text className="mt-3 text-[14px] leading-5" numberOfLines={2} style={{ color: colors.ink, fontFamily: typefaces.regular }}>
                      {item.briefPreview.summary}
                    </Text>
                  ) : null}
                  <View className="mt-4 flex-row items-center">
                    <Text className="text-[14px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Open brief</Text>
                    <ArrowRight color={colors.ink} size={16} style={{ marginLeft: 6 }} />
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
