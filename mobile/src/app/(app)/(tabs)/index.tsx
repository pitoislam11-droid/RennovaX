import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Bell, Sparkles } from 'lucide-react-native';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/ui/brand';
import { ProjectCard } from '@/components/ui/project-card';
import { ErrorState } from '@/components/ui/state-view';
import { SectionHeading } from '@/components/ui/typography';
import { colors, shadows, typefaces } from '@/lib/design/tokens';
import { useQuietEntrance } from '@/lib/motion';
import { useProfile } from '@/lib/profile';
import { useProjects } from '@/lib/projects/use-projects';

const heroImage =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=88';

const examples = [
  { label: 'Bathroom renovation', draft: 'I want to redo my bathroom' },
  { label: 'Painting', draft: 'I need my flat painted' },
  { label: 'Kitchen', draft: 'I want to renovate my kitchen' },
  { label: 'Roof repair', draft: 'My flat roof is leaking' },
  { label: 'Flooring', draft: 'I need new flooring fitted' },
] as const;

const recentWork = [
  {
    label: 'Bathroom, Fulham',
    image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=700&q=80',
  },
  {
    label: 'Kitchen, Richmond',
    image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=700&q=80',
  },
  {
    label: 'Whole home, Clapham',
    image: 'https://images.unsplash.com/photo-1600607688066-890987f18a86?auto=format&fit=crop&w=700&q=80',
  },
] as const;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function openNewProject(draft?: string) {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  if (draft) {
    router.push({ pathname: '/(app)/new-project', params: { draft } });
    return;
  }
  router.push('/(app)/new-project');
}

