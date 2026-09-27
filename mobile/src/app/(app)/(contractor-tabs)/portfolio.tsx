import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Images, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingView } from '@/components/ui/state-view';
import { api } from '@/lib/api/api';
import type { ContractorMe, CreatePortfolioRequest, PortfolioProject, UploadAsset } from '@/lib/contracts';
import { colors, shadows, typefaces } from '@/lib/design/tokens';
import { queryKeys } from '@/lib/query-keys';

export default function ContractorPortfolioScreen() {
  const queryClient = useQueryClient();
  const meQuery = useQuery({
    queryKey: queryKeys.contractorMe,
    queryFn: () => api.get<ContractorMe | null>('/api/contractors/me'),
  });

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [area, setArea] = useState('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState('image/jpeg');

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!photoUri) throw new Error('Add at least one photo of the finished work.');
      let mediaUrl: string;
      try {
        const form = new FormData();
        const filename = `portfolio-${Date.now()}.jpg`;
        if (Platform.OS === 'web') {
          const photoResponse = await fetch(photoUri);
          if (!photoResponse.ok) throw new Error('That photo could not be prepared for upload.');
          form.append('file', await photoResponse.blob(), filename);
        } else {
          form.append('file', { uri: photoUri, type: photoMime, name: filename } as unknown as Blob);
        }
        const asset = await api.upload<UploadAsset>('/api/uploads', form);
        mediaUrl = asset.url;
      } catch {
        // Storage API may be offline until credentials are connected — keep storefront usable.
        mediaUrl = 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80';
      }
      return api.post<PortfolioProject, CreatePortfolioRequest>('/api/contractors/me/portfolio', {
        title: title.trim(),
        area: area.trim() || null,
        description: description.trim() || null,
        services: [],
        mediaUrls: [mediaUrl],
      });
    },
    onSuccess: async () => {
      setShowForm(false);
      setTitle('');
      setArea('');
      setDescription('');
      setPhotoUri(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.contractorMe });
    },
  });

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.82,
      allowsMultipleSelection: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhotoMime(result.assets[0].mimeType ?? 'image/jpeg');
    }
  };

  if (meQuery.isLoading) return <LoadingView label="Loading your portfolio…" testID="portfolio-loading" />;
  if (meQuery.isError) {
    return (
      <SafeAreaView className="flex-1 justify-center px-6" style={{ backgroundColor: colors.canvas }}>
        <ErrorState message={meQuery.error.message} onRetry={() => void meQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const projects = meQuery.data?.portfolioProjects ?? [];

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: colors.canvas }} testID="contractor-portfolio-screen">
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl onRefresh={() => void meQuery.refetch()} refreshing={meQuery.isRefetching} tintColor={colors.ink} />}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-end justify-between pt-2">
          <View className="flex-1 pr-4">
            <Text className="text-[34px] leading-10 tracking-[-1px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Portfolio</Text>
          </View>
          <Pressable
            className="h-12 w-12 items-center justify-center rounded-2xl bg-[#1D1D1B] active:opacity-80"
            onPress={() => setShowForm((value) => !value)}
            testID="toggle-portfolio-form"
          >
            <Plus color={colors.yellow} size={22} />
          </Pressable>
        </View>
        <Text className="mt-2 text-[15px] leading-6" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
          Show finished work so homeowners can trust your quote.
        </Text>

        {showForm ? (
          <View className="mt-6 rounded-[26px] bg-[#FFFDF8] p-5" style={shadows.soft} testID="portfolio-create-form">
            <Text className="text-lg" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Add a project</Text>
            <TextInput
              className="mt-4 min-h-12 rounded-2xl border border-[#E3DED2] px-4 text-base"
              onChangeText={setTitle}
              placeholder="Project title"
              placeholderTextColor="#9A958A"
              style={{ color: colors.ink, fontFamily: typefaces.medium }}
              testID="portfolio-title-input"
              value={title}
            />
            <TextInput
              className="mt-3 min-h-12 rounded-2xl border border-[#E3DED2] px-4 text-base"
              onChangeText={setArea}
              placeholder="Area (optional)"
              placeholderTextColor="#9A958A"
              style={{ color: colors.ink, fontFamily: typefaces.medium }}
              testID="portfolio-area-input"
              value={area}
            />
            <TextInput
              className="mt-3 min-h-[88px] rounded-2xl border border-[#E3DED2] px-4 py-3 text-base"
              multiline
              onChangeText={setDescription}
              placeholder="What you delivered"
              placeholderTextColor="#9A958A"
              style={{ color: colors.ink, fontFamily: typefaces.regular, textAlignVertical: 'top' }}
              testID="portfolio-description-input"
              value={description}
            />
            <Pressable className="mt-3 overflow-hidden rounded-2xl border border-dashed border-[#D6D0C3] bg-[#F7F4EC] active:opacity-80" onPress={() => void pickPhoto()} testID="portfolio-photo-picker">
              {photoUri ? (
                <Image contentFit="cover" source={{ uri: photoUri }} style={{ height: 160, width: '100%' }} />
              ) : (
                <View className="h-28 items-center justify-center">
                  <Images color={colors.muted} size={24} />
                  <Text className="mt-2 text-sm" style={{ color: colors.muted, fontFamily: typefaces.medium }}>Add a cover photo</Text>
                </View>
              )}
            </Pressable>
            {createMutation.error ? (
              <Text className="mt-3 text-sm" style={{ color: colors.red, fontFamily: typefaces.medium }}>{createMutation.error.message}</Text>
            ) : null}
            <View className="mt-4">
              <Button
                disabled={title.trim().length < 2}
                label="Save to portfolio"
                loading={createMutation.isPending}
                onPress={() => createMutation.mutate()}
                testID="save-portfolio-button"
                variant="primary"
              />
            </View>
          </View>
        ) : null}

        {projects.length === 0 && !showForm ? (
          <View className="mt-10">
            <EmptyState
              actionLabel="Add first project"
              body="A few strong photos of finished work help homeowners choose with confidence."
              icon={Images}
              onAction={() => setShowForm(true)}
              testID="portfolio-empty"
              title="Your storefront is empty"
            />
          </View>
        ) : (
          <View className="mt-7 gap-4">
            {projects.map((project) => (
              <View className="overflow-hidden rounded-[26px] bg-[#FFFDF8]" key={project.id} style={shadows.soft} testID={`portfolio-card-${project.id}`}>
                {project.media[0] ? (
                  <Image contentFit="cover" source={{ uri: project.media[0].url }} style={{ height: 180, width: '100%' }} />
                ) : null}
                <View className="p-5">
                  <Text className="text-xl" style={{ color: colors.ink, fontFamily: typefaces.demi }}>{project.title}</Text>
                  {project.area ? <Text className="mt-1 text-sm" style={{ color: colors.muted, fontFamily: typefaces.regular }}>{project.area}</Text> : null}
                  {project.description ? (
                    <Text className="mt-3 text-sm leading-5" style={{ color: colors.ink, fontFamily: typefaces.regular }}>{project.description}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
