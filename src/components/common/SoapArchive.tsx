import React, { useState } from 'react';
import { Share2, Copy, Printer, Check, ChevronDown, ChevronUp, Archive, Users } from 'lucide-react';
import type { SavedSession, TherapyRole } from '../../types';
import { ShareToTeamModal } from './ShareToTeamModal';

interface SoapArchiveProps {
  sessions: SavedSession[];
  childName: string;
  language: 'en' | 'ar';
  title: string;
  credential: string;
}

type SoapKey = 'S' | 'O' | 'A' | 'P';

const SECTIONS: Array<{ key: SoapKey; en: string; ar: string; badge: string; bar: string }> = [
  { key: 'S', en: 'Subjective', ar: 'الملاحظة الذاتية', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800', bar: 'border-indigo-300 dark:border-indigo-700' },
  { key: 'O', en: 'Objective', ar: 'القياسات الموضوعية', badge: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-800', bar: 'border-teal-300 dark:border-teal-700' },
  { key: 'A', en: 'Assessment', ar: 'التقييم', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800', bar: 'border-amber-300 dark:border-amber-700' },
  { key: 'P', en: 'Plan', ar: 'الخطة', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800', bar: 'border-emerald-300 dark:border-emerald-700' },
];

/** Splits "[SOAP NOTE]\nS: ...\nO: ..." into its four sections. */
function parseSoap(notes: string): Record<SoapKey, string> {
  const out: Record<SoapKey, string> = { S: '', O: '', A: '', P: '' };
  let current: SoapKey | null = null;
  for (const line of notes.split('\n')) {
    const m = line.match(/^([SOAP]):\s?(.*)$/);
    if (m) {
      current = m[1] as SoapKey;
      out[current] = m[2];
    } else if (current) {
      out[current] += `\n${line}`;
    }
  }
  (Object.keys(out) as SoapKey[]).forEach((k) => (out[k] = out[k].trim()));
  return out;
}

function buildShareText(ss: SavedSession, childName: string, isAr: boolean, credential: string): string {
  const soap = parseSoap(ss.notes);
  const date = new Date(ss.savedAt).toLocaleString(isAr ? 'ar-SA' : undefined);
  const lines = [
    isAr ? 'ملاحظات جلسة SOAP الرسمية' : 'Official SOAP Session Note',
    `${isAr ? 'الطفل' : 'Child'}: ${childName}`,
    `${isAr ? 'الهدف' : 'Target'}: ${ss.targetName}`,
    `${isAr ? 'التاريخ' : 'Date'}: ${date}`,
    '',
  ];
  SECTIONS.forEach((s) => {
    if (soap[s.key]) lines.push(`${s.key} – ${isAr ? s.ar : s.en}:`, soap[s.key], '');
  });
  if (ss.summary.percentIndependent != null) {
    lines.push(`${isAr ? 'الاستقلالية' : 'Independence'}: ${ss.summary.percentIndependent}%`);
  }
  lines.push(`${ss.therapistName} (${credential})`);
  return lines.join('\n');
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function printSession(ss: SavedSession, childName: string, isAr: boolean, credential: string) {
  const soap = parseSoap(ss.notes);
  const body = SECTIONS.filter((s) => soap[s.key])
    .map((s) => `<h3>${s.key} – ${isAr ? s.ar : s.en}</h3><p>${escapeHtml(soap[s.key]).replace(/\n/g, '<br>')}</p>`)
    .join('');
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.write(`<!doctype html><html dir="${isAr ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>SOAP – ${escapeHtml(childName)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:32px auto;padding:0 20px;color:#1F1B3A}h1{font-size:20px;margin:0 0 4px}h3{font-size:14px;margin:18px 0 4px;color:#4338CA}p{font-size:13px;line-height:1.7;margin:0}.meta{font-size:12px;color:#6B6785}footer{margin-top:28px;border-top:1px solid #ddd;padding-top:10px;font-size:12px}</style></head><body>
<h1>${isAr ? 'ملاحظات جلسة SOAP الرسمية' : 'Official SOAP Session Note'}</h1>
<div class="meta">${escapeHtml(childName)} · ${escapeHtml(ss.targetName)} · ${escapeHtml(new Date(ss.savedAt).toLocaleString())}</div>
${body}<footer>${escapeHtml(ss.therapistName)} (${escapeHtml(credential)})</footer></body></html>`);
  w.document.close();
  w.focus();
  w.print();
  return true;
}


/** In-app recipient picker for a saved SOAP note. */
const SharePicker: React.FC<{
  ss: SavedSession;
  childName: string;
  isAr: boolean;
  text: string;
  onClose: () => void;
}> = ({ ss, childName, isAr, text, onClose }) => (
  <ShareToTeamModal
    role={ss.role}
    isAr={isAr}
    title={isAr ? 'إرسال الملاحظة داخل التطبيق' : 'Share note inside the app'}
    subtitle={`${childName} · ${ss.targetName}`}
    text={text}
    tag="SOAP Note"
    childName={childName}
    authorName={ss.therapistName}
    onClose={onClose}
  />
);

const ArchiveCard: React.FC<{
  ss: SavedSession;
  childName: string;
  isAr: boolean;
  credential: string;
}> = ({ ss, childName, isAr, credential }) => {
  const [expanded, setExpanded] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const soap = parseSoap(ss.notes);
  const sections = SECTIONS.filter((s) => soap[s.key]);
  const saved = new Date(ss.savedAt);
  const dateStr = saved.toLocaleDateString(isAr ? 'ar-SA' : undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = saved.toLocaleTimeString(isAr ? 'ar-SA' : undefined, { hour: '2-digit', minute: '2-digit' });
  const text = () => buildShareText(ss, childName, isAr, credential);

  const chips: Array<{ label: string; value: string }> = [];
  const m = ss.summary;
  if (m.percentIndependent != null) chips.push({ label: isAr ? 'مستقل' : 'Independent', value: `${m.percentIndependent}%` });
  if (m.scoredTrials) chips.push({ label: isAr ? 'محاولات' : 'Trials', value: String(m.scoredTrials) });
  if (m.meanLatencySec != null) chips.push({ label: isAr ? 'زمن الاستجابة' : 'Latency', value: `${m.meanLatencySec}s` });
  if (m.ratePerMinute != null) chips.push({ label: isAr ? 'المعدل' : 'Rate', value: `${m.ratePerMinute}/min` });
  if (m.integrityPercent != null) chips.push({ label: isAr ? 'سلامة التنفيذ' : 'Integrity', value: `${m.integrityPercent}%` });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
    setShareOpen(false);
  };

  const actionCls =
    'flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-start';

  return (
    <article className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-2xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-heading font-bold text-[15px] text-[#1F1B3A] dark:text-white leading-snug">{ss.targetName}</h4>
          <p className="text-[11px] text-[#6B6785] dark:text-gray-400 mt-0.5">
            {dateStr} · {timeStr}
          </p>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShareOpen((o) => !o)}
            className="px-2.5 py-1.5 rounded-lg border border-[#0F766E] text-[#0F766E] dark:text-teal-300 dark:border-teal-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition active:scale-95"
            aria-haspopup="menu"
            aria-expanded={shareOpen}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : isAr ? 'مشاركة' : 'Share'}</span>
          </button>

          {shareOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShareOpen(false)} />
              <div
                role="menu"
                className="absolute end-0 mt-1.5 z-20 w-44 rounded-xl border border-[#E8E2D9] dark:border-[#38325E] bg-white dark:bg-[#1F1B3A] shadow-float py-1 overflow-hidden"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShareOpen(false);
                    setPickerOpen(true);
                  }}
                  className={actionCls}
                >
                  <Users className="w-3.5 h-3.5" /> {isAr ? 'إرسال إلى ولي الأمر' : 'Send to parents'}
                </button>
                <button type="button" role="menuitem" onClick={copy} className={actionCls}>
                  <Copy className="w-3.5 h-3.5" /> {isAr ? 'نسخ النص' : 'Copy text'}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    printSession(ss, childName, isAr, credential);
                    setShareOpen(false);
                  }}
                  className={actionCls}
                >
                  <Printer className="w-3.5 h-3.5" /> {isAr ? 'طباعة / PDF' : 'Print / PDF'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {pickerOpen && (
        <SharePicker ss={ss} childName={childName} isAr={isAr} text={text()} onClose={() => setPickerOpen(false)} />
      )}

      {/* Metric chips */}
      {chips.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span
              key={c.label}
              className="text-[11px] px-2 py-0.5 rounded-full bg-[#F4F1EA] dark:bg-[#252044] text-[#4B4766] dark:text-gray-200 border border-[#E8E2D9] dark:border-[#38325E]"
            >
              {c.label} <strong className="font-bold">{c.value}</strong>
            </span>
          ))}
        </div>
      )}

      {/* SOAP sections */}
      <div className="px-4 pb-3 space-y-2.5">
        {sections.length === 0 ? (
          <p className="text-xs text-[#6B6785]">{isAr ? 'لا توجد ملاحظات مكتوبة.' : 'No written notes.'}</p>
        ) : (
          sections.map((s) => (
            <section key={s.key} className={`border-s-2 ps-3 ${s.bar}`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`inline-flex items-center justify-center w-4.5 h-4.5 min-w-[18px] h-[18px] rounded text-[10px] font-extrabold border ${s.badge}`}>
                  {s.key}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#6B6785] dark:text-gray-400">
                  {isAr ? s.ar : s.en}
                </span>
              </div>
              <p
                dir="auto"
                className={`text-[13px] leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap ${
                  expanded ? '' : 'line-clamp-2'
                }`}
              >
                {soap[s.key]}
              </p>
            </section>
          ))
        )}

        {sections.some((s) => soap[s.key].length > 90 || soap[s.key].includes('\n')) && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="text-xs font-semibold text-[#4338CA] dark:text-indigo-300 flex items-center gap-1"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? (isAr ? 'عرض أقل' : 'Show less') : isAr ? 'عرض الكل' : 'Show full note'}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-[#FAF6F0] dark:bg-[#252044] border-t border-[#E8E2D9] dark:border-[#38325E] text-[11px]">
        <span className="font-medium text-[#0F766E] dark:text-teal-300">
          {ss.therapistName} · {credential}
        </span>
        {ss.review && (
          <span data-testid="review-badge" className={`block mt-1 font-semibold ${ss.review.status === 'signed' ? 'text-emerald-700' : 'text-rose-700'}`} dir="auto">
            {ss.review.status === 'signed' ? (isAr ? `اعتمدها ${ss.review.by}` : `Signed off by ${ss.review.by}`) : (isAr ? 'طلب المشرف تعديلات' : 'Changes requested') + (ss.review.note ? `: ${ss.review.note}` : '')}
          </span>
        )}
      </div>
    </article>
  );
};

export const SoapArchive: React.FC<SoapArchiveProps> = ({ sessions, childName, language, title, credential }) => {
  const isAr = language === 'ar';
  if (sessions.length === 0) return null;

  const sorted = [...sessions].sort((a, b) => b.savedAt.localeCompare(a.savedAt));

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
          <Archive className="w-4 h-4 text-[#4338CA] dark:text-indigo-300" />
          {title}
        </h3>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-[#4338CA] dark:text-indigo-300">
          {sorted.length}
        </span>
      </div>
      {sorted.map((ss) => (
        <ArchiveCard key={ss.id} ss={ss} childName={childName} isAr={isAr} credential={credential} />
      ))}
    </div>
  );
};
