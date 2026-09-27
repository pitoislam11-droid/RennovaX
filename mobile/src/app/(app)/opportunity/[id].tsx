import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { Check, MapPin, MessageCircle, Phone, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ErrorState, LoadingView } from '@/components/ui/state-view';
import { api } from '@/lib/api/api';
import type { CallRequest, OpportunityDetail, Quote, SubmitQuoteRequest } from '@/lib/contracts';
import { colors, shadows, typefaces } from '@/lib/design/tokens';
import { formatPounds, poundsInputToPence } from '@/lib/money';
import { queryKeys } from '@/lib/query-keys';

function MoneyField({
  label,
  testID,
  value,
  onChangeText,
}: {
  label: string;
  testID: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-2 text-[14px]" style={{ color: colors.muted, fontFamily: typefaces.medium }}>{label}</Text>
      <View className="min-h-14 flex-row items-center rounded-2xl border border-[#E3DED2] bg-[#FFFDF8] px-4">
        <Text style={{ color: colors.muted, fontFamily: typefaces.medium }}>£</Text>
        <TextInput
          className="ml-2 flex-1 text-base"
          keyboardType="decimal-pad"
          onChangeText={onChangeText}
          placeholder="0"
          placeholderTextColor="#9A958A"
          style={{ color: colors.ink, fontFamily: typefaces.medium }}
          testID={testID}
          value={value}
        />
      </View>
    </View>
  );
}

