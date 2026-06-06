import { apiFetch } from '@/lib/api';
import type { AuthUser } from '@/lib/types';

let cachedUser: AuthUser | null = null;
let pendingMeRequest: Promise<AuthUser> | null = null;

export function setCachedAuthUser(user: AuthUser) {
  cachedUser = user;
}

export function clearCachedAuthUser() {
  cachedUser = null;
  pendingMeRequest = null;
}

export async function getCachedAuthUser() {
  if (cachedUser) return cachedUser;
  if (!pendingMeRequest) {
    pendingMeRequest = apiFetch<AuthUser>('/auth/me/').finally(() => {
      pendingMeRequest = null;
    });
  }
  const user = await pendingMeRequest;
  cachedUser = user;
  return user;
}
