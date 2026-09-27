import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { AlertTriangle, Check, ImagePlus, MapPin, Pencil, Send, X } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ErrorState } from '@/components/ui/state-view';
import { api } from '@/lib/api/api';
import type { CreateProjectRequest, Project, ProjectBrief, UploadAsset } from '@/lib/contracts';
import { colors, shadows, typefaces } from '@/lib/design/tokens';
import type { LocalProjectPhoto } from '@/lib/projects/project-store';
import { useProjectDraft } from '@/lib/projects/project-store';
import { queryKeys } from '@/lib/query-keys';

function copyBrief(brief: ProjectBrief): ProjectBrief {
  return { ...brief, sections: brief.sections.map((section) => ({ ...section, items: [...section.items] })), safetyNotes: [...brief.safetyNotes] };
}

function EditableField({ label, value, onChangeText, multiline = false, testID }: { label: string; value: string; onChangeText: (value: string) => void; multiline?: boolean; testID: string }) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-[14px]" style={{ color: colors.muted, fontFamily: typefaces.medium }}>{label}</Text>
      <TextInput
        className={`rounded-2xl border border-[#D8D2C6] bg-[#FFFDF8] px-4 text-base ${multiline ? 'min-h-[100px] py-4' : 'min-h-14'}`}
        maxLength={multiline ? 500 : 180}
        multiline={multiline}
        onChangeText={onChangeText}
        style={{ color: colors.ink, fontFamily: typefaces.regular, textAlignVertical: multiline ? 'top' : 'center' }}
        testID={testID}
        value={value}
      />
    </View>
  );
}

