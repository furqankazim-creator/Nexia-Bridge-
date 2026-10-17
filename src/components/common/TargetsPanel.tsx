import React, { useMemo, useState } from 'react';
import { Plus, Share2, Sparkles } from 'lucide-react';
import type { SavedSession, Target } from '../../types';
import { primaryPercent } from '../../utils/primaryPercent';

interface Props {
  isAr: boolean;
  /** This child's targets for one discipline. */
  targets: Target[];
  /** This child's saved sessions for the same discipline. */
  sessions: SavedSession[];
  title: { en: string; ar: string };
  subtitle: { en: string; ar: string };
  addLabel: { en: string; ar: string };
  /** What one item is called in this discipline, e.g. "target" or "goal". */
  noun: { en: string; ar: string };
  onAdd: () => void;
  onEdit: (t: Target) => void;
  onReport: () => void;
  /** When set, each goal shows a "Launch in session" button. */
  onLaunch?: (t: Target) => void;
  /** How goals are grouped into filter chips. Defaults to the speech-style domain groups. */
  groupOf?: (domain: string) => string;
}

/** Group a free-text domain into the filter chips shown above the list. */
export const domainGroup = (domain: string): string => {
  const d = domain.toLowerCase();
  if (d.includes('artic') || d.includes('phon')) return 'Articulation';
  if (d.includes('aac')) return 'AAC Core';
  if (d.includes('receptive')) return 'Receptive';
  if (d.includes('expressive')) return 'Expressive';
  if (d.includes('pragmatic') || d.includes('social')) return 'Pragmatics';
  return 'Other';
};

