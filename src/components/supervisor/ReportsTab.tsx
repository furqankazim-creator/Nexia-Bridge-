import React, { useEffect, useMemo, useState } from 'react';
import { Copy, FileDown, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { SavedReport } from '../../types';
import { DISCIPLINE_LABEL, pendingGoals, pendingSessions } from '../../utils/org';
import { monthRange, reportNarrative, reportStats, snapshotOf } from '../../utils/supervision';
import { BTN, BTN_DANGER, BTN_GHOST, CARD, Chip, Empty, Field, INPUT, Pill } from './ui';

const disc = (r: string) => DISCIPLINE_LABEL[r]?.en ?? r;
const ymdOf = (d: Date) => d.toISOString().slice(0, 10);
const pct = (v: number | null) => (v === null ? '—' : `${v}%`);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const shortDate = (ymd: string) => new Date(`${ymd}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

type Preset = 'this' | 'last' | '30' | 'custom';

function range(p: Preset, custom: { from: string; to: string }, now = new Date()) {
  if (p === 'custom') return custom;
  if (p === '30') return { from: ymdOf(new Date(now.getTime() - 29 * 86400000)), to: ymdOf(now) };
  const ym = ymdOf(now).slice(0, 7);
  if (p === 'this') return { from: monthRange(ym).from, to: ymdOf(now) };
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return monthRange(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
}

export const ReportsTab: React.FC = () => {
  const app = useApp();
  const { childrenList, targets, savedSessions, fidelityObservations, homeTasks, bips, abcRecords, thresholds, orgName, language, savedReports, currentUserName, role } = app;
  const isAr = language === 'ar';
  const [preset, setPreset] = useState<Preset>('this');
  const [custom, setCustom] = useState({ from: ymdOf(new Date(Date.now() - 29 * 86400000)), to: ymdOf(new Date()) });
  const [fDisc, setFDisc] = useState('');
  const [fTher, setFTher] = useState('');
  const [fChild, setFChild] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [cmp, setCmp] = useState<string[]>([]);

  const { from, to } = range(preset, custom);
  const rangeErr = from > to ? 'The start date is after the end date.' : '';
  const stats = useMemo(
    () => reportStats({ children: childrenList, targets, sessions: savedSessions, observations: fidelityObservations, homeTasks, bips, abc: abcRecords, from, to: rangeErr ? from : to, filters: { discipline: fDisc || undefined, therapist: fTher || undefined, childId: fChild || undefined }, th: thresholds }),
    [childrenList, targets, savedSessions, fidelityObservations, homeTasks, bips, abcRecords, from, to, rangeErr, fDisc, fTher, fChild, thresholds],
  );
  const scope = [fChild ? childrenList.find((c) => c.id === fChild)?.name : 'All children', fDisc ? disc(fDisc) : 'all disciplines', fTher || 'all therapists'].join(', ');
  const autoText = useMemo(() => reportNarrative(stats, orgName, scope), [stats, orgName, scope]);

  // The narrative is written for you and stays editable. It is rewritten only when you ask or the filters change.
  const [narrative, setNarrative] = useState(autoText);
  const [edited, setEdited] = useState(false);
  useEffect(() => { if (!edited) setNarrative(autoText); }, [autoText, edited]);

  const therapists = Array.from(new Set(savedSessions.map((s) => s.therapistName))).sort();
  const waiting = pendingGoals(targets.filter((t) => childrenList.some((c) => c.id === t.childId))).length + pendingSessions(savedSessions.filter((s) => childrenList.some((c) => c.id === s.childId))).length;
  const t = stats.totals;
  const snap = snapshotOf(stats);
  const maxWeek = Math.max(1, ...stats.behavior.perWeek.map((w) => w.count));

  const save = (sign: boolean) => {
    if (rangeErr) return;
    const id = app.saveReport({ from, to, scope, narrative, snapshot: snap });
    if (sign) app.signReport(id, narrative);
    setEdited(false);
  };
  const text = () => `${narrative}\n\n— ${currentUserName}`;
  const copy = async () => { try { await navigator.clipboard.writeText(text()); app.showNotification('Report copied.'); } catch { app.showNotification('Copy is not available here.'); } };
  const exportPdf = () => {
    const w = window.open('', '_blank');
    if (!w) { app.showNotification('Your browser blocked the print window. Allow pop-ups, or copy the text instead.'); return; }
    const rows = stats.children.map((c) => `<tr><td>${esc(c.name)}</td><td>${c.goals}</td><td>${c.mastered}</td><td>${c.sessions}</td><td>${pct(c.avgAccuracy)}</td></tr>`).join('');
    w.document.write(`<!doctype html><html dir="${isAr ? 'rtl' : 'ltr'}" lang="${isAr ? 'ar' : 'en'}"><head><meta charset="utf-8"><title>${esc(orgName)} report</title><style>body{font-family:system-ui,Arial,sans-serif;margin:32px;line-height:1.55;color:#1F1B3A}h1{font-size:20px}table{border-collapse:collapse;width:100%;margin:12px 0}td,th{border:1px solid #ccc;padding:6px 8px;font-size:13px;text-align:start}pre{white-space:pre-wrap;font-family:inherit}</style></head><body><h1>${esc(orgName)}</h1><p>${esc(shortDate(from))} – ${esc(shortDate(to))} · ${esc(scope)}</p><table><tr><th>${isAr ? 'الطفل' : 'Child'}</th><th>${isAr ? 'الأهداف' : 'Goals'}</th><th>${isAr ? 'المتقنة' : 'Mastered'}</th><th>${isAr ? 'الجلسات' : 'Sessions'}</th><th>${isAr ? 'الدقة' : 'Accuracy'}</th></tr>${rows}</table><pre dir="auto">${esc(text())}</pre></body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };
  const shareToParents = () => {
    const child = childrenList.find((c) => c.id === fChild);
    if (!child) return;
    if (!window.confirm(`Share this summary with the parents of ${child.name}? They will see it in their messages. Only continue if the family agreed to receive reports.`)) return;
    app.shareSoapNote(['contact-circle'], { text: text(), childName: child.name, authorName: currentUserName, authorRole: role ?? 'supervisor', tag: 'Progress summary', childId: child.id });
  };

  const open = savedReports.find((r) => r.id === openId);
  const cmpReports = cmp.map((id) => savedReports.find((r) => r.id === id)).filter((r): r is SavedReport => !!r);
  const delta = (a: number | null, b: number | null) => (a === null || b === null ? '—' : `${b - a > 0 ? '+' : ''}${b - a}`);

  return (
    <div className="space-y-4 pb-28 md:pb-12 animate-in fade-in">
      <h2 className="font-heading text-2xl font-bold text-[#1F1B3A] dark:text-white">Monthly Clinical Audits</h2>

      <div className={`${CARD} space-y-3`} data-testid="report-controls">
        <div className="flex flex-wrap gap-2">{([['this', 'This month'], ['last', 'Last month'], ['30', 'Last 30 days'], ['custom', 'Custom']] as const).map(([k, l]) => <Chip key={k} on={preset === k} onClick={() => { setPreset(k); setEdited(false); }}>{l}</Chip>)}</div>
        {preset === 'custom' && <div className="grid grid-cols-2 gap-3"><Field label="From"><input aria-label="From" type="date" value={custom.from} onChange={(e) => { setCustom({ ...custom, from: e.target.value }); setEdited(false); }} className={INPUT} /></Field><Field label="To"><input aria-label="To" type="date" value={custom.to} onChange={(e) => { setCustom({ ...custom, to: e.target.value }); setEdited(false); }} className={INPUT} /></Field></div>}
        {rangeErr && <p role="alert" className="text-xs text-rose-700">{rangeErr}</p>}
        <p className="text-xs text-[#6B6785]" data-testid="period-line">{shortDate(from)} – {shortDate(to)}</p>
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <select aria-label="Report discipline" value={fDisc} onChange={(e) => { setFDisc(e.target.value); setEdited(false); }} className={`${INPUT} !text-xs md:!text-sm !px-2 md:!px-3.5`}><option value="">All disciplines</option>{Object.keys(DISCIPLINE_LABEL).map((d) => <option key={d} value={d}>{disc(d)}</option>)}</select>
          <select aria-label="Report therapist" value={fTher} onChange={(e) => { setFTher(e.target.value); setEdited(false); }} className={`${INPUT} !text-xs md:!text-sm !px-2 md:!px-3.5`}><option value="">All therapists</option>{therapists.map((n) => <option key={n} value={n}>{n}</option>)}</select>
          <select aria-label="Report child" value={fChild} onChange={(e) => { setFChild(e.target.value); setEdited(false); }} className={`${INPUT} !text-xs md:!text-sm !px-2 md:!px-3.5`}><option value="">All children</option>{childrenList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="org-figures">
        {([['Children', stats.children.length], ['Goals', t.goals], ['Sessions in period', t.sessions], ['Average performance', pct(t.avgPerformance)], ['Treatment integrity', pct(t.integrity)], ['IOA', pct(t.ioa)], ['Home practice done', pct(stats.homePractice.percent)], ['Waiting for review', waiting]] as const).map(([l, v]) => (
          <div key={l} className={`${CARD} text-center`}><b className="text-2xl font-heading tabular-nums block">{v}</b><span className="text-[11px] text-[#6B6785]">{l}</span></div>
        ))}
      </div>
      <p className="text-[11px] text-[#6B6785]">Average performance = mean latest score of approved goals. Sessions = datasheets saved in the period (SOAP notes are not counted twice).</p>

      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
        <section className={`${CARD} space-y-2`} data-testid="child-rows">
          <p className="text-xs font-bold">By child</p>
          {stats.children.length === 0 && <p className="text-xs text-[#6B6785]">No children match.</p>}
          {stats.children.map((c) => (
            <div key={c.childId} className="rounded-xl bg-[#FAF6F0] dark:bg-[#252044] p-3 text-xs space-y-1" data-testid="child-row">
              <div className="flex justify-between"><b>{c.name}</b><span>{c.sessions} session{c.sessions === 1 ? '' : 's'} · accuracy <b>{pct(c.avgAccuracy)}</b>{c.trend !== null ? <span className={c.trend >= 0 ? 'text-emerald-700' : 'text-rose-700'}> ({c.trend >= 0 ? '+' : ''}{c.trend} vs previous)</span> : ''}</span></div>
              <p className="text-[#6B6785]">{c.goals} goals · {c.started} started · {c.mastered} mastered · {c.stalled} need attention · prompts: {c.prompt.independent} independent, {c.prompt.prompted} prompted, {c.prompt.incorrect} incorrect</p>
            </div>
          ))}
        </section>

        <section className={`${CARD} space-y-2`} data-testid="therapist-rows">
          <p className="text-xs font-bold">By therapist</p>
          {stats.therapists.length === 0 && <p className="text-xs text-[#6B6785]">No sessions in this period.</p>}
          {stats.therapists.map((x) => (
            <div key={x.name} className="flex justify-between gap-2 text-xs rounded-xl bg-[#FAF6F0] dark:bg-[#252044] p-3" data-testid="therapist-row"><b>{x.name}</b><span className="text-end text-[#6B6785]">{x.sessions} sessions · integrity {pct(x.integrity)} · IOA {pct(x.ioa)} · notes {pct(x.noteCompletion)}{x.turnaroundDays !== null ? ` · reviewed in ${x.turnaroundDays} d` : ''}</span></div>
          ))}
        </section>
      </div>

      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
        <section className={`${CARD} space-y-1.5`}>
          <p className="text-xs font-bold">By discipline</p>
          {stats.disciplines.length === 0 && <p className="text-xs text-[#6B6785]">No data yet.</p>}
          {stats.disciplines.map((d) => <div key={d.role} className="flex justify-between text-xs"><span>{disc(d.role)}</span><b className="tabular-nums">{d.sessions} sessions · {d.goals} goals</b></div>)}
        </section>

        <section className={`${CARD} space-y-1.5`} data-testid="home-practice">
          <p className="text-xs font-bold">Home practice</p>
          <p className="text-xs">{stats.homePractice.completed} of {stats.homePractice.assigned} sheets completed ({pct(stats.homePractice.percent)}) · {stats.homePractice.withParentNote} with a parent note</p>
        </section>

        <section className={`${CARD} space-y-2`} data-testid="behavior-trend">
          <p className="text-xs font-bold">Behavior events per week · plans: {stats.behavior.plans.active} active, {stats.behavior.plans.draft} draft</p>
          {stats.behavior.perWeek.length === 0 ? <p className="text-xs text-[#6B6785]">No behavior events recorded in this period.</p> : stats.behavior.perWeek.map((w) => (
            <div key={w.week} className="flex items-center gap-2 text-xs"><span className="w-24 shrink-0">{shortDate(w.week)}</span><div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-[#252044] overflow-hidden"><div className="h-full bg-rose-400" style={{ width: `${(w.count / maxWeek) * 100}%` }} /></div><b className="w-6 text-end">{w.count}</b></div>
          ))}
        </section>
      </div>

      <section className={`${CARD} space-y-2`} data-testid="narrative-box">
        <div className="flex items-center justify-between"><p className="text-xs font-bold">Narrative</p><button type="button" className="text-xs font-bold text-[#4F46E5]" onClick={() => { setNarrative(autoText); setEdited(false); }}>Rewrite from the numbers</button></div>
        <textarea aria-label="Narrative" rows={10} value={narrative} onChange={(e) => { setNarrative(e.target.value); setEdited(true); }} className={`${INPUT} text-xs leading-relaxed`} dir="auto" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <button type="button" className={BTN_GHOST} onClick={() => save(false)} data-testid="save-report">Save draft</button>
          <button type="button" className={BTN} onClick={() => save(true)} data-testid="sign-report">Sign and save</button>
          <button type="button" className={`${BTN_GHOST} flex items-center justify-center gap-1`} onClick={() => void copy()}><Copy className="w-3.5 h-3.5" /> Copy</button>
          <button type="button" className={`${BTN_GHOST} flex items-center justify-center gap-1`} onClick={exportPdf} data-testid="export-pdf"><FileDown className="w-3.5 h-3.5" /> Export PDF</button>
          <button type="button" disabled={!fChild} className={`${BTN_GHOST} col-span-2 md:col-span-1 flex items-center justify-center gap-1`} onClick={shareToParents} data-testid="share-parents"><Send className="w-3.5 h-3.5" /> {fChild ? 'Share with the parents' : 'Choose one child to share with their parents'}</button>
        </div>
        <p className="text-[11px] text-[#6B6785]">PDF opens your browser’s print dialog (Arabic prints right-to-left). It may not work inside the phone app; use Copy there.</p>
      </section>

      <section className="space-y-2" data-testid="saved-reports">
        <h3 className="font-heading font-bold text-base">Saved reports</h3>
        {savedReports.length === 0 && <Empty>No saved reports yet.</Empty>}
        <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
        {savedReports.map((r) => (
          <article key={r.id} className={`${CARD} !p-3 space-y-1.5`} data-testid="saved-report">
            <div className="flex items-start justify-between gap-2"><div><b className="text-sm">{shortDate(r.from)} – {shortDate(r.to)}</b><p className="text-xs text-[#6B6785]">{r.scope}</p></div>{r.signedBy ? <Pill tone="green">Signed by {r.signedBy}</Pill> : <Pill tone="amber">Draft</Pill>}</div>
            <p className="text-xs text-[#6B6785]">{r.snapshot.goals} goals · {r.snapshot.sessions} sessions · performance {pct(r.snapshot.avgPerformance)}</p>
            <div className="flex flex-wrap gap-2 items-center">
              <button type="button" className={BTN_GHOST} onClick={() => setOpenId(openId === r.id ? null : r.id)}>{openId === r.id ? 'Close' : 'Open'}</button>
              <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={cmp.includes(r.id)} onChange={() => setCmp(cmp.includes(r.id) ? cmp.filter((x) => x !== r.id) : [...cmp, r.id].slice(-2))} className="accent-[#4F46E5]" /> Compare</label>
              <button type="button" className={BTN_DANGER} onClick={() => { if (window.confirm('Delete this saved report?')) app.deleteReport(r.id); }}>Delete</button>
            </div>
            {open?.id === r.id && <pre className="text-xs whitespace-pre-wrap font-sans bg-[#FAF6F0] dark:bg-[#252044] rounded-xl p-3" dir="auto">{r.narrative}</pre>}
          </article>
        ))}
        </div>
        {cmpReports.length === 2 && (
          <div className={`${CARD} space-y-1.5`} data-testid="compare">
            {(() => {
              const [a, b] = [...cmpReports].sort((x, y) => x.from.localeCompare(y.from));
              const rows: [string, number | null, number | null][] = [['Goals', a.snapshot.goals, b.snapshot.goals], ['Sessions', a.snapshot.sessions, b.snapshot.sessions], ['Average performance', a.snapshot.avgPerformance, b.snapshot.avgPerformance], ['Integrity', a.snapshot.integrity, b.snapshot.integrity], ['IOA', a.snapshot.ioa, b.snapshot.ioa], ['Mastered', a.snapshot.mastered, b.snapshot.mastered]];
              return (<>
                <p className="text-xs font-bold">{shortDate(a.from)} → {shortDate(b.from)}</p>
                {rows.map(([l, x, y]) => <div key={l} className="flex justify-between text-xs"><span>{l}</span><span><span className="text-[#6B6785]">{x ?? '—'} → {y ?? '—'}</span> <b className="tabular-nums">{delta(x, y)}</b></span></div>)}
              </>);
            })()}
          </div>
        )}
        {cmp.length === 1 && <p className="text-[11px] text-[#6B6785]">Tick a second report to compare.</p>}
      </section>
    </div>
  );
};