export default function ProjectReviewScreen() {
  const initialRequest = useProjectDraft((state) => state.initialRequest);
  const turns = useProjectDraft((state) => state.turns);
  const step = useProjectDraft((state) => state.step);
  const storedPhotos = useProjectDraft((state) => state.photos);
  const setStoredPhotos = useProjectDraft((state) => state.setPhotos);
  const reset = useProjectDraft((state) => state.reset);
  const [brief, setBrief] = useState<ProjectBrief | null>(step?.brief ? copyBrief(step.brief) : null);
  const [editing, setEditing] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      if (!brief) throw new Error('Your brief is not ready yet.');
      const uploaded: UploadAsset[] = [];
      for (const photo of storedPhotos) {
        try {
          const form = new FormData();
          if (Platform.OS === 'web') {
            const photoResponse = await fetch(photo.uri);
            if (!photoResponse.ok) continue;
            form.append('file', await photoResponse.blob(), photo.filename);
          } else {
            form.append('file', { uri: photo.uri, type: photo.mimeType, name: photo.filename } as unknown as Blob);
          }
          uploaded.push(await api.upload<UploadAsset>('/api/uploads', form));
        } catch {
          // Storage may be offline until credentials are connected — still save the brief.
        }
      }
      const briefForSave: ProjectBrief = {
        ...brief,
        photosSummary: uploaded.length
          ? `${uploaded.length} photo${uploaded.length === 1 ? '' : 's'} attached`
          : 'No photos attached',
      };
      const body: CreateProjectRequest = {
        initialRequest,
        brief: briefForSave,
        turns,
        media: uploaded.map((asset) => ({ assetId: asset.id })),
        publish,
      };
      return api.post<Project, CreateProjectRequest>('/api/projects', body);
    },
    onSuccess: async () => {
      reset();
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      router.replace('/(app)/(tabs)/projects');
    },
  });

  const pickMorePhotos = async () => {
    const remaining = 5 - storedPhotos.length;
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, mediaTypes: ['images'], quality: 0.82, selectionLimit: remaining });
    if (result.canceled) return;
    const additions: LocalProjectPhoto[] = result.assets.map((asset, index) => ({
      id: `${Date.now()}-${index}`,
      uri: asset.uri,
      filename: asset.fileName ?? `rennova-photo-${Date.now()}-${index}.jpg`,
      mimeType: asset.mimeType ?? 'image/jpeg',
    }));
    setStoredPhotos([...storedPhotos, ...additions].slice(0, 5));
  };

  if (!brief || !initialRequest) {
    return (
      <SafeAreaView className="flex-1 justify-center px-6" style={{ backgroundColor: colors.canvas }} testID="review-missing-state">
        <ErrorState message="We can’t find a completed brief for this project." onRetry={() => router.replace('/(app)/new-project')} />
      </SafeAreaView>
    );
  }

  const updateSectionItem = (sectionIndex: number, itemIndex: number, value: string) => {
    setBrief((current) => {
      if (!current) return current;
      const next = copyBrief(current);
      next.sections[sectionIndex].items[itemIndex] = value;
      return next;
    });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1" style={{ backgroundColor: colors.canvas }} testID="project-review-screen">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScreenHeader subtitle="Project brief" title={editing ? 'Edit the details' : 'Ready to review'} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 34 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center rounded-full bg-[#E1EFE8] px-3 py-2">
              <Check color={colors.green} size={15} /><Text className="ml-1.5 text-xs" style={{ color: colors.green, fontFamily: typefaces.demi }}>Brief generated</Text>
            </View>
            <Pressable className="min-h-11 flex-row items-center rounded-full border border-[#D8D2C6] bg-[#FFFDF8] px-4 active:opacity-60" onPress={() => setEditing((value) => !value)} testID="toggle-brief-edit-button">
              {editing ? <Check color={colors.ink} size={17} /> : <Pencil color={colors.ink} size={16} />}
              <Text className="ml-2 text-sm" style={{ color: colors.ink, fontFamily: typefaces.demi }}>{editing ? 'Done' : 'Edit'}</Text>
            </Pressable>
          </View>

          {editing ? (
            <View className="mt-7" testID="brief-edit-form">
              <EditableField label="Project title" onChangeText={(title) => setBrief({ ...brief, title })} testID="brief-title-input" value={brief.title} />
              <EditableField label="Summary" multiline onChangeText={(summary) => setBrief({ ...brief, summary })} testID="brief-summary-input" value={brief.summary} />
              <EditableField label="Location" onChangeText={(location) => setBrief({ ...brief, location })} testID="brief-location-input" value={brief.location} />
              <EditableField label="Property" onChangeText={(property) => setBrief({ ...brief, property })} testID="brief-property-input" value={brief.property} />
              <EditableField label="Materials" onChangeText={(materials) => setBrief({ ...brief, materials })} testID="brief-materials-input" value={brief.materials} />
              <EditableField label="Timing" onChangeText={(timing) => setBrief({ ...brief, timing })} testID="brief-timing-input" value={brief.timing} />
              {brief.sections.map((section, sectionIndex) => (
                <View className="mb-5 rounded-[24px] border border-[#DED8CC] bg-[#F2EEE5] p-4" key={`${section.title}-${sectionIndex}`}>
                  <TextInput className="mb-3 text-base" onChangeText={(title) => setBrief((current) => current ? { ...current, sections: current.sections.map((item, index) => index === sectionIndex ? { ...item, title } : item) } : current)} style={{ color: colors.ink, fontFamily: typefaces.demi }} testID={`brief-section-${sectionIndex + 1}-title`} value={section.title} />
                  {section.items.map((item, itemIndex) => (
                    <TextInput className="mb-2 min-h-12 rounded-xl bg-[#FFFDF8] px-3 py-3 text-sm" key={`${sectionIndex}-${itemIndex}`} multiline onChangeText={(value) => updateSectionItem(sectionIndex, itemIndex, value)} style={{ color: colors.ink, fontFamily: typefaces.regular }} testID={`brief-section-${sectionIndex + 1}-item-${itemIndex + 1}`} value={item} />
                  ))}
                </View>
              ))}
            </View>
          ) : (
            <View className="mt-7 rounded-[30px] bg-[#FFFDF8] p-6" style={shadows.soft} testID="generated-brief">
              <Text className="text-[30px] leading-[35px] tracking-[-0.7px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>{brief.title}</Text>
              <View className="mt-3 flex-row items-center"><MapPin color={colors.muted} size={16} /><Text className="ml-1.5 text-sm" style={{ color: colors.muted, fontFamily: typefaces.medium }}>{brief.location || 'Location not confirmed'}</Text></View>
              <Text className="mt-6 text-[15px] leading-6" style={{ color: colors.ink, fontFamily: typefaces.regular }}>{brief.summary}</Text>
              <View className="my-6 h-px bg-[#E7E1D5]" />
              {brief.sections.map((section) => (
                <View className="mb-6" key={section.title}>
                  <Text className="text-[14px]" style={{ color: colors.muted, fontFamily: typefaces.medium }}>{section.title}</Text>
                  {section.items.map((item) => (
                    <View className="mt-3 flex-row" key={item}><View className="mt-2 h-1.5 w-1.5 rounded-full bg-[#FFD21C]" /><Text className="ml-3 flex-1 text-sm leading-6" style={{ color: colors.ink, fontFamily: typefaces.regular }}>{item}</Text></View>
                  ))}
                </View>
              ))}
              <View className="rounded-[20px] bg-[#F2EEE5] p-4"><Text className="text-[14px]" style={{ color: colors.muted, fontFamily: typefaces.medium }}>Materials</Text><Text className="mt-2 text-sm leading-5" style={{ color: colors.ink, fontFamily: typefaces.regular }}>{brief.materials || 'Not confirmed'}</Text><Text className="mt-4 text-[14px]" style={{ color: colors.muted, fontFamily: typefaces.medium }}>Timing</Text><Text className="mt-2 text-sm leading-5" style={{ color: colors.ink, fontFamily: typefaces.regular }}>{brief.timing || 'Not confirmed'}</Text></View>
              {brief.safetyNotes.length ? <View className="mt-4 rounded-[20px] bg-[#FFF0EC] p-4"><View className="flex-row items-center"><AlertTriangle color={colors.red} size={18} /><Text className="ml-2 text-sm" style={{ color: colors.red, fontFamily: typefaces.demi }}>Safety notes</Text></View>{brief.safetyNotes.map((note) => <Text className="mt-2 text-sm leading-5" key={note} style={{ color: colors.ink, fontFamily: typefaces.regular }}>{note}</Text>)}</View> : null}
            </View>
          )}

          <View className="mt-8">
            <Text className="text-[22px] tracking-[-0.4px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Project photos · optional</Text>
            <Text className="mt-2 text-sm leading-5" style={{ color: colors.muted, fontFamily: typefaces.regular }}>Three to five clear photos help contractors understand the space before they visit.</Text>
            <View className="mt-4 flex-row flex-wrap gap-3" testID="review-photo-list">
              {storedPhotos.map((photo, index) => <View className="overflow-hidden rounded-[18px]" key={photo.id}><Image contentFit="cover" source={{ uri: photo.uri }} style={{ height: 96, width: 96 }} /><Pressable className="absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full bg-black/65" onPress={() => setStoredPhotos(storedPhotos.filter((item) => item.id !== photo.id))} testID={`review-remove-photo-${index + 1}`}><X color={colors.paper} size={14} /></Pressable></View>)}
              {storedPhotos.length < 5 ? <Pressable className="h-24 w-24 items-center justify-center rounded-[18px] border border-dashed border-[#AAA59A] bg-[#FFFDF8]" onPress={() => void pickMorePhotos()} testID="review-add-photos-button"><ImagePlus color={colors.ink} size={23} /><Text className="mt-1.5 text-[11px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Add</Text></Pressable> : null}
            </View>
          </View>

          {createMutation.error ? <View className="mt-6 rounded-2xl bg-[#FFF0EC] px-4 py-3" testID="create-project-error"><Text className="text-sm leading-5" style={{ color: colors.red, fontFamily: typefaces.medium }}>{createMutation.error.message}</Text></View> : null}
          <View className="mt-8 gap-3">
            <Button disabled={createMutation.isPending} icon={Send} label="Publish for quotes" loading={createMutation.isPending ? createMutation.variables === true : false} onPress={() => createMutation.mutate(true)} testID="publish-project-button" variant="primary" />
            <Button disabled={createMutation.isPending} label="Save as draft" loading={createMutation.isPending ? createMutation.variables === false : false} onPress={() => createMutation.mutate(false)} testID="save-project-draft-button" variant="secondary" />
          </View>
          <Text className="mt-3 text-center text-xs leading-5" style={{ color: colors.muted, fontFamily: typefaces.regular }}>Publishing shares this brief and its photos with suitable contractors.</Text>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
