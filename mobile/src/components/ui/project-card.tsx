import { Image } from 'expo-image';
import { ArrowUpRight, FilePenLine, MapPin } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { StatusPill } from '@/components/ui/status-pill';
import type { Project } from '@/lib/contracts';
import { colors, shadows, typefaces } from '@/lib/design/tokens';

const fallbackImage = 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=80';

export function ProjectCard({ project, onPress }: { project: Project; onPress?: () => void }) {
  const awarded = project.status === 'AWARDED';
  const published = project.status === 'PUBLISHED' || awarded;
  const quoteCount = project._count?.quotes ?? 0;

  return (
    <Pressable
      className="overflow-hidden rounded-[26px] bg-[#FFFDF8] active:scale-[0.99]"
      onPress={onPress}
      style={shadows.soft}
      testID={`project-card-${project.id}`}
    >
      <Image
        contentFit="cover"
        source={{ uri: project.media?.[0]?.url ?? fallbackImage }}
        style={{ height: 154, width: '100%' }}
        transition={250}
      />
      <View className="p-5">
        <View className="flex-row items-center justify-between">
          <StatusPill
            label={awarded ? 'Contractor selected' : published ? 'Live for quotes' : 'Draft'}
            tone={awarded ? 'won' : published ? 'live' : 'neutral'}
          />
          {published ? <ArrowUpRight color={colors.ink} size={20} /> : <FilePenLine color={colors.muted} size={19} />}
        </View>
        <Text className="mt-4 text-xl leading-6 tracking-[-0.3px]" numberOfLines={2} style={{ color: colors.ink, fontFamily: typefaces.demi }}>
          {project.title}
        </Text>
        <View className="mt-3 flex-row items-center">
          <MapPin color={colors.muted} size={15} />
          <Text className="ml-1.5 flex-1 text-sm" numberOfLines={1} style={{ color: colors.muted, fontFamily: typefaces.regular }}>
            {project.locationLabel || project.category}
          </Text>
          {quoteCount > 0 ? (
            <Text className="text-sm" style={{ color: colors.ink, fontFamily: typefaces.demi }}>
              {quoteCount} {quoteCount === 1 ? 'quote' : 'quotes'}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
