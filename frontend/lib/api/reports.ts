import { apiFetch } from '@/lib/api';
import type { Report } from '@/lib/types';

export const reportsApi = {
  createLessonReport(lessonId: number) {
    return apiFetch<Report>(`/reports/lessons/${lessonId}/`, { method: 'POST' });
  },
  createPeriodReport(studentId: number, periodFrom: string, periodTo: string) {
    return apiFetch<Report>(`/reports/students/${studentId}/period/`, {
      method: 'POST',
      body: { period_from: periodFrom, period_to: periodTo },
    });
  },
  get(reportId: number) {
    return apiFetch<Report>(`/reports/${reportId}/`);
  },
  listByStudent(studentId: number, reportType?: Report['reportType']) {
    const suffix = reportType ? `?report_type=${reportType}` : '';
    return apiFetch<Report[]>(`/reports/students/${studentId}/${suffix}`);
  },
  update(reportId: number, payload: Partial<{ title: string; content: string }>) {
    return apiFetch<Report>(`/reports/${reportId}/`, { method: 'PATCH', body: payload });
  },
  delete(reportId: number) {
    return apiFetch<{ deleted: boolean; id: number }>(`/reports/${reportId}/`, { method: 'DELETE' });
  },
};
