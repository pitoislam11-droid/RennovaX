import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api/api';
import type { Project } from '@/lib/contracts';
import { queryKeys } from '@/lib/query-keys';

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => api.get<Project[]>('/api/projects'),
  });
}

export function useProject(id: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: queryKeys.project(id),
    queryFn: () => api.get<Project>(`/api/projects/${id}`),
  });
}
