import { apiFetch } from '@/lib/api';
import type { MistakeType, Skill, Subject, Topic } from '@/lib/types';

type SubjectPayload = { name: string; code?: string | null; is_active?: boolean };
type TopicPayload = {
  subject_id: number;
  parent_id?: number | null;
  grade?: number | null;
  name: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
};
type SkillPayload = { topic_id: number; name: string; description?: string; sort_order?: number; is_active?: boolean };
type MistakeTypePayload = { subject_id: number; code?: string | null; name: string; description?: string; is_active?: boolean };

export const schoolApi = {
  subjects() {
    return apiFetch<Subject[]>('/school/subjects/?is_active=true');
  },
  adminSubjects() {
    return apiFetch<Subject[]>('/school/subjects/?limit=500');
  },
  createSubject(payload: SubjectPayload) {
    return apiFetch<Subject>('/school/subjects/', { method: 'POST', body: payload });
  },
  updateSubject(id: number, payload: Partial<SubjectPayload>) {
    return apiFetch<Subject>(`/school/subjects/${id}/`, { method: 'PATCH', body: payload });
  },
  topics(subjectId: number, grade?: number | null) {
    const params = new URLSearchParams({ subject_id: String(subjectId), is_active: 'true' });
    if (grade) params.set('grade', String(grade));
    return apiFetch<Topic[]>(`/school/topics/?${params.toString()}`);
  },
  adminTopics(subjectId?: number | null) {
    const params = new URLSearchParams({ limit: '500' });
    if (subjectId) params.set('subject_id', String(subjectId));
    return apiFetch<Topic[]>(`/school/topics/?${params.toString()}`);
  },
  createTopic(payload: TopicPayload) {
    return apiFetch<Topic>('/school/topics/', { method: 'POST', body: payload });
  },
  updateTopic(id: number, payload: Partial<TopicPayload>) {
    return apiFetch<Topic>(`/school/topics/${id}/`, { method: 'PATCH', body: payload });
  },
  topicTree(subjectId: number, grade?: number | null) {
    const params = new URLSearchParams({ subject_id: String(subjectId), is_active: 'true' });
    if (grade) params.set('grade', String(grade));
    return apiFetch<Topic[]>(`/school/topics/tree/?${params.toString()}`);
  },
  skills(topicId?: number | null) {
    const params = new URLSearchParams({ is_active: 'true' });
    if (topicId) params.set('topic_id', String(topicId));
    return apiFetch<Skill[]>(`/school/skills/?${params.toString()}`);
  },
  adminSkills(topicId?: number | null) {
    const params = new URLSearchParams({ limit: '500' });
    if (topicId) params.set('topic_id', String(topicId));
    return apiFetch<Skill[]>(`/school/skills/?${params.toString()}`);
  },
  createSkill(payload: SkillPayload) {
    return apiFetch<Skill>('/school/skills/', { method: 'POST', body: payload });
  },
  updateSkill(id: number, payload: Partial<SkillPayload>) {
    return apiFetch<Skill>(`/school/skills/${id}/`, { method: 'PATCH', body: payload });
  },
  mistakeTypes(subjectId: number) {
    return apiFetch<MistakeType[]>(`/school/mistake-types/?subject_id=${subjectId}&is_active=true`);
  },
  adminMistakeTypes(subjectId?: number | null) {
    const params = new URLSearchParams({ limit: '500' });
    if (subjectId) params.set('subject_id', String(subjectId));
    return apiFetch<MistakeType[]>(`/school/mistake-types/?${params.toString()}`);
  },
  createMistakeType(payload: MistakeTypePayload) {
    return apiFetch<MistakeType>('/school/mistake-types/', { method: 'POST', body: payload });
  },
  updateMistakeType(id: number, payload: Partial<MistakeTypePayload>) {
    return apiFetch<MistakeType>(`/school/mistake-types/${id}/`, { method: 'PATCH', body: payload });
  },
};
