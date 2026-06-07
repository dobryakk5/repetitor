import { apiFetch } from '@/lib/api';
import type { PublicStudentProgress } from '@/lib/types';

export const shareApi = {
  studentProgress(token: string) {
    return apiFetch<PublicStudentProgress>(`/public/student-progress/${encodeURIComponent(token)}/`, { skipAuthRefresh: true });
  },
};
