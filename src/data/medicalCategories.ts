import type { MedicalCategory, MedicalRecord, ShareRole } from '../types';

export interface CategoryDef {
  id: MedicalCategory;
  en: string;
  ar: string;
  hintEn: string;
  hintAr: string;
  color: string; // chip colours (light + dark)
}

export const MEDICAL_CATEGORIES: CategoryDef[] = [
  { id: 'diagnosis', en: 'Diagnosis & assessments', ar: 'التشخيص والتقييمات', hintEn: 'Autism assessment, developmental or psychology reports', hintAr: 'تقييم التوحد وتقارير النمو وعلم النفس', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900' },
  { id: 'doctor', en: 'Doctor visits', ar: 'زيارات الطبيب', hintEn: 'Paediatrician and specialist visit summaries', hintAr: 'ملخصات زيارات طبيب الأطفال والأخصائيين', color: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900' },
  { id: 'neuro', en: 'Neurology & EEG', ar: 'الأعصاب وتخطيط الدماغ', hintEn: 'EEG, MRI brain scans, neurologist reports', hintAr: 'تخطيط الدماغ والرنين وتقارير طبيب الأعصاب', color: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900' },
  { id: 'medication', en: 'Medication', ar: 'الأدوية', hintEn: 'Prescriptions, doses and changes', hintAr: 'الوصفات والجرعات والتغييرات', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900' },
  { id: 'lab', en: 'Lab tests & scans', ar: 'التحاليل والأشعة', hintEn: 'Blood tests, hearing, vision, x-ray', hintAr: 'تحاليل الدم والسمع والبصر والأشعة', color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900' },
  { id: 'therapy', en: 'Past therapy reports', ar: 'تقارير العلاج السابقة', hintEn: 'Reports from earlier speech, OT or behavior centres', hintAr: 'تقارير من مراكز النطق والتأهيل والسلوك السابقة', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900' },
  { id: 'school', en: 'School & IEP', ar: 'المدرسة والخطة الفردية', hintEn: 'School reports and individual education plans', hintAr: 'تقارير المدرسة والخطط التعليمية الفردية', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900' },
  { id: 'vaccine', en: 'Vaccinations', ar: 'التطعيمات', hintEn: 'Vaccination card and records', hintAr: 'بطاقة التطعيمات وسجلاتها', color: 'bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-950/40 dark:text-lime-300 dark:border-lime-900' },
  { id: 'allergy', en: 'Allergies & diet', ar: 'الحساسية والغذاء', hintEn: 'Food or drug allergies, special diets', hintAr: 'حساسية الطعام أو الدواء والأنظمة الغذائية', color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900' },
  { id: 'hospital', en: 'Hospital & emergency', ar: 'المستشفى والطوارئ', hintEn: 'Admissions, discharge notes, emergency visits', hintAr: 'الدخول والخروج وزيارات الطوارئ', color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900' },
  { id: 'insurance', en: 'Insurance & papers', ar: 'التأمين والأوراق', hintEn: 'Insurance, disability card, legal papers', hintAr: 'التأمين وبطاقة الإعاقة والأوراق القانونية', color: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-700' },
  { id: 'other', en: 'Other', ar: 'أخرى', hintEn: 'Anything else worth keeping', hintAr: 'أي شيء آخر يستحق الحفظ', color: 'bg-stone-50 text-stone-700 border-stone-200 dark:bg-stone-900/40 dark:text-stone-300 dark:border-stone-700' },
];

export const categoryOf = (id: string): CategoryDef => MEDICAL_CATEGORIES.find((c) => c.id === id) ?? MEDICAL_CATEGORIES[MEDICAL_CATEGORIES.length - 1];

export const SHARE_ROLE_LIST: { id: ShareRole; en: string; ar: string }[] = [
  { id: 'behavior', en: 'Behavior therapist', ar: 'أخصائي السلوك' },
  { id: 'speech', en: 'Speech therapist', ar: 'أخصائي النطق' },
  { id: 'ot', en: 'Occupational therapist', ar: 'أخصائي العلاج الوظيفي' },
  { id: 'remedial', en: 'Remedial teacher', ar: 'معلم التأهيل' },
  { id: 'teacher', en: 'Classroom teacher', ar: 'معلم الصف' },
  { id: 'supervisor', en: 'Supervisor', ar: 'المشرف' },
];

export const sharingLabel = (s: MedicalRecord['sharing'], isAr: boolean): string => {
  if (s.mode === 'private') return isAr ? 'خاص بي' : 'Only me';
  if (s.mode === 'team') return isAr ? 'كل فريق الطفل' : 'Whole care team';
  return s.roles.map((r) => SHARE_ROLE_LIST.find((x) => x.id === r)).filter(Boolean).map((x) => (isAr ? x!.ar : x!.en)).join(', ');
};

/** Can a person in this role see the record? (The server enforces the same rule.) */
export const canRoleSee = (r: Pick<MedicalRecord, 'sharing'>, role: string | null): boolean => {
  if (role === 'parent') return true;
  if (!role || role === 'admin') return false;
  return r.sharing.mode === 'team' || (r.sharing.mode === 'roles' && r.sharing.roles.includes(role as ShareRole));
};

export const FILE_ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp';
export const MAX_FILE_BYTES_SERVER = 8 * 1024 * 1024;
export const MAX_FILE_BYTES_DEMO = 3 * 1024 * 1024;
export const MAX_FILES_PER_RECORD = 5;

/** A few sample records so the practice version has something to look at. Dates reach back four years. */
export const demoMedicalRecords = (childId: string): MedicalRecord[] => {
  const mk = (id: string, category: MedicalCategory, title: string, date: string, provider: string, notes: string, sharing: MedicalRecord['sharing']): MedicalRecord => ({
    id, childId, category, title, date, provider, notes, files: [], sharing, createdAt: `${date}T09:00:00.000Z`, updatedAt: `${date}T09:00:00.000Z`,
  });
  return [
    mk('med-demo-1', 'diagnosis', 'Autism assessment (ADOS-2)', '2022-11-08', 'Dr. Hanan Al-Rashid, Child Development Clinic', 'First full assessment. Recommended speech therapy, OT and ABA.', { mode: 'team', roles: [] }),
    mk('med-demo-2', 'neuro', 'EEG report', '2023-03-14', 'Dr. Noor Haddad, Neurology', 'Routine EEG. No seizure activity seen.', { mode: 'roles', roles: ['supervisor'] }),
    mk('med-demo-3', 'therapy', 'Speech therapy discharge report', '2023-09-02', 'Bright Words Centre', 'Nine months of therapy. Uses about 40 words. Moved to a new centre.', { mode: 'roles', roles: ['speech', 'supervisor'] }),
    mk('med-demo-4', 'allergy', 'Peanut allergy note', '2024-01-20', 'Dr. Salma Idris, Allergy clinic', 'Mild peanut allergy. Carries an antihistamine. Tell the school.', { mode: 'team', roles: [] }),
    mk('med-demo-5', 'medication', 'Melatonin for sleep', '2025-02-11', 'Dr. Hanan Al-Rashid', '1 mg at bedtime, reviewed every three months.', { mode: 'private', roles: [] }),
    mk('med-demo-6', 'vaccine', 'Vaccination card', '2025-06-30', 'Primary health centre', 'All routine vaccines up to date.', { mode: 'private', roles: [] }),
  ];
};
