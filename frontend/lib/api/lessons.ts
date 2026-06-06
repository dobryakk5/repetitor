import { apiFetch } from '@/lib/api';
import type { Homework, Lesson, LessonFullCreatePayload } from '@/lib/types';

export const lessonsApi = {
  list(studentId?: number) {
    const suffix = studentId ? `?student_id=${studentId}` : '';
    return apiFetch<Lesson[]>(`/lessons/${suffix}`);
  },
  get(lessonId: number) {
    return apiFetch<Lesson>(`/lessons/${lessonId}/`);
  },
  createFull(payload: LessonFullCreatePayload) {
    return apiFetch<Lesson>('/lessons/full/', { method: 'POST', body: payload });
  },
  homeworks(studentId?: number) {
    const suffix = studentId ? `?student_id=${studentId}` : '';
    return apiFetch<Homework[]>(`/homeworks/${suffix}`);
  },
  updateHomework(homeworkId: number, payload: Partial<{ status: string; completion_percent: number | null; accuracy_percent: number | null; teacher_comment: string }>) {
    return apiFetch<Homework>(`/homeworks/${homeworkId}/`, { method: 'PATCH', body: payload });
  },
};
