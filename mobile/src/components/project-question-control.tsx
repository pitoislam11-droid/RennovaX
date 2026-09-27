import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { CalendarDays, Camera, Check, ImagePlus, Ruler, X } from 'lucide-react-native';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import type { IntakeAnswer, IntakeQuestion } from '@/lib/contracts';
import { colors, typefaces } from '@/lib/design/tokens';
import type { LocalProjectPhoto } from '@/lib/projects/project-store';

type Props = {
  question: IntakeQuestion;
  answer: IntakeAnswer;
  onAnswerChange: (answer: IntakeAnswer) => void;
  photos: LocalProjectPhoto[];
  onPhotosChange: (photos: LocalProjectPhoto[]) => void;
};

function OptionCard({
  label,
  detail,
  selected,
  onPress,
  testID,
}: {
  label: string;
  detail: string | null;
  selected: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      className={`mb-3 min-h-14 flex-row items-center rounded-[20px] border px-4 py-3 active:scale-[0.99] ${selected ? 'border-[#1D1D1B] bg-[#FFF2A8]' : 'border-[#DDD8CC] bg-[#FFFDF8]'}`}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      testID={testID}
    >
      <View className={`h-6 w-6 items-center justify-center rounded-full border ${selected ? 'border-[#1D1D1B] bg-[#1D1D1B]' : 'border-[#BBB6AA]'}`}>
        {selected ? <Check color={colors.paper} size={14} strokeWidth={3} /> : null}
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-base" style={{ color: colors.ink, fontFamily: typefaces.demi }}>{label}</Text>
        {detail ? <Text className="mt-1 text-sm leading-5" style={{ color: colors.muted, fontFamily: typefaces.regular }}>{detail}</Text> : null}
      </View>
    </Pressable>
  );
}

