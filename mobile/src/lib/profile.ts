import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api/api';
import type { Profile } from '@/lib/contracts';
import { queryKeys } from '@/lib/query-keys';

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => api.get<Profile>('/api/profile'),
    staleTime: 1000 * 60 * 2,
  });
}
