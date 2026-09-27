import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Building2, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/ui/field-label';
import { api } from '@/lib/api/api';
import type { AccountKind, ContractorProfile, UpsertContractorProfileRequest } from '@/lib/contracts';
import { colors, shadows, typefaces } from '@/lib/design/tokens';
import { contractorHomeHref } from '@/lib/navigation';
import { useProfile } from '@/lib/profile';
import { queryKeys } from '@/lib/query-keys';

const SERVICE_SUGGESTIONS = ['Kitchens', 'Bathrooms', 'Extensions', 'Decorating', 'Flooring', 'Electrics', 'Plumbing', 'Roofing'];

export default function ContractorSetupScreen() {
  const profileQuery = useProfile();
  const queryClient = useQueryClient();
  const existing = profileQuery.data?.contractorProfile;

  const [accountKind, setAccountKind] = useState<AccountKind>((existing?.accountKind as AccountKind) ?? 'SOLE_TRADER');
  const [businessName, setBusinessName] = useState(existing?.businessName ?? '');
  const [serviceArea, setServiceArea] = useState(existing?.serviceArea ?? '');
  const [about, setAbout] = useState(existing?.about ?? '');
  const [services, setServices] = useState<string[]>(
    Array.isArray(existing?.servicesJson) ? existing.servicesJson : [],
  );

  const saveMutation = useMutation({
    mutationFn: (body: UpsertContractorProfileRequest) =>
      api.put<ContractorProfile, UpsertContractorProfileRequest>('/api/contractors/me', body),
    onSuccess: async (profile) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      await queryClient.invalidateQueries({ queryKey: queryKeys.contractorMe });
      router.replace(contractorHomeHref({ contractorProfile: profile }));
    },
  });

  const toggleService = (service: string) => {
    setServices((current) =>
      current.includes(service) ? current.filter((item) => item !== service) : [...current, service].slice(0, 12),
    );
  };

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']} style={{ backgroundColor: colors.canvas }} testID="contractor-setup-screen">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <BrandMark />
        <Text className="mt-8 text-[34px] leading-[38px] tracking-[-1px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>
          Set up how homeowners see you
        </Text>
        <Text className="mt-3 text-[15px] leading-6" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
          Choose company or sole trader, then add the essentials. You can refine your storefront later.
        </Text>

        <Text className="mb-3 mt-8 text-[14px]" style={{ color: colors.muted, fontFamily: typefaces.medium }}>Account type</Text>
        <View className="flex-row gap-3">
          {([
            { kind: 'SOLE_TRADER' as const, label: 'Sole trader', icon: UserRound },
            { kind: 'COMPANY' as const, label: 'Company', icon: Building2 },
          ]).map(({ kind, label, icon: Icon }) => {
            const active = accountKind === kind;
            return (
              <Pressable
                key={kind}
                className="flex-1 rounded-[24px] border p-4 active:opacity-80"
                onPress={() => setAccountKind(kind)}
                style={{
                  backgroundColor: active ? colors.ink : colors.paper,
                  borderColor: active ? colors.ink : '#E3DED2',
                  ...shadows.soft,
                }}
                testID={`account-kind-${kind.toLowerCase()}`}
              >
                <Icon color={active ? colors.yellow : colors.ink} size={22} />
                <Text className="mt-3 text-base" style={{ color: active ? colors.paper : colors.ink, fontFamily: typefaces.demi }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-8">
          <FieldLabel>{accountKind === 'COMPANY' ? 'Company name' : 'Trading name'}</FieldLabel>
        </View>
        <TextInput
          autoCapitalize="words"
          className="min-h-14 rounded-2xl border border-[#E3DED2] bg-[#FFFDF8] px-4 text-base"
          onChangeText={setBusinessName}
          placeholder={accountKind === 'COMPANY' ? 'e.g. Oak & Stone Ltd' : 'e.g. James Clarke Joinery'}
          placeholderTextColor="#9A958A"
          style={{ color: colors.ink, fontFamily: typefaces.medium }}
          testID="business-name-input"
          value={businessName}
        />

        <View className="mt-5">
          <FieldLabel>Service area</FieldLabel>
        </View>
        <TextInput
          autoCapitalize="words"
          className="min-h-14 rounded-2xl border border-[#E3DED2] bg-[#FFFDF8] px-4 text-base"
          onChangeText={setServiceArea}
          placeholder="e.g. Greater Manchester"
          placeholderTextColor="#9A958A"
          style={{ color: colors.ink, fontFamily: typefaces.medium }}
          testID="service-area-input"
          value={serviceArea}
        />

        <View className="mt-5">
          <FieldLabel>About your work</FieldLabel>
        </View>
        <TextInput
          className="min-h-[110px] rounded-2xl border border-[#E3DED2] bg-[#FFFDF8] px-4 py-3 text-base"
          multiline
          onChangeText={setAbout}
          placeholder="A short note on the work you take on and how you work with homeowners."
          placeholderTextColor="#9A958A"
          style={{ color: colors.ink, fontFamily: typefaces.regular, textAlignVertical: 'top' }}
          testID="about-input"
          value={about}
        />

        <View className="mt-5">
          <FieldLabel>Services</FieldLabel>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {SERVICE_SUGGESTIONS.map((service) => {
            const active = services.includes(service);
            return (
              <Pressable
                key={service}
                className="rounded-full px-3.5 py-2"
                onPress={() => toggleService(service)}
                style={{ backgroundColor: active ? colors.yellow : colors.paper, borderColor: active ? colors.yellow : '#E3DED2', borderWidth: 1 }}
                testID={`service-chip-${service.toLowerCase()}`}
              >
                <Text style={{ color: colors.ink, fontFamily: typefaces.medium }}>{service}</Text>
              </Pressable>
            );
          })}
        </View>

        {saveMutation.error ? (
          <Text className="mt-5 text-sm" style={{ color: colors.red, fontFamily: typefaces.medium }} testID="contractor-setup-error">
            {saveMutation.error.message}
          </Text>
        ) : null}

        <View className="mt-8">
          <Button
            disabled={businessName.trim().length < 2}
            label={existing ? 'Save profile' : 'Open opportunities'}
            loading={saveMutation.isPending}
            onPress={() =>
              saveMutation.mutate({
                accountKind,
                businessName: businessName.trim(),
                serviceArea: serviceArea.trim() || null,
                about: about.trim() || null,
                services,
              })
            }
            testID="save-contractor-profile-button"
            variant="primary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