export function ProjectQuestionControl({ question, answer, onAnswerChange, photos, onPhotosChange }: Props) {
  const selected = answer.selectedOptionIds ?? [];

  if (question.type === 'single_choice' || question.type === 'yes_no') {
    return (
      <View testID="single-choice-control">
        {question.options.map((option) => (
          <OptionCard
            detail={option.detail}
            key={option.id}
            label={option.label}
            onPress={() => onAnswerChange({ selectedOptionIds: [option.id] })}
            selected={selected.includes(option.id)}
            testID={`option-${option.id}`}
          />
        ))}
      </View>
    );
  }

  if (question.type === 'multi_choice') {
    return (
      <View testID="multi-choice-control">
        <Text className="mb-3 text-xs" style={{ color: colors.muted, fontFamily: typefaces.medium }}>
          Choose up to {question.maxSelections}
        </Text>
        {question.options.map((option) => (
          <OptionCard
            detail={option.detail}
            key={option.id}
            label={option.label}
            onPress={() => {
              const exists = selected.includes(option.id);
              const next = exists ? selected.filter((id) => id !== option.id) : [...selected, option.id].slice(0, question.maxSelections);
              onAnswerChange({ selectedOptionIds: next });
            }}
            selected={selected.includes(option.id)}
            testID={`option-${option.id}`}
          />
        ))}
      </View>
    );
  }

  if (question.type === 'short_text') {
    return (
      <View className="rounded-[24px] border border-[#DDD8CC] bg-[#FFFDF8] p-4" testID="short-text-control">
        <TextInput
          className="min-h-[118px] text-base leading-6"
          maxLength={1000}
          multiline
          onChangeText={(text) => onAnswerChange({ text })}
          placeholder={question.placeholder ?? 'Add a short answer…'}
          placeholderTextColor="#9B988F"
          style={{ color: colors.ink, fontFamily: typefaces.regular, textAlignVertical: 'top' }}
          testID="question-text-input"
          value={answer.text ?? ''}
        />
      </View>
    );
  }

  if (question.type === 'measurement') {
    const units = question.unitOptions.length ? question.unitOptions : ['cm'];
    return (
      <View testID="measurement-control">
        <View className="min-h-16 flex-row items-center rounded-[22px] border border-[#DDD8CC] bg-[#FFFDF8] px-4">
          <Ruler color={colors.muted} size={22} />
          <TextInput
            className="ml-3 flex-1 py-4 text-2xl"
            keyboardType="decimal-pad"
            onChangeText={(text) => onAnswerChange({ ...answer, value: text.trim() ? Number(text.replace(',', '.')) : undefined })}
            placeholder="0"
            placeholderTextColor="#9B988F"
            style={{ color: colors.ink, fontFamily: typefaces.demi }}
            testID="measurement-value-input"
            value={answer.value === undefined || Number.isNaN(answer.value) ? '' : String(answer.value)}
          />
        </View>
        <ScrollView horizontal contentContainerStyle={{ gap: 8, paddingTop: 12 }} showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          {units.map((unit) => {
            const active = (answer.unit ?? units[0]) === unit;
            return (
              <Pressable
                className={`rounded-full border px-4 py-2.5 ${active ? 'border-[#1D1D1B] bg-[#1D1D1B]' : 'border-[#DDD8CC] bg-[#FFFDF8]'}`}
                key={unit}
                onPress={() => onAnswerChange({ ...answer, unit })}
                testID={`measurement-unit-${unit}`}
              >
                <Text className="text-sm" style={{ color: active ? colors.paper : colors.ink, fontFamily: typefaces.demi }}>{unit}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  if (question.type === 'date_choice') {
    if (question.options.length > 0) {
      return (
        <View testID="date-choice-options-control">
          {question.options.map((option) => (
            <OptionCard
              detail={option.detail}
              key={option.id}
              label={option.label}
              onPress={() => onAnswerChange({ selectedOptionIds: [option.id] })}
              selected={selected.includes(option.id)}
              testID={`date-option-${option.id}`}
            />
          ))}
        </View>
      );
    }

    const date = answer.text ? new Date(answer.text) : new Date();
    const onDateChange = (_event: DateTimePickerEvent, next?: Date) => {
      if (next) onAnswerChange({ text: next.toISOString() });
    };
    return (
      <View className="rounded-[24px] border border-[#DDD8CC] bg-[#FFFDF8] p-4" testID="date-choice-control">
        <View className="mb-3 flex-row items-center"><CalendarDays color={colors.ink} size={20} /><Text className="ml-2 text-sm" style={{ color: colors.muted, fontFamily: typefaces.medium }}>Choose an approximate date</Text></View>
        {Platform.OS === 'web' ? (
          <TextInput
            className="min-h-14 rounded-2xl bg-[#F3F0E8] px-4 text-base"
            onChangeText={(text) => onAnswerChange({ text })}
            placeholder="YYYY-MM-DD"
            style={{ color: colors.ink, fontFamily: typefaces.regular }}
            testID="date-text-input"
            value={answer.text ?? ''}
          />
        ) : (
          <DateTimePicker display="inline" minimumDate={new Date()} mode="date" onChange={onDateChange} testID="date-picker" value={date} />
        )}
      </View>
    );
  }

  const addPickedAssets = (assets: ImagePicker.ImagePickerAsset[]) => {
    const next = assets.map((asset, index) => ({
      id: `${Date.now()}-${index}`,
      uri: asset.uri,
      filename: asset.fileName ?? `rennova-photo-${Date.now()}-${index}.jpg`,
      mimeType: asset.mimeType ?? 'image/jpeg',
    }));
    const merged = [...photos, ...next].slice(0, Math.min(5, question.maxSelections));
    onPhotosChange(merged);
    onAnswerChange({ mediaCount: merged.length });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const pickPhotos = async () => {
    const remaining = Math.max(0, Math.min(5, question.maxSelections) - photos.length);
    if (!remaining) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ['images'],
      quality: 0.82,
      selectionLimit: remaining,
    });
    if (!result.canceled) addPickedAssets(result.assets);
  };

  const takePhoto = async () => {
    if (photos.length >= Math.min(5, question.maxSelections)) return;
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.82 });
    if (!result.canceled) addPickedAssets(result.assets);
  };

  return (
    <View testID="media-upload-control">
      {question.mediaGuidance.length ? (
        <View className="mb-4 rounded-[20px] bg-[#FFF2A8] p-4">
          <View className="mb-2 flex-row items-center"><Camera color={colors.ink} size={18} /><Text className="ml-2 text-sm" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Most useful angles</Text></View>
          {question.mediaGuidance.map((guidance) => <Text className="mt-1 text-sm leading-5" key={guidance} style={{ color: colors.muted, fontFamily: typefaces.regular }}>• {guidance}</Text>)}
        </View>
      ) : null}
      <View className="flex-row flex-wrap gap-3">
        {photos.map((photo, index) => (
          <View className="overflow-hidden rounded-[20px]" key={photo.id}>
            <Image contentFit="cover" source={{ uri: photo.uri }} style={{ height: 108, width: 108 }} />
            <Pressable
              className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-black/65"
              onPress={() => {
                const next = photos.filter((item) => item.id !== photo.id);
                onPhotosChange(next);
                onAnswerChange({ mediaCount: next.length });
              }}
              testID={`remove-photo-${index + 1}`}
            >
              <X color={colors.paper} size={16} />
            </Pressable>
          </View>
        ))}
        {photos.length < Math.min(5, question.maxSelections) ? (
          <Pressable className="h-[108px] w-[108px] items-center justify-center rounded-[20px] border border-dashed border-[#AAA59A] bg-[#FFFDF8] active:bg-[#FFF2A8]" onPress={() => void pickPhotos()} testID="pick-photos-button">
            <ImagePlus color={colors.ink} size={25} />
            <Text className="mt-2 text-xs" style={{ color: colors.ink, fontFamily: typefaces.demi }}>Choose photos</Text>
          </Pressable>
        ) : null}
      </View>
      {photos.length < Math.min(5, question.maxSelections) ? (
        <Pressable className="mt-3 min-h-12 flex-row items-center justify-center rounded-2xl bg-[#1D1D1B] active:opacity-80" onPress={() => void takePhoto()} testID="take-project-photo-button">
          <Camera color={colors.paper} size={18} />
          <Text className="ml-2 text-sm" style={{ color: colors.paper, fontFamily: typefaces.demi }}>Take a photo</Text>
        </Pressable>
      ) : null}
      <Text className="mt-4 text-xs leading-5" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
        {photos.length}/5 selected · Photos are optional. Three to five usually give contractors the clearest view.
      </Text>
    </View>
  );
}
