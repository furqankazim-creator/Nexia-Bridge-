import React from 'react';
import { useApp } from '../../context/AppContext';
import { useUnreadForRole } from './FamilyPanel';
import { 
  Home, Building2, CreditCard,
  TrendingUp, 
  MessageSquare, 
  Users, 
  Calendar, 
  Target as TargetIcon, 
  BarChart2, 
  FileText, 
  CheckSquare, 
  GraduationCap, 
  ClipboardCheck, 
  Settings, 
  FolderKanban,
  Mic
} from 'lucide-react';

export const BottomTabBar: React.FC = () => {
  const { role, activeTab, setActiveTab, language, targets, savedSessions, childrenList, teamRequests } = useApp();
  const unread = useUnreadForRole();

  if (!role) return null;

  interface TabDef {
    id: string;
    labelEn: string;
    labelAr: string;
    icon: React.ComponentType<{ className?: string }>;
  }

  // Counters on the tab icons: what is waiting for this person.
  const kidSet = new Set(childrenList.map((c) => c.id));
  const waitingReview = targets.filter((t) => kidSet.has(t.childId) && t.approvalStatus === 'awaiting_approval').length + savedSessions.filter((s) => kidSet.has(s.childId) && !s.review).length;
  const openRequests = teamRequests.filter((r) => r.status === 'open').length;
  const badgeFor = (id: string): number => {
    if (role === 'supervisor' && id === 'Review') return waitingReview;
    if (role === 'admin' && id === 'Home') return openRequests;
    return 0;
  };

  const isClinicalTherapyRole = ['speech', 'behavior', 'ot', 'remedial'].includes(role);

  const getTabsForRole = (): TabDef[] => {
    switch (role) {
      case 'parent':
        return [
          { id: 'Home', labelEn: 'Home', labelAr: 'الرئيسية', icon: Home },
          { id: 'Progress', labelEn: 'Progress', labelAr: 'التقدم', icon: BarChart2 },
          { id: 'Targets', labelEn: 'Targets', labelAr: 'الأهداف', icon: TargetIcon },
          { id: 'Sessions', labelEn: 'Sessions', labelAr: 'الجلسات', icon: Calendar },
          { id: 'Messages', labelEn: 'Messages', labelAr: 'الرسائل', icon: MessageSquare },
        ];
      case 'behavior':
        return [
          { id: 'Today', labelEn: 'Today', labelAr: 'اليوم', icon: Calendar },
          { id: 'Targets', labelEn: 'Targets', labelAr: 'الأهداف', icon: TargetIcon },
          { id: 'Graphs', labelEn: 'Graphs', labelAr: 'الرسوم', icon: BarChart2 },
          { id: 'BIP', labelEn: 'BIP', labelAr: 'خطة السلوك', icon: ClipboardCheck },
          { id: 'Notes', labelEn: 'Notes', labelAr: 'الملاحظات', icon: FileText },
          { id: 'Family', labelEn: 'Family', labelAr: 'الأسرة', icon: Users },
        ];
      case 'speech':
        return [
          { id: 'Today', labelEn: 'Today', labelAr: 'اليوم', icon: Calendar },
          { id: 'Targets', labelEn: 'Goals', labelAr: 'الأهداف', icon: TargetIcon },
          { id: 'Practice', labelEn: 'Practice', labelAr: 'التدريب', icon: Mic },
          { id: 'Graphs', labelEn: 'Graphs', labelAr: 'الرسوم', icon: BarChart2 },
          { id: 'Notes', labelEn: 'Notes', labelAr: 'الملاحظات', icon: FileText },
          { id: 'Family', labelEn: 'Family', labelAr: 'الأسرة', icon: Users },
        ];
      case 'ot':
        return [
          { id: 'Today', labelEn: 'Today', labelAr: 'اليوم', icon: Calendar },
          { id: 'Checklists', labelEn: 'Checklists', labelAr: 'القوائم', icon: CheckSquare },
          { id: 'Targets', labelEn: 'Goals', labelAr: 'الأهداف', icon: TargetIcon },
          { id: 'Graphs', labelEn: 'Graphs', labelAr: 'الرسوم', icon: BarChart2 },
          { id: 'Notes', labelEn: 'Notes', labelAr: 'الملاحظات', icon: FileText },
          { id: 'Family', labelEn: 'Family', labelAr: 'الأسرة', icon: Users },
        ];
      case 'remedial':
        return [
          { id: 'Today', labelEn: 'Today', labelAr: 'اليوم', icon: Calendar },
          { id: 'Targets', labelEn: 'Goals', labelAr: 'الأهداف', icon: TargetIcon },
          { id: 'Graphs', labelEn: 'Graphs', labelAr: 'الرسوم', icon: BarChart2 },
          { id: 'Notes', labelEn: 'Notes', labelAr: 'الملاحظات', icon: FileText },
          { id: 'Family', labelEn: 'Family', labelAr: 'الأسرة', icon: Users },
        ];
      case 'teacher':
        return [
          { id: 'Today', labelEn: 'Today', labelAr: 'اليوم', icon: Calendar },
          { id: 'Students', labelEn: 'Students', labelAr: 'الطلاب', icon: GraduationCap },
          { id: 'Notes', labelEn: 'Notes', labelAr: 'الملاحظات', icon: FileText },
          { id: 'Family', labelEn: 'Family', labelAr: 'الأسرة', icon: Users },
        ];
      case 'supervisor':
        return [
          { id: 'Review', labelEn: 'Review', labelAr: 'المراجعة', icon: ClipboardCheck },
          { id: 'Children', labelEn: 'Children', labelAr: 'الأطفال', icon: Users },
          { id: 'Staff', labelEn: 'Staff', labelAr: 'الكادر', icon: FolderKanban },
          { id: 'Reports', labelEn: 'Reports', labelAr: 'التقارير', icon: BarChart2 },
          { id: 'Templates', labelEn: 'Templates', labelAr: 'القوالب', icon: FileText },
        ];
      case 'admin':
        return [
          { id: 'Home', labelEn: 'Home', labelAr: 'الرئيسية', icon: Home },
          { id: 'Portals', labelEn: 'Portals', labelAr: 'البوابات', icon: FolderKanban },
          { id: 'Centers', labelEn: 'Centers', labelAr: 'المراكز', icon: Building2 },
          { id: 'Billing', labelEn: 'Billing', labelAr: 'الفوترة', icon: CreditCard },
          { id: 'Settings', labelEn: 'Settings', labelAr: 'الإعدادات', icon: Settings },
        ];
    }
  };

  const tabs = getTabsForRole();

  if (isClinicalTherapyRole) {
    // Mobile: Clean flat white bottom bar | Desktop (md+): Left vertical navigation rail
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 pb-safe bg-white/95 dark:bg-[#1A1733]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#2D284D] md:static md:w-60 lg:w-64 md:shrink-0 md:border-t-0 md:border-e md:pb-0 md:flex md:flex-col">
        <div className="max-w-md mx-auto md:max-w-none md:mx-0 md:w-full md:p-4">
          <p className="hidden md:block px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#6B6785] dark:text-[#8E8AAB]">
            {language === 'ar' ? 'القائمة الإكلينيكية' : 'Clinical Workspace'}
          </p>
          <nav 
            aria-label="Clinical Navigation" 
            className="py-2.5 px-4 flex items-center justify-around md:flex-col md:items-stretch md:justify-start md:p-0 md:gap-1"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab.toLowerCase() === tab.id.toLowerCase();

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 min-w-0 flex flex-col items-center justify-center transition-colors md:flex-none md:flex-row md:justify-start md:gap-3 md:px-3.5 md:py-2.5 md:rounded-xl ${
                    isActive
                      ? 'text-[#4338CA] dark:text-indigo-400 font-bold md:bg-indigo-50 dark:md:bg-indigo-950/50'
                      : 'text-[#6B7280] dark:text-[#A5A0C2] hover:text-[#1F1B3A] dark:hover:text-white md:hover:bg-[#F4EEE6]/60 dark:md:hover:bg-[#252044] font-medium'
                  }`}
                >
                  <span className="relative">
                    <Icon className="w-5 h-5 mb-1 md:mb-0" />
                    {badgeFor(tab.id) > 0 && (
                      <span className="absolute -top-1.5 -end-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center" data-testid={`badge-${tab.id}`} aria-label={`${badgeFor(tab.id)} waiting`}>{badgeFor(tab.id)}</span>
                    )}
                    {unread > 0 && tab.id === 'Family' && (
                      <span className="absolute -top-1.5 -end-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center" aria-label={`${unread} unread`}>{unread}</span>
                    )}
                  </span>
                  <span className="text-[11px] md:text-sm leading-none">
                    {language === 'ar' ? tab.labelAr : tab.labelEn}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    );
  }

  // Mobile: Standard rounded pill bottom bar | Desktop (md+): Left vertical navigation sidebar
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pb-safe pointer-events-none md:static md:w-60 lg:w-64 md:shrink-0 md:pb-0 md:pointer-events-auto md:bg-white/95 dark:md:bg-[#1A1733]/95 md:border-e md:border-[#E8E2D9] dark:md:border-[#2D284D] md:flex md:flex-col">
      <div className="max-w-md mx-auto px-4 pb-3 md:max-w-none md:mx-0 md:w-full md:p-4">
        <p className="hidden md:block px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#6B6785] dark:text-[#8E8AAB]">
          {language === 'ar' ? 'التنقل الرئيسي' : 'Navigation'}
        </p>
        <nav 
          aria-label="Bottom Navigation" 
          className="pointer-events-auto bg-white/95 dark:bg-[#1F1B3A]/95 backdrop-blur-md border border-[#E8E2D9] dark:border-[#38325E] rounded-[24px] shadow-warm py-2 px-3 flex items-center justify-around transition-all md:bg-transparent dark:md:bg-transparent md:border-0 md:shadow-none md:rounded-none md:p-0 md:flex-col md:items-stretch md:justify-start md:gap-1.5"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab.toLowerCase() === tab.id.toLowerCase();

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 min-w-[56px] md:flex-row md:justify-start md:px-3.5 md:py-2.5 md:rounded-xl ${
                  isActive
                    ? 'text-white'
                    : 'text-[#6B6785] dark:text-[#A5A0C2] hover:text-[#1F1B3A] dark:hover:text-white md:hover:bg-[#FAF6F0] dark:md:hover:bg-[#252044]'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 bg-[#4F46E5] rounded-xl shadow-xs transition-all duration-200" />
                )}

                <span className="relative z-10 flex flex-col items-center md:flex-row md:gap-3 md:w-full">
                  <span className="relative">
                    <Icon className="w-5 h-5 mb-0.5 md:mb-0" />
                    {badgeFor(tab.id) > 0 && <span className="absolute -top-1.5 -end-2.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center md:hidden" data-testid={`badge-${tab.id}`} aria-label={`${badgeFor(tab.id)} waiting`}>{badgeFor(tab.id)}</span>}
                  </span>
                  <span className="text-[11px] md:text-sm font-medium leading-none flex-1 md:text-start">
                    {language === 'ar' ? tab.labelAr : tab.labelEn}
                  </span>
                  {badgeFor(tab.id) > 0 && (
                    <span className="hidden md:inline-flex min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-bold items-center justify-center">
                      {badgeFor(tab.id)}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
