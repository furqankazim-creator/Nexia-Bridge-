import React, { useMemo, useState } from 'react';
import { ClipboardList, FileText, Loader2, LogIn, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api/client';
import { DISCIPLINE_LABEL, monthlyAuditText, orgStats } from '../../utils/org';
import { demoAdminApi } from './demoAdmin';
import { useAdminData } from './useAdminData';
import { PortalsTab, type PortalIntent } from './PortalsTab';
import { CentersTab } from './CentersTab';
import { BillingTab } from './BillingTab';
import { SettingsTab } from './SettingsTab';
import { NoteDialog } from '../supervisor/ui';
import { BTN, BTN_GHOST, CARD, Empty, ROLE_LABEL, Pill, Sheet, eventDetail, eventTitle, friendlyTime, longDate, monthYear, money } from './adminUi';

const COLLECTION_LABEL: Record<string, string> = {
  targets: 'Goals', savedSessions: 'Sessions and SOAP notes', bips: 'Behavior plans', homeTasks: 'Home tasks', messages: 'Messages', abcRecords: 'ABC records', reinforcers: 'Reinforcers',
  weeklyQuestions: 'Weekly questions', sentenceTasks: 'Sentence tasks', articulationLogs: 'Articulation logs', audioClips: 'Audio clips', otChecklist: 'OT checklists', otTasks: 'OT task analyses', otSensory: 'Sensory diet',
};
const ACCESS_WORD: Record<string, string> = { yes: 'Yes', no: 'No', some: 'Some', limited: 'Limited', summary: 'Summary' };
const ACCESS_CLS: Record<string, string> = { yes: 'bg-emerald-100 text-emerald-800', no: 'bg-gray-100 text-gray-500', some: 'bg-amber-100 text-amber-800', limited: 'bg-amber-100 text-amber-800', summary: 'bg-indigo-100 text-indigo-800' };
const INVITE_PORTALS: [string, string][] = [['behavior', 'Behavior'], ['speech', 'Speech'], ['ot', 'Occupational therapy'], ['remedial', 'Remedial'], ['teacher', 'Teacher'], ['supervisor', 'Supervisor']];
const GROUP_OF: Record<string, string> = { behavior: 'behavior', speech: 'speech', ot: 'ot', remedial: 'remedial', teacher: 'teacher', supervisor: 'supervisor' };

export const AdminPortal: React.FC = () => {
  const { activeTab, setActiveTab, isServerMode, childrenList, targets, savedSessions, homeTasks, bips, orgName, showNotification, teamRequests, resolveTeamRequest } = useApp();
  const { user } = useAuth();
  const tab = activeTab.toLowerCase();
  const myCenterId = isServerMode ? user?.centerId ?? null : null;
  const orgWide = !myCenterId;

  const data = useAdminData(isServerMode ? adminApi : demoAdminApi, showNotification);
  const { users, kids, centers, events, matrix, loading, error, refresh, settings, seatsUsed } = data;

  const [report, setReport] = useState(false);
  const [section, setSection] = useState<'audit' | 'roles' | null>(null);
  const [invite, setInvite] = useState(false);
  const [intent, setIntent] = useState<PortalIntent | null>(null);
  const [answer, setAnswer] = useState<{ id: string; status: 'done' | 'declined' } | null>(null);

  const org = useMemo(() => orgStats({ children: childrenList, targets, sessions: savedSessions, homeTasks, bips }), [childrenList, targets, savedSessions, homeTasks, bips]);
  const auditText = useMemo(() => monthlyAuditText({ orgName, children: childrenList, targets, sessions: savedSessions, homeTasks, bips }), [orgName, childrenList, targets, savedSessions, homeTasks, bips]);

  const myCenterName = centers.find((c) => c.id === myCenterId)?.name;
  const spin = loading && <Loader2 className="w-4 h-4 animate-spin text-[#4F46E5]" aria-label="Loading" />;
  const goto = (t: string, i?: PortalIntent) => { setSection(null); setIntent(i ?? null); setActiveTab(t); };
  const staff = users.filter((u) => u.role !== 'parent' && u.role !== 'admin');
  const openRequests = teamRequests.filter((r) => r.status === 'open');

  const Back = () => <button type="button" className="text-xs text-[#4F46E5] font-bold" onClick={() => setSection(null)}>← Back</button>;

  const renderSection = () => {
    if (section === 'audit') {
      return (
        <div className="space-y-3 pb-28 md:pb-12 animate-in fade-in">
          <h2 className="font-heading text-2xl font-bold">Audit log</h2>
          <p className="text-sm text-[#6B6785]">{isServerMode ? 'Recorded by the server' : 'Demo data on this device'}</p>
          <Back />
          {events.length === 0 && <Empty>Nothing recorded yet.</Empty>}
          <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 md:gap-3" data-testid="audit-list">
            {events.map((e) => <div key={e.id} className={`${CARD} !p-3 text-xs`} data-testid="audit-row" data-action={e.action}><div className="flex justify-between gap-2"><b>{eventTitle(e.action)}</b><span className="text-[#6B6785] shrink-0">{friendlyTime(e.at)}</span></div><p className="text-[#6B6785]">{eventDetail(e)}</p></div>)}
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-3 pb-28 md:pb-12 animate-in fade-in">
        <h2 className="font-heading text-2xl font-bold">Roles and permissions</h2>
        <Back />
        <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3" data-testid="access-matrix">
          {matrix.map((r) => (
            <div key={r.col} className={`${CARD} !p-3 text-xs space-y-1.5`} data-testid="access-row" data-col={r.col}>
              <b>{COLLECTION_LABEL[r.col] ?? r.col}</b>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                {[['Family', `${ACCESS_WORD[r.parentRead] ?? r.parentRead} / ${ACCESS_WORD[r.parentWrite] ?? r.parentWrite}`, r.parentRead], ['Clinical team', 'Yes / Yes', 'yes'], ['Admin', `${ACCESS_WORD[r.adminRead] ?? r.adminRead} / ${ACCESS_WORD[r.adminWrite] ?? r.adminWrite}`, r.adminRead]].map(([l, v, k]) => (
                  <div key={l} className={`rounded-lg py-1.5 ${ACCESS_CLS[k] ?? ACCESS_CLS.no}`}><span className="block opacity-70">{l}</span><b>{v}</b></div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[#6B6785]">Each cell reads: can view / can change. Staff also only reach the children they are linked to, within their centre.</p>
      </div>
    );
  };

  /** Each overview tile opens the screen that explains it. */
  const tileGo = (label: string) => {
    if (label === 'Children') goto('Portals', { group: 'children' });
    else if (label === 'Centers') goto('Centers');
    else if (label === 'Outstanding') goto('Billing');
    else setReport(true); // sessions, performance and home practice are all explained in the monthly summary
  };

  const renderHome = () => {
    const plan = settings?.plan;
    const figures: [string, string | number][] = [
      ['Children', kids.filter((k) => !k.archived).length],
      ['Centers', centers.filter((c) => !c.archived).length],
      ['Outstanding', money(data.totals.outstanding).replace(/\.00$/, '')],
      ['Sessions (30 days)', org.sessions30d],
      ['Average performance', org.avgPerformance === null ? '—' : `${org.avgPerformance}%`],
      ['Home practice done', org.homeTasks.percent === null ? '—' : `${org.homeTasks.percent}%`],
    ];
    const recent = events.slice(0, 4);
    return (
      <div className="space-y-4 pb-28 md:pb-12 animate-in fade-in">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-heading text-2xl font-bold text-[#1F1B3A] dark:text-white" data-testid="org-title">Organization &amp; Administration</h2>
            <p className="text-sm text-[#6B6785] dark:text-[#A5A0C2]" data-testid="scope-line">
              Multi-tenant administration, licensing, subscriptions and PDPL audit logging.{isServerMode && !orgWide ? ` You manage ${myCenterName ?? 'one centre'} only.` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">{spin}<button type="button" onClick={() => void refresh()} aria-label="Refresh" className="p-1.5 text-[#4F46E5]"><RefreshCw className="w-4 h-4" /></button></div>
        </div>
        {error && <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</p>}
        {!isServerMode && (
          <div className={`${CARD} border-amber-300`} data-testid="demo-note">
            <p className="text-xs"><b>Offline demo.</b> These people, centres, cases and invoices are dummy data stored on this device. Everything works: add, edit, remove, reassign, archive and bill. Sign-in logins only work on the real server. Reset it under Settings.</p>
          </div>
        )}

        {/* Whole-organisation figures */}
        <section className="space-y-3" aria-label="Overview">
          <h3 className="font-heading font-bold text-base flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#1B9E6B]" /> Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3" data-testid="admin-figures">
            {figures.map(([l, v]) => (
              <button key={l} type="button" onClick={() => tileGo(l)} className={`${CARD} text-center active:scale-[0.98] transition hover:border-[#4F46E5]`} data-testid="figure-tile" data-label={l}>
                <b className="text-xl font-heading tabular-nums block whitespace-nowrap">{v}</b><span className="text-[11px] text-[#6B6785]">{l} ›</span>
              </button>
            ))}
          </div>
          <div className={`${CARD} space-y-1.5 md:max-w-2xl`}>
            <p className="text-xs font-bold">By discipline</p>
            {org.byDiscipline.length === 0 && <p className="text-xs text-[#6B6785]">No data yet.</p>}
            {org.byDiscipline.map((d) => <button key={d.role} type="button" onClick={() => goto('Portals', { group: d.role })} className="w-full flex justify-between text-xs py-0.5 text-start hover:text-[#4F46E5]" data-testid="discipline-row"><span>{DISCIPLINE_LABEL[d.role]?.en ?? d.role} ›</span><b className="tabular-nums">{d.sessions} sessions · {d.goals} goals</b></button>)}
          </div>
          <button type="button" onClick={() => setReport(true)} className={`${BTN} w-full md:w-auto !py-3 !px-6 !text-sm`}>Generate monthly summary</button>
        </section>

        <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 items-start">
          {/* Billing & subscription */}
          <section className={`${CARD} space-y-3`} data-testid="billing-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5]">Billing &amp; Subscription</p>
                <h3 className="font-heading font-bold text-lg leading-tight mt-1" data-testid="home-plan">{plan?.name ?? '—'}</h3>
                <p className="text-xs text-[#6B6785]">{orgName}</p>
              </div>
              {plan && <span className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${plan.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{plan.status === 'active' ? 'Active Plan' : 'Paused'}</span>}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><p className="text-[11px] text-[#6B6785]">Seats used</p><b className="text-base text-[#4F46E5] tabular-nums" data-testid="home-seats">{seatsUsed} / {plan?.seats ?? '—'}</b></div>
              <div><p className="text-[11px] text-[#6B6785]">Billing Cycle</p><b className="text-sm leading-tight block">{plan ? `${plan.billingCycle === 'annual' ? 'Annual' : 'Monthly'} (Billed ${monthYear(plan.billedOn)})` : '—'}</b></div>
              <div><p className="text-[11px] text-[#6B6785]">Renewal</p><b className="text-sm leading-tight block">{plan ? longDate(plan.renewalDate) : '—'}</b></div>
            </div>
            <button type="button" onClick={() => goto('Billing')} className="w-full py-2.5 rounded-xl border-[1.5px] border-[#4F46E5] bg-indigo-50/60 dark:bg-indigo-950/30 text-[#4F46E5] dark:text-indigo-300 text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.99]" data-testid="manage-seats"><FileText className="w-4 h-4" /> Manage Seats &amp; Invoices</button>
          </section>

          {/* Staff accounts */}
          <section className={`${CARD} space-y-3`} data-testid="staff-card">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5]">Staff Accounts</p>
              <p className="text-sm text-[#6B6785]" data-testid="licensed-count">{seatsUsed} licensed clinical staff</p>
            </div>
            <button type="button" onClick={() => setInvite(true)} className="w-full py-2.5 rounded-xl border-[1.5px] border-[#4F46E5] text-[#4F46E5] dark:text-indigo-300 text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.99]" data-testid="invite-specialist"><UserPlus className="w-4 h-4" /> Invite New Specialist</button>
            <div className="space-y-2">
              {staff.slice(0, 3).map((u) => (
                <button key={u.id} type="button" onClick={() => goto('Portals', { group: GROUP_OF[u.role] })} className="w-full text-start rounded-xl border border-[#E8E2D9] dark:border-[#38325E] bg-[#FAF6F0]/60 dark:bg-[#252044] p-3 flex items-center justify-between gap-2" data-testid="home-staff-row">
                  <span className="min-w-0"><b className="block text-sm truncate">{u.name}</b><span className="block text-xs text-[#4F46E5] truncate">{u.title || ROLE_LABEL[u.role]}</span></span>
                  <Pill tone={u.disabled ? 'red' : 'indigo'}>{u.disabled ? 'Off' : 'Active'}</Pill>
                </button>
              ))}
              {staff.length === 0 && <p className="text-xs text-[#6B6785]">No staff yet. Invite the first specialist.</p>}
            </div>
            <button type="button" onClick={() => goto('Portals')} className="w-full text-center text-xs font-bold text-[#4F46E5]" data-testid="view-directory">View all staff directory &amp; permissions →</button>
          </section>

          {/* Team-change requests from supervisors */}
          <section className={`${CARD} space-y-2`} data-testid="requests-card">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5]">Team Change Requests</p>
              <p className="text-sm text-[#6B6785]" data-testid="open-requests">{openRequests.length} waiting for you</p>
            </div>
            {openRequests.length === 0 && <p className="text-xs text-[#6B6785]">Supervisors’ requests to add, remove or swap a therapist appear here.</p>}
            {openRequests.slice(0, 5).map((r) => (
              <div key={r.id} className="rounded-xl border border-[#E8E2D9] dark:border-[#38325E] bg-[#FAF6F0]/60 dark:bg-[#252044] p-3 space-y-1.5" data-testid="request-row">
                <p className="text-sm font-bold">{r.kind === 'add' ? `Add a ${DISCIPLINE_LABEL[r.role]?.en ?? r.role} therapist` : `${r.kind === 'remove' ? 'Remove' : 'Swap'} ${r.staffName}`} · {childrenList.find((c) => c.id === r.childId)?.name ?? 'child'}</p>
                <p className="text-xs text-[#6B6785]" dir="auto">{r.note}</p>
                <p className="text-[11px] text-[#6B6785]">From {r.requestedBy} · {friendlyTime(r.at)}</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={BTN_GHOST} onClick={() => goto('Portals')}>Open cases</button>
                  <button type="button" className={BTN} onClick={() => setAnswer({ id: r.id, status: 'done' })} data-testid="request-done">Mark done</button>
                  <button type="button" className={BTN_GHOST} onClick={() => setAnswer({ id: r.id, status: 'declined' })}>Decline</button>
                </div>
              </div>
            ))}
          </section>

          {/* Audit log */}
          <section className={`${CARD} space-y-2`} data-testid="audit-card">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5]">Audit Log (PDPL Compliance)</p>
              <p className="text-sm text-[#6B6785]">Saudi PDPL Compliant Stream</p>
            </div>
            <div className="divide-y divide-[#E8E2D9]/60 dark:divide-[#38325E]">
              {recent.length === 0 && <p className="text-xs text-[#6B6785] py-2">Nothing recorded yet.</p>}
              {recent.map((e) => (
                <div key={e.id} className="flex items-start gap-3 py-2.5" data-testid="home-audit-row">
                  <ClipboardList className="w-5 h-5 text-[#1B9E6B] shrink-0 mt-0.5" />
                  <div className="min-w-0"><p className="text-sm font-bold">{eventTitle(e.action)}</p><p className="text-xs text-[#6B6785]">{eventDetail(e)} • {friendlyTime(e.at)}</p></div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setSection('audit')} className="w-full text-center text-xs font-bold text-[#4F46E5]" data-testid="view-audit">View full audit log →</button>
          </section>
        </div>

        <p className="text-[11px] text-[#6B6785]">Administrators manage accounts, centres, cases and billing. Clinical notes, ABC data and messages are not shared with this role.</p>
      </div>
    );
  };

  return (
    <div className="max-w-md md:max-w-6xl mx-auto px-4 md:px-8 pt-3 md:pt-6" data-testid="admin-portal">
      {section ? renderSection() : (
        <>
          {tab === 'home' && renderHome()}
          {tab === 'portals' && <PortalsTab data={data} orgWide={orgWide} myCenterId={myCenterId} notify={showNotification} intent={intent} onIntentDone={() => setIntent(null)} />}
          {tab === 'centers' && <CentersTab data={data} orgWide={orgWide} />}
          {tab === 'billing' && <BillingTab data={data} orgWide={orgWide} myCenterId={myCenterId} notify={showNotification} />}
          {tab === 'settings' && <SettingsTab data={data} isServerMode={isServerMode} notify={showNotification} onOpen={setSection} />}
        </>
      )}

      {answer && (
        <NoteDialog
          title={answer.status === 'done' ? 'Mark request done' : 'Decline request'}
          prompt={answer.status === 'done' ? 'What did you change? (the supervisor sees this)' : 'Why is it declined? (the supervisor sees this)'}
          confirm={answer.status === 'done' ? 'Mark done' : 'Decline'}
          required={answer.status === 'declined'}
          onClose={() => setAnswer(null)}
          onConfirm={(v) => { resolveTeamRequest(answer.id, answer.status, v); setAnswer(null); }}
        />
      )}

      {invite && (
        <Sheet title="Invite a new specialist" onClose={() => setInvite(false)}>
          <p className="text-xs text-[#6B6785]">Which portal will they work in? You will enter their details and create their login next.</p>
          <div className="grid grid-cols-1 gap-2" data-testid="invite-portals">
            {INVITE_PORTALS.map(([id, label]) => <button key={id} type="button" className={`${BTN_GHOST} !py-3 text-start flex items-center gap-2`} onClick={() => { setInvite(false); goto('Portals', { group: id, add: true }); }}><LogIn className="w-4 h-4" /> {label}</button>)}
          </div>
        </Sheet>
      )}

      {report && (
        <Sheet title="Monthly summary" onClose={() => setReport(false)}>
          <pre data-testid="audit-text" className="text-xs whitespace-pre-wrap font-sans leading-relaxed bg-[#FAF6F0] dark:bg-[#252044] rounded-2xl p-3.5 border border-[#E8E2D9] dark:border-[#38325E]">{auditText}</pre>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className={BTN_GHOST} onClick={() => setReport(false)}>Close</button>
            <button type="button" className={BTN} onClick={async () => { try { await navigator.clipboard.writeText(auditText); showNotification('Summary copied.'); } catch { showNotification('Copy is not available here.'); } }}>Copy text</button>
          </div>
        </Sheet>
      )}
    </div>
  );
};
