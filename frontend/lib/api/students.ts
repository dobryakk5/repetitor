import { apiFetch } from '@/lib/api';
import type { DashboardOverview, Student } from '@/lib/types';

export const studentsApi = {
  overview() {
    return apiFetch<DashboardOverview>('/dashboard/overview/');
  },
  list() {
    return apiFetch<Student[]>('/students/');
  },
  get(studentId: number) {
    return apiFetch<Student>(`/students/${studentId}/`);
  },
  create(payload: {
    first_name: string;
    last_name?: string;
    grade?: number | null;
    parent_contact?: string;
    learning_goal?: string;
    start_level?: string;
    comment?: string;
  }) {
    return apiFetch<Student>('/students/', { method: 'POST', body: payload });
  },
  update(studentId: number, payload: Partial<{ first_name: string; last_name: string; grade: number | null; parent_contact: string; learning_goal: string; start_level: string; comment: string; is_active: boolean }>) {
    return apiFetch<Student>(`/students/${studentId}/`, { method: 'PATCH', body: payload });
  },
};
