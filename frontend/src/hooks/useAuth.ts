import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { connectSocket } from '@/lib/socket';

export interface UserProfile {
  id: number;
  phone: string;
  email: string | null;
  role: 'user' | 'buyer' | 'seller' | 'admin';
  created_at: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  status?: string;
}

export interface KycStatus {
  status: 'not_submitted' | 'Pending' | 'Approved' | 'Rejected';
  document_type?: string;
  document_url?: string;
  document_file_url?: string;
  rejection_reason?: string | null;
  submitted_at?: string;
  reviewed_at?: string | null;
}

export function useAuth() {
  const token = localStorage.getItem('token');
  
  return useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      const res = await api.get('/user/profile');
      return res.data as UserProfile;
    },
    enabled: !!token,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    queryClient.clear();
    navigate('/');
  };
}

/**
 * Fetch the current user's KYC application status.
 * Used on KYC page to show pending/rejected state.
 */
export function useKycStatus() {
  const token = localStorage.getItem('token');
  return useQuery({
    queryKey: ['kyc', 'status'],
    queryFn: async () => {
      const res = await api.get('/user/kyc/status');
      return res.data as KycStatus;
    },
    enabled: !!token,
    retry: false,
    staleTime: 1000 * 30, // 30 seconds — refresh often so rejection shows quickly
  });
}

/**
 * Submit KYC with optional file upload.
 * Only submits to Pending — no auto-promotion.
 */
export function useSubmitKyc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      document_type: string;
      document_url?: string;
      company_name?: string;
      document_file?: File;
    }) => {
      const formData = new FormData();
      formData.append('document_type', payload.document_type);
      if (payload.document_url) formData.append('document_url', payload.document_url);
      if (payload.company_name) formData.append('company_name', payload.company_name);
      if (payload.document_file) formData.append('document_file', payload.document_file);

      const res = await api.post('/user/kyc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
  });
}

/**
 * Real-time role sync hook.
 * Connect this at app root. Listens for `role_updated` socket events
 * and immediately re-fetches the user profile — no logout required.
 */
export function useRoleSync(onRoleUpdate?: (data: { role: string | null; message: string; kycStatus?: string }) => void) {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;

    const socket = connectSocket();

    const handleRoleUpdate = (data: { role: string | null; message: string; kycStatus?: string }) => {
      // Re-fetch user profile so all role-dependent UI updates immediately
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['kyc', 'status'] });
      if (onRoleUpdate) onRoleUpdate(data);
    };

    socket.on('role_updated', handleRoleUpdate);

    return () => {
      socket.off('role_updated', handleRoleUpdate);
    };
  }, [token, queryClient, onRoleUpdate]);
}
