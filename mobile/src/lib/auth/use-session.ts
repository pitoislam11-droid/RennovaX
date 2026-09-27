import { useQuery, useQueryClient } from '@tanstack/react-query';

import { authClient } from './auth-client';

export const SESSION_QUERY_KEY = ['auth-session'] as const;

export function useSession() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => {
      const result = await authClient.getSession();
      if (result.error) throw new Error(result.error.message);
      return result.data ?? null;
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useInvalidateSession() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
}
