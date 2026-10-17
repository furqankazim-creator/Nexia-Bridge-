import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Chaining, StepLevel, TaskAnalysis } from '../../types';
import { CHAINING_LABEL, OT_DOMAINS_FULL, STEP_LEVELS, TASK_TEMPLATES, coachNote, otRecommendation, parseSteps, stepStats } from '../../utils/taskAnalysis';
import { DecisionCard } from '../common/DecisionCard';

const INPUT = 'w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E2E6EA] dark:border-[#38325E] bg-[#F8FAFC] dark:bg-[#252044] outline-none focus:border-[#EA580C]';
const LABEL = 'text-xs font-bold text-[#1F1B3A] dark:text-white block mb-1';

const LEVEL_STYLE: Record<StepLevel, { on: string; ar: string }> = {
  Independent: { on: 'bg-[#22B573] border-[#22B573] text-white', ar: 'مستقل' },
  Verbal: { on: 'bg-[#3B82F6] border-[#3B82F6] text-white', ar: 'لفظي' },
  Model: { on: 'bg-[#F59E0B] border-[#F59E0B] text-white', ar: 'نمذجة' },
  Physical: { on: 'bg-[#D6336C] border-[#D6336C] text-white', ar: 'جسدي' },
};

const Ring: React.FC<{ percent: number }> = ({ percent }) => {
  const r = 24, c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" role="img" aria-label={`${percent}%`} className="shrink-0">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#FDE9D8" strokeWidth="7" />
      <circle cx="32" cy="32" r={r} fill="none" stroke="#EA580C" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} transform="rotate(-90 32 32)" />
      <text x="32" y="37" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1F1B3A">{percent}%</text>
    </svg>
  );
};

interface DialogProps {
  isAr: boolean;
  task: TaskAnalysis | null; // null = new
  childId: string;
  onClose: () => void;
  onSave: (v: { title: string; domain: string; chaining: Chaining; steps: string[] }) => void;
}

