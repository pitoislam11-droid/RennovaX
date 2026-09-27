import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { BadgeCheck, MapPin } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';
import { ErrorState, LoadingView } from '@/components/ui/state-view';
import { api } from '@/lib/api/api';
import type { ContractorMe } from '@/lib/contracts';
import { colors, shadows, typefaces } from '@/lib/design/tokens';
import { queryKeys } from '@/lib/query-keys';

export default function ContractorPublicProfileScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const profileId = Array.isArray(params.id) ? params.id[0] ?? '' : params.id ?? '';

  const profileQuery = useQuery({
    queryKey: queryKeys.contractorProfile(profileId),
    queryFn: () => api.get<ContractorMe>(`/api/contractors/${profileId}`),
    enabled: Boolean(profileId),
  });

  if (profileQuery.isLoading) return <LoadingView label="Opening storefront…" testID="contractor-profile-loading" />;
  if (profileQuery.isError || !profileQuery.data) {
    return (
      <SafeAreaView className="flex-1 justify-center px-6" style={{ backgroundColor: colors.canvas }}>
        <ErrorState message={profileQuery.error?.message ?? 'Contractor not found.'} onRetry={() => void profileQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const profile = profileQuery.data;
  const services = Array.isArray(profile.servicesJson) ? profile.servicesJson : [];

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']} style={{ backgroundColor: colors.canvas }} testID="contractor-public-profile-screen">
      <ScreenHeader subtitle="Storefront" title={profile.businessName} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        <View className="rounded-[28px] bg-[#173B31] p-6" style={shadows.soft}>
          <View className="flex-row items-center">
            <Text className="flex-1 text-[28px] leading-8" style={{ color: colors.paper, fontFamily: typefaces.demi }}>{profile.businessName}</Text>
            {profile.verification === 'VERIFIED' ? <BadgeCheck color={colors.yellow} size={24} /> : null}
          </View>
          <Text className="mt-2 text-sm" style={{ color: 'rgba(255,253,248,0.7)', fontFamily: typefaces.medium }}>
            {profile.accountKind === 'COMPANY' ? 'Company' : 'Sole trader'}
          </Text>
          {profile.serviceArea ? (
            <View className="mt-4 flex-row items-center">
              <MapPin color={colors.yellow} size={16} />
              <Text className="ml-2 text-sm" style={{ color: colors.paper, fontFamily: typefaces.regular }}>{profile.serviceArea}</Text>
            </View>
          ) : null}
          {profile.about ? (
            <Text className="mt-5 text-[15px] leading-6" style={{ color: 'rgba(255,253,248,0.86)', fontFamily: typefaces.regular }}>{profile.about}</Text>
          ) : null}
        </View>

        {services.length ? (
          <View className="mt-6 flex-row flex-wrap gap-2">
            {services.map((service) => (
              <View className="rounded-full bg-[#FFF2A8] px-3 py-2" key={service}>
                <Text style={{ color: colors.ink, fontFamily: typefaces.medium }}>{service}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text className="mb-3 mt-8 text-[22px] tracking-[-0.4px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Portfolio</Text>
        {(profile.portfolioProjects ?? []).length === 0 ? (
          <Text className="text-sm" style={{ color: colors.muted, fontFamily: typefaces.regular }}>No portfolio projects yet.</Text>
        ) : (
          (profile.portfolioProjects ?? []).map((project) => (
            <View className="mb-4 overflow-hidden rounded-[24px] bg-[#FFFDF8]" key={project.id} style={shadows.soft}>
              {project.media[0] ? (
                <Image contentFit="cover" source={{ uri: project.media[0].url }} style={{ height: 180, width: '100%' }} />
              ) : null}
              <View className="p-5">
                <Text className="text-lg" style={{ color: colors.ink, fontFamily: typefaces.demi }}>{project.title}</Text>
                {project.area ? <Text className="mt-1 text-sm" style={{ color: colors.muted, fontFamily: typefaces.regular }}>{project.area}</Text> : null}
                {project.description ? (
                  <Text className="mt-3 text-sm leading-5" style={{ color: colors.ink, fontFamily: typefaces.regular }}>{project.description}</Text>
                ) : null}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
