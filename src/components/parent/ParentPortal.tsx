import { HomeTasksCard } from './HomeTasksCard';
import { MedicalRecordsPanel } from '../medical/MedicalRecords';
import { BehaviorPlanCard } from './BehaviorPlanCard';
import { VoiceTipsCard } from './VoiceTipsCard';
import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Avatar, ChatComposer, ChatHeader, ChatListRow, ChatThread, messagePreview } from '../common/chat/WhatsAppChat';
import { StatusChipType, ChatContact, Target } from '../../types';
import { 
  ShieldCheck, 
  Play, 
  CheckCircle2, 
  Sparkles, 
  Lock, 
  MessageSquare, 
  Video, 
  Calendar, 
  TrendingUp, 
  Download, 
  Star, 
  AlertCircle, 
  X, 
  Send, 
  Volume2, 
  Clock, 
  Camera, 
  ArrowRight,
  ArrowLeft,
  Search,
  Filter,
  Edit,
  Users,
  Target as TargetIcon,
  Check,
  ChevronRight,
  Lightbulb,
  Hand,
  BarChart2,
  FileText,
  MapPin,
  Plus,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Info,
  Award,
  Activity,
  HelpCircle,
  Layers,
  Sliders,
  RefreshCw
} from 'lucide-react';

export const ParentPortal: React.FC = () => {
  const { 
    activeChild, 
    activeTab, 
    setActiveTab, 
    language, 
    consentGrants, 
    updateConsentGrant,
    targets,
    addSessionResult,
    contacts,
    activeContactId,
    setActiveContactId,
    sendContactMessage,
    markContactRead,
    triggerConfetti,
    showNotification
  } = useApp();

  const isAr = language === 'ar';

  useEffect(() => {
    if (activeContactId) markContactRead(activeContactId);
  }, [activeContactId, contacts]);

  // Modals state
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showWeDidItModal, setShowWeDidItModal] = useState(false);
  const [showHardDayModal, setShowHardDayModal] = useState(false);

  // Home practice check-in state
  const [practiceRating, setPracticeRating] = useState(5);
  const [practiceNotes, setPracticeNotes] = useState('');
  const [completedPracticeToday, setCompletedPracticeToday] = useState(false);

  // Messages state
  const [searchQuery, setSearchQuery] = useState('');
  const [chatCategoryFilter, setChatCategoryFilter] = useState<'all' | 'therapists' | 'school' | 'unread'>('all');
  const [chatInputText, setChatInputText] = useState('');

  // Sessions state (Improved pediatric appointments suite)
  const [sessionSubTab, setSessionSubTab] = useState<'upcoming' | 'completed' | 'calendar'>('upcoming');
  const [selectedWeekDay, setSelectedWeekDay] = useState<string>('Wed 14');
  const [showBookSessionModal, setShowBookSessionModal] = useState<boolean>(false);
  const [showTelehealthModal, setShowTelehealthModal] = useState<boolean>(false);
  const [telehealthSpecialist, setTelehealthSpecialist] = useState<string>('Reem Al-Ahmad (OT Specialist)');
  const [telehealthMuted, setTelehealthMuted] = useState<boolean>(false);
  const [telehealthVideoOff, setTelehealthVideoOff] = useState<boolean>(false);

  // Booking form state
  const [bookSpecialist, setBookSpecialist] = useState<string>('Dr. Sarah Alharbi (Lead SLP)');
  const [bookDate, setBookDate] = useState<string>('2026-10-16');
  const [bookTime, setBookTime] = useState<string>('11:00 AM');
  const [bookType, setBookType] = useState<string>('Clinic Session (Room 204)');
  const [bookNotes, setBookNotes] = useState<string>('');

  // Hard day flag state
  const [hardDayNotes, setHardDayNotes] = useState('');

  // Targets & Progress Deep-Dive state
  const [selectedTargetForDetail, setSelectedTargetForDetail] = useState<Target | null>(null);
  const [selectedDomainForDetail, setSelectedDomainForDetail] = useState<string | null>(null);
  const [showWorkflowExplainer, setShowWorkflowExplainer] = useState<boolean>(false);
  const [targetFilterStatus, setTargetFilterStatus] = useState<'all' | 'teaching' | 'mastered' | 'review'>('all');
  const [targetFilterDiscipline, setTargetFilterDiscipline] = useState<string>('all');
  const [targetSearchQuery, setTargetSearchQuery] = useState<string>('');
  const [showAddTargetHomePractice, setShowAddTargetHomePractice] = useState<boolean>(false);
  const [parentQuickPracticeScore, setParentQuickPracticeScore] = useState<number>(85);
  const [parentQuickPracticeNote, setParentQuickPracticeNote] = useState<string>('');

  const handleCompletePractice = () => {
    setCompletedPracticeToday(true);
    setShowWeDidItModal(false);
    triggerConfetti();
    showNotification(isAr ? 'تم تسجيل التطبيق المنزلي بنجاح! أحسنتم!' : 'Home practice completed! Wonderful teamwork!');
  };

  const handleSendHardDay = () => {
    setShowHardDayModal(false);
    showNotification(isAr ? 'تم إرسال إشعار الدعم إلى الفريق العلاجي' : 'Team alerted: Compassionate support mode initiated');
    setHardDayNotes('');
  };

  const activeContact = contacts.find(c => c.id === activeContactId);

  // Filter contacts matching Screenshot 3
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          contact.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          contact.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (chatCategoryFilter === 'therapists') return contact.category === 'therapists';
    if (chatCategoryFilter === 'school') return contact.category === 'school';
    if (chatCategoryFilter === 'unread') return (contact.unreadCount || 0) > 0;
    return true;
  });

  /* ---------------------------------------------------- */
  /* TAB 1: HOME (Exact match to Screenshot 1)           */
  /* ---------------------------------------------------- */
  /* ---------------------------------------------------- */
  /* TAB 1: HOME (Fully Connected Quick Actions & This Week) */
  /* ---------------------------------------------------- */
  const renderHomeTab = () => (
    <div className="space-y-6 pb-28 animate-in fade-in">
      {/* 1. Top Skills Progress Status Chips - Clickable to Developmental Targets */}
      <div className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[24px] shadow-card divide-y divide-[#E8E2D9]/60 dark:divide-[#2F2952] overflow-hidden">
        {/* Fine motor -> Links to OT target */}
        <button
          onClick={() => {
            setActiveTab('Targets');
            setTargetFilterDiscipline('ot');
          }}
          className="w-full p-4 flex items-center justify-between hover:bg-[#FAF6F0] dark:hover:bg-[#252044] transition text-left rtl:text-right group cursor-pointer"
          title="Inspect Fine Motor target in Targets tab"
        >
          <div className="flex items-center gap-2.5">
            <span className="font-heading font-semibold text-base text-[#1F1B3A] dark:text-white group-hover:text-[#4F46E5] dark:group-hover:text-indigo-300 transition">
              Fine motor
            </span>
            <span className="text-[10px] text-[#6B6785] dark:text-gray-400 hidden sm:inline">• Buttoning & tripod grasp</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF1CC] text-[#B7791F] dark:bg-amber-950 dark:text-amber-300">
              Developing
            </span>
            <ChevronRight className="w-4 h-4 text-[#6B6785] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
          </div>
        </button>

        {/* Independent dressing -> Links to OT / ADL target */}
        <button
          onClick={() => {
            setActiveTab('Targets');
            setTargetFilterDiscipline('ot');
          }}
          className="w-full p-4 flex items-center justify-between hover:bg-[#FAF6F0] dark:hover:bg-[#252044] transition text-left rtl:text-right group cursor-pointer"
          title="Inspect Independent Dressing target in Targets tab"
        >
          <div className="flex items-center gap-2.5">
            <span className="font-heading font-semibold text-base text-[#1F1B3A] dark:text-white group-hover:text-[#4F46E5] dark:group-hover:text-indigo-300 transition">
              Independent dressing
            </span>
            <span className="text-[10px] text-[#6B6785] dark:text-gray-400 hidden sm:inline">• Daily living ADL</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF1CC] text-[#B7791F] dark:bg-amber-950 dark:text-amber-300">
              Developing
            </span>
            <ChevronRight className="w-4 h-4 text-[#6B6785] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
          </div>
        </button>

        {/* Attention -> Links to Classroom / Attention target */}
        <button
          onClick={() => {
            setActiveTab('Targets');
            setTargetFilterDiscipline('teacher');
          }}
          className="w-full p-4 flex items-center justify-between hover:bg-[#FAF6F0] dark:hover:bg-[#252044] transition text-left rtl:text-right group cursor-pointer"
          title="Inspect Attention & Circle Time target in Targets tab"
        >
          <div className="flex items-center gap-2.5">
            <span className="font-heading font-semibold text-base text-[#1F1B3A] dark:text-white group-hover:text-[#4F46E5] dark:group-hover:text-indigo-300 transition">
              Attention
            </span>
            <span className="text-[10px] text-[#6B6785] dark:text-gray-400 hidden sm:inline">• Circle time peer focus</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#DDF5EA] text-[#1B9E6B] dark:bg-emerald-950 dark:text-emerald-300">
              Improving
            </span>
            <ChevronRight className="w-4 h-4 text-[#6B6785] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
          </div>
        </button>
      </div>

      {/* 2. Recent updates Section - Clickable directly to Target Detail */}
      <div>
        <h2 className="font-heading text-2xl font-bold text-[#1F1B3A] dark:text-white mb-3">
          {isAr ? 'آخر التحديثات' : 'Recent updates'}
        </h2>

        {/* Goal ready for review card - Connected to target detail inspector */}
        <div
          onClick={() => {
            const reqTarget = targets.find(t => t.id === 'target-lama-2');
            if (reqTarget) {
              setSelectedTargetForDetail(reqTarget);
            } else {
              setActiveTab('Targets');
              setTargetFilterStatus('review');
            }
          }}
          className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[24px] p-5 shadow-card flex items-start gap-4 hover:border-[#4F46E5] dark:hover:border-indigo-500 cursor-pointer transition group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#FFF8E7] dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0 text-amber-500 shadow-xs group-hover:scale-105 transition">
            <Sparkles className="w-6 h-6 fill-current" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white group-hover:text-[#4F46E5] dark:group-hover:text-indigo-300 transition">
                Goal ready for review
              </h3>
              <span className="text-xs text-[#6B6785] dark:text-gray-400">
                2h ago
              </span>
            </div>
            <p className="text-sm text-[#6B6785] dark:text-gray-300 leading-relaxed mb-3">
              Lama Alharbi met the mastery criterion for requesting help across 3 sessions (90%, 90%, 95%).
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
              <span className="inline-block px-3 py-1 rounded-xl text-xs font-bold bg-[#FFF1CC] text-[#B7791F] dark:bg-amber-950 dark:text-amber-300">
                Pending review
              </span>
              <span className="text-xs font-bold text-[#4F46E5] dark:text-indigo-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition flex items-center gap-1">
                Inspect Goal Details →
              </span>
            </div>
          </div>
        </div>
      </div>

      <VoiceTipsCard />

      <BehaviorPlanCard />

      <HomeTasksCard />

      {/* 3. Quick actions Section - Comprehensive & Connected across all pages */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-2xl font-bold text-[#1F1B3A] dark:text-white">
            {isAr ? 'إجراءات سريعة' : 'Quick actions'}
          </h2>
          <span className="text-xs text-[#6B6785] dark:text-gray-400 font-medium">
            Connected workflows
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Action 1: Start home practice (Dark green card) */}
          <button
            onClick={() => setShowVideoModal(true)}
            className="w-full bg-[#064E3B] hover:bg-[#054030] dark:bg-[#064E3B] text-white p-4 sm:p-5 rounded-[22px] flex items-center justify-between text-left rtl:text-right shadow-warm active:scale-[0.99] transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base sm:text-lg text-white">
                  Start home practice
                </h4>
                <p className="text-xs sm:text-sm text-emerald-100/90 font-normal">
                  Record home session data & watch therapeutic demo routine
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-white/90 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
          </button>

          {/* Action 2: Goal progress & milestones (Purple card) -> Jumps to Progress */}
          <button
            onClick={() => setActiveTab('Progress')}
            className="w-full bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] p-4 sm:p-5 rounded-[22px] flex items-center justify-between text-left rtl:text-right shadow-card hover:border-[#7C3AED] dark:hover:border-purple-400 active:scale-[0.99] transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#EDE9FE] dark:bg-purple-950/60 flex items-center justify-center text-[#7C3AED] dark:text-purple-300 shrink-0 group-hover:scale-105 transition">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white group-hover:text-[#7C3AED] dark:group-hover:text-purple-300 transition">
                  Goal progress & milestones
                </h4>
                <p className="text-xs sm:text-sm text-[#6B6785] dark:text-[#8E8AAB]">
                  Review developmental domain metrics, mastery engine & PDF report
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#6B6785] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
          </button>

          {/* Action 3: Individualized IEP Targets (Indigo card) -> Jumps to Targets */}
          <button
            onClick={() => setActiveTab('Targets')}
            className="w-full bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] p-4 sm:p-5 rounded-[22px] flex items-center justify-between text-left rtl:text-right shadow-card hover:border-[#4F46E5] dark:hover:border-indigo-400 active:scale-[0.99] transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#E0E7FF] dark:bg-indigo-950/60 flex items-center justify-center text-[#4F46E5] dark:text-indigo-300 shrink-0 group-hover:scale-105 transition">
                <TargetIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white group-hover:text-[#4F46E5] dark:group-hover:text-indigo-300 transition">
                  Individualized IEP Targets
                </h4>
                <p className="text-xs sm:text-sm text-[#6B6785] dark:text-[#8E8AAB]">
                  5 active targets, baseline percentages & rolling 3-session scores
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#6B6785] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
          </button>

          {/* Action 4: Therapy & School Sessions (Teal card) -> Jumps to Sessions */}
          <button
            onClick={() => setActiveTab('Sessions')}
            className="w-full bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] p-4 sm:p-5 rounded-[22px] flex items-center justify-between text-left rtl:text-right shadow-card hover:border-[#0D9488] dark:hover:border-teal-400 active:scale-[0.99] transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#CCFBF1] dark:bg-teal-950/60 flex items-center justify-center text-[#0D9488] dark:text-teal-300 shrink-0 group-hover:scale-105 transition">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white group-hover:text-[#0D9488] dark:group-hover:text-teal-300 transition">
                  Therapy & School Sessions
                </h4>
                <p className="text-xs sm:text-sm text-[#6B6785] dark:text-[#8E8AAB]">
                  View weekly timetable, join HD telehealth, or book visits
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#6B6785] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
          </button>

          {/* Action 5: Message Care Team (Sky blue card) -> Jumps to Messages */}
          <button
            onClick={() => setActiveTab('Messages')}
            className="w-full bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] p-4 sm:p-5 rounded-[22px] flex items-center justify-between text-left rtl:text-right shadow-card hover:border-[#0284C7] dark:hover:border-sky-400 active:scale-[0.99] transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#E0F2FE] dark:bg-sky-950/60 flex items-center justify-center text-[#0284C7] dark:text-sky-300 shrink-0 group-hover:scale-105 transition">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white group-hover:text-[#0284C7] dark:group-hover:text-sky-300 transition">
                  Message Care Team
                </h4>
                <p className="text-xs sm:text-sm text-[#6B6785] dark:text-[#8E8AAB]">
                  Chat directly with Dr. Sarah (SLP), Dr. Tareq (BCBA), Reem (OT), & Teachers
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#6B6785] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
          </button>

          {/* Action 6: Compassionate Support Banner */}
          <button
            onClick={() => setShowHardDayModal(true)}
            className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-left rtl:text-right text-xs transition hover:border-amber-400 active:scale-[0.99] group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">💛</span>
              <div>
                <span className="font-bold text-[#1F1B3A] dark:text-white block">
                  Had a challenging day with Lama?
                </span>
                <span className="text-[11px] text-[#6B6785] dark:text-gray-300">
                  Tap to request gentle transition support from the care team
                </span>
              </div>
            </div>
            <span className="font-bold text-amber-700 dark:text-amber-300 group-hover:underline shrink-0">
              Support Mode →
            </span>
          </button>
        </div>
      </div>

      {/* 4. This week Section with Circular Ring, Bars & Connected Sessions */}
      <div className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[24px] p-5 shadow-card space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-heading font-bold text-xl text-[#1F1B3A] dark:text-white">
              This week
            </h3>
            <p className="text-xs text-[#6B6785] dark:text-[#A5A0C2]">
              Goal progress & multidisciplinary attendance
            </p>
          </div>

          <button
            onClick={() => setActiveTab('Progress')}
            className="text-xs font-bold text-[#0D9488] hover:text-[#0b7a70] dark:text-teal-400 flex items-center gap-1 transition"
          >
            <span>View Full Progress</span>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>

        {/* Ring & Progress Bars Row */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Interactive Circular Progress Ring: 82% COMPLETE -> clicks to Progress */}
          <button
            onClick={() => setActiveTab('Progress')}
            className="relative w-28 h-28 shrink-0 flex items-center justify-center group cursor-pointer focus:outline-hidden"
            title="Click to view comprehensive progress breakdown"
          >
            <svg className="w-full h-full -rotate-90 group-hover:scale-105 transition duration-300" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-gray-100 dark:stroke-gray-800"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-[#0D9488]"
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset="45.2" // 82%
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-heading font-black text-2xl text-[#1F1B3A] dark:text-white leading-none group-hover:text-[#0D9488] transition">
                82%
              </span>
              <span className="text-[9px] font-bold text-[#6B6785] dark:text-gray-400 uppercase tracking-wider mt-0.5">
                COMPLETE
              </span>
              <span className="text-[8px] text-[#0D9488] font-semibold opacity-0 group-hover:opacity-100 transition">
                Inspect →
              </span>
            </div>
          </button>

          {/* Interactive Goal Progress Bars - Each clickable to filter Targets */}
          <div className="flex-1 w-full space-y-3">
            {/* Speech 82% -> Clicks to speech targets */}
            <button
              onClick={() => {
                setActiveTab('Targets');
                setTargetFilterDiscipline('speech');
              }}
              className="w-full text-left rtl:text-right p-2 rounded-xl hover:bg-purple-50/60 dark:hover:bg-purple-950/40 transition group cursor-pointer"
              title="Filter Targets to Speech & Language"
            >
              <div className="flex justify-between text-xs font-semibold text-[#1F1B3A] dark:text-white mb-1">
                <span className="group-hover:text-[#8B5CF6] transition flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#8B5CF6]"></span>
                  <span>Speech & Communication</span>
                </span>
                <span className="font-bold text-[#8B5CF6]">82% →</span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#8B5CF6] rounded-full transition-all duration-500" style={{ width: '82%' }}></div>
              </div>
            </button>

            {/* Behavior 64% -> Clicks to behavior targets */}
            <button
              onClick={() => {
                setActiveTab('Targets');
                setTargetFilterDiscipline('behavior');
              }}
              className="w-full text-left rtl:text-right p-2 rounded-xl hover:bg-blue-50/60 dark:hover:bg-blue-950/40 transition group cursor-pointer"
              title="Filter Targets to Behavior (ABA)"
            >
              <div className="flex justify-between text-xs font-semibold text-[#1F1B3A] dark:text-white mb-1">
                <span className="group-hover:text-[#0284C7] transition flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0284C7]"></span>
                  <span>Behavior & Independence</span>
                </span>
                <span className="font-bold text-[#0284C7]">64% →</span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#0284C7] rounded-full transition-all duration-500" style={{ width: '64%' }}></div>
              </div>
            </button>

            {/* AAC Communication 65% -> Clicks to speech / AAC targets */}
            <button
              onClick={() => {
                setActiveTab('Targets');
                setTargetFilterDiscipline('speech');
              }}
              className="w-full text-left rtl:text-right p-2 rounded-xl hover:bg-teal-50/60 dark:hover:bg-teal-950/40 transition group cursor-pointer"
              title="Filter Targets to AAC / Picture Communication"
            >
              <div className="flex justify-between text-xs font-semibold text-[#1F1B3A] dark:text-white mb-1">
                <span className="group-hover:text-[#0D9488] transition flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0D9488]"></span>
                  <span>AAC Communication</span>
                </span>
                <span className="font-bold text-[#0D9488]">65% →</span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#0D9488] rounded-full transition-all duration-500" style={{ width: '65%' }}></div>
              </div>
            </button>
          </div>
        </div>

        {/* CONNECTED WORK: This Week's Active Schedule & Telehealth */}
        <div className="p-4 rounded-2xl bg-[#FAF6F0] dark:bg-[#252044] border border-[#E8E2D9] dark:border-[#38325E] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0D9488]" />
              <h4 className="font-heading font-bold text-xs sm:text-sm text-[#1F1B3A] dark:text-white">
                This Week's Sessions (Week 3, Oct 2026)
              </h4>
            </div>
            <button
              onClick={() => {
                setActiveTab('Sessions');
                setSessionSubTab('calendar');
              }}
              className="text-[11px] font-bold text-[#0D9488] hover:underline"
            >
              Calendar Map →
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {/* Upcoming Session 1 Preview */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center shrink-0 text-xs">
                  س
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[#1F1B3A] dark:text-white truncate">
                    Speech Therapy • Dr. Sarah Alharbi
                  </p>
                  <p className="text-[10px] text-[#6B6785] dark:text-gray-400">
                    Wed, 10:00 AM • Clinic Room 204
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab('Sessions');
                  setSessionSubTab('upcoming');
                }}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-[#4F46E5] dark:text-indigo-300 font-bold text-[11px] hover:bg-indigo-100 shrink-0 ml-2"
              >
                View
              </button>
            </div>

            {/* Upcoming Session 2 Telehealth Preview */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center shrink-0 text-xs">
                  ر
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[#1F1B3A] dark:text-white truncate">
                    Occupational Therapy • Reem Al-Ahmad
                  </p>
                  <p className="text-[10px] text-teal-700 dark:text-teal-300 font-semibold">
                    Thu, 2:00 PM • Telehealth Ready
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setTelehealthSpecialist('Reem Al-Ahmad (OT Specialist)');
                  setShowTelehealthModal(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#0D9488] text-white font-bold text-[11px] hover:bg-[#0b7a70] flex items-center gap-1 shrink-0 ml-2"
              >
                <Video className="w-3 h-3" />
                <span>Join</span>
              </button>
            </div>
          </div>
        </div>

        {/* CONNECTED WORK: This Week's Home Practice Streak */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              4/5
            </div>
            <div>
              <h5 className="font-bold text-xs text-emerald-950 dark:text-emerald-200">
                Weekly Home Practice Goal
              </h5>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                4 days completed this week (80% On Track)
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowWeDidItModal(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1 active:scale-95 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>We Did It!</span>
          </button>
        </div>
      </div>

      {/* 5. Weekly Therapy Insights & Consent Center Link */}
      <div className="pt-2 text-center">
        <button
          onClick={() => setShowConsentModal(true)}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#0D9488] hover:text-[#0A7369] dark:text-teal-400 underline underline-offset-4 decoration-2 transition group"
        >
          <ShieldCheck className="w-4 h-4 text-[#0D9488] dark:text-teal-400 group-hover:scale-110 transition" />
          <span>Manage who can see my child's information (PDPL Privacy)</span>
        </button>
      </div>
    </div>
  );

  /* ---------------------------------------------------- */
  /* TAB 2: PROGRESS (Exact match to Screenshot 2)       */
  /* ---------------------------------------------------- */
  /* ---------------------------------------------------- */
  /* TAB 2: PROGRESS (Clinical Progression & Origins)     */
  /* ---------------------------------------------------- */
  const renderProgressTab = () => {
    const childTargets = targets.filter(t => t.childId === activeChild.id || t.childId === 'child-lama');
    const masteredCount = childTargets.filter(t => t.status === 'mastered').length;
    const inProgressCount = childTargets.filter(t => t.status !== 'mastered').length;

    return (
      <div className="space-y-6 pb-28 animate-in fade-in">
        {/* Multidisciplinary Progress Overview Card */}
        <div className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[24px] p-5 shadow-card space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5] dark:text-indigo-400 block mb-1">
                {isAr ? 'المجالات النمائية الشاملة' : 'DEVELOPMENTAL DOMAINS'}
              </span>
              <h2 className="font-heading text-2xl font-bold text-[#1F1B3A] dark:text-white">
                {isAr ? 'المهارات قيد التقدم والإتقان' : 'Skills Currently in Progress'}
              </h2>
              <p className="text-xs text-[#6B6785] dark:text-gray-300 mt-0.5">
                {isAr ? 'مؤشرات إكلينيكية حية مجمعة من 5 ممارسين صحيين والملاحظات المنزلية' : "Real-time clinical mastery aggregated across 5 specialists & home practice"}
              </p>
            </div>

            <button
              onClick={() => setShowWorkflowExplainer(!showWorkflowExplainer)}
              className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-[#4F46E5] dark:text-indigo-300 hover:bg-indigo-100 flex items-center gap-1.5 text-xs font-bold transition shrink-0"
              title="Learn how progress is calculated"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{showWorkflowExplainer ? 'Hide Logic' : 'How it Works'}</span>
            </button>
          </div>

          {/* Interactive Explainer: How Progress & Targets Work */}
          {showWorkflowExplainer && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-teal-50/80 dark:from-[#252044] dark:to-[#1B2936] border border-indigo-200 dark:border-indigo-800 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#4F46E5] shrink-0" />
                <h4 className="font-heading font-bold text-xs sm:text-sm text-[#1F1B3A] dark:text-white">
                  Where Progress & Targets Come From (The Clinical Pipeline)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#1A1733] border border-indigo-100 dark:border-gray-800 space-y-1">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">1</span>
                  <p className="font-bold text-[#1F1B3A] dark:text-white">Clinical Assessment</p>
                  <p className="text-[10px] text-[#6B6785] dark:text-gray-400">Baseline established via IEP & diagnostic tests (e.g. 25% starting point).</p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#1A1733] border border-indigo-100 dark:border-gray-800 space-y-1">
                  <span className="w-5 h-5 rounded-full bg-[#0D9488] text-white font-bold text-[10px] flex items-center justify-center">2</span>
                  <p className="font-bold text-[#1F1B3A] dark:text-white">Session Trial Feeds</p>
                  <p className="text-[10px] text-[#6B6785] dark:text-gray-400">SLP, OT & BCBA log real-time data (+, P, -) during 1-on-1 clinic therapy.</p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#1A1733] border border-indigo-100 dark:border-gray-800 space-y-1">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center">3</span>
                  <p className="font-bold text-[#1F1B3A] dark:text-white">Home & School Logs</p>
                  <p className="text-[10px] text-[#6B6785] dark:text-gray-400">Parents submit "We Did It!" check-ins and teachers log classroom inclusion.</p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#1A1733] border border-indigo-100 dark:border-gray-800 space-y-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">4</span>
                  <p className="font-bold text-[#1F1B3A] dark:text-white">Rolling Mastery Engine</p>
                  <p className="text-[10px] text-[#6B6785] dark:text-gray-400">When last 3 sessions reach ≥90%, target is submitted for Supervisor sign-off.</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-4 gap-2 pt-1 text-center">
            <div className="p-3 rounded-2xl bg-[#FAF6F0] dark:bg-[#252044] border border-[#E8E2D9] dark:border-[#38325E]">
              <span className="font-heading font-black text-xl text-[#0D9488]">82%</span>
              <p className="text-[10px] text-[#6B6785] dark:text-gray-400 uppercase font-semibold mt-0.5">Overall Index</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF6F0] dark:bg-[#252044] border border-[#E8E2D9] dark:border-[#38325E]">
              <span className="font-heading font-black text-xl text-[#4F46E5]">{inProgressCount}</span>
              <p className="text-[10px] text-[#6B6785] dark:text-gray-400 uppercase font-semibold mt-0.5">In Teaching</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF6F0] dark:bg-[#252044] border border-[#E8E2D9] dark:border-[#38325E]">
              <span className="font-heading font-black text-xl text-emerald-600">{masteredCount}</span>
              <p className="text-[10px] text-[#6B6785] dark:text-gray-400 uppercase font-semibold mt-0.5">Mastered</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF6F0] dark:bg-[#252044] border border-[#E8E2D9] dark:border-[#38325E]">
              <span className="font-heading font-black text-xl text-amber-500">15</span>
              <p className="text-[10px] text-[#6B6785] dark:text-gray-400 uppercase font-semibold mt-0.5">Sessions</p>
            </div>
          </div>

          {/* 4 Domain Cards (Exact match to Screenshot 2 + tap to inspect) */}
          <div className="space-y-4 pt-1">
            {/* Card 1: Communication & Speech */}
            <div 
              onClick={() => setSelectedDomainForDetail('Communication & Speech')}
              className="p-4 sm:p-5 rounded-2xl border border-[#E8E2D9] dark:border-[#38325E] bg-white dark:bg-[#252044] shadow-card space-y-3 cursor-pointer hover:border-[#0D9488] transition active:scale-[0.99] group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition">
                      Communication & Speech
                    </h3>
                    <p className="text-xs text-[#6B6785] dark:text-gray-400">
                      5 milestones achieved • Lead: Dr. Sarah Alharbi (SLP)
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#DDF5EA] text-[#1B9E6B] dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                  Improving ↗
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF6F0] dark:bg-[#1E193B] border border-[#E8E2D9] dark:border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 block mb-0.5">
                    Active Focus Target:
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-[#1F1B3A] dark:text-white">
                    Answering "Where" and "What" questions spontaneously
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-teal-600 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition shrink-0" />
              </div>
            </div>

            {/* Card 2: Motor Skills & Daily Self-Care */}
            <div 
              onClick={() => setSelectedDomainForDetail('Motor Skills & Daily Self-Care')}
              className="p-4 sm:p-5 rounded-2xl border border-[#E8E2D9] dark:border-[#38325E] bg-white dark:bg-[#252044] shadow-card space-y-3 cursor-pointer hover:border-orange-400 transition active:scale-[0.99] group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-600 shrink-0">
                    <Hand className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white group-hover:text-orange-600 transition">
                      Motor Skills & Daily Self-Care
                    </h3>
                    <p className="text-xs text-[#6B6785] dark:text-gray-400">
                      4 milestones achieved • Lead: Reem Al-Ahmad (OT)
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#DDF5EA] text-[#1B9E6B] dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                  Improving ↗
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF6F0] dark:bg-[#1E193B] border border-[#E8E2D9] dark:border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 block mb-0.5">
                    Active Focus Target:
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-[#1F1B3A] dark:text-white">
                    Fastening buttons and tripod pencil hold
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-orange-600 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition shrink-0" />
              </div>
            </div>

            {/* Card 3: Functional Learning & Thinking */}
            <div 
              onClick={() => setSelectedDomainForDetail('Functional Learning & Thinking')}
              className="p-4 sm:p-5 rounded-2xl border border-[#E8E2D9] dark:border-[#38325E] bg-white dark:bg-[#252044] shadow-card space-y-3 cursor-pointer hover:border-indigo-400 transition active:scale-[0.99] group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 shrink-0">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white group-hover:text-indigo-600 transition">
                      Functional Learning & Thinking
                    </h3>
                    <p className="text-xs text-[#6B6785] dark:text-gray-400">
                      3 milestones achieved • Lead: Ms. Layla Fahad
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF1CC] text-[#B7791F] dark:bg-amber-950 dark:text-amber-300 shrink-0">
                  Developing 🕒
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF6F0] dark:bg-[#1E193B] border border-[#E8E2D9] dark:border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                    Active Focus Target:
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-[#1F1B3A] dark:text-white">
                    Counting objects 1-10 with token counters
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition shrink-0" />
              </div>
            </div>

            {/* Card 4: Social Connection & Play */}
            <div 
              onClick={() => setSelectedDomainForDetail('Social Connection & Play')}
              className="p-4 sm:p-5 rounded-2xl border border-[#E8E2D9] dark:border-[#38325E] bg-white dark:bg-[#252044] shadow-card space-y-3 cursor-pointer hover:border-emerald-400 transition active:scale-[0.99] group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white group-hover:text-emerald-600 transition">
                      Social Connection & Play
                    </h3>
                    <p className="text-xs text-[#6B6785] dark:text-gray-400">
                      4 milestones achieved • Lead: Classroom Team
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#DDF5EA] text-[#1B9E6B] dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                  Improving ↗
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF6F0] dark:bg-[#1E193B] border border-[#E8E2D9] dark:border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">
                    Active Focus Target:
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-[#1F1B3A] dark:text-white">
                    Answering peer questions during group science
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition shrink-0" />
              </div>
            </div>
          </div>

          {/* Bottom Action Button: Download Full Progress Report (PDF) */}
          <div className="pt-2">
            <button
              onClick={() => {
                showNotification(isAr ? 'جاري تصدير تقرير تقدم الطفل الشامل (PDF)' : 'Generating Full Multidisciplinary Progress Report (PDF)...');
              }}
              className="w-full py-4 rounded-2xl bg-white dark:bg-[#252044] border-2 border-[#4F46E5] text-[#4F46E5] dark:text-indigo-300 hover:bg-indigo-50/50 font-heading font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition active:scale-[0.99]"
            >
              <Download className="w-5 h-5 text-[#4F46E5] dark:text-indigo-300" />
              <span>{isAr ? 'تحميل التقرير الإكلينيكي الشامل (PDF)' : 'Download Full Progress Report (PDF)'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ---------------------------------------------------- */
  /* TAB 3: TARGETS (IEP Goals, Origin & Dynamic History) */
  /* ---------------------------------------------------- */
  const renderTargetsTab = () => {
    const childTargets = targets.filter(t => t.childId === activeChild.id || t.childId === 'child-lama');

    const filtered = childTargets.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(targetSearchQuery.toLowerCase()) ||
                            t.domain.toLowerCase().includes(targetSearchQuery.toLowerCase()) ||
                            (t.operationalDefinition || '').toLowerCase().includes(targetSearchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (targetFilterStatus === 'teaching') return t.status === 'teaching';
      if (targetFilterStatus === 'mastered') return t.status === 'mastered';
      if (targetFilterStatus === 'review') return t.approvalStatus === 'needs_review' || t.approvalStatus === 'awaiting_approval';
      if (targetFilterDiscipline !== 'all') return t.discipline === targetFilterDiscipline;
      return true;
    });

    return (
      <div className="space-y-4 pb-28 animate-in fade-in">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold text-[#1F1B3A] dark:text-white mb-0.5">
              {isAr ? 'الأهداف والخطط الفردية' : 'Developmental Targets'}
            </h2>
            <p className="text-xs text-[#6B6785] dark:text-[#A5A0C2]">
              {isAr ? 'أهداف الخطة التربوية الفردية المقاسة إكلينيكياً في الجلسات' : 'Individualized Education Plan (IEP) goals measured in live sessions'}
            </p>
          </div>

          <button
            onClick={() => setShowWorkflowExplainer(!showWorkflowExplainer)}
            className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center gap-1 shadow-xs"
            title="How targets originate"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Origin Info</span>
          </button>
        </div>

        {/* Origin & Workflow Notice Banner */}
        <div className="p-3.5 rounded-2xl bg-[#EDE9FE]/50 dark:bg-[#252044] border border-[#7C3AED]/20 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#7C3AED] shrink-0" />
            <span className="text-[#1F1B3A] dark:text-gray-200">
              Each target originates from clinical evaluations, updated live during sessions, and requires 3 consecutive sessions to reach mastery.
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#6B6785] absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={targetSearchQuery}
            onChange={(e) => setTargetSearchQuery(e.target.value)}
            placeholder="Search targets by skill or domain..."
            className="w-full py-2.5 pl-10 pr-4 rtl:pl-4 rtl:pr-10 rounded-2xl bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] text-xs sm:text-sm text-[#1F1B3A] dark:text-white placeholder-[#6B6785] outline-hidden shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
          {[
            { key: 'all', label: `All (${childTargets.length})` },
            { key: 'teaching', label: `In Teaching (${childTargets.filter(t => t.status === 'teaching').length})` },
            { key: 'review', label: `Pending Review (${childTargets.filter(t => t.approvalStatus === 'needs_review' || t.approvalStatus === 'awaiting_approval').length})` },
            { key: 'mastered', label: `Mastered (${childTargets.filter(t => t.status === 'mastered').length})` },
          ].map((pill) => (
            <button
              key={pill.key}
              onClick={() => setTargetFilterStatus(pill.key as any)}
              className={`px-3 py-1.5 rounded-full font-semibold transition shrink-0 border ${
                targetFilterStatus === pill.key
                  ? 'bg-[#4F46E5] text-white border-[#4F46E5] shadow-xs'
                  : 'bg-white dark:bg-[#1F1B3A] border-[#E8E2D9] dark:border-[#38325E] text-[#6B6785]'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Targets List */}
        <div className="space-y-3.5">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6B6785] bg-white dark:bg-[#1F1B3A] rounded-2xl border border-[#E8E2D9] dark:border-[#38325E]">
              No targets matching your search query.
            </div>
          ) : (
            filtered.map((tgt) => {
              const baseline = tgt.baseline || 20;
              const isMastered = tgt.status === 'mastered';
              const isNear = tgt.currentPerformance >= tgt.criterionThreshold - 5 && !isMastered;

              const disciplineBadges: Record<string, { bg: string; text: string; label: string }> = {
                speech: { bg: 'bg-[#EDE9FE] dark:bg-purple-950', text: 'text-[#7C3AED] dark:text-purple-300', label: 'Speech (SLP)' },
                ot: { bg: 'bg-[#D1FAE5] dark:bg-emerald-950', text: 'text-[#10B981] dark:text-emerald-300', label: 'Occupational Therapy' },
                behavior: { bg: 'bg-[#E0E7FF] dark:bg-indigo-950', text: 'text-[#4F46E5] dark:text-indigo-300', label: 'Behavior (ABA)' },
                remedial: { bg: 'bg-[#FEF3C7] dark:bg-amber-950', text: 'text-[#D97706] dark:text-amber-300', label: 'Remedial / Academics' },
                teacher: { bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300', label: 'Classroom Inclusion' },
              };

              const badge = disciplineBadges[tgt.discipline] || disciplineBadges.speech;

              return (
                <div
                  key={tgt.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] shadow-card space-y-3 hover:border-[#4F46E5]/60 transition"
                >
                  {/* Card Header: Discipline, Status & Origin */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      {tgt.therapistName && (
                        <span className="text-[11px] text-[#6B6785] dark:text-gray-400">
                          • {tgt.therapistName}
                        </span>
                      )}
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      isMastered
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : isNear
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-indigo-50 text-[#4F46E5] dark:bg-indigo-950 dark:text-indigo-300'
                    }`}>
                      {isMastered ? 'Mastered ✓' : isNear ? 'Mastery Near 🔥' : 'In Teaching'}
                    </span>
                  </div>

                  {/* Target Title & Origin */}
                  <div>
                    <h3 className="font-heading font-bold text-sm sm:text-base text-[#1F1B3A] dark:text-white leading-snug">
                      {tgt.name}
                    </h3>
                    <p className="text-[11px] text-[#6B6785] dark:text-gray-400 mt-0.5">
                      {tgt.origin || 'Established in Annual Multidisciplinary IEP Review'}
                    </p>
                  </div>

                  {/* Visual Progression: Baseline ➔ Current ➔ Criterion */}
                  <div className="p-3 rounded-xl bg-[#FAF6F0] dark:bg-[#252044] space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[#6B6785] dark:text-gray-300 font-semibold text-[11px]">
                      <span>Baseline: {baseline}%</span>
                      <span className="font-bold text-[#1F1B3A] dark:text-white text-xs">Current: {tgt.currentPerformance}%</span>
                      <span className="text-emerald-700 dark:text-emerald-400">Goal: {tgt.criterionThreshold}%</span>
                    </div>

                    {/* Multi-step progress bar */}
                    <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, tgt.currentPerformance)}%` }}
                      ></div>
                    </div>

                    {/* Rolling 3 Sessions Dots */}
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-[#6B6785] dark:text-gray-400">
                        Rolling 3 sessions:
                      </span>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
                        {tgt.lastThreeSessions.map((score, idx) => (
                          <span
                            key={idx}
                            className={`px-1.5 py-0.5 rounded-md ${
                              score >= tgt.criterionThreshold
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {score}%
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Next Step / Clinical Recommendation */}
                  <div className="text-xs text-[#6B6785] dark:text-gray-300 flex items-start gap-1.5 italic">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{tgt.suggestedAction}</span>
                  </div>

                  {/* Action Buttons: Inspect & Log Home Practice */}
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTargetForDetail(tgt)}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Inspect Target & History</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedTargetForDetail(tgt);
                        setShowAddTargetHomePractice(true);
                      }}
                      className="py-2 px-3 rounded-xl border border-[#0D9488] text-[#0D9488] dark:text-teal-400 text-xs font-bold hover:bg-teal-50 dark:hover:bg-teal-950 flex items-center gap-1 transition"
                      title="Log home practice for this goal"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Home Trial</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  /* ---------------------------------------------------- */
  /* TAB 4: SESSIONS (Enhanced Pediatric Schedule Suite)  */
  /* ---------------------------------------------------- */
  const renderSessionsTab = () => (
    <div className="space-y-5 pb-28 animate-in fade-in">
      {/* Top Header & Book New Session Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#1F1B3A] dark:text-white mb-0.5">
            {isAr ? 'الجلسات والمواعيد' : 'Therapy & School Sessions'}
          </h2>
          <p className="text-xs text-[#6B6785] dark:text-[#A5A0C2]">
            {isAr ? 'جدول الجلسات التأهيلية، الملاحظات الإكلينيكية، والمكالمات المرئية' : "Lama Alharbi's multidisciplinary appointments & clinical logs"}
          </p>
        </div>

        <button
          onClick={() => setShowBookSessionModal(true)}
          className="px-3.5 py-2 rounded-2xl bg-[#0D9488] hover:bg-[#0B7A70] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'حجز موعد' : 'Book Session'}</span>
        </button>
      </div>

      {/* Interactive Week Date Strip */}
      <div className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-2xl p-3 shadow-xs">
        <div className="flex justify-between items-center text-xs mb-2 px-1">
          <span className="font-bold text-[#1F1B3A] dark:text-white">October 2026</span>
          <span className="text-[11px] text-[#0D9488] font-semibold">Week 3 • 4 Sessions</span>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {[
            { day: 'Sun', date: '12', hasSession: false },
            { day: 'Mon', date: '13', hasSession: true },
            { day: 'Tue', date: '14', hasSession: true, isToday: true },
            { day: 'Wed', date: '15', hasSession: true },
            { day: 'Thu', date: '16', hasSession: true },
            { day: 'Fri', date: '17', hasSession: false },
            { day: 'Sat', date: '18', hasSession: false },
          ].map((item) => {
            const isSelected = selectedWeekDay.includes(item.date);
            return (
              <button
                key={item.date}
                onClick={() => setSelectedWeekDay(`${item.day} ${item.date}`)}
                className={`py-2 px-1 rounded-xl flex flex-col items-center transition ${
                  item.isToday
                    ? 'bg-[#0D9488] text-white font-bold shadow-xs'
                    : isSelected
                    ? 'bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border border-teal-300 font-semibold'
                    : 'text-[#6B6785] hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-[10px] uppercase">{item.day}</span>
                <span className="text-sm font-bold mt-0.5">{item.date}</span>
                {item.hasSession && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-1 ${item.isToday ? 'bg-amber-300' : 'bg-[#0D9488]'}`}></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pediatric Attendance & Compliance Metric Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            98%
          </div>
          <div>
            <h4 className="font-heading font-bold text-xs sm:text-sm text-teal-950 dark:text-teal-200">
              {isAr ? 'نسبة الالتزام بالجلسات: 98%' : 'Term Attendance: 98% (14 / 15)'}
            </h4>
            <p className="text-[11px] text-teal-700 dark:text-teal-300">
              {isAr ? 'ممتاز! استمرارية الجلسات تدعم سرعة إتقان الأهداف' : 'Optimal consistency accelerates developmental goal mastery'}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white dark:bg-[#1F1B3A] text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700">
          On Track ✓
        </span>
      </div>

      {/* Sub-Tab Filter Pills */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSessionSubTab('upcoming')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition border ${
            sessionSubTab === 'upcoming'
              ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-xs'
              : 'bg-white dark:bg-[#1F1B3A] border-[#E8E2D9] dark:border-[#38325E] text-[#6B6785]'
          }`}
        >
          {isAr ? 'المواعيد القادمة (3)' : 'Upcoming (3)'}
        </button>

        <button
          onClick={() => setSessionSubTab('completed')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition border ${
            sessionSubTab === 'completed'
              ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-xs'
              : 'bg-white dark:bg-[#1F1B3A] border-[#E8E2D9] dark:border-[#38325E] text-[#6B6785]'
          }`}
        >
          {isAr ? 'الجلسات السابقة والملاحظات (3)' : 'Completed & Notes (3)'}
        </button>

        <button
          onClick={() => setSessionSubTab('calendar')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition border ${
            sessionSubTab === 'calendar'
              ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-xs'
              : 'bg-white dark:bg-[#1F1B3A] border-[#E8E2D9] dark:border-[#38325E] text-[#6B6785]'
          }`}
        >
          {isAr ? 'الجدول الأسبوعي' : 'Weekly Grid'}
        </button>
      </div>

      {/* UPCOMING SESSIONS VIEW */}
      {sessionSubTab === 'upcoming' && (
        <div className="space-y-3.5">
          {/* Upcoming Session 1: Speech Therapy (Clinic) */}
          <div className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[22px] p-5 shadow-card space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#EDE9FE] dark:bg-purple-950/60 text-[#7C3AED] font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                  س
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C3AED] bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-full">
                    Speech & Language (SLP)
                  </span>
                  <h3 className="font-heading font-bold text-sm sm:text-base text-[#1F1B3A] dark:text-white mt-1">
                    Dr. Sarah Alharbi (Lead SLP)
                  </h3>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded-full">
                Confirmed
              </span>
            </div>

            {/* Time & Location */}
            <div className="p-3 rounded-xl bg-[#FAF6F0] dark:bg-[#252044] space-y-1 text-xs">
              <div className="flex items-center gap-2 text-[#1F1B3A] dark:text-gray-200 font-semibold">
                <Clock className="w-4 h-4 text-[#7C3AED]" />
                <span>Tomorrow, Oct 14 • 10:00 AM – 10:45 AM (45 min)</span>
              </div>
              <div className="flex items-center gap-2 text-[#6B6785] dark:text-gray-400">
                <MapPin className="w-4 h-4 text-[#7C3AED]" />
                <span>Room 204 • Riyadh Specialist Child Clinic</span>
              </div>
            </div>

            {/* Focus Target & Parent Preparation - Connected to Target Tab */}
            <div className="text-xs space-y-1">
              <button
                onClick={() => {
                  const tgt = targets.find(t => t.id === 'target-lama-1');
                  if (tgt) setSelectedTargetForDetail(tgt);
                  else {
                    setActiveTab('Targets');
                    setTargetFilterDiscipline('speech');
                  }
                }}
                className="font-semibold text-teal-800 dark:text-teal-300 hover:underline cursor-pointer flex items-center gap-1 text-left rtl:text-right"
              >
                <span>🎯 Target Focus: Answering "Where" and "What" questions spontaneously</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </button>
              <p className="text-[11px] text-[#6B6785] dark:text-gray-400 italic">
                Parent tip: Please bring Lama's favorite healthy snack and visual choice board.
              </p>
            </div>

            {/* Action buttons */}
            <div className="pt-1 flex items-center gap-2">
              <button
                onClick={() => showNotification('Session added to your device calendar.')}
                className="flex-1 py-2 px-3 rounded-xl border border-[#E8E2D9] dark:border-gray-700 text-xs font-semibold text-[#1F1B3A] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>Calendar</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('Messages');
                  setActiveContactId('contact-slp');
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950 text-[#7C3AED] dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message</span>
              </button>
              <button
                onClick={() => showNotification('Reschedule request sent to clinic front desk.')}
                className="py-2 px-3 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-50"
              >
                Reschedule
              </button>
            </div>
          </div>

          {/* Upcoming Session 2: Occupational Therapy (Telehealth Video) */}
          <div className="bg-white dark:bg-[#1F1B3A] border-2 border-teal-500/30 dark:border-teal-700 rounded-[22px] p-5 shadow-warm space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#D1FAE5] dark:bg-emerald-950/60 text-[#10B981] font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                  ر
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#10B981] bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                    Occupational Therapy (OT)
                  </span>
                  <h3 className="font-heading font-bold text-sm sm:text-base text-[#1F1B3A] dark:text-white mt-1">
                    Reem Al-Ahmad (OT Specialist)
                  </h3>
                </div>
              </div>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 dark:bg-teal-950 px-2 py-1 rounded-full flex items-center gap-1">
                <Video className="w-3 h-3" />
                Telehealth Ready
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF6F0] dark:bg-[#252044] space-y-1 text-xs">
              <div className="flex items-center gap-2 text-[#1F1B3A] dark:text-gray-200 font-semibold">
                <Clock className="w-4 h-4 text-[#10B981]" />
                <span>Thursday, Oct 15 • 2:00 PM – 2:45 PM (45 min)</span>
              </div>
              <div className="flex items-center gap-2 text-[#6B6785] dark:text-gray-400">
                <Video className="w-4 h-4 text-[#10B981]" />
                <span>Encrypted HD Video Consultation Room</span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <button
                onClick={() => {
                  const tgt = targets.find(t => t.id === 'target-lama-3');
                  if (tgt) setSelectedTargetForDetail(tgt);
                  else {
                    setActiveTab('Targets');
                    setTargetFilterDiscipline('ot');
                  }
                }}
                className="font-semibold text-teal-800 dark:text-teal-300 hover:underline cursor-pointer flex items-center gap-1 text-left rtl:text-right"
              >
                <span>🎯 Target Focus: Fastening buttons and tripod pencil hold</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </button>
              <p className="text-[11px] text-[#6B6785] dark:text-gray-400 italic">
                Parent tip: Have button vest with 1-inch wooden buttons and pencil grip ready on table.
              </p>
            </div>

            {/* Direct Join Video Button */}
            <div className="pt-1 flex items-center gap-2">
              <button
                onClick={() => {
                  setTelehealthSpecialist('Reem Al-Ahmad (OT Specialist)');
                  setShowTelehealthModal(true);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0D9488] hover:bg-[#0B7A70] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
              >
                <Video className="w-4 h-4" />
                <span>Join Telehealth Call</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('Messages');
                  setActiveContactId('contact-ot');
                }}
                className="py-2.5 px-3.5 rounded-xl border border-[#E8E2D9] dark:border-gray-700 text-xs font-semibold text-[#1F1B3A] dark:text-white"
                title="Message Reem Al-Ahmad"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Upcoming Session 3: Behavior Home Visit */}
          <div className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[22px] p-5 shadow-card space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#E0E7FF] dark:bg-indigo-950/60 text-[#4F46E5] font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                  ط
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F46E5] bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
                    Behavior Therapy (ABA)
                  </span>
                  <h3 className="font-heading font-bold text-sm sm:text-base text-[#1F1B3A] dark:text-white mt-1">
                    Dr. Tareq Hassan (BCBA)
                  </h3>
                </div>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded-full">
                Home Visit
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF6F0] dark:bg-[#252044] space-y-1 text-xs">
              <div className="flex items-center gap-2 text-[#1F1B3A] dark:text-gray-200 font-semibold">
                <Clock className="w-4 h-4 text-[#4F46E5]" />
                <span>Friday, Oct 16 • 4:00 PM – 5:00 PM</span>
              </div>
              <div className="flex items-center gap-2 text-[#6B6785] dark:text-gray-400">
                <MapPin className="w-4 h-4 text-[#4F46E5]" />
                <span>Home Visit • Transition Generalization Observation</span>
              </div>
            </div>

            <button
              onClick={() => {
                const tgt = targets.find(t => t.id === 'target-lama-2');
                if (tgt) setSelectedTargetForDetail(tgt);
                else {
                  setActiveTab('Targets');
                  setTargetFilterDiscipline('behavior');
                }
              }}
              className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:underline cursor-pointer flex items-center gap-1 text-left rtl:text-right"
            >
              <span>🎯 Target Focus: Requesting help during dinner and evening transitions</span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* COMPLETED SESSIONS & CLINICAL NOTES VIEW */}
      {sessionSubTab === 'completed' && (
        <div className="space-y-3.5">
          {/* Past 1: Behavior ABA */}
          <div className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[22px] p-5 shadow-card space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F46E5] bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
                  Behavior (ABA)
                </span>
                <h4 className="font-heading font-bold text-sm sm:text-base text-[#1F1B3A] dark:text-white mt-1">
                  Dr. Tareq Hassan (BCBA)
                </h4>
                <p className="text-xs text-[#6B6785]">Completed Oct 12 • 4:00 PM (45 min)</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full">
                92% Independent ✓
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF6F0] dark:bg-[#252044] border border-[#E8E2D9] dark:border-gray-800 space-y-2 text-xs">
              <p className="font-semibold text-[#1F1B3A] dark:text-white">
                Clinical Session Note:
              </p>
              <p className="text-[#6B6785] dark:text-gray-300 leading-relaxed">
                "Lama successfully met the mastery criterion for requesting help across 3 consecutive sessions! Latency reduced to 2.8 seconds without requiring physical guidance. Ready for supervisor approval."
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                onClick={() => {
                  const tgt = targets.find(t => t.id === 'target-lama-2');
                  if (tgt) setSelectedTargetForDetail(tgt);
                  else {
                    setActiveTab('Targets');
                    setTargetFilterDiscipline('behavior');
                  }
                }}
                className="text-[#4F46E5] dark:text-indigo-300 font-bold hover:underline flex items-center gap-1"
              >
                <span>Inspect Target (Requesting Help) →</span>
              </button>
              <button
                onClick={() => showNotification('Downloaded clinical note PDF')}
                className="text-[#0D9488] font-bold hover:underline"
              >
                Download Note PDF
              </button>
            </div>
          </div>

          {/* Past 2: Speech SLP */}
          <div className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[22px] p-5 shadow-card space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C3AED] bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-full">
                  Speech & Language (SLP)
                </span>
                <h4 className="font-heading font-bold text-sm sm:text-base text-[#1F1B3A] dark:text-white mt-1">
                  Dr. Sarah Alharbi (Lead SLP)
                </h4>
                <p className="text-xs text-[#6B6785]">Completed Oct 10 • 10:00 AM (45 min)</p>
              </div>
              <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 dark:bg-purple-950 px-2.5 py-1 rounded-full">
                85% Independent
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF6F0] dark:bg-[#252044] border border-[#E8E2D9] dark:border-gray-800 space-y-2 text-xs">
              <p className="font-semibold text-[#1F1B3A] dark:text-white">
                Clinical Session Note:
              </p>
              <p className="text-[#6B6785] dark:text-gray-300 leading-relaxed">
                "Answered 5 of 6 WH questions accurately without verbal cue. Strong generalization observed with picture scenes of classroom and kitchen."
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                onClick={() => {
                  const tgt = targets.find(t => t.id === 'target-lama-1');
                  if (tgt) setSelectedTargetForDetail(tgt);
                  else {
                    setActiveTab('Targets');
                    setTargetFilterDiscipline('speech');
                  }
                }}
                className="text-[#7C3AED] dark:text-purple-300 font-bold hover:underline flex items-center gap-1"
              >
                <span>Inspect Target (WH Questions) →</span>
              </button>
              <button
                onClick={() => showNotification('Downloaded clinical note PDF')}
                className="text-[#0D9488] font-bold hover:underline"
              >
                Download Note PDF
              </button>
            </div>
          </div>

          {/* Past 3: Occupational Therapy Completed Session */}
          <div className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[22px] p-5 shadow-card space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#10B981] bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  Occupational Therapy (OT)
                </span>
                <h4 className="font-heading font-bold text-sm sm:text-base text-[#1F1B3A] dark:text-white mt-1">
                  Reem Al-Ahmad (OT Specialist)
                </h4>
                <p className="text-xs text-[#6B6785]">Completed Oct 8 • 2:00 PM (45 min)</p>
              </div>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 rounded-full">
                88% Independent
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF6F0] dark:bg-[#252044] border border-[#E8E2D9] dark:border-gray-800 space-y-2 text-xs">
              <p className="font-semibold text-[#1F1B3A] dark:text-white">
                Clinical Session Note:
              </p>
              <p className="text-[#6B6785] dark:text-gray-300 leading-relaxed">
                "Lama buttoned 4 out of 5 one-inch wooden buttons without hand-over-hand prompting. Bilateral hand coordination showed notable strength when stabilizing fabric. Transitioned smoothly using sensory warm-up."
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                onClick={() => {
                  const tgt = targets.find(t => t.id === 'target-lama-3');
                  if (tgt) setSelectedTargetForDetail(tgt);
                  else {
                    setActiveTab('Targets');
                    setTargetFilterDiscipline('ot');
                  }
                }}
                className="text-teal-700 dark:text-teal-300 font-bold hover:underline flex items-center gap-1"
              >
                <span>Inspect Target (Buttoning & Fine Motor) →</span>
              </button>
              <button
                onClick={() => showNotification('Downloaded clinical note PDF')}
                className="text-[#0D9488] font-bold hover:underline"
              >
                Download Note PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WEEKLY GRID & SCHEDULE MAP VIEW */}
      {sessionSubTab === 'calendar' && (
        <div className="space-y-3.5">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] space-y-3 shadow-card">
            <h4 className="font-heading font-bold text-sm text-[#1F1B3A] dark:text-white flex items-center justify-between">
              <span>Multidisciplinary Weekly Schedule</span>
              <span className="text-xs text-[#0D9488] font-normal">Week of Oct 12-16</span>
            </h4>

            <div className="space-y-2 text-xs divide-y divide-gray-100 dark:divide-gray-800">
              {[
                { day: 'Mon 13', time: '10:00 AM', disc: 'Speech (SLP)', spec: 'Dr. Sarah Alharbi', loc: 'Clinic Room 204', tag: 'Completed' },
                { day: 'Tue 14', time: '10:00 AM', disc: 'Speech (SLP)', spec: 'Dr. Sarah Alharbi', loc: 'Clinic Room 204', tag: 'Tomorrow' },
                { day: 'Wed 15', time: '11:30 AM', disc: 'School Inclusion', spec: 'Ms. Layla Fahad', loc: 'Grade 1 Classroom', tag: 'Scheduled' },
                { day: 'Thu 16', time: '02:00 PM', disc: 'OT Telehealth', spec: 'Reem Al-Ahmad', loc: 'Encrypted HD Video', tag: 'Telehealth' },
                { day: 'Fri 17', time: '04:00 PM', disc: 'Behavior (ABA)', spec: 'Dr. Tareq Hassan', loc: 'Home Environment', tag: 'Home Visit' },
              ].map((item, idx) => (
                <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#1F1B3A] dark:text-white mr-2">{item.day} • {item.time}</span>
                    <p className="text-[11px] text-[#6B6785] dark:text-gray-400">{item.disc} — {item.spec} ({item.loc})</p>
                  </div>
                  <button
                    onClick={() => {
                      if (item.tag === 'Telehealth') {
                        setTelehealthSpecialist('Reem Al-Ahmad (OT Specialist)');
                        setShowTelehealthModal(true);
                      } else {
                        setSessionSubTab('upcoming');
                      }
                    }}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-200 transition"
                  >
                    {item.tag}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /* ---------------------------------------------------- */
  /* TAB 5: MESSAGES (Exact match to Screenshot 3)       */
  /* ---------------------------------------------------- */
  const renderMessagesTab = () => {
    // No conversation chosen: the chat list, like WhatsApp's.
    if (!activeContact) {
      const pill = (id: typeof chatCategoryFilter, label: string, n?: number) => (
        <button
          key={id}
          onClick={() => setChatCategoryFilter(id)}
          className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium flex items-center gap-1.5 shrink-0 transition ${chatCategoryFilter === id ? 'bg-[#D9FDD3] dark:bg-[#103529] text-[#0B6B53] dark:text-[#06CF9C]' : 'bg-[#F0F2F5] dark:bg-[#202C33] text-[#54656F] dark:text-[#8696A0]'}`}
        >
          <span>{label}</span>
          {n !== undefined && n > 0 && <span className="text-[11px] opacity-80">{n}</span>}
        </button>
      );
      return (
        <div className="space-y-3 pb-28 md:pb-12 animate-in fade-in" data-testid="chat-list">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-heading text-[28px] font-bold text-[#111B21] dark:text-[#E9EDEF] leading-tight">{isAr ? 'المحادثات' : 'Chats'}</h1>
              <p className="text-xs text-[#667781] dark:text-[#8696A0] mt-0.5">{activeChild.name} · {isAr ? 'فريق الرعاية' : 'care team'} · {contacts.length}</p>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#667781] absolute start-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={isAr ? 'ابحث في المحادثات' : 'Search chats'}
              placeholder={isAr ? 'ابحث أو ابدأ محادثة' : 'Search chats or messages'}
              className="w-full py-2.5 ps-11 pe-4 rounded-full bg-[#F0F2F5] dark:bg-[#202C33] text-[15px] text-[#111B21] dark:text-[#E9EDEF] placeholder-[#667781] outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {pill('all', isAr ? 'الكل' : 'All')}
            {pill('therapists', isAr ? 'المعالجون' : 'Therapists')}
            {pill('school', isAr ? 'المدرسة' : 'School')}
            {pill('unread', isAr ? 'غير مقروءة' : 'Unread', contacts.reduce((a, c) => a + (c.unreadCount || 0), 0))}
          </div>

          <div className="bg-white dark:bg-[#111B21] rounded-2xl border border-[#E9EDEF] dark:border-[#222D34] overflow-hidden">
            {filteredContacts.length === 0 && <p className="text-sm text-[#667781] text-center py-8">{isAr ? 'لا توجد محادثات.' : 'No chats found.'}</p>}
            {filteredContacts.map((contact) => {
              const visible = contact.messages.filter((m) => m.audience !== 'staff' && (!m.childId || m.childId === activeChild.id));
              const last = visible[visible.length - 1];
              return (
                <ChatListRow
                  key={contact.id}
                  avatar={<Avatar initial={contact.avatarInitial} bg={contact.avatarBg} text={contact.avatarTextColor} size={50} online={contact.online} />}
                  name={contact.name}
                  role={contact.roleTitle}
                  time={contact.timestamp}
                  preview={last ? messagePreview(last, isAr) : contact.lastMessage}
                  unread={contact.unreadCount || 0}
                  mineLast={!!last?.isParent}
                  onClick={() => { setActiveContactId(contact.id); markContactRead(contact.id); }}
                />
              );
            })}
          </div>
        </div>
      );
    }

    // One conversation: green bar, wallpaper with bubbles, rounded input.
    const visibleMsgs = activeContact.messages.filter((m) => m.audience !== 'staff' && (!m.childId || m.childId === activeChild.id));
    const iconBtn = 'w-9 h-9 rounded-full hover:bg-white/10 active:scale-95 flex items-center justify-center transition';
    return (
      <div className="flex flex-col h-[calc(var(--app-h)-192px)] mb-[84px] md:mb-4 md:h-[calc(var(--app-h)-180px)] animate-in fade-in" data-testid="chat-view">
        <div className="flex-1 min-h-0 flex flex-col rounded-2xl overflow-hidden border border-[#E9EDEF] dark:border-[#222D34] shadow-card">
          <ChatHeader
            onBack={() => setActiveContactId(null)}
            backLabel={isAr ? 'المحادثات' : 'Back to chats'}
            avatar={<Avatar initial={activeContact.avatarInitial} bg={activeContact.avatarBg} text={activeContact.avatarTextColor} size={40} online={activeContact.online} />}
            title={activeContact.name}
            subtitle={`${activeContact.online ? (isAr ? 'متصل الآن' : 'online') : (isAr ? 'آخر ظهور أمس' : 'last seen yesterday')} · ${activeContact.roleTitle}`}
            actions={
              <>
                <button
                  onClick={() => {
                    const discMap: Record<string, string> = { 'contact-slp': 'speech', 'contact-ot': 'ot', 'contact-bcba': 'behavior', 'contact-teacher': 'teacher' };
                    setTargetFilterDiscipline(discMap[activeContact.id] || 'all');
                    setActiveTab('Targets');
                  }}
                  className={iconBtn}
                  aria-label={isAr ? 'أهداف هذا المختص' : "This specialist's goals"}
                  title={isAr ? 'أهداف هذا المختص' : "This specialist's goals"}
                ><TargetIcon className="w-5 h-5" /></button>
                <button onClick={() => { setBookSpecialist(activeContact.name); setShowBookSessionModal(true); }} className={iconBtn} aria-label={isAr ? 'حجز جلسة' : 'Book a session'} title={isAr ? 'حجز جلسة' : 'Book a session'}><Calendar className="w-5 h-5" /></button>
                <button onClick={() => { setTelehealthSpecialist(activeContact.name); setShowTelehealthModal(true); }} className={iconBtn} aria-label={isAr ? 'مكالمة فيديو' : 'Video call'} title={isAr ? 'مكالمة فيديو' : 'Video call'}><Video className="w-5 h-5" /></button>
              </>
            }
          />
          <ChatThread
            messages={visibleMsgs}
            isMine={(m) => m.isParent}
            unreadByOther={activeContact.unreadStaff || 0}
            isAr={isAr}
            showNames
            emptyText={isAr ? 'لا توجد رسائل بعد. اكتب رسالتك الأولى.' : 'No messages yet. Write your first message.'}
            notice={isAr ? 'الرسائل هنا مشتركة فقط مع فريق رعاية طفلك.' : 'Messages here are shared only with your child’s care team.'}
          />
          <ChatComposer
            isAr={isAr}
            label={isAr ? 'رسالة إلى المختص' : 'Message to specialist'}
            placeholder={isAr ? 'اكتب رسالة' : 'Type a message'}
            notify={showNotification}
            onSend={(text, attachment) => sendContactMessage(activeContact.id, text, undefined, attachment)}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md md:max-w-6xl mx-auto px-4 md:px-8 pt-3 md:pt-6">
      {activeTab.toLowerCase() === 'home' && renderHomeTab()}
      {activeTab.toLowerCase() === 'progress' && renderProgressTab()}
      {activeTab.toLowerCase() === 'targets' && renderTargetsTab()}
      {activeTab.toLowerCase() === 'sessions' && renderSessionsTab()}
      {activeTab.toLowerCase() === 'records' && <MedicalRecordsPanel mode="parent" />}
      {activeTab.toLowerCase() === 'messages' && renderMessagesTab()}

      {/* MODAL 1: CONSENT CENTER */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-float animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#E8E2D9] dark:border-[#2F2952] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white">
                    {isAr ? 'مركز موافقة ولي الأمر' : 'Parent Consent Center'}
                  </h3>
                  <p className="text-[11px] text-[#6B6785] dark:text-gray-400">
                    Saudi PDPL compliant granular privacy controls
                  </p>
                </div>
              </div>
              <button onClick={() => setShowConsentModal(false)} className="text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <p className="text-xs text-[#6B6785] dark:text-gray-300 leading-relaxed">
                You maintain custody of Lama's record. Toggle specific domains on or off for each specialist. Changes take effect immediately.
              </p>

              <div className="space-y-3">
                {consentGrants.map((grant) => (
                  <div key={grant.id} className="p-4 rounded-2xl bg-[#FAF6F0] dark:bg-[#252044] border border-[#E8E2D9] dark:border-[#38325E]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-xs text-[#1F1B3A] dark:text-white">{grant.professionalName}</span>
                      <span className="text-[10px] text-teal-700 dark:text-teal-300 font-semibold">Active Grant</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { key: 'communication', label: 'Communication' },
                        { key: 'math', label: 'Math & Cognition' },
                        { key: 'fineMotor', label: 'Fine Motor' },
                        { key: 'dressing', label: 'Dressing & ADL' },
                        { key: 'attention', label: 'Attention' },
                        { key: 'clinicalNotes', label: 'Clinical Notes' },
                      ].map((domain) => {
                        const isGranted = grant.domains[domain.key as keyof typeof grant.domains];
                        return (
                          <button
                            key={domain.key}
                            onClick={() => updateConsentGrant(grant.id, domain.key as any, !isGranted)}
                            className={`p-2 rounded-xl text-left rtl:text-right border transition flex justify-between items-center ${
                              isGranted
                                ? 'bg-white dark:bg-[#1F1B3A] border-teal-400 text-teal-800 dark:text-teal-200 font-semibold'
                                : 'bg-gray-100 dark:bg-gray-800 border-gray-300 text-gray-400 line-through'
                            }`}
                          >
                            <span className="text-[11px]">{domain.label}</span>
                            <span>{isGranted ? '✓' : '×'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-[#E8E2D9] dark:border-[#2F2952]">
              <button
                onClick={() => setShowConsentModal(false)}
                className="w-full py-3 rounded-xl bg-[#0D9488] text-white font-semibold text-xs shadow-warm"
              >
                Save & Enforce Privacy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: 60-SECOND DEMO VIDEO */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1F1B3A] rounded-3xl max-w-sm w-full overflow-hidden shadow-float">
            <div className="p-4 border-b border-[#E8E2D9] dark:border-[#2F2952] flex justify-between items-center">
              <h3 className="font-heading font-bold text-sm text-[#1F1B3A] dark:text-white">
                Start Home Practice
              </h3>
              <button onClick={() => setShowVideoModal(false)} className="text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-slate-900 aspect-video flex flex-col items-center justify-center p-4 text-white">
              <div className="w-12 h-12 rounded-full bg-[#0D9488] flex items-center justify-center shadow-lg animate-pulse mb-2">
                <Play className="w-6 h-6 fill-current text-white ml-0.5" />
              </div>
              <p className="text-xs font-medium text-center text-gray-200">
                Dr. Sarah Alharbi demonstrates snack-time WH question routine
              </p>
            </div>

            <div className="p-4 space-y-2 bg-[#FAF6F0] dark:bg-[#252044]">
              <p className="text-xs font-semibold text-[#1F1B3A] dark:text-white">Quick steps:</p>
              <ol className="text-xs text-[#6B6785] dark:text-gray-300 space-y-1 list-decimal list-inside">
                <li>Place snack within sight but just out of direct reach.</li>
                <li>Ask: "Where is the apple?" and wait 4 seconds.</li>
                <li>If no response, point to the item rather than answering.</li>
                <li>Celebrate immediately and hand them the snack!</li>
              </ol>
            </div>

            <div className="p-3 border-t border-[#E8E2D9] dark:border-[#2F2952]">
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  setShowWeDidItModal(true);
                }}
                className="w-full py-2.5 rounded-xl bg-[#0D9488] text-white text-xs font-semibold"
              >
                Ready to Record Session ("We Did It!")
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: WE DID IT CHECK-IN */}
      {showWeDidItModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1F1B3A] rounded-3xl max-w-sm w-full p-5 shadow-float space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white">
                  Record Home Session
                </h3>
              </div>
              <button onClick={() => setShowWeDidItModal(false)} className="text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#1F1B3A] dark:text-white mb-1.5">
                Engagement & Success Rating (1-5):
              </p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setPracticeRating(star)} className="p-1">
                    <Star className={`w-6 h-6 ${star <= practiceRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1F1B3A] dark:text-white block mb-1">
                Parent observation note:
              </label>
              <textarea
                value={practiceNotes}
                onChange={(e) => setPracticeNotes(e.target.value)}
                placeholder="e.g. Lama pointed and said 'Where apple' independently on the first try!"
                className="w-full text-xs p-3 rounded-xl border border-[#E8E2D9] dark:border-gray-700 bg-[#FAF6F0] dark:bg-gray-800 text-[#1F1B3A] dark:text-white outline-hidden h-20 resize-none"
              />
            </div>

            <button
              onClick={handleCompletePractice}
              className="w-full py-3 rounded-2xl bg-[#0D9488] hover:bg-[#0B7A70] text-white font-semibold text-xs shadow-warm flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit & Sync with Specialists</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: TARGET CLINICAL INSPECTOR & SESSION TIMELINE */}
      {selectedTargetForDetail && !showAddTargetHomePractice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-float animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#E8E2D9] dark:border-[#2F2952] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-[#4F46E5] shrink-0 font-bold">
                  🎯
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F46E5] dark:text-indigo-400">
                    Clinical Goal Inspector
                  </span>
                  <h3 className="font-heading font-bold text-sm sm:text-base text-[#1F1B3A] dark:text-white leading-tight">
                    {selectedTargetForDetail.name}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedTargetForDetail(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Origin & Lead Specialist Banner */}
              <div className="p-3.5 rounded-2xl bg-[#FAF6F0] dark:bg-[#252044] border border-[#E8E2D9] dark:border-[#38325E] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1F1B3A] dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Goal Origin & Clinical Lead</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-[#1F1B3A] text-[#4F46E5] border border-indigo-200 dark:border-indigo-800">
                    {selectedTargetForDetail.discipline.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-[#6B6785] dark:text-gray-300">
                  {selectedTargetForDetail.origin || 'Established in Annual Multidisciplinary IEP Review'}
                </p>
                <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  Lead Specialist: {selectedTargetForDetail.therapistName || 'Clinical Lead'}
                </p>
              </div>

              {/* Baseline vs Current vs Mastery Gauge */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#252044] border border-[#E8E2D9] dark:border-[#38325E] space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#6B6785] dark:text-gray-300">
                  <span>Baseline: {selectedTargetForDetail.baseline || 20}%</span>
                  <span className="font-bold text-sm text-[#1F1B3A] dark:text-white">Current: {selectedTargetForDetail.currentPerformance}%</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">Goal: {selectedTargetForDetail.criterionThreshold}%</span>
                </div>

                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, selectedTargetForDetail.currentPerformance)}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#6B6785] dark:text-gray-400 pt-0.5">
                  <span>Mastery Criterion: {selectedTargetForDetail.masteryCriterion}</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedTargetForDetail.status === 'mastered' ? 'Mastered ✓' : 'In Teaching'}
                  </span>
                </div>
              </div>

              {/* Rolling 3 Sessions History */}
              <div className="p-3.5 rounded-2xl bg-[#FAF6F0] dark:bg-[#252044] border border-[#E8E2D9] dark:border-[#38325E] space-y-2">
                <h5 className="font-bold uppercase tracking-wider text-[10px] text-[#6B6785] dark:text-gray-400">
                  Rolling 3-Session Mastery Tracker
                </h5>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {selectedTargetForDetail.lastThreeSessions.map((score, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border ${
                        score >= selectedTargetForDetail.criterionThreshold
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                          : 'bg-white dark:bg-[#1F1B3A] border-[#E8E2D9] dark:border-gray-700 text-[#1F1B3A] dark:text-gray-300'
                      }`}
                    >
                      <span className="text-[10px] block font-semibold text-[#6B6785]">Session {idx + 1}</span>
                      <span className="font-mono font-bold text-sm">{score}%</span>
                      <span className="text-[9px] block font-medium mt-0.5">
                        {score >= selectedTargetForDetail.criterionThreshold ? 'Passed ✓' : 'Developing'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operational Definition */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252044] border border-[#E8E2D9] dark:border-[#38325E] space-y-1">
                <h5 className="font-bold uppercase tracking-wider text-[10px] text-[#6B6785] dark:text-gray-400">
                  Operational Definition
                </h5>
                <p className="text-xs text-[#1F1B3A] dark:text-gray-200 leading-relaxed">
                  {selectedTargetForDetail.operationalDefinition}
                </p>
              </div>

              {/* Contributing Clinical Sessions Feed */}
              <div className="space-y-2 pt-1">
                <h5 className="font-bold uppercase tracking-wider text-[10px] text-[#6B6785] dark:text-gray-400 flex items-center justify-between">
                  <span>How This Progress Was Recorded (Session History)</span>
                  <span className="text-teal-700 dark:text-teal-400">Live Feeds</span>
                </h5>

                <div className="space-y-2">
                  {(selectedTargetForDetail.contributingSessions || [
                    { id: 'cs-1', date: 'Oct 10, 2026', therapistName: selectedTargetForDetail.therapistName || 'Therapist', scorePercent: selectedTargetForDetail.currentPerformance, notes: 'Targeted trial cycles with prompt fading.', trialsRecorded: '10 trials recorded', source: 'Clinic Session' }
                  ]).map((cs) => (
                    <div
                      key={cs.id}
                      className="p-3 rounded-2xl bg-[#FAF6F0] dark:bg-[#252044] border border-[#E8E2D9] dark:border-[#38325E] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#1F1B3A] dark:text-white">
                          {cs.therapistName}
                        </span>
                        <span className="font-mono font-bold text-xs text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-md">
                          {cs.scorePercent}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#6B6785] dark:text-gray-400">
                        <span>{cs.date} • {cs.source}</span>
                        {cs.trialsRecorded && <span className="font-medium text-[#4F46E5]">{cs.trialsRecorded}</span>}
                      </div>

                      <p className="text-[11px] text-[#1F1B3A] dark:text-gray-300 italic">
                        "{cs.notes}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-3.5 border-t border-[#E8E2D9] dark:border-[#2F2952] flex items-center gap-2">
              <button
                onClick={() => setShowAddTargetHomePractice(true)}
                className="flex-1 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0B7A70] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Log Home Practice Observation</span>
              </button>

              <button
                onClick={() => {
                  setSelectedTargetForDetail(null);
                  setActiveTab('Messages');
                  setActiveContactId('contact-slp');
                }}
                className="py-2.5 px-3.5 rounded-xl border border-[#E8E2D9] dark:border-gray-700 text-xs font-bold text-[#4F46E5] dark:text-indigo-400 hover:bg-gray-50"
              >
                Message Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: LOG HOME PRACTICE FOR SPECIFIC TARGET */}
      {selectedTargetForDetail && showAddTargetHomePractice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1F1B3A] rounded-3xl max-w-sm w-full p-5 shadow-float space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D9488]">Parent Data Entry</span>
                <h3 className="font-heading font-bold text-sm sm:text-base text-[#1F1B3A] dark:text-white">
                  Log Trial for: {selectedTargetForDetail.name}
                </h3>
              </div>
              <button onClick={() => setShowAddTargetHomePractice(false)} className="text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#6B6785] block mb-1">
                  Observed Success Rate Today ({parentQuickPracticeScore}%)
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={parentQuickPracticeScore}
                  onChange={(e) => setParentQuickPracticeScore(Number(e.target.value))}
                  className="w-full accent-[#0D9488]"
                />
                <div className="flex justify-between text-[10px] text-[#6B6785] mt-1 font-mono">
                  <span>50% (Prompted)</span>
                  <span className="font-bold text-[#0D9488]">{parentQuickPracticeScore}%</span>
                  <span>100% (Independent)</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#6B6785] block mb-1">
                  Home Practice Routine Note:
                </label>
                <textarea
                  value={parentQuickPracticeNote}
                  onChange={(e) => setParentQuickPracticeNote(e.target.value)}
                  placeholder="e.g. Practiced with snack choice board. Lama answered 'Where apple' independently on 4 out of 5 attempts!"
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-[#E8E2D9] dark:border-gray-700 bg-[#FAF6F0] dark:bg-gray-800 text-[#1F1B3A] dark:text-white outline-hidden"
                />
              </div>
            </div>

            <button
              onClick={() => {
                addSessionResult(
                  selectedTargetForDetail.id,
                  parentQuickPracticeScore,
                  parentQuickPracticeNote || 'Parent home practice session logged.'
                );
                setShowAddTargetHomePractice(false);
                setSelectedTargetForDetail(null);
                triggerConfetti();
                showNotification(`Home practice recorded! Target updated to ${parentQuickPracticeScore}% independent.`);
              }}
              className="w-full py-3 rounded-2xl bg-[#0D9488] hover:bg-[#0B7A70] text-white font-bold text-xs shadow-warm flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit & Sync with Clinical Team</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 6: DOMAIN DEEP-DIVE DRAWER */}
      {selectedDomainForDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-3xl max-w-sm w-full p-5 shadow-float space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[#0D9488]" />
                <h3 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white">
                  {selectedDomainForDetail}
                </h3>
              </div>
              <button onClick={() => setSelectedDomainForDetail(null)} className="text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#6B6785] dark:text-gray-300">
              Clinical milestones achieved and ongoing therapy interventions for Lama Alharbi in {selectedDomainForDetail}.
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200">
                <p className="font-bold text-xs">Active Focus Target:</p>
                <p className="text-[11px] mt-0.5">
                  {selectedDomainForDetail.includes('Speech')
                    ? 'Answering "Where" and "What" questions spontaneously across 3 settings.'
                    : selectedDomainForDetail.includes('Motor')
                    ? 'Fastening 1-inch buttons on dressing vest and maintaining tripod pencil grasp.'
                    : selectedDomainForDetail.includes('Learning')
                    ? '1-to-1 counting correspondence using token counters 1-10.'
                    : 'Peer greeting and answering questions in group circle time.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF6F0] dark:bg-[#252044] space-y-1 text-[#6B6785] dark:text-gray-400 text-[11px]">
                <p className="font-bold text-[#1F1B3A] dark:text-white">Home Practice Recommendations:</p>
                <p>• Practice during daily routines (breakfast, afternoon reading, bedtime).</p>
                <p>• Provide 4-second processing delay before assisting.</p>
                <p>• Celebrate small steps immediately with praise and tokens.</p>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedDomainForDetail(null);
                setActiveTab('Targets');
              }}
              className="w-full py-2.5 rounded-xl bg-[#4F46E5] text-white font-semibold text-xs shadow-xs"
            >
              View Active Targets in this Domain
            </button>
          </div>
        </div>
      )}

      {/* MODAL 7: TELEHEALTH ENCRYPTED VIDEO CALL (Root Level Access) */}
      {showTelehealthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1733] text-white rounded-3xl max-w-sm w-full overflow-hidden shadow-float flex flex-col h-[520px] animate-in fade-in zoom-in-95">
            {/* Call Header */}
            <div className="p-3.5 bg-black/40 flex items-center justify-between">
              <div>
                <h4 className="font-heading font-bold text-xs">{telehealthSpecialist}</h4>
                <p className="text-[10px] text-emerald-400">● Encrypted HD Telehealth Consultation</p>
              </div>
              <span className="text-xs font-mono font-bold bg-white/10 px-2.5 py-0.5 rounded-full">12:35</span>
            </div>

            {/* Video Main Feed */}
            <div className="flex-1 relative bg-slate-900 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80"
                alt="Therapist Video"
                className="w-full h-full object-cover"
              />
              {/* Picture in picture self-view */}
              <div className="absolute bottom-3 right-3 w-24 h-32 bg-slate-800 border-2 border-white/20 rounded-2xl overflow-hidden shadow-lg">
                {!telehealthVideoOff ? (
                  <img
                    src="https://images.unsplash.com/photo-1595454223600-91fb57d22457?w=200&auto=format&fit=crop&q=80"
                    alt="Self View"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900 text-xs text-gray-400">
                    Camera Off
                  </div>
                )}
              </div>
            </div>

            {/* Call Controls */}
            <div className="p-4 bg-black/60 flex items-center justify-around">
              <button
                onClick={() => setTelehealthMuted(!telehealthMuted)}
                className={`p-3 rounded-full transition ${telehealthMuted ? 'bg-rose-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                title={telehealthMuted ? 'Unmute' : 'Mute'}
              >
                {telehealthMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setTelehealthVideoOff(!telehealthVideoOff)}
                className={`p-3 rounded-full transition ${telehealthVideoOff ? 'bg-rose-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                title={telehealthVideoOff ? 'Turn Video On' : 'Turn Video Off'}
              >
                {telehealthVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              <button
                onClick={() => {
                  setShowTelehealthModal(false);
                  showNotification('Telehealth consultation completed.');
                }}
                className="p-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg"
                title="End Consultation"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: BOOK / REQUEST SESSION (Root Level Access) */}
      {showBookSessionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1F1B3A] rounded-3xl max-w-sm w-full p-5 shadow-float space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white">
                Book / Request Session
              </h3>
              <button onClick={() => setShowBookSessionModal(false)} className="text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-bold text-[#6B6785] block mb-1">Select Specialist</label>
                <select
                  value={bookSpecialist}
                  onChange={(e) => setBookSpecialist(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E8E2D9] dark:border-gray-700 bg-[#FAF6F0] dark:bg-gray-800 text-[#1F1B3A] dark:text-white font-medium"
                >
                  <option>Dr. Sarah Alharbi (Lead SLP)</option>
                  <option>Reem Al-Ahmad (OT Specialist)</option>
                  <option>Dr. Tareq Hassan (BCBA)</option>
                  <option>Ms. Layla Fahad (Special Educator)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#6B6785] block mb-1">Session Format</label>
                <select
                  value={bookType}
                  onChange={(e) => setBookType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E8E2D9] dark:border-gray-700 bg-[#FAF6F0] dark:bg-gray-800 text-[#1F1B3A] dark:text-white font-medium"
                >
                  <option>In-Person Clinic Visit (Room 204)</option>
                  <option>Encrypted Telehealth HD Video</option>
                  <option>Home Environment Routine Visit</option>
                  <option>Classroom Observation Slot</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#6B6785] block mb-1">Preferred Date</label>
                  <input
                    type="date"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#E8E2D9] dark:border-gray-700 bg-[#FAF6F0] dark:bg-gray-800 text-[#1F1B3A] dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#6B6785] block mb-1">Time Slot</label>
                  <select
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#E8E2D9] dark:border-gray-700 bg-[#FAF6F0] dark:bg-gray-800 text-[#1F1B3A] dark:text-white"
                  >
                    <option>10:00 AM</option>
                    <option>11:00 AM</option>
                    <option>02:00 PM</option>
                    <option>04:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#6B6785] block mb-1">Parent Note or Goal Request</label>
                <textarea
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  placeholder="e.g. Focus on dressing button vest and requesting water."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-[#E8E2D9] dark:border-gray-700 bg-[#FAF6F0] dark:bg-gray-800 text-[#1F1B3A] dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setShowBookSessionModal(false);
                showNotification(`Appointment requested with ${bookSpecialist} for ${bookDate} at ${bookTime}. Specialist notified!`);
              }}
              className="w-full py-3 rounded-2xl bg-[#0D9488] hover:bg-[#0B7A70] text-white font-bold text-xs shadow-warm"
            >
              Confirm & Send Request
            </button>
          </div>
        </div>
      )}

      {/* MODAL 9: HARD DAY / COMPASSIONATE SUPPORT MODE */}
      {showHardDayModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-3xl max-w-sm w-full p-5 shadow-float space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xl">💛</span>
                <div>
                  <h3 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white">
                    Support Mode
                  </h3>
                  <p className="text-[10px] text-[#6B6785] dark:text-gray-400">
                    We're here for you and Lama
                  </p>
                </div>
              </div>
              <button onClick={() => setShowHardDayModal(false)} className="text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#6B6785] dark:text-gray-300 leading-relaxed">
              Every child has challenging days. Alerting your care team enables Dr. Sarah, Dr. Tareq, and Reem to apply lower demands and sensory regulation routines in the next sessions.
            </p>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-[#1F1B3A] dark:text-white block">
                Primary difficulty today:
              </label>
              {[
                'Sensory overload / loud surroundings',
                'Difficult transition or unexpected routine change',
                'Low sleep / elevated fatigue',
                'Communication frustration / receptive difficulty'
              ].map((reason, idx) => (
                <label key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-[#FAF6F0] dark:bg-[#252044] border border-[#E8E2D9] dark:border-[#38325E] cursor-pointer">
                  <input type="radio" name="hardDayReason" defaultChecked={idx === 0} className="accent-amber-500" />
                  <span className="text-[11px] text-[#1F1B3A] dark:text-gray-200">{reason}</span>
                </label>
              ))}

              <div className="pt-1">
                <label className="font-bold text-[#6B6785] block mb-1">
                  Optional note for specialists:
                </label>
                <textarea
                  value={hardDayNotes}
                  onChange={(e) => setHardDayNotes(e.target.value)}
                  placeholder="e.g. Lama was sensitive to bright lights after school..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-[#E8E2D9] dark:border-gray-700 bg-[#FAF6F0] dark:bg-gray-800 text-[#1F1B3A] dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={handleSendHardDay}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-warm flex items-center justify-center gap-2"
            >
              <span>Alert Team for Gentle Support</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
