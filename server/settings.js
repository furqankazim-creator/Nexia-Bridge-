import { z } from 'zod';
import { Setting, User } from './models.js';

/** Organisation-wide settings. Stored as one document; anything missing falls back to these defaults. */
export const DEFAULTS = {
  name: 'Al-Amal Development Center',
  plan: { name: 'Clinic Multidisciplinary Pro', seats: 20, billingCycle: 'annual', billedOn: '2026-10', renewalDate: '2027-10-15', status: 'active' },
  access: { staffSelfRegistration: true, familySignup: true },
  policy: { requireGoalApproval: true, parentMessaging: true, integrityMin: 80, ioaMin: 80, observationDays: 30, stalledDays: 14 },
  staffCode: null, // an override chosen by the administrator; null = the code the server was started with
};

const merge = (a, b) => ({
  ...a, ...b,
  plan: { ...a.plan, ...(b?.plan ?? {}) },
  access: { ...a.access, ...(b?.access ?? {}) },
  policy: { ...a.policy, ...(b?.policy ?? {}) },
});

export async function getSettings() {
  const doc = await Setting.findById('org');
  return merge(DEFAULTS, doc?.data ?? {});
}
export async function saveSettings(next) {
  await Setting.findOneAndUpdate({ _id: 'org' }, { $set: { data: next } }, { upsert: true });
  return next;
}

/** Staff accounts that use a licence seat: clinical and teaching staff that are switched on. */
export const seatsUsed = () => User.countDocuments({ role: { $nin: ['parent', 'admin'] }, disabled: { $ne: true } });

/** The part of the settings every signed-in person may see. */
export const publicOrg = (s) => ({ name: s.name, requireGoalApproval: s.policy.requireGoalApproval, parentMessaging: s.policy.parentMessaging, integrityMin: s.policy.integrityMin, ioaMin: s.policy.ioaMin, observationDays: s.policy.observationDays, stalledDays: s.policy.stalledDays });

export const settingsPatch = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  plan: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    seats: z.number().int().min(1).max(10000).optional(),
    billingCycle: z.enum(['monthly', 'annual']).optional(),
    billedOn: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    renewalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }).optional(),
  access: z.object({ staffSelfRegistration: z.boolean().optional(), familySignup: z.boolean().optional() }).optional(),
  policy: z.object({
    requireGoalApproval: z.boolean().optional(),
    parentMessaging: z.boolean().optional(),
    integrityMin: z.number().int().min(0).max(100).optional(),
    ioaMin: z.number().int().min(0).max(100).optional(),
    observationDays: z.number().int().min(1).max(365).optional(),
    stalledDays: z.number().int().min(1).max(365).optional(),
  }).optional(),
});
