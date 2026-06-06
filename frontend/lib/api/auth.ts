import { apiFetch } from '@/lib/api';
import { clearCachedAuthUser, getCachedAuthUser, setCachedAuthUser } from '@/lib/api/auth-cache';
import type { LoginResponse } from '@/lib/types';

export const authApi = {
  async register(payload: { email: string; password: string; fullName?: string }) {
    const result = await apiFetch<LoginResponse>('/auth/register/', {
      method: 'POST',
      body: { email: payload.email, password: payload.password, fullName: payload.fullName ?? '' },
    });
    setCachedAuthUser(result.user);
    return result;
  },
  async login(payload: { email: string; password: string }) {
    const result = await apiFetch<LoginResponse>('/auth/login/', { method: 'POST', body: payload });
    setCachedAuthUser(result.user);
    return result;
  },
  me() {
    return getCachedAuthUser();
  },
  async logout() {
    clearCachedAuthUser();
    await apiFetch<void>('/auth/logout/', { method: 'POST' });
  },
};