const TaskDialog: React.FC<DialogProps> = ({ isAr, task, onClose, onSave }) => {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [title, setTitle] = useState(task?.title ?? '');
  const [domain, setDomain] = useState(task?.domain ?? OT_DOMAINS_FULL[0]);
  const [chaining, setChaining] = useState<Chaining>(task?.chaining ?? 'forward');
  const [steps, setSteps] = useState((task?.steps ?? []).map((s, i) => `${i + 1}. ${s.text}`).join('\n'));
  const [tried, setTried] = useState(false);

  const parsed = parseSteps(steps);
  const errors: string[] = [];
  if (!title.trim()) errors.push(t('Activity title is required.', 'عنوان النشاط مطلوب.'));
  if (parsed.length < 2) errors.push(t('Add at least 2 steps, one per line.', 'أضف خطوتين على الأقل، خطوة في كل سطر.'));
  const domains = OT_DOMAINS_FULL.includes(domain) ? OT_DOMAINS_FULL : [domain, ...OT_DOMAINS_FULL];

  return (
    <div className="absolute inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={onClose} role="dialog" aria-modal="true" aria-label={task ? t('Edit Task Analysis Activity', 'تعديل نشاط تحليل المهمة') : t('Add New Task Analysis Activity', 'إضافة نشاط تحليل مهمة جديد')}>
      <form noValidate onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); setTried(true); if (errors.length) return; onSave({ title: title.trim(), domain, chaining, steps: parsed }); }}
        className="bg-white dark:bg-[#1F1B3A] w-full rounded-t-3xl border border-[#E8E2D9] dark:border-[#38325E] shadow-float p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] space-y-3.5 max-h-[92%] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <h4 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white">{task ? t('Edit Task Analysis Activity', 'تعديل نشاط تحليل المهمة') : t('Add New Task Analysis Activity', 'إضافة نشاط تحليل مهمة جديد')}</h4>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 rounded-full text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        {!task && (
          <div>
            <span className={LABEL}>{t('Start from a template', 'ابدأ من قالب')}</span>
            <div className="flex flex-wrap gap-1.5">
              {TASK_TEMPLATES.map((tpl) => (
                <button key={tpl.key} type="button" onClick={() => { setTitle(tpl.title); setDomain(tpl.domain); setChaining(tpl.chaining); setSteps(tpl.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')); }} className="px-2.5 py-1 rounded-full text-xs border border-[#F5C8A8] bg-[#FFF7F0] text-[#C2410C] font-semibold">{tpl.title.replace(/\s*\(.*\)$/, '')}</button>
              ))}
            </div>
          </div>
        )}

        <label className="block"><span className={LABEL}>{t('Activity Title:', 'عنوان النشاط:')}</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} dir="auto" placeholder={t('e.g. Zipping winter coat independently', 'مثال: إغلاق المعطف الشتوي باستقلال')} className={INPUT} /></label>
        <label className="block"><span className={LABEL}>{t('OT Scope Domain:', 'مجال العلاج الوظيفي:')}</span>
          <select value={domain} onChange={(e) => setDomain(e.target.value)} className={INPUT}>{domains.map((d) => <option key={d} value={d}>{d}</option>)}</select></label>
        <label className="block"><span className={LABEL}>{t('Chaining method:', 'طريقة التسلسل:')}</span>
          <select value={chaining} onChange={(e) => setChaining(e.target.value as Chaining)} className={INPUT}>
            {(Object.keys(CHAINING_LABEL) as Chaining[]).map((c) => <option key={c} value={c}>{isAr ? CHAINING_LABEL[c].ar : CHAINING_LABEL[c].en}</option>)}
          </select></label>
        <label className="block"><span className={LABEL}>{t('Sequential Steps (One per line):', 'الخطوات المتسلسلة (خطوة في كل سطر):')}</span>
          <textarea rows={5} value={steps} onChange={(e) => setSteps(e.target.value)} dir="auto" placeholder={'1. Hold bottom pin\n2. Insert pin into zipper slide\n3. Pull tab up with dominant hand'} className={INPUT} /></label>
        {task && <p className="text-[11px] text-[#5C706C]">{t('Steps you leave unchanged keep their scores. Edited or new steps start unscored.', 'الخطوات التي لا تغيّرها تحتفظ بدرجاتها. الخطوات المعدّلة أو الجديدة تبدأ بلا درجة.')}</p>}
        {tried && errors.length > 0 && <ul role="alert" className="text-xs text-rose-700 list-disc ps-4">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button type="button" onClick={onClose} className="py-3 rounded-xl border-[1.5px] border-[#4338CA] text-[#4338CA] dark:text-indigo-300 text-sm font-bold bg-white dark:bg-transparent">{t('Cancel', 'إلغاء')}</button>
          <button type="submit" className="py-3 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-sm font-bold">{t('Save Task Analysis', 'حفظ تحليل المهمة')}</button>
        </div>
      </form>
    </div>
  );
};

const RulesDialog: React.FC<{ isAr: boolean; onClose: () => void }> = ({ isAr, onClose }) => {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  return (
    <div className="absolute inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={onClose} role="dialog" aria-modal="true" aria-label="OT Rules">
      <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#1F1B3A] w-full rounded-t-3xl border border-[#E8E2D9] dark:border-[#38325E] shadow-float p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] space-y-3 max-h-[88%] overflow-y-auto text-sm">
        <div className="flex items-start justify-between"><h4 className="font-heading font-bold text-base">{t('How the OT rules work', 'كيف تعمل قواعد العلاج الوظيفي')}</h4><button type="button" onClick={onClose} aria-label="Close" className="p-1 text-gray-400"><X className="w-5 h-5" /></button></div>
        <p><b>{t('Steps independent', 'الخطوات المستقلة')}:</b> {t('independent steps ÷ all steps. A step not scored yet counts as not independent.', 'الخطوات المستقلة ÷ كل الخطوات. الخطوة غير المقيّمة تُحسب غير مستقلة.')}</p>
        <p><b>{t('Support levels', 'مستويات الدعم')}:</b> {t('Independent, then Verbal cue, then Model, then Physical help (most support).', 'مستقل، ثم تلميح لفظي، ثم نمذجة، ثم مساعدة جسدية (أكثر دعم).')}</p>
        <p><b>{t('Which step to fade', 'أي خطوة تُخفَّض')}:</b> {t('Forward chaining: the first step not independent. Backward chaining: the last step not independent. Total task: the step needing the most support.', 'التسلسل الأمامي: أول خطوة غير مستقلة. التسلسل الخلفي: آخر خطوة غير مستقلة. المهمة الكلية: الخطوة الأكثر حاجة للدعم.')}</p>
        <p><b>{t('Advance', 'التقدم')}:</b> {t('75% or more across 3 consecutive saved sessions → move to a harder variation and generalize.', '75% أو أكثر عبر 3 جلسات محفوظة متتالية ← انتقل إلى صيغة أصعب وعمّم المهارة.')}</p>
        <p><b>{t('Revise', 'المراجعة')}:</b> {t('Three sessions that are not improving and the latest below 60% → use smaller steps or more support.', 'ثلاث جلسات بلا تحسن وآخرها أقل من 60% ← استخدم خطوات أصغر أو دعماً أكثر.')}</p>
        <p className="text-[#5C706C]">{t('These are suggestions from fixed rules, not a diagnosis. You decide.', 'هذه اقتراحات من قواعد ثابتة وليست تشخيصاً. القرار لك.')}</p>
      </div>
    </div>
  );
};

/** Task analysis: break an activity into steps, score the support each step needed, and get a recommendation. */
export const TaskAnalysisPanel: React.FC<{ activeId: string; setActiveId: (id: string) => void }> = ({ activeId, setActiveId }) => {
  const { activeChild, language, otTasks, addTaskAnalysis, updateTaskAnalysis, setStepLevel, deleteTaskAnalysis } = useApp();
  const isAr = language === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const tasks = useMemo(() => otTasks.filter((x) => x.childId === activeChild.id), [otTasks, activeChild.id]);
  const [dialog, setDialog] = useState<'new' | 'edit' | null>(null);
  const [rules, setRules] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const task = tasks.find((x) => x.id === activeId) ?? tasks[0];
  useEffect(() => setConfirmDelete(false), [task?.id]);

  const stats = task ? stepStats(task) : null;
  const note = task ? coachNote(task) : null;

  return (
    <div className="space-y-3" data-testid="task-analysis">
      <section className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-4 shadow-card space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#1F1B3A] dark:text-white">{t('Active Task Analysis Activity:', 'نشاط تحليل المهمة النشط:')}</span>
          <div className="flex items-center gap-3 shrink-0">
            <button type="button" onClick={() => setRules(true)} className="px-2.5 py-1 rounded-lg bg-[#FFEDD5] text-[#C2410C] text-xs font-bold">{t('OT Rules', 'قواعد OT')}</button>
            <button type="button" onClick={() => setDialog('new')} className="flex items-center gap-1 text-xs font-bold text-[#EA580C]"><Plus className="w-3.5 h-3.5" /> {t('New Task', 'مهمة جديدة')}</button>
          </div>
        </div>
        {tasks.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5" role="tablist" aria-label={t('Task analysis activity', 'نشاط تحليل المهمة')}>
            {tasks.map((x) => {
              const on = x.id === task?.id;
              return (
                <button key={x.id} type="button" role="tab" aria-selected={on} onClick={() => setActiveId(x.id)} className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition active:scale-95 ${on ? 'bg-[#EA580C] border-[#EA580C] text-white' : 'bg-white dark:bg-transparent border-[#DCE3E1] dark:border-[#38325E] text-[#1F1B3A] dark:text-gray-200'}`}>{x.title}</button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-[#5C706C]">{t('No task analyses yet. Start with a template, or write your own.', 'لا توجد تحليلات مهام بعد. ابدأ بقالب أو اكتب تحليلك.')}</p>
            <div className="flex flex-wrap gap-1.5">
              {TASK_TEMPLATES.map((tpl) => (
                <button key={tpl.key} type="button" onClick={() => setActiveId(addTaskAnalysis({ childId: activeChild.id, title: tpl.title, domain: tpl.domain, chaining: tpl.chaining, steps: tpl.steps }))} className="px-3 py-1.5 rounded-full text-xs font-bold border border-[#F5C8A8] bg-[#FFF7F0] text-[#C2410C]">+ {tpl.title.replace(/\s*\(.*\)$/, '')}</button>
              ))}
            </div>
          </div>
        )}
      </section>

      {task && stats && note && (
        <section className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-5 shadow-card space-y-3.5" data-testid="task-card">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#4338CA]">{t('Task analysis breakdown', 'تفصيل تحليل المهمة')}</span>
              <h3 className="font-heading font-bold text-lg text-[#1F1B3A] dark:text-white" dir="auto">{task.title}</h3>
              <p className="text-xs text-[#5C706C]" dir="auto">{task.domain} • {isAr ? CHAINING_LABEL[task.chaining].ar : CHAINING_LABEL[task.chaining].en}</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#FFEDD5] text-[#C2410C] text-[11px] font-bold shrink-0">{isAr ? CHAINING_LABEL[task.chaining].ar : CHAINING_LABEL[task.chaining].en}</span>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[#F5D9A8] bg-[#FFF8E7] dark:bg-amber-950/20 p-3">
            <Ring percent={stats.percent} />
            <div>
              <p className="text-sm font-bold text-[#92400E]" data-testid="task-percent">{stats.percent}% {t('Steps Independent', 'خطوات مستقلة')} ({stats.independent}/{stats.total})</p>
              <p className="text-xs text-[#92400E]/90" dir="auto">{isAr ? CHAINING_LABEL[task.chaining].ar : CHAINING_LABEL[task.chaining].en.replace('Task', 'task').replace('Chaining', 'chaining')}. {note.advice}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold mb-2">{t('Activity Sequential Steps:', 'الخطوات المتسلسلة للنشاط:')}</p>
            <ol className="space-y-2.5">
              {task.steps.map((s, i) => (
                <li key={s.id} className="rounded-2xl border border-[#E8E2D9] dark:border-[#38325E] bg-[#FAFBFC] dark:bg-[#252044] p-3 space-y-2" data-testid="task-step">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 shrink-0 rounded-full bg-[#EA580C] text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <p className="text-sm font-semibold text-[#1F1B3A] dark:text-white" dir="auto">{s.text}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label={`${t('Step', 'الخطوة')} ${i + 1}`}>
                    {STEP_LEVELS.map((lv) => {
                      const on = task.levels[s.id] === lv;
                      return (
                        <button key={lv} type="button" role="radio" aria-checked={on} onClick={() => setStepLevel(task.id, s.id, on ? null : lv)}
                          className={`py-2 rounded-lg border text-[11px] font-bold transition active:scale-95 ${on ? LEVEL_STYLE[lv].on : 'bg-white dark:bg-transparent border-[#DCE3E1] dark:border-[#38325E] text-[#1F1B3A] dark:text-gray-200'}`}>
                          {isAr ? LEVEL_STYLE[lv].ar : lv}
                        </button>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {task.history.length > 0 && (
            <p className="text-xs text-[#5C706C]" data-testid="task-history">{t('Saved sessions', 'الجلسات المحفوظة')}: {task.history.slice(-5).map((h) => `${h.percent}%`).join(' → ')}</p>
          )}

          <div className="flex items-center justify-between pt-1">
            <button type="button" onClick={() => setDialog('edit')} className="text-xs font-bold text-[#EA580C] underline">{t('Edit steps', 'تعديل الخطوات')}</button>
            {confirmDelete ? (
              <button type="button" onClick={() => { deleteTaskAnalysis(task.id); setActiveId(''); }} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold">{t('Tap again to delete', 'اضغط مرة أخرى للحذف')}</button>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="flex items-center gap-1 text-xs text-rose-600 underline"><Trash2 className="w-3 h-3" /> {t('Delete task', 'حذف المهمة')}</button>
            )}
          </div>
        </section>
      )}

      {dialog && (
        <TaskDialog
          isAr={isAr}
          task={dialog === 'edit' ? task ?? null : null}
          childId={activeChild.id}
          onClose={() => setDialog(null)}
          onSave={(v) => {
            if (dialog === 'edit' && task) updateTaskAnalysis(task.id, v);
            else setActiveId(addTaskAnalysis({ childId: activeChild.id, ...v }));
            setDialog(null);
          }}
        />
      )}
      {rules && <RulesDialog isAr={isAr} onClose={() => setRules(false)} />}
    </div>
  );
};

/** The OT recommendation for the selected task, shown above the Save button. */
export const TaskDecision: React.FC<{ task: TaskAnalysis; isAr: boolean }> = ({ task, isAr }) => {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const rec = otRecommendation(task);
  return (
    <DecisionCard
      testId="ot-decision"
      tone="orange"
      isAr={isAr}
      eyebrow={t('OT Clinical Decision Support', 'دعم القرار الإكلينيكي للعلاج الوظيفي')}
      headline={`${t('Recommendation:', 'التوصية:')} ${rec.headline}`}
      body={<p>{t('Rule Triggered:', 'القاعدة المفعّلة:')} {rec.ruleLine} {t('Suggested action:', 'الإجراء المقترح:')} {rec.action}</p>}
      whyLabel={t('Why this was suggested (OT Clinical Rule Engine)', 'لماذا هذا الاقتراح (محرك قواعد العلاج الوظيفي)')}
      why={{ rule: rec.decision.rule, scores: rec.decision.scores, reasons: rec.decision.reasons }}
    />
  );
};