/** Goals and target lessons: definition, materials, teaching steps, data and a recommendation. */
export const TargetsPanel: React.FC<Props> = ({ isAr, targets, sessions, title, subtitle, addLabel, noun, onAdd, onEdit, onReport, onLaunch, groupOf = domainGroup }) => {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [group, setGroup] = useState('All');
  const groups = useMemo(() => ['All', ...Array.from(new Set(targets.map((x) => groupOf(x.domain))))], [targets]);
  const active = groups.includes(group) ? group : 'All';
  const shown = active === 'All' ? targets : targets.filter((x) => groupOf(x.domain) === active);
  return (
    <div className="space-y-4 pb-28 animate-in fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#1F1B3A] dark:text-white">{t(title.en, title.ar)}</h2>
          <p className="text-xs text-[#6B6785]">{t(subtitle.en, subtitle.ar)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onAdd} className="px-3 py-1.5 rounded-xl bg-[#0F766E] text-xs font-semibold text-white hover:bg-[#0B5F58] transition flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>{t(addLabel.en, addLabel.ar)}</span>
          </button>
          <button onClick={onReport} className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1F1B3A] border border-[#0F766E] text-xs font-semibold text-[#0F766E] hover:bg-teal-50 transition flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5" />
            <span>{t('Report', 'تقرير')}</span>
          </button>
        </div>
      </div>

      {groups.length > 2 && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1" role="tablist" aria-label={t('Filter by domain', 'تصفية حسب المجال')}>
          {groups.map((g) => (
            <button key={g} type="button" role="tab" aria-selected={active === g} onClick={() => setGroup(g)}
              className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap border transition ${active === g ? 'bg-[#0F766E] border-[#0F766E] text-white font-semibold' : 'bg-white dark:bg-[#1F1B3A] border-[#DCE3E1] dark:border-[#38325E] text-[#5C706C] dark:text-gray-300'}`}>
              {g === 'All' ? t('All Targets', 'كل الأهداف') : g}
            </button>
          ))}
        </div>
      )}

      {targets.length === 0 && (
        <section className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-5 text-sm text-[#5C706C] space-y-3">
          <p>{t(`No ${noun.en}s for this child yet.`, 'لا توجد أهداف لهذا الطفل بعد.')}</p>
          <button onClick={onAdd} className="px-4 py-2 rounded-xl bg-[#0F766E] text-white text-sm font-bold">{t(`Add the first ${noun.en}`, 'أضف أول هدف')}</button>
        </section>
      )}

      {shown.map((target) => {
        const own = sessions.filter((s) => s.targetId === target.id && !s.notes.startsWith('[SOAP NOTE]'));
        const contributing = [
          ...own.map((s) => ({
            id: s.id,
            date: new Date(s.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            therapistName: s.therapistName,
            scorePercent: primaryPercent(s.summary) ?? 0,
            notes: s.notes,
          })),
          ...(target.contributingSessions || []).map((c) => ({ id: c.id, date: c.date, therapistName: c.therapistName, scorePercent: c.scorePercent, notes: c.notes })),
        ];
        return (
          <article key={target.id} className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-5 shadow-card space-y-4" data-testid="target-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E] bg-teal-50 dark:bg-teal-950 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">{target.domain}</span>
                <h3 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white mt-1.5" dir="auto">{target.name}</h3>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize shrink-0 ${target.status === 'mastered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{target.status}</span>
            </div>
            {target.approvalStatus === 'awaiting_approval' && <p data-testid="approval-badge" className="text-xs rounded-xl bg-amber-50 text-amber-800 px-3 py-2">{t('Awaiting supervisor approval', 'بانتظار موافقة المشرف')}</p>}
            {target.approvalStatus === 'needs_review' && <p data-testid="approval-badge" className="text-xs rounded-xl bg-rose-50 text-rose-800 px-3 py-2" dir="auto">{t('Supervisor asked for changes', 'طلب المشرف تعديلات')}{target.reviewNote ? `: ${target.reviewNote}` : ''}</p>}
            {target.approvalStatus === 'approved' && <p data-testid="approval-badge" className="text-xs rounded-xl bg-emerald-50 text-emerald-800 px-3 py-2">{t('Approved by supervisor', 'اعتمده المشرف')}</p>}
            <button type="button" onClick={() => onEdit(target)} className="text-xs font-semibold text-[#0F766E] underline">{t(`Edit ${noun.en}`, 'تعديل الهدف')}</button>

            {target.operationalDefinition.trim() && target.operationalDefinition.trim() !== target.name.trim() && (
            <div>
              <h4 className="text-xs font-bold text-[#1F1B3A] dark:text-white mb-1">{t('Operational definition', 'التعريف الإجرائي')}</h4>
              <p className="text-xs text-[#6B6785] dark:text-gray-300 leading-relaxed" dir="auto">{target.operationalDefinition}</p>
            </div>
            )}

            {target.procedureNotes?.trim() && (
              <div>
                <h4 className="text-xs font-bold text-[#1F1B3A] dark:text-white mb-1">{t('Procedure & materials', 'الإجراء والأدوات')}</h4>
                <p className="text-xs text-[#6B6785] dark:text-gray-300 leading-relaxed whitespace-pre-line" dir="auto">{target.procedureNotes}</p>
              </div>
            )}

            {target.materials.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-[#1F1B3A] dark:text-white mb-1">{t('Materials', 'الأدوات والمواد')}</h4>
                <ul className="text-xs text-[#6B6785] dark:text-gray-300 list-disc list-inside space-y-0.5">
                  {target.materials.map((m, i) => <li key={i} dir="auto">{m}</li>)}
                </ul>
              </div>
            )}

            {target.procedureSteps.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-[#1F1B3A] dark:text-white mb-1">{t('Lesson steps', 'خطوات الدرس')}</h4>
                <ol className="text-xs text-[#6B6785] dark:text-gray-300 space-y-1">
                  {target.procedureSteps.map((st, i) => (
                    <li key={i} className="flex gap-2" dir="auto"><span className="font-bold text-[#0F766E] shrink-0">{i + 1}.</span><span>{st.replace(/^\d+\.\s*/, '')}</span></li>
                  ))}
                </ol>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-[#F0FAF7] dark:bg-[#1C2C28] border-l-4 border-l-[#0F766E] border border-teal-200 dark:border-teal-800/60 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F766E] dark:text-teal-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('Clinical decision support', 'دعم القرار الإكلينيكي')}</span>
              </div>
              <p className="text-xs font-medium text-[#1F1B3A] dark:text-white">
                {t('Performance:', 'الأداء الحالي:')} <span className="font-bold text-[#0F766E] dark:text-teal-300">{target.currentPerformance}%</span> {t('independent. Mastery criterion:', 'مستقل. معيار الإتقان:')} {target.masteryCriterion}.
              </p>
              <p className="text-xs text-[#10B981] font-semibold">{t('Suggested action:', 'الإجراء المقترح:')} {target.suggestedAction}</p>
              <p className="text-xs text-[#6B6785] dark:text-gray-400">{t('Suggested next step:', 'الخطوة التالية:')} {target.suggestedNextStep}</p>
            </div>

            <div className="flex items-end justify-between gap-3 pt-1 border-t border-[#E8E2D9] dark:border-gray-800">
              <div>
                <p className="text-[11px] font-bold text-[#6B6785]">{t('Current Mastery Rate:', 'معدل الإتقان الحالي:')}</p>
                <p className="font-heading text-2xl font-bold text-[#0F766E] dark:text-teal-300">{target.currentPerformance}%</p>
              </div>
              {onLaunch && (
                <button type="button" onClick={() => onLaunch(target)} className="px-3.5 py-2 rounded-xl border-[1.5px] border-[#0F766E] text-[#0F766E] dark:text-teal-300 text-xs font-bold bg-white dark:bg-transparent hover:bg-teal-50 active:scale-95">
                  {t('Launch In Session', 'ابدأ في الجلسة')}
                </button>
              )}
            </div>

            {contributing.length > 0 && (
              <div className="pt-2 border-t border-[#E8E2D9] dark:border-gray-800">
                <h4 className="text-xs font-bold text-[#1F1B3A] dark:text-white mb-2 flex items-center justify-between">
                  <span>{t(`Recorded sessions for this ${noun.en}`, 'الجلسات المسجلة لهذا الهدف')}</span>
                  <span className="text-[10px] text-[#6B6785] font-normal">{contributing.length}</span>
                </h4>
                <div className="space-y-2">
                  {contributing.slice(0, 4).map((cs, idx) => (
                    <div key={cs.id || idx} className="p-3 rounded-xl bg-[#FAF6F0] dark:bg-[#252044] border border-[#E8E2D9] dark:border-[#38325E] text-xs flex items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#1F1B3A] dark:text-white">{cs.date}</span>
                          <span className="text-[10px] text-[#6B6785] dark:text-gray-400 truncate">· {cs.therapistName}</span>
                        </div>
                        <p className="text-[11px] text-[#6B6785] dark:text-gray-300 line-clamp-1" dir="auto">{cs.notes}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-emerald-100 text-emerald-800 shrink-0">{cs.scorePercent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
};
