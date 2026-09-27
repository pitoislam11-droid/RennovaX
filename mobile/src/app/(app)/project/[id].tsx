import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, MapPin, MessageCircle, Phone, Send } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ErrorState, LoadingView } from '@/components/ui/state-view';
import { api } from '@/lib/api/api';
import type { CallRequest, Project, PublishProjectRequest, Quote } from '@/lib/contracts';
import { colors, shadows, typefaces } from '@/lib/design/tokens';
import { formatPounds } from '@/lib/money';
import { useProject } from '@/lib/projects/use-projects';
import { queryKeys } from '@/lib/query-keys';

export default function ProjectDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const projectId = Array.isArray(params.id) ? params.id[0] ?? '' : params.id ?? '';
  const projectQuery = useProject(projectId);
  const queryClient = useQueryClient();

  const quotesQuery = useQuery({
    queryKey: queryKeys.projectQuotes(projectId),
    queryFn: () => api.get<Quote[]>(`/api/quotes/project/${projectId}`),
    enabled: Boolean(projectId) && projectQuery.data?.status !== 'DRAFT',
  });

  const callsQuery = useQuery({
    queryKey: queryKeys.callRequests(projectId),
    queryFn: () => api.get<CallRequest[]>(`/api/calls/project/${projectId}`),
    enabled: Boolean(projectId) && projectQuery.data?.status !== 'DRAFT',
  });

  const publishMutation = useMutation({
    mutationFn: () => api.patch<Project, PublishProjectRequest>(`/api/projects/${projectId}/publish`, { publish: true }),
    onSuccess: async (project) => {
      queryClient.setQueryData(queryKeys.project(projectId), project);
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (quoteId: string) => api.post<Quote>(`/api/quotes/${quoteId}/accept`, {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projectQuotes(projectId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });

  const respondCallMutation = useMutation({
    mutationFn: ({ callRequestId, decision }: { callRequestId: string; decision: 'APPROVED' | 'DECLINED' }) =>
      api.post<CallRequest, { decision: 'APPROVED' | 'DECLINED' }>(`/api/calls/${callRequestId}/respond`, { decision }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.callRequests(projectId) });
    },
  });

  if (projectQuery.isLoading) return <LoadingView label="Opening your project…" testID="project-detail-loading" />;
  if (projectQuery.isError || !projectQuery.data) {
    return (
      <SafeAreaView className="flex-1 justify-center px-6" style={{ backgroundColor: colors.canvas }} testID="project-detail-error-screen">
        <ErrorState message={projectQuery.error?.message ?? 'This project could not be opened.'} onRetry={() => void projectQuery.refetch()} testID="project-detail-error" />
      </SafeAreaView>
    );
  }

  const project = projectQuery.data;
  const brief = project.briefJson;
  const published = project.status === 'PUBLISHED' || project.status === 'AWARDED';
  const quotes = quotesQuery.data ?? [];
  const pendingCalls = (callsQuery.data ?? []).filter((item) => item.status === 'PENDING');

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']} style={{ backgroundColor: colors.canvas }} testID="project-detail-screen">
      <ScreenHeader subtitle={published ? (project.status === 'AWARDED' ? 'Contractor selected' : 'Live project') : 'Saved draft'} title="Project brief" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 34 }} showsVerticalScrollIndicator={false}>
        <View className="self-start flex-row items-center rounded-full bg-[#E1EFE8] px-3 py-2">
          <Check color={colors.green} size={15} />
          <Text className="ml-1.5 text-xs" style={{ color: colors.green, fontFamily: typefaces.demi }}>
            {project.status === 'AWARDED' ? 'Awarded' : published ? 'Open for quotes' : 'Ready when you are'}
          </Text>
        </View>

        <View className="mt-5 rounded-[30px] bg-[#FFFDF8] p-6" style={shadows.soft} testID="saved-project-brief">
          <Text className="text-[30px] leading-[35px] tracking-[-0.7px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>{brief.title}</Text>
          <View className="mt-3 flex-row items-center">
            <MapPin color={colors.muted} size={16} />
            <Text className="ml-1.5 flex-1 text-sm" style={{ color: colors.muted, fontFamily: typefaces.medium }}>{brief.location || 'Location not confirmed'}</Text>
          </View>
          <Text className="mt-6 text-[15px] leading-6" style={{ color: colors.ink, fontFamily: typefaces.regular }}>{brief.summary}</Text>
          <View className="my-6 h-px bg-[#E7E1D5]" />
          {brief.sections.map((section, sectionIndex) => (
            <View className="mb-6" key={`${section.title}-${sectionIndex}`}>
              <Text className="text-[14px]" style={{ color: colors.muted, fontFamily: typefaces.medium }}>{section.title}</Text>
              {section.items.map((item, itemIndex) => (
                <View className="mt-3 flex-row" key={`${sectionIndex}-${itemIndex}`}>
                  <View className="mt-2 h-1.5 w-1.5 rounded-full bg-[#FFD21C]" />
                  <Text className="ml-3 flex-1 text-sm leading-6" style={{ color: colors.ink, fontFamily: typefaces.regular }}>{item}</Text>
                </View>
              ))}
            </View>
          ))}
          <View className="rounded-[20px] bg-[#F2EEE5] p-4">
            <Text className="text-[14px]" style={{ color: colors.muted, fontFamily: typefaces.medium }}>Materials</Text>
            <Text className="mt-2 text-sm leading-5" style={{ color: colors.ink, fontFamily: typefaces.regular }}>{brief.materials || 'Not confirmed'}</Text>
            <Text className="mt-4 text-[14px]" style={{ color: colors.muted, fontFamily: typefaces.medium }}>Timing</Text>
            <Text className="mt-2 text-sm leading-5" style={{ color: colors.ink, fontFamily: typefaces.regular }}>{brief.timing || 'Not confirmed'}</Text>
          </View>
        </View>

        {project.media.length ? (
          <View className="mt-8" testID="saved-project-photos">
            <Text className="mb-3 text-[22px] tracking-[-0.4px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Project photos</Text>
            <ScrollView horizontal contentContainerStyle={{ gap: 12 }} showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              {project.media.map((media) => <Image contentFit="cover" key={media.id} source={{ uri: media.url }} style={{ borderRadius: 20, height: 132, width: 132 }} />)}
            </ScrollView>
          </View>
        ) : null}

        {published ? (
          <View className="mt-8">
            <View className="mb-4 flex-row items-end justify-between">
              <Text className="text-[26px] tracking-[-0.5px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Private quotations</Text>
              <Text className="text-[13px]" style={{ color: colors.muted, fontFamily: typefaces.medium }}>{quotes.length} received</Text>
            </View>

            {quotesQuery.isLoading ? (
              <Text className="text-sm" style={{ color: colors.muted, fontFamily: typefaces.regular }}>Loading quotes…</Text>
            ) : quotes.length === 0 ? (
              <View className="rounded-[24px] border border-[#E3DED2] bg-[#FFFDF8] px-5 py-8">
                <Text className="text-center text-base" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Waiting for quotes</Text>
                <Text className="mt-2 text-center text-sm leading-5" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
                  Contractors see your brief privately. Quotes will appear here for comparison.
                </Text>
              </View>
            ) : (
              (() => {
                const totals = quotes.map((q) => q.totalPence ?? q.labourPence + q.materialsPence + q.wastePence + q.otherPence);
                const maxTotal = Math.max(...totals, 1);
                const minTotal = Math.min(...totals);
                return quotes.map((quote, index) => {
                  const total = totals[index] ?? 0;
                  const selected = quote.isSelected || quote.status === 'ACCEPTED';
                  const isLowest = total === minTotal && quotes.length > 1;
                  return (
                  <View className="mb-3 rounded-[26px] bg-[#FFFDF8] p-5" key={quote.id} style={shadows.soft} testID={`quote-card-${quote.id}`}>
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-3">
                        <Text className="text-lg" style={{ color: colors.ink, fontFamily: typefaces.demi }}>
                          {quote.contractorProfile?.businessName ?? 'Contractor'}
                        </Text>
                        <Text className="mt-1 text-[13px]" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
                          {quote.contractorProfile?.accountKind === 'COMPANY' ? 'Company' : 'Sole trader'}
                          {quote.contractorProfile?.serviceArea ? ` · ${quote.contractorProfile.serviceArea}` : ''}
                        </Text>
                        {isLowest ? (
                          <Text className="mt-2 text-[12px]" style={{ color: colors.green, fontFamily: typefaces.demi }}>Lowest total</Text>
                        ) : null}
                      </View>
                      <Text className="text-[22px] tracking-[-0.4px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>{formatPounds(total)}</Text>
                    </View>

                    <View className="mt-4 h-2 overflow-hidden rounded-full bg-[#F2EEE5]">
                      <View className="h-full rounded-full bg-[#FFD21C]" style={{ width: `${Math.max(12, (total / maxTotal) * 100)}%` }} />
                    </View>

                    <View className="mt-4 flex-row flex-wrap gap-2">
                      <View className="rounded-full bg-[#F2EEE5] px-3 py-1.5">
                        <Text className="text-xs" style={{ color: colors.ink, fontFamily: typefaces.medium }}>Labour {formatPounds(quote.labourPence)}</Text>
                      </View>
                      <View className="rounded-full bg-[#F2EEE5] px-3 py-1.5">
                        <Text className="text-xs" style={{ color: colors.ink, fontFamily: typefaces.medium }}>Materials {formatPounds(quote.materialsPence)}</Text>
                      </View>
                      {quote.durationText ? (
                        <View className="rounded-full bg-[#FFF2A8] px-3 py-1.5">
                          <Text className="text-xs" style={{ color: colors.ink, fontFamily: typefaces.medium }}>{quote.durationText}</Text>
                        </View>
                      ) : null}
                    </View>

                    {quote.scopeText ? (
                      <Text className="mt-4 text-sm leading-5" style={{ color: colors.ink, fontFamily: typefaces.regular }}>{quote.scopeText}</Text>
                    ) : null}

                    <View className="mt-4 flex-row gap-2">
                      <Pressable
                        accessibilityLabel="Message contractor"
                        accessibilityRole="button"
                        className="h-12 flex-1 flex-row items-center justify-center rounded-2xl border border-[#E3DED2] active:opacity-80"
                        onPress={() => router.push(`/(app)/messages/${projectId}`)}
                        testID={`message-contractor-${quote.id}`}
                      >
                        <MessageCircle color={colors.ink} size={16} />
                        <Text className="ml-2 text-sm" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Message</Text>
                      </Pressable>
                      {!selected && project.status !== 'AWARDED' ? (
                        <Pressable
                          accessibilityLabel="Select this quotation"
                          accessibilityRole="button"
                          className="h-12 flex-[1.2] flex-row items-center justify-center rounded-2xl bg-[#FFD21C] active:opacity-80"
                          disabled={acceptMutation.isPending}
                          onPress={() => acceptMutation.mutate(quote.id)}
                          testID={`accept-quote-${quote.id}`}
                        >
                          <Text className="text-sm" style={{ color: colors.ink, fontFamily: typefaces.demi }}>
                            {acceptMutation.isPending ? 'Selecting…' : 'Select'}
                          </Text>
                        </Pressable>
                      ) : selected ? (
                        <View className="h-12 flex-[1.2] flex-row items-center justify-center rounded-2xl bg-[#E1EFE8]">
                          <Check color={colors.green} size={16} />
                          <Text className="ml-1.5 text-sm" style={{ color: colors.green, fontFamily: typefaces.demi }}>Selected</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  );
                });
              })()
            )}
            {acceptMutation.error ? (
              <Text className="mt-2 text-sm" style={{ color: colors.red, fontFamily: typefaces.medium }}>{acceptMutation.error.message}</Text>
            ) : null}
          </View>
        ) : null}

        {pendingCalls.length > 0 ? (
          <View className="mt-8">
            <Text className="mb-4 text-[26px] tracking-[-0.5px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Call requests</Text>
            {pendingCalls.map((call) => (
              <View className="mb-3 rounded-[24px] border border-[#E3DED2] bg-[#FFFDF8] p-4" key={call.id} testID={`call-request-${call.id}`}>
                <View className="flex-row items-center">
                  <Phone color={colors.ink} size={18} />
                  <Text className="ml-2 flex-1 text-base" style={{ color: colors.ink, fontFamily: typefaces.demi }}>
                    {call.contractorProfile?.businessName ?? 'Contractor'} wants a call
                  </Text>
                </View>
                <View className="mt-4 flex-row gap-2">
                  <View className="flex-1">
                    <Button
                      label="Decline"
                      loading={respondCallMutation.isPending}
                      onPress={() => respondCallMutation.mutate({ callRequestId: call.id, decision: 'DECLINED' })}
                      testID={`decline-call-${call.id}`}
                      variant="secondary"
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      label="Approve"
                      loading={respondCallMutation.isPending}
                      onPress={() => respondCallMutation.mutate({ callRequestId: call.id, decision: 'APPROVED' })}
                      testID={`approve-call-${call.id}`}
                      variant="primary"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {publishMutation.error ? (
          <View className="mt-6 rounded-2xl bg-[#FFF0EC] px-4 py-3" testID="publish-draft-error">
            <Text className="text-sm leading-5" style={{ color: colors.red, fontFamily: typefaces.medium }}>{publishMutation.error.message}</Text>
          </View>
        ) : null}

        {!published ? (
          <View className="mt-8">
            <Button icon={Send} label="Publish for quotes" loading={publishMutation.isPending} onPress={() => publishMutation.mutate()} testID="publish-draft-button" variant="primary" />
            <Text className="mt-3 text-center text-xs leading-5" style={{ color: colors.muted, fontFamily: typefaces.regular }}>Publishing shares this brief and its photos with suitable contractors.</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