export default function HomeScreen() {
  const profileQuery = useProfile();
  const projectsQuery = useProjects();
  const { quiet, enter } = useQuietEntrance();
  const firstName = profileQuery.data?.name?.split(' ')[0] ?? 'there';
  const projects = projectsQuery.data ?? [];

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: colors.canvas }} testID="home-screen">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={profileQuery.isRefetching || projectsQuery.isRefetching}
            onRefresh={() => {
              void profileQuery.refetch();
              void projectsQuery.refetch();
            }}
            tintColor={colors.ink}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
          <BrandMark />
          <Pressable
            accessibilityLabel="Notifications"
            className="h-11 w-11 items-center justify-center rounded-full bg-[#FFFDF8] active:opacity-70"
            onPress={() => router.push('/(app)/notifications')}
            style={shadows.soft}
            testID="notifications-button"
          >
            <Bell color={colors.ink} size={20} />
          </Pressable>
        </View>

        <Animated.View entering={enter(0)} className="px-5 pt-4">
          <Text className="text-[15px]" style={{ color: colors.muted, fontFamily: typefaces.medium }}>
            {greeting()}, {firstName}
          </Text>
          <Text
            className="mt-2 text-[36px] leading-[40px] tracking-[-1.1px]"
            style={{ color: colors.ink, fontFamily: typefaces.demi }}
          >
            What needs doing?
          </Text>
          <Text className="mt-3 max-w-[320px] text-[15px] leading-6" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
            Tell Rennova in your own words. We’ll ask only what contractors need.
          </Text>
        </Animated.View>

        <Animated.View entering={enter(60)} className="mt-7" testID="home-hero">
          <View style={{ height: 320, width: '100%' }}>
            <Image contentFit="cover" source={{ uri: heroImage }} style={{ height: '100%', width: '100%' }} transition={quiet ? 0 : 400} />
            <LinearGradient
              colors={['rgba(20,20,18,0.05)', 'rgba(20,20,18,0.55)', 'rgba(20,20,18,0.92)']}
              locations={[0.15, 0.55, 1]}
              style={{ position: 'absolute', inset: 0 }}
            />
            <View className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-10">
              <View className="mb-3 flex-row items-center">
                <Sparkles color={colors.yellow} size={16} />
                <Text className="ml-2 text-[13px]" style={{ color: colors.paper, fontFamily: typefaces.medium }}>
                  AI-guided · no giant forms
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                className="min-h-[56px] flex-row items-center rounded-[18px] bg-[#FFFDF8] px-5 active:scale-[0.985]"
                onPress={() => openNewProject()}
                style={shadows.floating}
                testID="start-project-button"
              >
                <View className="h-9 w-9 items-center justify-center rounded-[12px] bg-[#FFD21C]">
                  <Sparkles color={colors.ink} size={18} />
                </View>
                <Text className="ml-3 flex-1 text-[16px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>
                  Tell Rennova what you need…
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={enter(100)} className="mt-5 px-5" testID="home-examples">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }} style={{ flexGrow: 0 }}>
            {examples.map((example, index) => (
              <Pressable
                key={example.label}
                accessibilityRole="button"
                className="min-h-11 items-center justify-center rounded-full border border-[#E0DACD] bg-[#FFFDF8] px-4 active:bg-[#FFF2A8]"
                onPress={() => openNewProject(example.draft)}
                testID={`home-example-${index + 1}`}
              >
                <Text className="text-[14px]" style={{ color: colors.ink, fontFamily: typefaces.medium }}>
                  {example.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {projectsQuery.isError ? (
          <View className="mx-5 mt-8">
            <ErrorState message={projectsQuery.error.message} onRetry={() => void projectsQuery.refetch()} testID="home-projects-error" />
          </View>
        ) : null}

        <Animated.View entering={enter(140)} className="mt-10 px-5" testID="home-projects">
          <SectionHeading
            actionLabel={projects.length > 0 ? 'View all' : undefined}
            onAction={projects.length > 0 ? () => router.push('/(app)/(tabs)/projects') : undefined}
            title="Your projects"
          />

          {projects.length === 0 && !projectsQuery.isLoading ? (
            <View className="rounded-[24px] border border-[#E5E0D4] bg-[#FFFDF8] px-5 py-7">
              <Text className="text-[17px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>
                Nothing in progress yet
              </Text>
              <Text className="mt-2 text-[14px] leading-5" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
                Start with a sentence — Rennova shapes the brief contractors quote from.
              </Text>
              <Pressable
                className="mt-5 min-h-12 self-start items-center justify-center rounded-2xl bg-[#FFD21C] px-5 active:opacity-80"
                onPress={() => openNewProject()}
                testID="home-empty-start-button"
              >
                <Text style={{ color: colors.ink, fontFamily: typefaces.demi }}>Start a project</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-4">
              {projects.slice(0, 2).map((project) => (
                <ProjectCard
                  key={project.id}
                  onPress={() => router.push({ pathname: '/(app)/project/[id]', params: { id: project.id } })}
                  project={project}
                />
              ))}
            </View>
          )}
        </Animated.View>

        <Animated.View entering={quiet ? undefined : enter(180)} className="mt-11" testID="home-explore">
          <View className="mb-4 px-5">
            <Text className="text-[26px] tracking-[-0.5px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>
              Recent work nearby
            </Text>
            <Text className="mt-2 text-[14px] leading-5" style={{ color: colors.muted, fontFamily: typefaces.regular }}>
              Portfolio photography from the network — so you can see the quality before you choose.
            </Text>
          </View>
          <ScrollView
            horizontal
            contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
          >
            {recentWork.map((item) => (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                className="overflow-hidden active:opacity-90"
                onPress={() => router.push('/(app)/(tabs)/contractors')}
                style={{ borderRadius: 22, height: 188, width: 148 }}
                testID={`recent-work-${item.label}`}
              >
                <Image contentFit="cover" source={{ uri: item.image }} style={{ height: '100%', width: '100%' }} transition={250} />
                <LinearGradient colors={['transparent', 'rgba(20,20,18,0.78)']} style={{ position: 'absolute', inset: 0 }} />
                <Text className="absolute bottom-4 left-3 right-3 text-[14px]" style={{ color: colors.paper, fontFamily: typefaces.demi }}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
