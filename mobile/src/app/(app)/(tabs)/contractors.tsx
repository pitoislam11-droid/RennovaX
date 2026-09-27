import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { BadgeCheck, Hammer, MapPin } from 'lucide-react-native';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, LoadingView } from '@/components/ui/state-view';
import { api } from '@/lib/api/api';
import type { ContractorMe } from '@/lib/contracts';
import { colors, shadows, typefaces } from '@/lib/design/tokens';
import { queryKeys } from '@/lib/query-keys';

type DirectoryContractor = ContractorMe & {
  _count: { portfolioProjects: number; quotes: number };
};

export default function ContractorsScreen() {
  const directoryQuery = useQuery({
    queryKey: queryKeys.contractorDirectory,
    queryFn: () => api.get<DirectoryContractor[]>('/api/contractors/directory'),
  });

  if (directoryQuery.isLoading) return <LoadingView label="Loading contractors…" testID="contractors-loading" />;
  if (directoryQuery.isError) {
    return (
      <SafeAreaView className="flex-1 justify-center px-6" style={{ backgroundColor: colors.canvas }}>
        <ErrorState message={directoryQuery.error.message} onRetry={() => void directoryQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const contractors = directoryQuery.data ?? [];

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: colors.canvas }} testID="contractors-screen">
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
        refreshControl={<RefreshControl onRefresh={() => void directoryQuery.refetch()} refreshing={directoryQuery.isRefetching} tintColor={colors.ink} />}
        showsVerticalScrollIndicator={false}
      >
        <Text className="pt-2 text-[34px] leading-10 tracking-[-1px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Contractors</Text>
        <Text className="mt-3 max-w-[330px] text-[15px] leading-6" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
          Browse storefronts. Quotes stay private until you open them on a project.
        </Text>

        {contractors.length === 0 ? (
          <View className="mt-10">
            <EmptyState
              body="As contractors join Rennova, their portfolios will appear here."
              icon={Hammer}
              testID="contractors-empty"
              title="Network warming up"
            />
          </View>
        ) : (
          <View className="mt-7 gap-3">
            {contractors.map((contractor) => {
              const cover = contractor.portfolioProjects?.[0]?.media?.[0]?.url;
              const services = Array.isArray(contractor.servicesJson) ? contractor.servicesJson.slice(0, 3) : [];
              return (
                <Pressable
                  className="overflow-hidden rounded-[26px] bg-[#FFFDF8] active:opacity-90"
                  key={contractor.id}
                  onPress={() => router.push(`/(app)/contractor/${contractor.id}`)}
                  style={shadows.soft}
                  testID={`directory-contractor-${contractor.id}`}
                >
                  {cover ? (
                    <Image contentFit="cover" source={{ uri: cover }} style={{ height: 140, width: '100%' }} />
                  ) : (
                    <View className="h-24 items-center justify-center bg-[#173B31]">
                      <Text style={{ color: colors.yellow, fontFamily: typefaces.demi }}>
                        {contractor.accountKind === 'COMPANY' ? 'Company' : 'Sole trader'}
                      </Text>
                    </View>
                  )}
                  <View className="p-5">
                    <View className="flex-row items-center">
                      <Text className="flex-1 text-xl" style={{ color: colors.ink, fontFamily: typefaces.demi }}>{contractor.businessName}</Text>
                      {contractor.verification === 'VERIFIED' ? <BadgeCheck color={colors.green} size={20} /> : null}
                    </View>
                    {contractor.serviceArea ? (
                      <View className="mt-2 flex-row items-center">
                        <MapPin color={colors.muted} size={14} />
                        <Text className="ml-1.5 text-sm" style={{ color: colors.muted, fontFamily: typefaces.regular }}>{contractor.serviceArea}</Text>
                      </View>
                    ) : null}
                    {services.length ? (
                      <View className="mt-3 flex-row flex-wrap gap-2">
                        {services.map((service) => (
                          <View className="rounded-full bg-[#F2EEE5] px-2.5 py-1" key={service}>
                            <Text className="text-xs" style={{ color: colors.ink, fontFamily: typefaces.medium }}>{service}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
