import React, { useMemo, useState } from 'react';
import type { SavedSession, Target } from '../../types';

export type MetricId = 'percentIndependent' | 'frequency' | 'ratePerMinute' | 'meanLatencySec' | 'mtsPercent' | 'partialPercent' | 'ioaPercent' | 'integrityPercent' | 'coldProbePercent' | 'accuracyPercent' | 'percentageCorrect' | 'cueIndependentPercent' | 'mlu' | 'meanDurationSec' | 'wcpm' | 'digitsPm' | 'rubricPercent' | 'aacSelections' | 'aacSpontaneousPercent' | 'errorCount' | 'taskAnalysisPercent';

export interface MetricDef { id: MetricId; en: string; ar: string; unit: string; percent: boolean }

export const BEHAVIOR_METRICS: MetricDef[] = [
  { id: 'percentIndependent', en: '% independent', ar: '% مستقل', unit: '%', percent: true },
  { id: 'frequency', en: 'Frequency', ar: 'التكرار', unit: '', percent: false },
  { id: 'ratePerMinute', en: 'Rate / min', ar: 'المعدل/دقيقة', unit: '', percent: false },
  { id: 'meanLatencySec', en: 'Latency (s)', ar: 'الكمون (ث)', unit: 's', percent: false },
  { id: 'mtsPercent', en: 'MTS %', ar: 'MTS %', unit: '%', percent: true },
  { id: 'partialPercent', en: 'Partial interval %', ar: 'الفاصل الجزئي %', unit: '%', percent: true },
  { id: 'ioaPercent', en: 'IOA %', ar: 'IOA %', unit: '%', percent: true },
  { id: 'integrityPercent', en: 'Integrity %', ar: 'سلامة التنفيذ %', unit: '%', percent: true },
];

interface Props {
  isAr: boolean;
  targets: Target[];
  sessions: SavedSession[]; // this child's sessions for this discipline
  onReport: () => void;
  metrics?: MetricDef[];
}

const W = 320, H = 170, L = 38, R = 12, T = 14, B = 26;

