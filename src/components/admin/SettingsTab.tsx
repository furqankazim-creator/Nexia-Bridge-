import React, { useState } from 'react';
import { Copy, KeyRound, LogOut, Moon, Globe, Sun } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getApiUrl, type OrgSettings, type SettingsPatch } from '../../api/client';
import { demoOrg, resetDemoAdmin } from './demoAdmin';
import type { AdminData } from './useAdminData';
import { BTN, BTN_DANGER, BTN_GHOST, CARD, Field, INPUT } from './adminUi';

interface Props { data: AdminData; isServerMode: boolean; notify: (m: string) => void; onOpen: (s: 'audit' | 'roles') => void }

const Toggle: React.FC<{ on: boolean; label: string; hint: string; disabled?: boolean; onChange: (v: boolean) => void; id: string }> = ({ on, label, hint, disabled, onChange, id }) => (
  <div className="flex items-start justify-between gap-3 py-3">
    <div className="min-w-0"><p className="text-sm font-semibold">{label}</p><p className="text-[11px] text-[#6B6785]">{hint}</p></div>
    <button type="button" role="switch" aria-checked={on} aria-label={label} data-testid={id} disabled={disabled} onClick={() => onChange(!on)} className={`relative w-11 h-6 rounded-full shrink-0 transition disabled:opacity-50 ${on ? 'bg-[#4F46E5]' : 'bg-gray-300 dark:bg-gray-600'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  </div>
);

const NumberRow: React.FC<{ label: string; hint: string; unit: string; value: number; min: number; max: number; disabled?: boolean; id: string; onSave: (n: number) => void }> = ({ label, hint, unit, value, min, max, disabled, id, onSave }) => {
  const [v, setV] = useState(String(value));
  const [seen, setSeen] = useState(value);
  if (seen !== value) { setSeen(value); setV(String(value)); }
  const n = Number(v);
  const bad = v.trim() === '' || !Number.isInteger(n) || n < min || n > max;
  return (
    <form noValidate className="py-3 space-y-1" onSubmit={(e) => { e.preventDefault(); if (!bad && n !== value) onSave(n); }}>
      <label className="text-sm font-semibold block" htmlFor={id}>{label}</label>
      <p className="text-[11px] text-[#6B6785]">{hint}</p>
      <div className="flex items-center gap-2">
        <input id={id} data-testid={id} inputMode="numeric" disabled={disabled} value={v} onChange={(e) => setV(e.target.value)} className={`${INPUT} !w-24`} />
        <span className="text-xs text-[#6B6785]">{unit}</span>
        <button type="submit" disabled={disabled || bad || n === value} className={BTN}>Save</button>
      </div>
      {bad && <p role="alert" className="text-[11px] text-rose-700">Enter a whole number from {min} to {max}.</p>}
    </form>
  );
};

const Section: React.FC<{ title: string; sub?: string; children: React.ReactNode }> = ({ title, sub, children }) => (
  <section className={`${CARD} space-y-1 md:mb-4 break-inside-avoid`}>
    <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5]">{title}</h3>
    {sub && <p className="text-xs text-[#6B6785] pb-1">{sub}</p>}
    {children}
  </section>
);

/** Administrator settings: how the whole app is run, not one person's preferences. */
export const SettingsTab: React.FC<Props> = ({ data, isServerMode, notify, onOpen }) => {
  const { settings, canEditSettings, run, busy, api } = data;
  const { language, toggleLanguage, darkMode, toggleDarkMode, setOrgSettings, logout } = useApp();
  const [name, setName] = useState('');
  const [nameFor, setNameFor] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);

  if (!settings) return <div className={CARD}><p className="text-sm text-[#6B6785]">Loading settings…</p></div>;
  if (nameFor !== settings.name) { setNameFor(settings.name); setName(settings.name); }
  const edit = !canEditSettings;

  const apply = async (patch: SettingsPatch, ok: string) => {
    const done = await run(() => api.patchSettings(patch).then((r) => { setOrgSettings({ name: r.settings.name, requireGoalApproval: r.settings.policy.requireGoalApproval, parentMessaging: r.settings.policy.parentMessaging, integrityMin: r.settings.policy.integrityMin, ioaMin: r.settings.policy.ioaMin, observationDays: r.settings.policy.observationDays, stalledDays: r.settings.policy.stalledDays }); return r; }), ok);
    return done;
  };
  const flip = (group: 'access' | 'policy', key: string, v: boolean, label: string) => void apply({ [group]: { [key]: v } } as SettingsPatch, `${label} ${v ? 'on' : 'off'}.`);
  const copy = async (text: string, msg: string) => { try { await navigator.clipboard.writeText(text); notify(msg); } catch { notify('Copy is not available here.'); } };
  const s: OrgSettings = settings;

  return (
    <div className="space-y-4 pb-28 md:pb-12 animate-in fade-in">
      <div>
        <h2 className="font-heading text-2xl font-bold">Settings</h2>
        <p className="text-sm text-[#6B6785]">How the whole app is run{edit ? ' (view only: centre administrators cannot change these)' : ''}</p>
      </div>

      <div className="space-y-4 md:space-y-0 md:columns-2 md:gap-4">
      <Section title="Organization" sub="The name shown in every portal’s header.">
        <form noValidate className="space-y-2" onSubmit={(e) => { e.preventDefault(); if (name.trim().length >= 2 && name.trim() !== s.name) void apply({ name: name.trim() }, 'Organization name saved.'); }}>
          <Field label="Organization name"><input aria-label="Organization name" disabled={edit} value={name} onChange={(e) => setName(e.target.value)} className={INPUT} dir="auto" /></Field>
          <button type="submit" disabled={edit || busy || name.trim().length < 2 || name.trim() === s.name} className={BTN}>Save name</button>
        </form>
      </Section>

      <Section title="Access and sign-up" sub="Who can create their own account.">
        <div className="divide-y divide-[#E8E2D9]/60 dark:divide-[#38325E]">
          <Toggle id="tg-staff-signup" on={s.access.staffSelfRegistration} disabled={edit || busy} label="Staff can sign up with the invite code" hint="Off: only you can create staff accounts." onChange={(v) => flip('access', 'staffSelfRegistration', v, 'Staff sign-up')} />
          <Toggle id="tg-family-signup" on={s.access.familySignup} disabled={edit || busy} label="Families can sign up with a child code" hint="Off: parents cannot join until you switch this on." onChange={(v) => flip('access', 'familySignup', v, 'Family sign-up')} />
        </div>
        {s.staffCode !== null && (
          <div className="rounded-xl bg-[#FAF6F0] dark:bg-[#252044] p-3 space-y-2 mt-2" data-testid="staff-code-box">
            <p className="text-xs font-bold flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" /> Staff invite code</p>
            <div className="flex items-center gap-2"><code className="font-mono tracking-wider text-sm flex-1" data-testid="staff-code">{showCode ? s.staffCode : '••••••••'}</code>
              <button type="button" className="text-xs font-bold text-[#4F46E5]" onClick={() => setShowCode(!showCode)}>{showCode ? 'Hide' : 'Show'}</button>
              <button type="button" aria-label="Copy staff code" onClick={() => void copy(s.staffCode ?? '', 'Code copied.')}><Copy className="w-4 h-4 text-[#4F46E5]" /></button></div>
            <button type="button" disabled={edit || busy} className={BTN_GHOST} onClick={() => { if (window.confirm('Replace the staff invite code? The old code stops working.')) void run(() => api.rotateStaffCode().then(() => data.refresh()), 'New staff invite code created.').then(() => setShowCode(true)); }}>Replace code</button>
          </div>
        )}
      </Section>

      <Section title="Clinical policy" sub="Rules every portal follows.">
        <div className="divide-y divide-[#E8E2D9]/60 dark:divide-[#38325E]">
          <Toggle id="tg-goal-approval" on={s.policy.requireGoalApproval} disabled={edit || busy} label="New goals need supervisor approval" hint="Off: goals a therapist adds are approved straight away." onChange={(v) => flip('policy', 'requireGoalApproval', v, 'Goal approval')} />
          <Toggle id="tg-parent-msg" on={s.policy.parentMessaging} disabled={edit || busy} label="Parents can message the care team" hint="Off: families can read messages but not send them." onChange={(v) => flip('policy', 'parentMessaging', v, 'Family messaging')} />
        </div>
      </Section>

      <Section title="Supervision limits" sub="Supervisors see an alert when someone falls outside these.">
        <div className="divide-y divide-[#E8E2D9]/60 dark:divide-[#38325E]">
          <NumberRow id="th-integrity" label="Minimum treatment integrity" hint="Below this, a therapist is flagged." unit="%" value={s.policy.integrityMin} min={0} max={100} disabled={edit || busy} onSave={(n) => void apply({ policy: { integrityMin: n } }, 'Integrity limit saved.')} />
          <NumberRow id="th-ioa" label="Minimum inter-observer agreement (IOA)" hint="Below this, a therapist is flagged." unit="%" value={s.policy.ioaMin} min={0} max={100} disabled={edit || busy} onSave={(n) => void apply({ policy: { ioaMin: n } }, 'IOA limit saved.')} />
          <NumberRow id="th-obs-days" label="Observe every therapist at least every" hint="No observation for longer than this raises an alert." unit="days" value={s.policy.observationDays} min={1} max={365} disabled={edit || busy} onSave={(n) => void apply({ policy: { observationDays: n } }, 'Observation interval saved.')} />
          <NumberRow id="th-stalled" label="A goal is stalled after no session for" hint="Used for goal status on the Children tab." unit="days" value={s.policy.stalledDays} min={1} max={365} disabled={edit || busy} onSave={(n) => void apply({ policy: { stalledDays: n } }, 'Stalled-goal limit saved.')} />
        </div>
      </Section>

      <Section title="Governance">
        <div className="divide-y divide-[#E8E2D9]/60 dark:divide-[#38325E] -mx-4">
          {([['audit', 'Audit log', 'Every sign-in, account and record change'], ['roles', 'Roles and permissions', 'Who can see and change what']] as const).map(([k, l, h]) => (
            <button key={k} type="button" onClick={() => onOpen(k)} className="w-full px-4 py-3 text-start flex items-center justify-between hover:bg-[#FAF6F0] dark:hover:bg-[#252044]"><span><b className="block text-sm">{l}</b><span className="text-[11px] text-[#6B6785]">{h}</span></span><span className="text-[#6B6785]">›</span></button>
          ))}
        </div>
      </Section>

      <Section title="This device">
        <div className="flex items-center justify-between gap-3 py-1"><span className="text-sm font-semibold flex items-center gap-2"><Globe className="w-4 h-4 text-indigo-500" /> Language</span><button type="button" className={BTN_GHOST} onClick={toggleLanguage}>{language === 'en' ? 'العربية (RTL)' : 'English (LTR)'}</button></div>
        <div className="flex items-center justify-between gap-3 py-1"><span className="text-sm font-semibold flex items-center gap-2">{darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />} Theme</span><button type="button" className={BTN_GHOST} onClick={toggleDarkMode}>{darkMode ? 'Light' : 'Dark'}</button></div>
        {isServerMode && <p className="text-[11px] text-[#6B6785] pt-1">Server: {getApiUrl()}</p>}
      </Section>

      <Section title="Session">
        {isServerMode
          ? <button type="button" className={`${BTN_DANGER} w-full flex items-center justify-center gap-1.5`} onClick={() => { logout(); }}><LogOut className="w-4 h-4" /> Sign out</button>
          : <>
              <p className="text-xs text-[#6B6785]">Demo data lives on this device only.</p>
              <button type="button" className={`${BTN_DANGER} w-full`} onClick={() => { if (window.confirm('Put all dummy admin data and settings back to how they started?')) { resetDemoAdmin(); void data.refresh().then(() => { setOrgSettings(demoOrg()); notify('Demo data reset.'); }); } }}>Reset demo data</button>
            </>}
      </Section>
      </div>
    </div>
  );
};
