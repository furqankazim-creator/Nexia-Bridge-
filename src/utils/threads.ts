import type { RoleType } from '../types';

/** The chat thread (contact id) that belongs to each staff role. A parent talks to a therapist through it. */
export const OWN_THREAD: Partial<Record<RoleType, string>> = {
  behavior: 'contact-bcba',
  speech: 'contact-slp',
  ot: 'contact-ot',
  teacher: 'contact-teacher',
  remedial: 'contact-teacher',
  supervisor: 'contact-circle',
  admin: 'contact-circle',
};
