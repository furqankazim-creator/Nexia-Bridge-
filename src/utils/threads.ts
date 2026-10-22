import type { RoleType } from '../types';

/** The chat thread (contact id) that belongs to each staff role. A parent talks to a therapist through it. */
export const OWN_THREAD: Partial<Record<RoleType, string>> = {
  behavior: 'contact-bcba',
  speech: 'contact-slp',
  ot: 'contact-ot',
  teacher: 'contact-teacher',
  remedial: 'contact-teacher',
  supervisor: 'contact-circle',
};

/** Which staff roles answer in each chat (the parent's contact list is built from the child's real team). */
export const THREAD_ROLES: Record<string, RoleType[]> = {
  'contact-slp': ['speech'],
  'contact-ot': ['ot'],
  'contact-bcba': ['behavior'],
  'contact-teacher': ['teacher', 'remedial'],
  'contact-circle': ['supervisor'],
};

export const ROLE_TITLE: Partial<Record<RoleType, { en: string; ar: string }>> = {
  speech: { en: 'Speech therapist', ar: 'أخصائي النطق' },
  ot: { en: 'Occupational therapist', ar: 'أخصائي العلاج الوظيفي' },
  behavior: { en: 'Behavior therapist', ar: 'أخصائي السلوك' },
  teacher: { en: 'Classroom teacher', ar: 'معلم الصف' },
  remedial: { en: 'Remedial teacher', ar: 'معلم التأهيل' },
  supervisor: { en: 'Clinical supervisor', ar: 'المشرف الإكلينيكي' },
};
