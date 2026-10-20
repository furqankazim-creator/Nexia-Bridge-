import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RoleType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { serverConfigured } from '../../api/client';
import { 
  ChevronDown, 
  Globe, 
  Moon, 
  Sun, 
  Wifi, 
  WifiOff, 
  Sparkles, 
  UserCheck, 
  ShieldCheck, 
  Check, 
  Smartphone,
  Bell,
  Settings,
  FileCheck,
  LogOut
} from 'lucide-react';

export const Header: React.FC<{ onOpenAudit?: () => void }> = ({ onOpenAudit }) => {
  const { 
    role, 
    setRole, 
    activeChild, 
    selectedChildId, 
    setSelectedChildId, 
    childrenList,
    language,
    toggleLanguage,
    darkMode,
    toggleDarkMode,
    isOffline,
    toggleOffline,
    syncQueueCount,
    childScheduleMode,
    setChildScheduleMode,
    setIsNotificationsOpen,
    unreadNotificationsCount,
    setIsSettingsOpen,
    isServerMode,
    currentUserName,
    orgName,
    logout
  } = useApp();
  const auth = useAuth();

  const [childDropdownOpen, setChildDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  // Each portal is its own sign-in: nobody hops between portals from inside one. Only a tester who opens the
  // practice version with ?portals=all gets the quick switcher (the guide screenshots rely on it).
  const canSwitch = !isServerMode && new URLSearchParams(window.location.search).has('portals');

  // Role accents defined in design specification
  const roleColors: Record<RoleType, { bg: string; dot: string; labelEn: string; labelAr: string }> = {
    parent: { bg: 'bg-[#FFE4DF]', dot: 'bg-[#FF6B57]', labelEn: 'Parent portal', labelAr: 'بوابة ولي الأمر' },
    behavior: { bg: 'bg-[#E0E7FF]', dot: 'bg-[#4F46E5]', labelEn: 'Behavior therapist', labelAr: 'أخصائي السلوك' },
    speech: { bg: 'bg-[#E0F2FE]', dot: 'bg-[#0EA5E9]', labelEn: 'Speech therapist', labelAr: 'أخصائي النطق والتخاطب' },
    ot: { bg: 'bg-[#FEF3C7]', dot: 'bg-[#F59E0B]', labelEn: 'Occupational therapist', labelAr: 'أخصائي العلاج الوظيفي' },
    remedial: { bg: 'bg-[#EDE9FE]', dot: 'bg-[#7C3AED]', labelEn: 'Remedial teacher', labelAr: 'معلم التربية الخاصة' },
    teacher: { bg: 'bg-[#D1FAE5]', dot: 'bg-[#10B981]', labelEn: 'Teacher', labelAr: 'معلم الفصل' },
    supervisor: { bg: 'bg-[#F1F5F9]', dot: 'bg-[#334155]', labelEn: 'Supervisor', labelAr: 'المشرف الإكلينيكي' },
    admin: { bg: 'bg-[#E2E8F0]', dot: 'bg-[#0F172A]', labelEn: 'Administrator', labelAr: 'مدير النظام' },
  };

  const currentRoleConfig = role ? roleColors[role] : roleColors.parent;

  return (
    <header className="relative shrink-0 z-50 pt-safe bg-white/95 dark:bg-[#1A1733]/95 backdrop-blur-md border-b border-[#E8E2D9] dark:border-[#2D284D] transition-colors">
      {/* Top micro-bar with quick simulator toggles (Language, Dark mode, Offline, Role switcher, Child schedule mode) */}
      <div className="bg-[#F4EEE6] dark:bg-[#14122B] px-3 md:px-6 lg:px-8 py-1.5 flex items-center justify-between text-xs text-[#6B6785] dark:text-[#A5A0C2] border-b border-[#E8E2D9]/60 dark:border-[#2D284D]/60">
        <div className="flex items-center gap-2">
          {/* Desktop Brand Pill */}
          <div className="hidden md:flex items-center gap-2 pe-2 me-1 border-e border-[#E8E2D9] dark:border-[#38325E]">
            <div className="w-6 h-6 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white font-heading font-bold text-xs shadow-xs">
              N
            </div>
            <span className="font-heading font-bold text-xs text-[#1F1B3A] dark:text-white tracking-tight">
              {language === 'ar' ? 'نيكسيا بريدج' : 'Nexia Bridge'}
            </span>
          </div>

          {/* Quick Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => canSwitch && setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-1.5 font-medium px-2 py-0.5 rounded-full bg-white dark:bg-[#201C3D] text-[#1F1B3A] dark:text-white border border-[#E8E2D9] dark:border-[#38325E] shadow-xs hover:border-[#4F46E5] transition"
              title={canSwitch ? 'Switch role' : undefined}
            >
              <span className={`w-2 h-2 rounded-full ${currentRoleConfig.dot}`}></span>
              <span className="truncate max-w-[110px] sm:max-w-none">
                {language === 'ar' ? currentRoleConfig.labelAr : currentRoleConfig.labelEn}
              </span>
              {canSwitch && <ChevronDown className="w-3 h-3 text-[#6B6785]" />}
            </button>

            {roleDropdownOpen && canSwitch && (
              <div className="absolute left-0 mt-1 w-64 bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-xl shadow-warm py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#6B6785] dark:text-[#8E8AAB]">
                  Switch Portal Role
                </div>
                {(Object.keys(roleColors) as RoleType[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left rtl:text-right px-3 py-2 text-xs flex items-center justify-between hover:bg-[#F4EEE6] dark:hover:bg-[#2B264E] transition ${
                      role === r ? 'font-semibold text-[#4F46E5] dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30' : 'text-[#1F1B3A] dark:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${roleColors[r].dot}`}></span>
                      <span>{language === 'ar' ? roleColors[r].labelAr : roleColors[r].labelEn}</span>
                    </div>
                    {role === r && <Check className="w-3.5 h-3.5 text-[#4F46E5]" />}
                  </button>
                ))}
                <div className="border-t border-[#E8E2D9] dark:border-[#38325E] mt-1 pt-1">
                  <button
                    onClick={() => {
                      setRole(null);
                      setRoleDropdownOpen(false);
                    }}
                    className="w-full text-left rtl:text-right px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>Return to Launch Screen</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Child Schedule Mode Quick Button */}
          <button
            onClick={() => setChildScheduleMode(!childScheduleMode)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full border transition text-[11px] font-medium ${
              childScheduleMode 
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300' 
                : 'bg-white dark:bg-[#201C3D] border-[#E8E2D9] dark:border-[#38325E] hover:text-[#4F46E5]'
            }`}
            title="First-Then & Picture Schedule"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span className="hidden sm:inline">Child Mode</span>
          </button>
        </div>

        {/* Right tools: Language toggle, Dark mode, Offline simulation */}
        <div className="flex items-center gap-2">
          {/* Offline indicator */}
          <button
            onClick={toggleOffline}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium transition ${
              isOffline
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
            }`}
            title={isOffline ? 'Offline mode active (Click to go online)' : 'Online and synced (Click to simulate offline)'}
          >
            {isOffline ? <WifiOff className="w-3 h-3 text-amber-600" /> : <Wifi className="w-3 h-3 text-emerald-600" />}
            <span className="hidden sm:inline">{isOffline ? `Offline (${syncQueueCount})` : 'Synced'}</span>
          </button>

          {isServerMode ? (
            <button
              onClick={logout}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-[#201C3D] border border-[#E8E2D9] dark:border-[#38325E] hover:border-rose-400 text-[11px] font-medium transition"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-3 h-3 text-rose-600" />
              <span>Sign out</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setRole(null)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-[#201C3D] border border-[#E8E2D9] dark:border-[#38325E] hover:border-rose-400 text-[11px] font-medium transition"
                title={language === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Back to the welcome page'}
                aria-label={language === 'ar' ? 'خروج' : 'Exit portal'}
              >
                <LogOut className="w-3 h-3 text-rose-600" />
                <span>{language === 'ar' ? 'خروج' : 'Exit'}</span>
              </button>
            {serverConfigured() && (
              <button
                onClick={auth.leaveDemo}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-[#201C3D] border border-[#E8E2D9] dark:border-[#38325E] hover:border-[#4F46E5] text-[11px] font-medium transition"
                title="Sign in to the server"
              >
                <span>Sign in</span>
              </button>
            )}
            </>
          )}

          {/* Language Switch */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-[#201C3D] border border-[#E8E2D9] dark:border-[#38325E] hover:border-[#4F46E5] text-[11px] font-medium transition"
            title="Toggle English / Arabic (RTL)"
          >
            <Globe className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>{language === 'en' ? 'العربية' : 'EN'}</span>
          </button>

          {/* Prompt & PDF compliance audit (moved here from a floating button) */}
          {onOpenAudit && (
            <button
              onClick={onOpenAudit}
              className="p-1 rounded-full bg-white dark:bg-[#201C3D] border border-[#E8E2D9] dark:border-[#38325E] hover:text-indigo-600 transition"
              title="Prompt & PDF Compliance Audit"
              aria-label="Prompt and PDF compliance audit"
            >
              <FileCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            </button>
          )}

          {/* Dark Mode */}
          <button
            onClick={toggleDarkMode}
            className="p-1 rounded-full bg-white dark:bg-[#201C3D] border border-[#E8E2D9] dark:border-[#38325E] hover:text-indigo-600 transition"
            title="Toggle Dark Mode"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-indigo-600" />}
          </button>
        </div>
      </div>

      {/* Main Header bar: mobile width on phones, full width on desktop web */}
      <div className="max-w-md md:max-w-none mx-auto px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Left: User Avatar S, Name, Role badge, and Child Switcher */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#EDE9FE] dark:bg-purple-950/70 text-[#7C3AED] dark:text-purple-300 font-bold text-lg flex items-center justify-center shadow-xs shrink-0 border border-purple-200 dark:border-purple-800">
            {isServerMode ? (currentUserName.trim()[0] ?? '?').toUpperCase() : role === 'parent' ? 'S' : role === 'speech' ? 'س' : role === 'ot' ? 'ر' : role === 'behavior' ? 'ط' : role === 'teacher' ? 'ل' : 'A'}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white leading-tight">
                {currentUserName}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F4EEE6] dark:bg-[#252044] text-[#6B6785] dark:text-gray-300 border border-[#E8E2D9] dark:border-gray-700">
                {role === 'parent' ? 'Mother' : role === 'speech' ? 'SLP' : role === 'ot' ? 'OT' : role === 'behavior' ? 'BCBA' : role === 'teacher' ? 'Teacher' : role === 'admin' ? 'Admin' : role === 'supervisor' ? 'Supervisor' : 'Lead'}
              </span>
            </div>

            {/* Administrators have no child: show the organisation instead */}
            {role === 'admin' && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[#10B981] dark:text-emerald-400 mt-0.5" data-testid="header-org">
                <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                <span className="truncate max-w-[170px] md:max-w-md">{orgName}</span>
              </p>
            )}

            {/* Supervisors work across the whole caseload, so there is no single child to pick */}
            {role === 'supervisor' && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[#10B981] dark:text-emerald-400 mt-0.5" data-testid="header-caseload">
                <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                <span>All children ({childrenList.length})</span>
              </p>
            )}

            {/* Child Indicator with Green Dot & Dropdown */}
            {role !== 'admin' && role !== 'supervisor' && <div className="relative mt-0.5">
              <button
                onClick={() => setChildDropdownOpen(!childDropdownOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#10B981] dark:text-emerald-400 hover:text-emerald-600 transition"
              >
                <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                <span>Child: {activeChild.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#10B981]" />
              </button>

              {childDropdownOpen && (
                <div className="absolute left-0 rtl:left-auto rtl:right-0 mt-2 w-56 bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-2xl shadow-warm py-2 z-50 animate-in fade-in">
                  <div className="px-3 py-1 text-[11px] font-semibold text-[#6B6785] dark:text-[#A5A0C2]">
                    Select Child Record
                  </div>
                  {childrenList.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedChildId(c.id);
                        setChildDropdownOpen(false);
                      }}
                      className={`w-full text-left rtl:text-right px-3 py-2 text-xs flex items-center gap-2 hover:bg-[#F4EEE6] dark:hover:bg-[#2B264E] transition ${
                        selectedChildId === c.id ? 'font-semibold text-[#4F46E5] dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40' : 'text-[#1F1B3A] dark:text-gray-200'
                      }`}
                    >
                      <img src={c.avatar} alt={c.name} className="w-6 h-6 rounded-full object-cover" />
                      <div className="truncate flex-1">
                        <p className="leading-tight">{c.name}</p>
                        <p className="text-[10px] text-[#6B6785] dark:text-gray-400 truncate">{c.diagnosis}</p>
                      </div>
                      {selectedChildId === c.id && <Check className="w-3.5 h-3.5 text-[#4F46E5]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>}
          </div>
        </div>

        {/* Right: Working Bell and Settings Gear matching Screenshot 1 */}
        <div className="flex items-center gap-2">
          {/* Bell Icon */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="relative p-2 rounded-2xl bg-white dark:bg-[#201C3D] border border-[#E8E2D9] dark:border-[#38325E] text-[#1F1B3A] dark:text-white shadow-xs hover:border-[#4F46E5] transition"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-[#1F1B3A] dark:text-white" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF6B57] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Settings Gear Icon (administrators have a Settings tab instead) */}
          {role !== 'admin' && <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-2xl bg-white dark:bg-[#201C3D] border border-[#E8E2D9] dark:border-[#38325E] text-[#1F1B3A] dark:text-white shadow-xs hover:border-[#4F46E5] transition"
            title="Settings & Privacy"
          >
            <Settings className="w-5 h-5 text-[#1F1B3A] dark:text-white" />
          </button>}
        </div>
      </div>
    </header>
  );
};
