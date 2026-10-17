import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ClinicalTemplate, TemplateKind } from '../../types';
import { BTN, BTN_DANGER, BTN_GHOST, CARD, Chip, Empty, Field, INPUT, Pill, Sheet } from './ui';

const KIND: Record<TemplateKind, string> = { soap: 'SOAP note', dtt: 'DTT data sheet', bip: 'Behavior plan', task_analysis: 'Task analysis' };
const TONE = { draft: 'grey', submitted: 'amber', approved: 'green' } as const;
const dateOf = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

export const TemplatesTab: React.FC = () => {
  const app = useApp();
  const { templates, canApproveTemplates } = app;
  const [kind, setKind] = useState<'all' | TemplateKind>('all');
  const [editing, setEditing] = useState<ClinicalTemplate | 'new' | null>(null);
  const [view, setView] = useState<string | null>(null);
  const list = templates.filter((t) => kind === 'all' || t.kind === kind).sort((a, b) => a.kind.localeCompare(b.kind) || a.title.localeCompare(b.title));
  const waiting = templates.filter((t) => t.status === 'submitted').length;

  return (
    <div className="space-y-4 pb-28 md:pb-12 animate-in fade-in">
      <div className="flex items-start justify-between gap-2">
        <div><h2 className="font-heading text-2xl font-bold text-[#1F1B3A] dark:text-white">Templates</h2><p className="text-sm text-[#6B6785]">SOAP, DTT, behavior plan and task analysis</p></div>
        <button type="button" className={`${BTN} flex items-center gap-1 shrink-0`} onClick={() => setEditing('new')} data-testid="new-template"><Plus className="w-4 h-4" /> New</button>
      </div>
      <div className={`${CARD} text-xs text-[#6B6785] space-y-1`} data-testid="template-roles">
        <p><b>Clinical Supervisors</b> write drafts, review submissions, and approve templates as the clinical standard.</p>
        <p>{canApproveTemplates ? `You can approve templates. ${waiting} waiting for approval.` : `${waiting} waiting for supervisor approval.`}</p>
      </div>
      <div className="flex flex-wrap gap-2">{(['all', 'soap', 'dtt', 'bip', 'task_analysis'] as const).map((k) => <Chip key={k} on={kind === k} onClick={() => setKind(k)}>{k === 'all' ? 'All' : KIND[k]}</Chip>)}</div>
      {templates.length === 0 && (
        <div className={`${CARD} space-y-2`}><p className="text-sm">No templates yet.</p><button type="button" className={BTN} onClick={app.loadStarterTemplates} data-testid="load-starters">Load starter templates</button></div>
      )}
      {templates.length > 0 && list.length === 0 && <Empty>None of this kind.</Empty>}
      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 items-start">
      {list.map((t) => (
        <article key={t.id} className={`${CARD} space-y-2`} data-testid="template-card" data-status={t.status}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-wide text-[#4F46E5]">{KIND[t.kind]} · v{t.version}</p><h4 className="font-heading font-bold text-sm" dir="auto">{t.title}</h4><p className="text-xs text-[#6B6785]">{t.createdBy}{t.approvedBy ? ` · approved by ${t.approvedBy} ${dateOf(t.approvedAt)}` : ''}</p></div>
            <Pill tone={TONE[t.status]}>{t.status === 'approved' ? 'Approved' : t.status === 'submitted' ? 'Awaiting approval' : 'Draft'}</Pill>
          </div>
          {view === t.id && (
            <div className="rounded-xl bg-[#FAF6F0] dark:bg-[#252044] p-3 text-xs space-y-1.5" data-testid="template-body">
              {t.body && <p className="whitespace-pre-wrap" dir="auto">{t.body}</p>}
              {t.steps.length > 0 && <ol className="list-decimal ps-4 space-y-0.5">{t.steps.map((s, i) => <li key={i} dir="auto">{s}</li>)}</ol>}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className={BTN_GHOST} onClick={() => setView(view === t.id ? null : t.id)}>{view === t.id ? 'Hide' : 'View'}</button>
            <button type="button" className={BTN_GHOST} onClick={() => setEditing(t)}>Edit</button>
            {t.status === 'draft' && <button type="button" className={BTN} onClick={() => app.submitTemplate(t.id)}>Send for approval</button>}
            {t.status === 'submitted' && canApproveTemplates && <><button type="button" className={BTN} onClick={() => app.approveTemplate(t.id)}>Approve</button><button type="button" className={BTN_GHOST} onClick={() => app.returnTemplate(t.id)}>Return</button></>}
            {t.status === 'approved' && canApproveTemplates && <button type="button" className={BTN_GHOST} onClick={() => app.returnTemplate(t.id)}>Withdraw approval</button>}
            <button type="button" className={BTN_DANGER} onClick={() => { if (window.confirm(`Delete “${t.title}”?`)) app.deleteTemplate(t.id); }}>Delete</button>
          </div>
        </article>
      ))}
      </div>
      {editing && <TemplateEditor t={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  );
};

const TemplateEditor: React.FC<{ t?: ClinicalTemplate; onClose: () => void }> = ({ t, onClose }) => {
  const { saveTemplate } = useApp();
  const [kind, setKind] = useState<TemplateKind>(t?.kind ?? 'soap');
  const [title, setTitle] = useState(t?.title ?? '');
  const [body, setBody] = useState(t?.body ?? '');
  const [steps, setSteps] = useState((t?.steps ?? []).join('\n'));
  const [tried, setTried] = useState(false);
  const stepKind = kind === 'dtt' || kind === 'task_analysis';
  const err = title.trim().length < 3 ? 'Give the template a name.' : stepKind && steps.split('\n').filter((s) => s.trim()).length < 2 ? 'List at least two steps, one per line.' : !stepKind && body.trim().length < 5 ? 'Write the template text.' : '';
  return (
    <Sheet title={t ? 'Edit template' : 'New template'} onClose={onClose}>
      <form noValidate className="space-y-3" onSubmit={(e) => { e.preventDefault(); setTried(true); if (err) return; saveTemplate({ id: t?.id, kind, title, body, steps: steps.split('\n') }); onClose(); }}>
        <Field label="Type"><div className="flex flex-wrap gap-2">{(Object.keys(KIND) as TemplateKind[]).map((k) => <Chip key={k} on={kind === k} onClick={() => setKind(k)}>{KIND[k]}</Chip>)}</div></Field>
        <Field label="Title"><input aria-label="Title" value={title} onChange={(e) => setTitle(e.target.value)} className={INPUT} dir="auto" /></Field>
        <Field label={stepKind ? 'Description' : 'Template text'}><textarea aria-label="Template text" rows={5} value={body} onChange={(e) => setBody(e.target.value)} className={INPUT} dir="auto" /></Field>
        {stepKind && <Field label="Steps (one per line)"><textarea aria-label="Steps" rows={6} value={steps} onChange={(e) => setSteps(e.target.value)} className={INPUT} dir="auto" /></Field>}
        {t?.status === 'approved' && <p className="text-[11px] text-amber-700">Editing an approved template makes a new version that needs approval again.</p>}
        {tried && err && <p role="alert" className="text-xs text-rose-700">{err}</p>}
        <div className="grid grid-cols-2 gap-3"><button type="button" onClick={onClose} className={BTN_GHOST}>Cancel</button><button type="submit" className={BTN}>Save draft</button></div>
      </form>
    </Sheet>
  );
};
