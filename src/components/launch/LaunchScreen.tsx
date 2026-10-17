import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RoleType } from '../../types';
import { 
  ChevronRight, 
  Sparkles, 
  Heart, 
  Activity, 
  BookOpen, 
  ShieldCheck, 
  Check, 
  ArrowLeft,
  Lock
} from 'lucide-react';

export const LaunchScreen: React.FC = () => {
  const { setRole, language, toggleLanguage, darkMode, toggleDarkMode } = useApp();
  const [subPicker, setSubPicker] = useState<'therapist' | 'teacher' | 'supervisor_admin' | null>(null);

  const isAr = language === 'ar';

  const selectRole = (r: RoleType) => {
    setRole(r);
  };

  return (
    <div className="min-h-full bg-[#FBF7F2] dark:bg-[#14122B] flex flex-col justify-between p-4 sm:p-6 md:p-10 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)] max-w-md md:max-w-5xl w-full mx-auto relative overflow-hidden transition-colors">
      {/* Decorative background warmth */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-200/20 dark:bg-indigo-900/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute bottom-10 left-0 w-72 h-72 bg-[#FFE4DF]/30 dark:bg-rose-900/10 rounded-full blur-3xl pointer-events-none -ml-20"></div>

      {/* Main Top Header and Brand */}
      <div className="pt-2 relative z-10">
        {/* Top bar with quick language and theme switcher */}
        <div className="flex items-center justify-end mb-4 pb-2 border-b border-[#E8E2D9]/70 dark:border-[#38325E]/70">
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleLanguage}
              className="px-2 py-0.5 rounded-full bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] text-xs font-semibold"
            >
              {language === 'en' ? 'العربية' : 'EN'}
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-1 rounded-full bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] text-xs"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Quick 1-Tap Portal Preview Bar */}
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6785] dark:text-[#8E8AAB] mb-1.5">
            Instant Preview Portal:
          </p>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'parent', label: 'Parent', color: 'bg-rose-50 text-rose-700 border-rose-200' },
              { id: 'behavior', label: 'Behavior (ABA)', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
              { id: 'speech', label: 'Speech (SLP)', color: 'bg-sky-50 text-sky-700 border-sky-200' },
              { id: 'ot', label: 'OT', color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { id: 'teacher', label: 'Teacher', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { id: 'supervisor', label: 'Supervisor', color: 'bg-slate-50 text-slate-700 border-slate-200' },
              { id: 'admin', label: 'Admin', color: 'bg-gray-100 text-gray-800 border-gray-300' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => selectRole(p.id as RoleType)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap shadow-xs hover:scale-105 transition ${p.color}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#4F46E5] flex items-center justify-center shadow-warm text-white">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 stroke-current stroke-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 17C6 11 10 8 12 8C14 8 18 11 21 17M12 8V20M6 14C8 12 10 11 12 11C14 11 16 12 18 14" />
            </svg>
          </div>
          <span className="font-heading text-2xl font-bold tracking-tight text-[#1F1B3A] dark:text-white">
            {isAr ? 'نيكسيا بريدج' : 'Nexia Bridge'}
          </span>
        </div>

        {/* Headline & Subline */}
        <h1 className="font-heading text-3xl sm:text-[34px] md:text-4xl font-bold text-[#1F1B3A] dark:text-white leading-[1.2] mb-3">
          {isAr ? (
            <>طفل واحد. فريق واحد.<br /><span className="text-[#4F46E5]">رؤية واحدة مشتركة.</span></>
          ) : (
            <>One child. One team.<br /><span className="text-[#4F46E5]">One shared picture.</span></>
          )}
        </h1>

        <p className="text-base text-[#6B6785] dark:text-[#A5A0C2] leading-relaxed mb-8">
          {isAr
            ? 'التقييم، العلاج التأهيلي، المدرسة وتقدم المنزل، معاً في مكان واحد آمن.'
            : 'Assessment, therapy, school and home progress, together in one place.'}
        </p>

        {/* Role Selection section */}
        {subPicker === null ? (
          <div>
            <p className="text-sm font-semibold text-[#6B6785] dark:text-[#8E8AAB] mb-3">
              {isAr ? 'أنا...' : 'I am a…'}
            </p>

            <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
              {/* Parent or caregiver */}
              <button
                onClick={() => selectRole('parent')}
                className="w-full bg-white dark:bg-[#1F1B3A] border-2 border-[#E8E2D9] dark:border-[#38325E] hover:border-[#FF6B57] dark:hover:border-[#FF6B57] p-4 rounded-2xl flex items-center justify-between text-left rtl:text-right shadow-card hover:shadow-warm transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFE4DF] dark:bg-rose-950/50 flex items-center justify-center text-[#FF6B57]">
                    <Heart className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-[#1F1B3A] dark:text-white group-hover:text-[#FF6B57] transition">
                      {isAr ? 'ولي أمر أو مقدم رعاية' : 'Parent or caregiver'}
                    </h3>
                    <p className="text-xs text-[#6B6785] dark:text-[#8E8AAB]">
                      {isAr ? 'متابعة تقدم طفلك والتطبيق المنزلي' : "View today's progress & home practice"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#6B6785] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
              </button>

              {/* Therapist */}
              <button
                onClick={() => setSubPicker('therapist')}
                className="w-full bg-white dark:bg-[#1F1B3A] border-2 border-[#E8E2D9] dark:border-[#38325E] hover:border-[#4F46E5] dark:hover:border-[#4F46E5] p-4 rounded-2xl flex items-center justify-between text-left rtl:text-right shadow-card hover:shadow-warm transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E0E7FF] dark:bg-indigo-950/50 flex items-center justify-center text-[#4F46E5]">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-[#1F1B3A] dark:text-white group-hover:text-[#4F46E5] transition">
                      {isAr ? 'أخصائي تأهيل' : 'Therapist'}
                    </h3>
                    <p className="text-xs text-[#6B6785] dark:text-[#8E8AAB]">
                      {isAr ? 'سلوك، نطق وتخاطب، أو علاج وظيفي' : 'Behavior (ABA), Speech (SLP), or OT'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#6B6785] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
              </button>

              {/* Teacher */}
              <button
                onClick={() => setSubPicker('teacher')}
                className="w-full bg-white dark:bg-[#1F1B3A] border-2 border-[#E8E2D9] dark:border-[#38325E] hover:border-[#10B981] dark:hover:border-[#10B981] p-4 rounded-2xl flex items-center justify-between text-left rtl:text-right shadow-card hover:shadow-warm transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D1FAE5] dark:bg-emerald-950/50 flex items-center justify-center text-[#10B981]">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-[#1F1B3A] dark:text-white group-hover:text-[#10B981] transition">
                      {isAr ? 'معلم' : 'Teacher'}
                    </h3>
                    <p className="text-xs text-[#6B6785] dark:text-[#8E8AAB]">
                      {isAr ? 'معلم الفصل أو التربية الخاصة' : 'General classroom or Remedial teacher'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#6B6785] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
              </button>

              {/* Supervisor or admin */}
              <button
                onClick={() => setSubPicker('supervisor_admin')}
                className="w-full bg-white dark:bg-[#1F1B3A] border-2 border-[#E8E2D9] dark:border-[#38325E] hover:border-[#334155] dark:hover:border-[#64748B] p-4 rounded-2xl flex items-center justify-between text-left rtl:text-right shadow-card hover:shadow-warm transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] dark:bg-slate-800 flex items-center justify-center text-[#334155] dark:text-slate-300">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-[#1F1B3A] dark:text-white group-hover:text-[#334155] transition">
                      {isAr ? 'مشرف أو مدير' : 'Supervisor or admin'}
                    </h3>
                    <p className="text-xs text-[#6B6785] dark:text-[#8E8AAB]">
                      {isAr ? 'اعتماد الأهداف، متابعة الكادر والامتثال' : 'Clinical review, caseload & org control'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#6B6785] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
              </button>
            </div>
          </div>
        ) : (
          /* Sub-discipline Pickers */
          <div className="animate-in fade-in slide-in-from-right-4">
            <button
              onClick={() => setSubPicker(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4F46E5] mb-4 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{isAr ? 'رجوع للاختيار الرئيسي' : 'Back to role selection'}</span>
            </button>

            {subPicker === 'therapist' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#6B6785] dark:text-[#8E8AAB] mb-2">
                  {isAr ? 'اختر تخصصك العلاجي:' : 'Select your therapy discipline:'}
                </p>
                <button
                  onClick={() => selectRole('behavior')}
                  className="w-full bg-white dark:bg-[#1F1B3A] border-2 border-indigo-200 dark:border-indigo-900/60 p-4 rounded-2xl flex items-center justify-between text-left rtl:text-right shadow-card hover:border-[#4F46E5] transition"
                >
                  <div>
                    <h3 className="font-heading font-semibold text-[#1F1B3A] dark:text-white">
                      {isAr ? 'أخصائي سلوك (ABA)' : 'Behavior Therapist (ABA / BCBA)'}
                    </h3>
                    <p className="text-xs text-[#6B6785] dark:text-[#8E8AAB]">
                      {isAr ? 'بيانات DTT، التلقين، القياس المستمر وABC' : 'DTT, prompt levels, continuous measures & ABC'}
                    </p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-[#4F46E5]"></div>
                </button>

                <button
                  onClick={() => selectRole('speech')}
                  className="w-full bg-white dark:bg-[#1F1B3A] border-2 border-sky-200 dark:border-sky-900/60 p-4 rounded-2xl flex items-center justify-between text-left rtl:text-right shadow-card hover:border-sky-500 transition"
                >
                  <div>
                    <h3 className="font-heading font-semibold text-[#1F1B3A] dark:text-white">
                      {isAr ? 'أخصائي نطق وتخاطب (SLP)' : 'Speech-Language Pathologist (SLP)'}
                    </h3>
                    <p className="text-xs text-[#6B6785] dark:text-[#8E8AAB]">
                      {isAr ? 'أسئلة WH، مهارات AAC، وتوسيع اللغة' : 'WH questions, AAC boards, MLU & vocal accuracy'}
                    </p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-[#0EA5E9]"></div>
                </button>

                <button
                  onClick={() => selectRole('ot')}
                  className="w-full bg-white dark:bg-[#1F1B3A] border-2 border-amber-200 dark:border-amber-900/60 p-4 rounded-2xl flex items-center justify-between text-left rtl:text-right shadow-card hover:border-amber-500 transition"
                >
                  <div>
                    <h3 className="font-heading font-semibold text-[#1F1B3A] dark:text-white">
                      {isAr ? 'أخصائي علاج وظيفي (OT)' : 'Occupational Therapist (OT)'}
                    </h3>
                    <p className="text-xs text-[#6B6785] dark:text-[#8E8AAB]">
                      {isAr ? 'المهارات الدقيقة، ارتداء الملابس والحمية الحسية' : 'Fine motor checklists, dressing & sensory diets'}
                    </p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-[#F59E0B]"></div>
                </button>
              </div>
            )}

            {subPicker === 'teacher' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#6B6785] dark:text-[#8E8AAB] mb-2">
                  {isAr ? 'اختر دورك التعليمي:' : 'Select your teaching role:'}
                </p>
                <button
                  onClick={() => selectRole('teacher')}
                  className="w-full bg-white dark:bg-[#1F1B3A] border-2 border-emerald-200 dark:border-emerald-900/60 p-4 rounded-2xl flex items-center justify-between text-left rtl:text-right shadow-card hover:border-emerald-500 transition"
                >
                  <div>
                    <h3 className="font-heading font-semibold text-[#1F1B3A] dark:text-white">
                      {isAr ? 'معلم الفصل العام' : 'General Classroom Teacher'}
                    </h3>
                    <p className="text-xs text-[#6B6785] dark:text-[#8E8AAB]">
                      {isAr ? 'توثيق الأنشطة الصيفية بـ 4 نقرات سهلة' : 'Quick 4-tap activity recording without jargon'}
                    </p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
                </button>

                <button
                  onClick={() => selectRole('remedial')}
                  className="w-full bg-white dark:bg-[#1F1B3A] border-2 border-purple-200 dark:border-purple-900/60 p-4 rounded-2xl flex items-center justify-between text-left rtl:text-right shadow-card hover:border-purple-500 transition"
                >
                  <div>
                    <h3 className="font-heading font-semibold text-[#1F1B3A] dark:text-white">
                      {isAr ? 'معلم تربية خاصة / معالجة صعوبات' : 'Remedial & Special Ed Specialist'}
                    </h3>
                    <p className="text-xs text-[#6B6785] dark:text-[#8E8AAB]">
                      {isAr ? 'الكلمات بالدقيقة، تدريس صريح وبنك خطط IEP' : 'WCPM reading fluency, explicit instruction & IEP'}
                    </p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-[#7C3AED]"></div>
                </button>
              </div>
            )}

            {subPicker === 'supervisor_admin' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#6B6785] dark:text-[#8E8AAB] mb-2">
                  {isAr ? 'اختر الدور الإداري أو الإشرافي:' : 'Select supervisor or admin:'}
                </p>
                <button
                  onClick={() => selectRole('supervisor')}
                  className="w-full bg-white dark:bg-[#1F1B3A] border-2 border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between text-left rtl:text-right shadow-card hover:border-slate-500 transition"
                >
                  <div>
                    <h3 className="font-heading font-semibold text-[#1F1B3A] dark:text-white">
                      {isAr ? 'المشرف الإكلينيكي' : 'Clinical Supervisor'}
                    </h3>
                    <p className="text-xs text-[#6B6785] dark:text-[#8E8AAB]">
                      {isAr ? 'اعتماد معايير الإتقان، جودة الجلسات وتوافق IOA' : 'Review queue, mastery criteria sign-off & fidelity'}
                    </p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-[#334155]"></div>
                </button>

                <button
                  onClick={() => selectRole('admin')}
                  className="w-full bg-white dark:bg-[#1F1B3A] border-2 border-slate-300 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between text-left rtl:text-right shadow-card hover:border-slate-700 transition"
                >
                  <div>
                    <h3 className="font-heading font-semibold text-[#1F1B3A] dark:text-white">
                      {isAr ? 'مدير المنشأة' : 'Clinic / Organization Admin'}
                    </h3>
                    <p className="text-xs text-[#6B6785] dark:text-[#8E8AAB]">
                      {isAr ? 'إدارة الكادر، مصفوفة الصلاحيات وسجل الامتثال' : 'Staff roles, child assignments & PDPL audit log'}
                    </p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-[#0F172A]"></div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Buttons & Consent Privacy Banner */}
      <div className="pt-6 relative z-10 space-y-4">
        {/* Sign In & Create Account */}
        <div className="space-y-2.5">
          <button
            onClick={() => selectRole('parent')}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-heading font-semibold text-base shadow-warm active:scale-[0.99] transition flex items-center justify-center gap-2"
          >
            <span>{isAr ? 'تسجيل الدخول السريع' : 'Sign in'}</span>
          </button>

          <button
            onClick={() => selectRole('parent')}
            className="w-full py-3.5 px-6 rounded-2xl bg-white dark:bg-[#1F1B3A] border-2 border-[#E8E2D9] dark:border-[#38325E] text-[#1F1B3A] dark:text-white font-heading font-semibold text-base hover:bg-[#F4EEE6] dark:hover:bg-[#252044] transition flex items-center justify-center gap-2"
          >
            <span>{isAr ? 'إنشاء حساب جديد' : 'Create an account'}</span>
          </button>
        </div>

        {/* Client's exact signature footer line */}
        <div className="flex items-center justify-center gap-2 text-center text-xs text-[#6B6785] dark:text-[#8E8AAB] px-4 py-2 bg-[#F4EEE6]/70 dark:bg-[#1D193B]/70 rounded-xl border border-[#E8E2D9]/80 dark:border-[#2D284D]">
          <Lock className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
          <span>
            {isAr
              ? 'أولياء الأمور يحددون أي المختصين يمكنهم رؤية معلومات طفلهم.'
              : "Parents decide which professionals can see their child's information."}
          </span>
        </div>
      </div>
    </div>
  );
};
