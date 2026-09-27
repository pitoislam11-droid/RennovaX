import { router } from 'expo-router';
import { FolderOpen, Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/ui/project-card';
import { EmptyState, ErrorState } from '@/components/ui/state-view';
import { PageTitle } from '@/components/ui/typography';
import { colors, typefaces } from '@/lib/design/tokens';
import { useProjects } from '@/lib/projects/use-projects';

type Filter = 'ALL' | 'DRAFT' | 'PUBLISHED' | 'AWARDED';

export default function ProjectsScreen() {
  const [filter, setFilter] = useState<Filter>('ALL');
  const projectsQuery = useProjects();
  const projects = useMemo(
    () => (projectsQuery.data ?? []).filter((project) => filter === 'ALL' || project.status === filter),
    [filter, projectsQuery.data],
  );

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: colors.canvas }} testID="projects-screen">
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={projectsQuery.isRefetching} onRefresh={() => void projectsQuery.refetch()} tintColor={colors.ink} />}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-end justify-between pt-2">
          <View className="flex-1 pr-4">
            <PageTitle subtitle="Drafts, live briefs and awarded jobs." title="Projects" />
          </View>
          <View className="mb-1 w-14">
            <Button icon={Plus} label="" onPress={() => router.push('/(app)/new-project')} testID="projects-new-button" variant="primary" />
          </View>
        </View>

        <View className="mt-6 flex-row flex-wrap" testID="project-filter-controls">
          {([
            { id: 'ALL' as const, label: 'All' },
            { id: 'DRAFT' as const, label: 'Drafts' },
            { id: 'PUBLISHED' as const, label: 'Published' },
            { id: 'AWARDED' as const, label: 'Awarded' },
          ]).map((item) => {
            const selected = item.id === filter;
            return (
              <Pressable
                className={`mb-2 mr-2 rounded-full px-4 py-2.5 ${selected ? 'bg-[#1D1D1B]' : 'border border-[#DDD8CC] bg-[#FFFDF8]'}`}
                key={item.id}
                onPress={() => setFilter(item.id)}
                testID={`filter-${item.id.toLowerCase()}-button`}
              >
                <Text className="text-[13px]" style={{ color: selected ? colors.paper : colors.muted, fontFamily: typefaces.demi }}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {projectsQuery.isError ? (
          <View className="mt-8"><ErrorState message={projectsQuery.error.message} onRetry={() => void projectsQuery.refetch()} testID="projects-error" /></View>
        ) : null}

        {!projectsQuery.isLoading && !projectsQuery.isError && projects.length === 0 ? (
          <View className="mt-8">
            <EmptyState
              actionLabel={filter === 'ALL' ? 'Start your first project' : undefined}
              body={filter === 'ALL' ? 'Tell us what needs doing and we’ll shape it into a clear brief.' : `You have no ${filter.toLowerCase()} projects right now.`}
              icon={FolderOpen}
              onAction={filter === 'ALL' ? () => router.push('/(app)/new-project') : undefined}
              testID="projects-empty-state"
              title={filter === 'ALL' ? 'A blank page, in a good way' : 'Nothing here yet'}
            />
          </View>
        ) : null}

        <View className="mt-7 gap-5" testID="projects-list">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              onPress={() => router.push({ pathname: '/(app)/project/[id]', params: { id: project.id } })}
              project={project}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