export const BehaviorGraphs: React.FC<Props> = ({ isAr, targets, sessions, onReport, metrics = BEHAVIOR_METRICS }) => {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [targetId, setTargetId] = useState(targets[0]?.id ?? '');
  const [metric, setMetric] = useState<MetricId>(metrics[0].id);
  const target = targets.find((x) => x.id === targetId) ?? targets[0];
  const m = metrics.find((x) => x.id === metric) ?? metrics[0];

  // Datasheet saves only: a SOAP-note save repeats the same numbers and would double every point.
  const own = useMemo(
    () => sessions.filter((s) => s.targetId === target?.id && !s.notes.startsWith('[SOAP NOTE]')).sort((a, b) => a.savedAt.localeCompare(b.savedAt)),
    [sessions, target?.id]
  );

  const points = useMemo(
    () => own.map((s) => ({ v: s.summary[metric] as number | null, at: s.savedAt })).filter((p): p is { v: number; at: string } => p.v !== null && p.v !== undefined).slice(-20),
    [own, metric]
  );

  const baselineVal = metric === metrics.find((x) => x.percent)?.id && target?.baseline != null ? target.baseline : null;
  const series = baselineVal !== null ? [{ v: baselineVal, at: '', baseline: true }, ...points.map((p) => ({ ...p, baseline: false }))] : points.map((p) => ({ ...p, baseline: false }));
  const maxY = m.percent ? 100 : Math.max(1, ...series.map((p) => p.v)) * 1.15;
  const x = (i: number) => L + (series.length <= 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (series.length - 1));
  const y = (v: number) => T + (1 - v / maxY) * (H - T - B);
  const ticks = m.percent ? [0, 25, 50, 75, 100] : [0, 0.5, 1].map((f) => Math.round(maxY * f * 10) / 10);
  const criterion = metric === 'percentIndependent' && target ? target.criterionThreshold : null;

  const promptCounts = useMemo(() => {
    const c: Record<string, number> = {};
    own.forEach((s) => { const p = s.data.promptLevel; if (p) c[p] = (c[p] || 0) + 1; });
    return c;
  }, [own]);
  const promptMax = Math.max(1, ...Object.values(promptCounts));

  const first = series[0]?.v, last = series[series.length - 1]?.v;
  const delta = series.length >= 2 ? Math.round((last - first) * 10) / 10 : null;
  const betterIsLower = metric === 'meanLatencySec';

  return (
    <div className="space-y-4 pb-28 animate-in fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-[28px] leading-tight font-bold text-[#0F2A27] dark:text-white">{t('Clinical graphs', 'الرسوم البيانية')}</h2>
          <p className="text-sm text-[#5C706C] dark:text-[#A5A0C2] mt-1">{t('Built from your saved datasheets.', 'مبنية من أوراق البيانات المحفوظة.')}</p>
        </div>
        <button onClick={onReport} className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1F1B3A] border border-[#0F766E] text-xs font-semibold text-[#0F766E] shrink-0">{t('Report', 'تقرير')}</button>
      </div>

      {targets.length === 0 ? (
        <section className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-5 text-sm text-[#5C706C]">{t('Add a target first (Targets tab).', 'أضف هدفاً أولاً (تبويب الأهداف).')}</section>
      ) : (
        <>
          <label className="block">
            <span className="text-xs font-bold block mb-1">{t('Target', 'الهدف')}</span>
            <select value={target?.id} onChange={(e) => setTargetId(e.target.value)} className="w-full text-sm px-3.5 py-2.5 rounded-2xl border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-transparent">
              {targets.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1" role="tablist" aria-label={t('Metric', 'المقياس')}>
            {metrics.map((x) => (
              <button key={x.id} role="tab" aria-selected={metric === x.id} onClick={() => setMetric(x.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap border transition ${metric === x.id ? 'bg-[#0F766E] border-[#0F766E] text-white font-semibold' : 'bg-white dark:bg-[#1F1B3A] border-[#DCE3E1] dark:border-[#38325E] text-[#5C706C] dark:text-gray-300'}`}>
                {t(x.en, x.ar)}
              </button>
            ))}
          </div>

          <section className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-heading font-semibold text-sm truncate">{target?.name} · {t(m.en, m.ar)}</h3>
              {criterion !== null && <span className="text-xs font-bold text-[#0F766E] shrink-0">{t('Criterion', 'المعيار')}: {criterion}%</span>}
            </div>

            {series.length === 0 ? (
              <p className="text-sm text-[#5C706C] py-8 text-center">{t('No saved data for this measure yet. Save a datasheet that records it.', 'لا توجد بيانات محفوظة لهذا المقياس بعد. احفظ ورقة بيانات تسجله.')}</p>
            ) : (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible" role="img" aria-label={`${target?.name} ${m.en}`}>
                {ticks.map((tv) => (
                  <g key={tv}>
                    <line x1={L} x2={W - R} y1={y(tv)} y2={y(tv)} stroke="#E8E2D9" strokeDasharray="3 3" />
                    <text x={L - 5} y={y(tv) + 3} fontSize="9" fill="#6B6785" textAnchor="end">{tv}{m.percent ? '%' : ''}</text>
                  </g>
                ))}
                <line x1={L} x2={L} y1={T} y2={H - B} stroke="#1F1B3A" />
                <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="#1F1B3A" />
                {criterion !== null && (
                  <>
                    <line x1={L} x2={W - R} y1={y(criterion)} y2={y(criterion)} stroke="#FF6B57" strokeWidth="2" strokeDasharray="4 4" />
                    <text x={W - R} y={y(criterion) - 4} fontSize="9" fill="#FF6B57" fontWeight="bold" textAnchor="end">{criterion}%</text>
                  </>
                )}
                {baselineVal !== null && series.length > 1 && (
                  <>
                    <line x1={(x(0) + x(1)) / 2} x2={(x(0) + x(1)) / 2} y1={T} y2={H - B} stroke="#6B6785" strokeWidth="1.5" strokeDasharray="2 2" />
                    <text x={(x(0) + x(1)) / 2 - 4} y={T + 8} fontSize="9" fill="#6B6785" textAnchor="end">{t('Baseline', 'الخط القاعدي')}</text>
                    <text x={(x(0) + x(1)) / 2 + 4} y={T + 8} fontSize="9" fill="#0F766E" fontWeight="bold">{t('Treatment', 'العلاج')}</text>
                  </>
                )}
                <polyline fill="none" stroke="#0F766E" strokeWidth="2.5" points={series.filter((p) => !p.baseline).map((p) => { const i = series.indexOf(p); return `${x(i)},${y(p.v)}`; }).join(' ')} />
                {series.map((p, i) => (
                  <g key={i}>
                    <circle cx={x(i)} cy={y(p.v)} r="4.5" fill={p.baseline ? '#9AA7A4' : '#0F766E'} stroke="#fff" strokeWidth="2" />
                    {series.length <= 10 && <text x={x(i)} y={y(p.v) - 8} fontSize="9" fill="#1F1B3A" textAnchor="middle">{Math.round(p.v * 10) / 10}</text>}
                  </g>
                ))}
                {series.map((p, i) => (series.length <= 10 || i % Math.ceil(series.length / 8) === 0) && (
                  <text key={`l${i}`} x={x(i)} y={H - 10} fontSize="8" fill="#6B6785" textAnchor="middle">
                    {p.baseline ? 'BL' : p.at ? new Date(p.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                  </text>
                ))}
              </svg>
            )}

            <div className="flex items-center justify-between text-xs text-[#5C706C] pt-2 border-t border-[#E8E2D9] dark:border-gray-800">
              <span>{points.length} {t('saved sessions', 'جلسات محفوظة')}</span>
              {delta !== null && (
                <span className={`font-bold ${(betterIsLower ? delta <= 0 : delta >= 0) ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {delta > 0 ? '+' : ''}{delta}{m.unit} {t('since first point', 'منذ أول نقطة')}
                </span>
              )}
            </div>
          </section>

          <section className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-5 shadow-card space-y-2">
            <h3 className="font-heading font-semibold text-sm">{t('Prompt level used per session', 'مستوى التلقين المستخدم في كل جلسة')}</h3>
            {Object.keys(promptCounts).length === 0 && <p className="text-sm text-[#5C706C]">{t('No sessions saved yet.', 'لا توجد جلسات محفوظة بعد.')}</p>}
            {Object.entries(promptCounts).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 text-xs">
                <span className="w-28 shrink-0">{k}</span>
                <div className="flex-1 h-2.5 rounded-full bg-[#EDE8DF] dark:bg-[#38325E] overflow-hidden"><div className="h-full bg-[#0F766E]" style={{ width: `${(v / promptMax) * 100}%` }} /></div>
                <b className="w-5 text-end">{v}</b>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
};
