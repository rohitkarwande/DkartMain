import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface HeroBanner {
  id: number;
  title: string;
  subtitle: string;
  badge_text: string;
  image_url: string;
  link_url: string;
  button_text: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// 1. Fetch active banners for homepage carousel
export function useActiveHeroBanners() {
  return useQuery({
    queryKey: ['banners', 'active'],
    queryFn: async () => {
      const res = await api.get('/banners');
      return (res.data?.banners || []) as HeroBanner[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// 2. Fetch all banners for Admin panel
export function useAllHeroBanners() {
  return useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: async () => {
      const res = await api.get('/admin/banners');
      return (res.data?.banners || []) as HeroBanner[];
    },
  });
}

// 3. Create banner mutation
export function useCreateHeroBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/admin/banners', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners', 'active'] });
    },
  });
}

// 4. Update banner mutation
export function useUpdateHeroBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
      const res = await api.put(`/admin/banners/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners', 'active'] });
    },
  });
}

// 5. Delete banner mutation
export function useDeleteHeroBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/banners/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners', 'active'] });
    },
  });
}

// 6. Reorder banners mutation
export function useReorderHeroBanners() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bannerIds: number[]) => {
      const res = await api.post('/admin/banners/reorder', { bannerIds });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners', 'active'] });
    },
  });
}
