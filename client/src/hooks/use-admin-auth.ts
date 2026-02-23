import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiRequest } from '@/lib/queryClient';

interface AdminState {
  accessToken: string | null;
  admin: { id: string; email: string; role: string } | null;
  isAuthenticated: boolean;
  setAuth: (token: string, admin: { id: string; email: string; role: string }) => void;
  logout: () => void;
}

export const useAdminAuth = create<AdminState>()(
  persist(
    (set) => ({
      accessToken: null,
      admin: null,
      isAuthenticated: false,
      setAuth: (token, admin) => set({ accessToken: token, admin, isAuthenticated: true }),
      logout: () => {
        set({ accessToken: null, admin: null, isAuthenticated: false });
      },
    }),
    { name: 'admin-auth' }
  )
);

export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = useAdminAuth.getState().accessToken;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers, credentials: 'include' });

  if (res.status === 401) {
    useAdminAuth.getState().logout();
  }

  return res;
}
