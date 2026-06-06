import { apiFetch } from '@/lib/api';
import type { AnalyticsOverview, AnalyticsSummary, MistakeSummary, Recommendation, SkillState } from '@/lib/types';

export const analyticsApi = {
  overview(studentId: number) {
    return apiFetch<AnalyticsOverview>(`/analytics/students/${studentId}/overview/`);
  },
  summary(studentId: number) {
    return apiFetch<AnalyticsSummary>(`/analytics/students/${studentId}/summary/`);
  },
  topics(studentId: number) {
    return apiFetch<SkillState[]>(`/analytics/students/${studentId}/topics/`);
  },
  mistakes(studentId: number) {
    return apiFetch<MistakeSummary[]>(`/analytics/students/${studentId}/mistakes/`);
  },
  recommendations(studentId: number) {
    return apiFetch<Recommendation[]>(`/analytics/students/${studentId}/recommendations/`);
  },
  updateRecommendation(recommendationId: number, payload: Partial<{ is_done: boolean; priority: string; text: string }>) {
    return apiFetch<Recommendation>(`/analytics/recommendations/${recommendationId}/`, { method: 'PATCH', body: payload });
  },
};
