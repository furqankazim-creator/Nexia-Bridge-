import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { OWN_THREAD } from '../../utils/threads';
import { RoleType } from '../../types';
import { 
  Settings, 
  User, 
  Users,
  Globe, 
  Moon, 
  Sun, 
  Bell, 
  Clock, 
  ShieldCheck, 
  Download, 
  LogOut, 
  X, 
  ChevronRight,
  Smartphone,
  Lock
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const { 
    isSettingsOpen, 
    setIsSettingsOpen, 
    language, 
    toggleLanguage, 
    darkMode, 
    toggleDarkMode, 
    role, 
    setRole, 
    activeChild, 
    setActiveTab,
    setActiveContactId,
    showNotification 
  } = useApp();
  const { user: authUser } = useAuth();
  const isServerMode = !!authUser;
  const AVATAR: Record<string, string> = { speech: 'bg-[#EDE9FE] text-[#7C3AED]', ot: 'bg-[#D1FAE5] text-[#10B981]', behavior: 'bg-[#E0E7FF] text-[#4F46E5]', teacher: 'bg-[#FEF3C7] text-[#F59E0B]', remedial: 'bg-[#EDE9FE] text-[#7C3AED]', supervisor: 'bg-[#F1F5F9] text-[#334155]' };
  const realTeam = activeChild.assignedTeam.map((m) => ({ id: OWN_THREAD[m.role] ?? 'contact-circle', name: m.name, role: m.title || m.role, initial: m.name.trim().charAt(0).toUpperCase(), bg: AVATAR[m.role] ?? AVATAR.supervisor, domains: ({ speech: 'Speech & language', ot: 'Occupational therapy', behavior: 'Behavior support', teacher: 'Classroom', remedial: 'Remedial teaching', supervisor: 'Clinical supervision' } as Record<string, string>)[m.role] ?? m.role }));
  const shownTeamCount = isServerMode ? realTeam.length : 5;

  const [pushEnabled, setPushEnabled] = useState(true);
  const [quietHours, setQuietHours] = useState(true);
  const isAr = language === 'ar';

  if (!isSettingsOpen) return null;

  const handleExportData = () => {
    showNotification(isAr ? 'تم تصدير ملف بيانات الطفل المشفرة بنجاح (JSON/PDF)' : "Exported child's encrypted clinical & school record (Saudi PDPL compliant)");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-3xl max-w-md w-full max-h-[88vh] flex flex-col shadow-float animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8E2D9] dark:border-[#2F2952] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white">
                {isAr ? 'الإعدادات والملف الشخصي' : 'Settings & Preferences'}
              </h3>
              <p className="text-[11px] text-[#6B6785] dark:text-gray-400">
                {isAr ? 'حساب ولي الأمر والتحكم بالخصوصية' : 'Account, notifications and privacy controls'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Dynamic User Profile Card based on Active Portal Role */}
          {(() => {
            const roleProfiles: Record<RoleType, { name: string; title: string; email: string; avatar: string; bg: string; text: string; detail: string }> = {
              parent: { name: 'Sarah Alharbi', title: 'Mother / Primary Guardian', email: 'sarah.alharbi@riyadh.edu.sa', avatar: 'S', bg: 'bg-[#FFE4DF]', text: 'text-[#FF6B57]', detail: `Custody & Legal Consent: ${activeChild.name}` },
              speech: { name: 'Dr. Sarah Alharbi', title: 'Speech-Language Pathologist (SLP)', email: 'dr.sarah.slp@nexiabridge.sa', avatar: 'س', bg: 'bg-[#EDE9FE]', text: 'text-[#7C3AED]', detail: 'Clinical Lic. #SLP-9482 • Pediatric Speech Dept.' },
              ot: { name: 'Reem Al-Ahmad', title: 'Occupational Therapist (OT)', email: 'reem.ot@nexiabridge.sa', avatar: 'ر', bg: 'bg-[#D1FAE5]', text: 'text-[#10B981]', detail: 'Clinical Lic. #OT-3841 • Sensory & ADL Rehabilitation' },
              behavior: { name: 'Dr. Tareq Hassan', title: 'Board Certified Behavior Analyst (BCBA)', email: 'tareq.bcba@nexiabridge.sa', avatar: 'ط', bg: 'bg-[#E0E7FF]', text: 'text-[#4F46E5]', detail: 'Cert. #BACB-1192 • Functional Behavior Clinic' },
              remedial: { name: 'Mr. Omar Khaled', title: 'Remedial & Special Education Specialist', email: 'omar.remedial@nexiabridge.sa', avatar: 'ع', bg: 'bg-[#EDE9FE]', text: 'text-[#7C3AED]', detail: 'Lic. #SE-5541 • Reading & Math Intervention' },
              teacher: { name: 'Ms. Layla Fahad', title: 'Inclusive Classroom Teacher', email: 'layla.teacher@riyadh.edu.sa', avatar: 'ل', bg: 'bg-[#FEF3C7]', text: 'text-[#F59E0B]', detail: 'Grade 1 • Inclusive Elementary School #42' },
              supervisor: { name: 'Dr. Rebecca Hall', title: 'Clinical Director & Supervisor (BCBA-D)', email: 'rebecca.director@nexiabridge.sa', avatar: 'R', bg: 'bg-[#F1F5F9]', text: 'text-[#334155]', detail: 'Multidisciplinary Governance & Mastery Review' },
              admin: { name: 'System Administrator', title: 'Clinic Operations & PDPL Officer', email: 'admin@nexiabridge.sa', avatar: 'A', bg: 'bg-[#E2E8F0]', text: 'text-[#0F172A]', detail: 'Nexia Bridge Healthcare Center • Riyadh HQ' },
            };
            const demoProfile = role ? roleProfiles[role] : roleProfiles.parent;
            // Signed in to the server: show the real person and the details the administrator entered.
            const currentProfile = authUser
              ? {
                  ...demoProfile,
                  name: authUser.name,
                  email: authUser.email,
                  avatar: authUser.name.trim().charAt(0).toUpperCase() || '?',
                  title: authUser.title || demoProfile.title,
                  detail: [authUser.centerName, authUser.phone].filter(Boolean).join(' · ') || (authUser.role === 'parent' ? `Parent of ${activeChild.name}` : 'Nexia Bridge'),
                }
              : demoProfile;

            return (
              <div className="p-4 rounded-2xl bg-[#FAF6F0] dark:bg-[#252044] border border-[#E8E2D9] dark:border-[#38325E] flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full ${currentProfile.bg} ${currentProfile.text} font-bold text-lg flex items-center justify-center shadow-xs shrink-0`}>
                  {currentProfile.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-[#1F1B3A] dark:text-white truncate">
                      {currentProfile.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white dark:bg-[#1F1B3A] text-[#6B6785] dark:text-gray-300 border border-gray-200 dark:border-gray-700 shrink-0">
                      {currentProfile.title.split(' ')[0]}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B6785] dark:text-gray-300 truncate">
                    {currentProfile.email}
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 truncate">
                    ● {currentProfile.detail}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Preferences Group */}
          <div className="space-y-2">
            <h5 className="font-bold uppercase tracking-wider text-[10px] text-[#6B6785] dark:text-gray-400">
              {isAr ? 'التفضيلات العامة' : 'App Preferences'}
            </h5>

            {/* Language */}
            <div className="p-3 rounded-2xl bg-white dark:bg-[#252044] border border-[#E8E2D9] dark:border-[#38325E] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold text-[#1F1B3A] dark:text-white">
                  {isAr ? 'لغة التطبيق' : 'Application Language'}
                </span>
              </div>
              <button
                onClick={toggleLanguage}
                className="px-3 py-1 rounded-xl bg-[#FAF6F0] dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-gray-700 text-xs font-bold text-[#4F46E5]"
              >
                {language === 'en' ? 'العربية (RTL)' : 'English (LTR)'}
              </button>
            </div>

            {/* Theme */}
            <div className="p-3 rounded-2xl bg-white dark:bg-[#252044] border border-[#E8E2D9] dark:border-[#38325E] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {darkMode ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <span className="font-semibold text-[#1F1B3A] dark:text-white">
                  {isAr ? 'المظهر (ليلي / نهاري)' : 'Dark / Light Theme'}
                </span>
              </div>
              <button
                onClick={toggleDarkMode}
                className="px-3 py-1 rounded-xl bg-[#FAF6F0] dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-gray-700 text-xs font-bold"
              >
                {darkMode ? '🌙 Dark Active' : '☀️ Light Active'}
              </button>
            </div>

            {/* Push Notifications Toggle */}
            <div className="p-3 rounded-2xl bg-white dark:bg-[#252044] border border-[#E8E2D9] dark:border-[#38325E] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-[#10B981]" />
                <div>
                  <span className="font-semibold text-[#1F1B3A] dark:text-white block">
                    {isAr ? 'الإشعارات الفورية' : 'Push Notifications'}
                  </span>
                  <span className="text-[10px] text-[#6B6785]">
                    {isAr ? 'تنبيهات عند إتمام الأهداف' : 'Alerts on goal mastery and messages'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPushEnabled(!pushEnabled)}
                className={`w-11 h-6 rounded-full transition p-1 flex items-center ${
                  pushEnabled ? 'bg-[#10B981] justify-end' : 'bg-gray-300 dark:bg-gray-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-xs"></div>
              </button>
            </div>

            {/* Quiet Hours */}
            <div className="p-3 rounded-2xl bg-white dark:bg-[#252044] border border-[#E8E2D9] dark:border-[#38325E] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="font-semibold text-[#1F1B3A] dark:text-white block">
                    {isAr ? 'ساعات الهدوء' : 'Quiet Hours (9 PM - 7 AM)'}
                  </span>
                  <span className="text-[10px] text-[#6B6785]">
                    {isAr ? 'كتم الإشعارات غير الطارئة ليلاً' : 'Mute non-urgent notifications at night'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setQuietHours(!quietHours)}
                className={`w-11 h-6 rounded-full transition p-1 flex items-center ${
                  quietHours ? 'bg-[#4F46E5] justify-end' : 'bg-gray-300 dark:bg-gray-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-xs"></div>
              </button>
            </div>
          </div>

          {/* Care Team Section (Requested by user: "Team are show in settings") */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h5 className="font-bold uppercase tracking-wider text-[10px] text-[#6B6785] dark:text-gray-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span>{isAr ? `فريق رعاية ${activeChild.name} (${shownTeamCount} مختصين)` : `${activeChild.name}'s Care Team (${shownTeamCount} ${shownTeamCount === 1 ? 'Specialist' : 'Specialists'})`}</span>
              </h5>
              {!isServerMode && <button
                onClick={() => showNotification(isAr ? 'تم فتح نموذج دعوة ممارس صحي جديد' : 'Invite new practitioner link generated')}
                className="text-[11px] font-bold text-[#4F46E5] dark:text-indigo-400 hover:underline"
              >
                + {isAr ? 'دعوة مختص' : 'Invite Specialist'}
              </button>}
            </div>

            {isServerMode && realTeam.length === 0 && <p className="text-[11px] text-[#6B6785]">{isAr ? 'لم يُعيَّن مختصون بعد. يضيفهم مدير النظام.' : 'No specialists assigned yet. Your administrator adds them.'}</p>}
            <div className="space-y-2.5">
              {(isServerMode ? realTeam : [
                { id: 'contact-slp', name: 'Dr. Sarah Alharbi (Lead SLP)', role: 'Speech-Language Pathologist', initial: 'س', bg: 'bg-[#EDE9FE] text-[#7C3AED]', domains: 'Speech & Communication, Attention' },
                { id: 'contact-ot', name: 'Reem Al-Ahmad (OT Specialist)', role: 'Occupational Therapist', initial: 'ر', bg: 'bg-[#D1FAE5] text-[#10B981]', domains: 'Fine Motor, Dressing & ADL' },
                { id: 'contact-bcba', name: 'Dr. Tareq Hassan (BCBA)', role: 'Board Certified Behavior Analyst', initial: 'ط', bg: 'bg-[#E0E7FF] text-[#4F46E5]', domains: 'Functional Behavior, Requesting' },
                { id: 'contact-teacher', name: 'Ms. Layla Fahad (Special Educator)', role: 'Inclusive Classroom Teacher', initial: 'ل', bg: 'bg-[#FEF3C7] text-[#F59E0B]', domains: 'Classroom Inclusion, Science' },
                { id: 'contact-circle', name: 'Dr. Rebecca Hall', role: 'Clinical Director & Supervisor', initial: 'R', bg: 'bg-[#F1F5F9] text-[#334155]', domains: 'Mastery Approval & Governance' },
              ]).map((specialist) => (
                <div
                  key={specialist.id}
                  className="p-3.5 rounded-2xl bg-[#FAF6F0] dark:bg-[#252044] border border-[#E8E2D9] dark:border-[#38325E] space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-full ${specialist.bg} font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}>
                        {specialist.initial}
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-xs sm:text-sm text-[#1F1B3A] dark:text-white leading-tight">
                          {specialist.name}
                        </h4>
                        <p className="text-[10px] text-[#6B6785] dark:text-gray-400">
                          {specialist.role}
                        </p>
                      </div>
                    </div>

                    <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#E8E2D9]/70 dark:border-gray-800 text-[10px]">
                    <span className="text-[#6B6785] dark:text-gray-400 truncate max-w-[190px]">
                      {isServerMode ? specialist.domains : `Access: ${specialist.domains}`}
                    </span>
                    <button
                      onClick={() => {
                        setIsSettingsOpen(false);
                        setActiveTab('Messages');
                        setActiveContactId(specialist.id);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-gray-700 text-[#4F46E5] dark:text-indigo-400 font-bold hover:bg-indigo-50"
                    >
                      Message
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy & Compliance Section */}
          <div className="space-y-2 pt-2">
            <h5 className="font-bold uppercase tracking-wider text-[10px] text-[#6B6785] dark:text-gray-400">
              {isAr ? 'الخصوصية والأمان (نظام حماية البيانات السعودي)' : 'Saudi PDPL Privacy & Data'}
            </h5>

            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-bold text-emerald-900 dark:text-emerald-200">
                    PDPL Certified Vault
                  </p>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                    Consent ledger active & immutable
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportData}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1 shadow-xs"
              >
                <Download className="w-3 h-3" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Quick Portal Switcher / Return to Launch */}
          <div className="pt-2 border-t border-[#E8E2D9] dark:border-[#2F2952]">
            <button
              onClick={() => {
                setRole(null);
                setIsSettingsOpen(false);
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              <span>{isAr ? 'الرجوع إلى شاشة البداية' : 'Return to Launch Screen'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#E8E2D9] dark:border-[#2F2952]">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="w-full py-2.5 rounded-xl bg-[#4F46E5] text-white text-xs font-semibold shadow-xs"
          >
            {isAr ? 'تم وحفظ' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
