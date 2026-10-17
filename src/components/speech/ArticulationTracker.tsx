import React, { useMemo, useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ArticulationLevel, SoundPosition } from '../../types';
import { LEVELS, POSITIONS, accuracyOf, accuracyTrend, articulationSummary, normalizeSound, totalOf } from '../../utils/articulation';

const CARD = 'bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-5 shadow-card space-y-3';
const INPUT = 'w-full text-sm px-3.5 py-2.5 rounded-2xl border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-transparent outline-none focus:border-[#0F766E]';
const BTN = 'py-2.5 px-4 rounded-xl bg-[#0F766E] hover:bg-[#0B5F58] text-white text-sm font-bold active:scale-95 transition disabled:opacity-50';
const SOUNDS = ['p', 'b', 't', 'd', 'k', 'g', 'f', 'v', 's', 'z', 'sh', 'ch', 'l', 'r', 'th', 'ك', 'س', 'ر', 'ش'];
const POS_AR: Record<SoundPosition, string> = { initial: 'بداية الكلمة', medial: 'وسط الكلمة', final: 'نهاية الكلمة' };
const LEVEL_AR: Record<ArticulationLevel, string> = { isolation: 'منفرد', syllable: 'مقطع', word: 'كلمة', phrase: 'عبارة', sentence: 'جملة', conversation: 'محادثة' };

const Counter: React.FC<{ label: string; value: number; onChange: (n: number) => void; tone: string }> = ({ label, value, onChange, tone }) => (
  <div className={`rounded-2xl p-3 text-center ${tone}`}>
    <span className="text-[11px] font-bold block">{label}</span>
    <span className="text-3xl font-bold font-heading tabular-nums block my-0.5" aria-live="polite">{value}</span>
    <div className="flex items-center justify-center gap-2">
      <button type="button" aria-label={`${label} −1`} onClick={() => onChange(Math.max(0, value - 1))} className="w-9 h-9 rounded-xl bg-white/70 dark:bg-black/20 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
      <button type="button" aria-label={`${label} +1`} onClick={() => onChange(value + 1)} className="w-9 h-9 rounded-xl bg-white dark:bg-black/30 flex items-center justify-center font-bold"><Plus className="w-4 h-4" /></button>
    </div>
  </div>
);

