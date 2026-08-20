import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface FeatureFlag {
  key: string;
  is_enabled: boolean;
  name: string;
  description: string;
  updated_at: string;
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const res = await api.get('/feature-flags');
      return res.data as {
        flags: Record<string, boolean>;
        list: FeatureFlag[];
      };
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useFeatureFlag(key: string, defaultValue = true) {
  const { data, isLoading } = useFeatureFlags();
  if (isLoading || !data?.flags) {
    return { isEnabled: defaultValue, isLoading };
  }
  const isEnabled = data.flags[key] !== undefined ? data.flags[key] : defaultValue;
  return { isEnabled, isLoading: false };
}

export function useUpdateFeatureFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, is_enabled }: { key: string; is_enabled: boolean }) => {
      const res = await api.patch(`/admin/feature-flags/${key}`, { is_enabled });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
  });
}
