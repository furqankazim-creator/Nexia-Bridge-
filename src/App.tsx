/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen, groupOf, type RoleGroup } from './components/auth/AuthScreen';
import type { RoleType } from './types';
import { Header } from './components/common/Header';
import { BottomTabBar } from './components/common/BottomTabBar';
import { LaunchScreen } from './components/launch/LaunchScreen';
import { ParentPortal } from './components/parent/ParentPortal';
import { BehaviorPortal } from './components/behavior/BehaviorPortal';
import { SpeechPortal } from './components/speech/SpeechPortal';
import { OTPortal } from './components/ot/OTPortal';
import { RemedialPortal } from './components/remedial/RemedialPortal';
import { TeacherPortal } from './components/teacher/TeacherPortal';
import { SupervisorPortal } from './components/supervisor/SupervisorPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { ChildScheduleMode } from './components/child/ChildScheduleMode';
import { PromptAuditModal } from './components/common/PromptAuditModal';
import { NotificationsModal } from './components/common/NotificationsModal';
import { SettingsModal } from './components/common/SettingsModal';
import { Sparkles } from 'lucide-react';

const MainContent: React.FC = () => {
  const { role, childScheduleMode, notification } = useApp();
  const [showAuditModal, setShowAuditModal] = useState(false);

  return (
    <div className="app-backdrop">
      <div className="app-frame text-[#1F1B3A] dark:text-white font-sans">
        {/* Toast Notification */}
        {notification && (
          <div className="absolute top-[calc(env(safe-area-inset-top)+1rem)] left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 w-[90%] max-w-md pointer-events-none">
            <div className="bg-[#1F1B3A] dark:bg-white text-white dark:text-[#1F1B3A] px-4 py-2.5 rounded-2xl shadow-float text-xs font-semibold flex items-center gap-2 border border-white/10 dark:border-gray-800">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">{notification}</span>
            </div>
          </div>
        )}

        {/* Render Portal by Role */}
        {!role ? (
          <div className="app-scroll">
            <LaunchScreen />
          </div>
        ) : (
          <>
            <Header onOpenAudit={() => setShowAuditModal(true)} />
            <div className="flex-1 min-h-0 flex flex-col md:flex-row relative">
              <BottomTabBar />
              <main className="app-scroll flex-1">
                  {role === 'parent' && <ParentPortal />}
                {role === 'behavior' && <BehaviorPortal />}
                {role === 'speech' && <SpeechPortal />}
                {role === 'ot' && <OTPortal />}
                {role === 'remedial' && <RemedialPortal />}
                {role === 'teacher' && <TeacherPortal />}
                {role === 'supervisor' && <SupervisorPortal />}
                {role === 'admin' && <AdminPortal />}
              </main>
            </div>
          </>
        )}

        {/* Child Schedule Mode Overlay */}
        {childScheduleMode && <ChildScheduleMode />}

        {/* Prompt Audit Modal */}
        <PromptAuditModal isOpen={showAuditModal} onClose={() => setShowAuditModal(false)} />

        {/* Global Notifications Modal (Bell icon across all portals) */}
        <NotificationsModal />

        {/* Global Settings Modal (Gear icon across all portals) */}
        <SettingsModal />
      </div>
    </div>
  );
};

/** The real system, signed out: the welcome page first, then the sign-in page for the portal that was chosen. */
function SignedOut() {
  type Step = { screen: 'landing' } | { screen: 'auth'; mode: 'login' | 'register'; group?: RoleGroup; role?: RoleType };
  const [step, setStep] = useState<Step>({ screen: 'landing' });
  const toLanding = () => setStep({ screen: 'landing' });
  return (
    // The provider only supplies language and dark mode here; nothing is signed in yet.
    <AppProvider key="signed-out">
      <div className="app-backdrop">
        <div className="app-frame text-[#1F1B3A] dark:text-white font-sans">
          <div className="app-scroll">
            {step.screen === 'landing' ? (
              <LaunchScreen
                onChoose={(r) => setStep({ screen: 'auth', mode: 'login', group: groupOf(r), role: r })}
                onSignIn={() => setStep({ screen: 'auth', mode: 'login' })}
                onCreate={() => setStep({ screen: 'auth', mode: 'register' })}
              />
            ) : (
              <AuthScreen key={`${step.mode}-${step.role ?? ''}`} initialMode={step.mode} group={step.group} role={step.role} onBack={toLanding} />
            )}
          </div>
        </div>
      </div>
    </AppProvider>
  );
}

function Gate() {
  const auth = useAuth();

  if (auth.gate === 'checking') {
    return (
      <div className="app-backdrop">
        <div className="app-frame text-[#1F1B3A] font-sans">
          <div className="app-scroll">
            <AuthScreen />
          </div>
        </div>
      </div>
    );
  }
  if (auth.gate === 'login') return <SignedOut />;
  // Keyed by account so signing out / in as someone else starts from a clean state.
  return (
    <AppProvider key={auth.user?.id ?? 'demo'}>
      <MainContent />
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