/** Articulation practice per sound and position, at the right level of the hierarchy. */
export const ArticulationTracker: React.FC<{ compact?: boolean; initialSound?: string }> = ({ compact = false, initialSound = '' }) => {
  const { activeChild, language, articulationLogs, addArticulationLog, deleteArticulationLog, showNotification } = useApp();
  const isAr = language === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);

  const [sound, setSound] = useState(initialSound);
  const [position, setPosition] = useState<SoundPosition>('initial');
  const [level, setLevel] = useState<ArticulationLevel>('word');
  const [correct, setCorrect] = useState(0);
  const [approx, setApprox] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [note, setNote] = useState('');
  const [trendSound, setTrendSound] = useState('');

  const logs = useMemo(() => articulationLogs.filter((l) => l.childId === activeChild.id), [articulationLogs, activeChild.id]);
  const rows = useMemo(() => articulationSummary(logs), [logs]);
  const sounds = useMemo(() => Array.from(new Set(rows.map((r) => r.sound))), [rows]);
  const chosen = sounds.includes(normalizeSound(trendSound)) ? normalizeSound(trendSound) : sounds[0];
  const trend = chosen ? accuracyTrend(logs, chosen) : [];

  const total = correct + approx + incorrect;
  const live = accuracyOf({ correct, approximated: approx, incorrect });
  const valid = normalizeSound(sound).length > 0 && total > 0;

  const save = () => {
    if (!valid) return;
    addArticulationLog({ childId: activeChild.id, sound: normalizeSound(sound), position, level, correct, approximated: approx, incorrect, ...(note.trim() ? { note: note.trim() } : {}) });
    showNotification(t(`/${normalizeSound(sound)}/ ${position} saved: ${live}% accurate.`, `تم حفظ /${normalizeSound(sound)}/: ${live}% دقة.`));
    setCorrect(0);
    setApprox(0);
    setIncorrect(0);
    setNote('');
  };

  // Tiny line chart of accuracy over time for the chosen sound.
  const W = 300, H = 110, L = 28, B = 18, T = 8;
  const x = (i: number) => L + (trend.length <= 1 ? (W - L - 10) / 2 : (i * (W - L - 10)) / (trend.length - 1));
  const y = (v: number) => T + (1 - v / 100) * (H - T - B);

  return (
    <div className="space-y-4" data-testid="articulation-tracker">
      <section className={compact ? 'space-y-3' : CARD}>
        {!compact && <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{t('Log articulation practice', 'تسجيل تدريب النطق')}</h3>}

        <label className="block">
          <span className="text-xs font-bold block mb-1">{t('Sound', 'الصوت')}</span>
          <input value={sound} onChange={(e) => setSound(e.target.value)} dir="auto" aria-label={t('Sound', 'الصوت')} placeholder={t('e.g. s', 'مثال: س')} maxLength={6} className={INPUT} />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {SOUNDS.map((s) => (
            <button key={s} type="button" aria-pressed={normalizeSound(sound) === s} onClick={() => setSound(s)} className={`min-w-[40px] px-2.5 py-1.5 rounded-full text-sm border font-semibold ${normalizeSound(sound) === s ? 'bg-[#D9F0EA] border-[#0F766E] border-[1.5px] text-[#0B4F49]' : 'bg-white dark:bg-transparent border-[#DCE3E1] dark:border-[#38325E]'}`}>/{s}/</button>
          ))}
        </div>

        <div>
          <span className="text-xs font-bold block mb-1">{t('Where in the word', 'موضع الصوت في الكلمة')}</span>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('Position', 'الموضع')}>
            {POSITIONS.map((p) => (
              <button key={p} type="button" role="radio" aria-checked={position === p} onClick={() => setPosition(p)} className={`py-2 rounded-xl text-xs font-bold border ${position === p ? 'bg-[#D9F0EA] border-[#0F766E] border-[1.5px] text-[#0B4F49]' : 'bg-white dark:bg-transparent border-[#DCE3E1] dark:border-[#38325E]'}`}>{isAr ? POS_AR[p] : p}</button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-bold block mb-1">{t('Level', 'المستوى')}</span>
          <select value={level} onChange={(e) => setLevel(e.target.value as ArticulationLevel)} className={INPUT}>
            {LEVELS.map((lv) => <option key={lv} value={lv}>{isAr ? LEVEL_AR[lv] : lv}</option>)}
          </select>
        </label>

        <div className="grid grid-cols-3 gap-2">
          <Counter label={t('Correct', 'صحيح')} value={correct} onChange={setCorrect} tone="bg-[#DDF5EA] text-[#1B9E6B]" />
          <Counter label={t('Close', 'قريب')} value={approx} onChange={setApprox} tone="bg-[#FFF1CC] text-[#B7791F]" />
          <Counter label={t('Incorrect', 'خطأ')} value={incorrect} onChange={setIncorrect} tone="bg-[#FDE3E4] text-[#D63B3B]" />
        </div>
        <p className="text-sm text-[#16302C] dark:text-gray-200">{total === 0 ? t('Tap + for each production.', 'اضغط + عن كل نطق.') : `${correct} ${t('of', 'من')} ${total} ${t('correct', 'صحيحة')} (${live}%)`}</p>

        <input value={note} onChange={(e) => setNote(e.target.value)} dir="auto" aria-label={t('Note', 'ملاحظة')} placeholder={t('Note (optional): words used, cues, errors heard', 'ملاحظة (اختياري): الكلمات والتلميحات والأخطاء')} className={INPUT} />
        <button type="button" onClick={save} disabled={!valid} className={`${BTN} w-full`}>{t('Save this block', 'حفظ هذه المجموعة')}</button>
        {total > 0 && !normalizeSound(sound) && <p className="text-xs text-amber-700">{t('Choose or type the sound first.', 'اختر الصوت أو اكتبه أولاً.')}</p>}
      </section>

      {!compact && (
      <section className={CARD}>
        <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{t('Accuracy by sound', 'الدقة حسب الصوت')}</h3>
        {rows.length === 0 && <p className="text-sm text-[#5C706C]">{t('Nothing logged yet for this child.', 'لا شيء مسجل لهذا الطفل بعد.')}</p>}
        {rows.map((r) => (
          <div key={`${r.sound}-${r.position}`} className="flex items-center gap-2 text-xs" data-testid="artic-row">
            <span className="w-24 shrink-0 font-bold">/{r.sound}/ <span className="font-normal text-[#5C706C]">{isAr ? POS_AR[r.position] : r.position}</span></span>
            <div className="flex-1 h-2.5 rounded-full bg-[#EDE8DF] dark:bg-[#38325E] overflow-hidden"><div className={`h-full ${r.accuracy >= 80 ? 'bg-[#1B9E6B]' : r.accuracy >= 50 ? 'bg-[#E0A21F]' : 'bg-[#D63B3B]'}`} style={{ width: `${r.accuracy}%` }} /></div>
            <b className="w-10 text-end tabular-nums">{r.accuracy}%</b>
            <span className="w-16 text-end text-[#5C706C] shrink-0">{isAr ? LEVEL_AR[r.level] : r.level}</span>
          </div>
        ))}
      </section>
      )}

      {!compact && sounds.length > 0 && (
        <section className={CARD}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{t('Progress over time', 'التقدم عبر الوقت')}</h3>
            <select aria-label={t('Sound to chart', 'الصوت للرسم')} value={chosen} onChange={(e) => setTrendSound(e.target.value)} className="text-sm px-3 py-1.5 rounded-xl border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-[#1F1B3A]">
              {sounds.map((s) => <option key={s} value={s}>/{s}/</option>)}
            </select>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible" role="img" aria-label={`/${chosen}/ ${t('accuracy over time', 'الدقة عبر الوقت')}`} data-testid="artic-chart">
            {[0, 50, 100].map((v) => (<g key={v}><line x1={L} x2={W - 10} y1={y(v)} y2={y(v)} stroke="#E8E2D9" strokeDasharray="3 3" /><text x={L - 4} y={y(v) + 3} fontSize="9" fill="#6B6785" textAnchor="end">{v}%</text></g>))}
            <line x1={L} x2={W - 10} y1={y(80)} y2={y(80)} stroke="#FF6B57" strokeWidth="1.5" strokeDasharray="4 4" />
            {trend.length > 1 && <polyline fill="none" stroke="#0F766E" strokeWidth="2.5" points={trend.map((p, i) => `${x(i)},${y(p.accuracy)}`).join(' ')} />}
            {trend.map((p, i) => (<g key={i}><circle cx={x(i)} cy={y(p.accuracy)} r="4.5" fill="#0F766E" stroke="#fff" strokeWidth="2" /><text x={x(i)} y={y(p.accuracy) - 8} fontSize="9" textAnchor="middle" fill="#1F1B3A">{p.accuracy}%</text></g>))}
          </svg>
        </section>
      )}

      {!compact && logs.length > 0 && (
        <section className={CARD}>
          <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{t('Recent blocks', 'آخر المجموعات')}</h3>
          {logs.slice(0, 8).map((l) => (
            <div key={l.id} className="flex items-center gap-2 py-1.5 border-b border-[#EDE8DF] dark:border-[#38325E] last:border-b-0 text-xs">
              <span className="font-bold w-14 shrink-0">/{l.sound}/</span>
              <span className="flex-1 min-w-0 truncate">{isAr ? POS_AR[l.position] : l.position} · {isAr ? LEVEL_AR[l.level] : l.level} · {l.correct}/{totalOf(l)} · {new Date(l.at).toLocaleDateString()}{l.note ? ` · ${l.note}` : ''}</span>
              <b className="tabular-nums">{accuracyOf(l)}%</b>
              <button type="button" aria-label={t('Delete block', 'حذف المجموعة')} onClick={() => deleteArticulationLog(l.id)} className="p-1 text-[#9AA7A4] hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