export default function OpportunityDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const projectId = Array.isArray(params.id) ? params.id[0] ?? '' : params.id ?? '';
  const queryClient = useQueryClient();

  const opportunityQuery = useQuery({
    queryKey: queryKeys.opportunity(projectId),
    queryFn: () => api.get<OpportunityDetail>(`/api/opportunities/${projectId}`),
    enabled: Boolean(projectId),
  });

  const callQuery = useQuery({
    queryKey: queryKeys.callRequests(projectId),
    queryFn: () => api.get<CallRequest[]>(`/api/calls/project/${projectId}`),
    enabled: Boolean(projectId),
  });

  const [labour, setLabour] = useState('');
  const [materials, setMaterials] = useState('');
  const [waste, setWaste] = useState('');
  const [other, setOther] = useState('');
  const [durationText, setDurationText] = useState('');
  const [warrantyText, setWarrantyText] = useState('');
  const [scopeText, setScopeText] = useState('');
  const [materialsIncluded, setMaterialsIncluded] = useState(false);

  useEffect(() => {
    const quote = opportunityQuery.data?.myQuote;
    if (!quote) return;
    setLabour(String(quote.labourPence / 100));
    setMaterials(String(quote.materialsPence / 100));
    setWaste(String(quote.wastePence / 100));
    setOther(String(quote.otherPence / 100));
    setDurationText(quote.durationText ?? '');
    setWarrantyText(quote.warrantyText ?? '');
    setScopeText(quote.scopeText ?? '');
    setMaterialsIncluded(quote.materialsIncluded);
  }, [opportunityQuery.data?.myQuote?.id]);

  const quoteMutation = useMutation({
    mutationFn: (body: SubmitQuoteRequest) => api.post<Quote, SubmitQuoteRequest>(`/api/quotes/project/${projectId}`, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.opportunity(projectId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.opportunities });
      await queryClient.invalidateQueries({ queryKey: queryKeys.opportunityStats });
    },
  });

  const callMutation = useMutation({
    mutationFn: () => api.post<CallRequest, { note?: string | null }>(`/api/calls/project/${projectId}/request`, { note: null }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.callRequests(projectId) });
    },
  });

  if (opportunityQuery.isLoading) return <LoadingView label="Opening brief…" testID="opportunity-loading" />;
  if (opportunityQuery.isError || !opportunityQuery.data) {
    return (
      <SafeAreaView className="flex-1 justify-center px-6" style={{ backgroundColor: colors.canvas }}>
        <ErrorState message={opportunityQuery.error?.message ?? 'This opportunity could not be opened.'} onRetry={() => void opportunityQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const project = opportunityQuery.data;
  const brief = project.briefJson;
  const myQuote = project.myQuote;
  const labourPence = poundsInputToPence(labour);
  const materialsPence = poundsInputToPence(materials);
  const wastePence = poundsInputToPence(waste);
  const otherPence = poundsInputToPence(other);
  const totalPence = labourPence + materialsPence + wastePence + otherPence;
  const callRequest = callQuery.data?.[0];

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']} style={{ backgroundColor: colors.canvas }} testID="opportunity-detail-screen">
      <ScreenHeader subtitle={project.category} title="Private brief" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="rounded-[30px] bg-[#FFFDF8] p-6" style={shadows.soft}>
          <Text className="text-[30px] leading-[34px] tracking-[-0.7px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>{brief.title || project.title}</Text>
          <View className="mt-3 flex-row items-center">
            <MapPin color={colors.muted} size={16} />
            <Text className="ml-1.5 flex-1 text-sm" style={{ color: colors.muted, fontFamily: typefaces.medium }}>
              {brief.location || project.locationLabel || 'Location in brief'}
            </Text>
          </View>
          <Text className="mt-5 text-[15px] leading-6" style={{ color: colors.ink, fontFamily: typefaces.regular }}>{brief.summary}</Text>
          <View className="my-6 h-px bg-[#E7E1D5]" />
          {brief.sections?.map((section, sectionIndex) => (
            <View className="mb-5" key={`${section.title}-${sectionIndex}`}>
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
          <ScrollView horizontal className="mt-5" contentContainerStyle={{ gap: 12 }} showsHorizontalScrollIndicator={false}>
            {project.media.map((media) => (
              <Image contentFit="cover" key={media.id} source={{ uri: media.url }} style={{ borderRadius: 20, height: 132, width: 132 }} />
            ))}
          </ScrollView>
        ) : null}

        <Text className="mb-3 mt-8 text-[22px] tracking-[-0.4px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>
          {myQuote ? 'Update your private quote' : 'Send a private quote'}
        </Text>
        <View className="rounded-[26px] bg-[#FFFDF8] p-5" style={shadows.soft}>
          <MoneyField label="Labour" onChangeText={setLabour} testID="quote-labour-input" value={labour} />
          <MoneyField label="Materials" onChangeText={setMaterials} testID="quote-materials-input" value={materials} />
          <MoneyField label="Waste / skip" onChangeText={setWaste} testID="quote-waste-input" value={waste} />
          <MoneyField label="Other" onChangeText={setOther} testID="quote-other-input" value={other} />

          <View className="mb-4 mt-1 flex-row items-center justify-between rounded-2xl bg-[#F7F4EC] px-4 py-3">
            <Text style={{ color: colors.ink, fontFamily: typefaces.medium }}>Materials included</Text>
            <Switch
              onValueChange={setMaterialsIncluded}
              testID="materials-included-switch"
              trackColor={{ false: '#DDD8CC', true: colors.yellow }}
              value={materialsIncluded}
            />
          </View>

          <TextInput
            className="mb-3 min-h-12 rounded-2xl border border-[#E3DED2] px-4 text-base"
            onChangeText={setDurationText}
            placeholder="Duration estimate"
            placeholderTextColor="#9A958A"
            style={{ color: colors.ink, fontFamily: typefaces.medium }}
            testID="quote-duration-input"
            value={durationText}
          />
          <TextInput
            className="mb-3 min-h-12 rounded-2xl border border-[#E3DED2] px-4 text-base"
            onChangeText={setWarrantyText}
            placeholder="Warranty (optional)"
            placeholderTextColor="#9A958A"
            style={{ color: colors.ink, fontFamily: typefaces.medium }}
            testID="quote-warranty-input"
            value={warrantyText}
          />
          <TextInput
            className="mb-4 min-h-[88px] rounded-2xl border border-[#E3DED2] px-4 py-3 text-base"
            multiline
            onChangeText={setScopeText}
            placeholder="Scope notes for the homeowner"
            placeholderTextColor="#9A958A"
            style={{ color: colors.ink, fontFamily: typefaces.regular, textAlignVertical: 'top' }}
            testID="quote-scope-input"
            value={scopeText}
          />

          <View className="mb-4 flex-row items-center justify-between rounded-2xl bg-[#173B31] px-4 py-4">
            <Text style={{ color: 'rgba(255,253,248,0.72)', fontFamily: typefaces.medium }}>Total</Text>
            <Text style={{ color: colors.yellow, fontFamily: typefaces.demi }}>{formatPounds(totalPence)}</Text>
          </View>

          {quoteMutation.error ? (
            <Text className="mb-3 text-sm" style={{ color: colors.red, fontFamily: typefaces.medium }}>{quoteMutation.error.message}</Text>
          ) : null}
          {quoteMutation.isSuccess ? (
            <View className="mb-3 flex-row items-center rounded-2xl bg-[#E1EFE8] px-3 py-3">
              <Check color={colors.green} size={16} />
              <Text className="ml-2 text-sm" style={{ color: colors.green, fontFamily: typefaces.demi }}>Quote sent privately</Text>
            </View>
          ) : null}

          <Button
            disabled={totalPence <= 0}
            label={myQuote ? 'Update quotation' : 'Send private quotation'}
            loading={quoteMutation.isPending}
            onPress={() =>
              quoteMutation.mutate({
                labourPence,
                materialsPence,
                wastePence,
                otherPence,
                durationText: durationText.trim() || null,
                warrantyText: warrantyText.trim() || null,
                scopeText: scopeText.trim() || null,
                materialsIncluded,
              })
            }
            testID="submit-quote-button"
            variant="primary"
          />
        </View>

        {myQuote ? (
          <View className="mt-5 gap-3">
            <Pressable
              className="min-h-14 flex-row items-center justify-center rounded-2xl bg-[#FFF2A8] active:opacity-80"
              onPress={() =>
                router.push({
                  pathname: '/(app)/(contractor-tabs)/ask',
                  params: { projectId, title: project.title },
                })
              }
              testID="ask-rennova-from-opportunity"
            >
              <Sparkles color={colors.ink} size={18} />
              <Text className="ml-2 text-base" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Ask Rennova about this brief</Text>
            </Pressable>
            <Pressable
              className="min-h-14 flex-row items-center justify-center rounded-2xl border border-[#E3DED2] bg-[#FFFDF8] active:opacity-80"
              onPress={() => router.push(`/(app)/messages/${projectId}`)}
              testID="open-message-thread-button"
            >
              <MessageCircle color={colors.ink} size={18} />
              <Text className="ml-2 text-base" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Message homeowner</Text>
            </Pressable>
            <Button
              disabled={callRequest?.status === 'PENDING' || callRequest?.status === 'APPROVED'}
              icon={Phone}
              label={
                callRequest?.status === 'APPROVED'
                  ? 'Call approved'
                  : callRequest?.status === 'PENDING'
                    ? 'Call request pending'
                    : callRequest?.status === 'DECLINED'
                      ? 'Request call again'
                      : 'Request a call'
              }
              loading={callMutation.isPending}
              onPress={() => callMutation.mutate()}
              testID="request-call-button"
              variant="dark"
            />
            {callMutation.error ? (
              <Text className="text-center text-sm" style={{ color: colors.red, fontFamily: typefaces.medium }}>{callMutation.error.message}</Text>
            ) : null}
          </View>
        ) : (
          <View className="mt-5">
            <Pressable
              className="min-h-14 flex-row items-center justify-center rounded-2xl bg-[#FFF2A8] active:opacity-80"
              onPress={() =>
                router.push({
                  pathname: '/(app)/(contractor-tabs)/ask',
                  params: { projectId, title: project.title },
                })
              }
              testID="ask-before-quote"
            >
              <Sparkles color={colors.ink} size={18} />
              <Text className="ml-2 text-base" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Ask Rennova before you quote</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
