import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { RoleType } from '../../types';
import { LaunchScreen } from './LaunchScreen';
import { AuthScreen, groupOf, type RoleGroup } from '../auth/AuthScreen';

type Step = { screen: 'landing' } | { screen: 'auth'; mode: 'login' | 'register'; group?: RoleGroup; role?: RoleType };

/**
 * The way in, the same for the real system and the practice version:
 * welcome page -> the portal you pick -> its sign-in page -> the portal.
 * The browser's Back button steps back through it, and every step opens at the top.
 */
export const EntryFlow: React.FC<{ real: boolean }> = ({ real }) => {
  const { setRole } = useApp();
  const [step, setStep] = useState<Step>({ screen: 'landing' });

  const go = (next: Step) => {
    if (next.screen === 'auth') window.history.pushState({ entry: 'auth' }, '');
    setStep(next);
  };
  const back = () => {
    if (window.history.state?.entry === 'auth') window.history.back();
    else setStep({ screen: 'landing' });
  };

  useEffect(() => {
    const onPop = () => setStep({ screen: 'landing' });
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Each step opens at the top of the page.
  useEffect(() => {
    document.querySelectorAll('.app-scroll').forEach((e) => { e.scrollTop = 0; });
  }, [step.screen]);

  return (
    <div key={step.screen === 'auth' ? `auth-${step.mode}-${step.role ?? ''}` : 'landing'} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {step.screen === 'landing' ? (
        <LaunchScreen
          demo={!real}
          onChoose={(r) => go({ screen: 'auth', mode: 'login', group: groupOf(r), role: r })}
          onSignIn={() => go({ screen: 'auth', mode: 'login' })}
          onCreate={real ? () => go({ screen: 'auth', mode: 'register' }) : undefined}
        />
      ) : (
        <AuthScreen
          initialMode={step.mode}
          group={step.group}
          role={step.role}
          onBack={back}
          demo={real ? undefined : { onEnter: (r) => { setStep({ screen: 'landing' }); setRole(r); } }}
        />
      )}
    </div>
  );
};
