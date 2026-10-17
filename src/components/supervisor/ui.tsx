import React, { useState } from 'react';
export { BTN, BTN_GHOST, BTN_DANGER, CARD, Chip, Empty, Field, INPUT, Pill, Sheet } from '../admin/adminUi';
import { BTN, BTN_GHOST, Field, INPUT, Sheet } from '../admin/adminUi';

/** A small text prompt in a bottom sheet (feedback notes, reasons). */
export const NoteDialog: React.FC<{
  title: string;
  prompt: string;
  confirm: string;
  initial?: string;
  multiline?: boolean;
  required?: boolean;
  validate?: (v: string) => string | null;
  onClose: () => void;
  onConfirm: (v: string) => void;
}> = ({ title, prompt, confirm, initial = '', multiline = true, required = true, validate, onClose, onConfirm }) => {
  const [v, setV] = useState(initial);
  const [tried, setTried] = useState(false);
  const err = validate ? validate(v) : required && !v.trim() ? 'Write a note first.' : null;
  return (
    <Sheet title={title} onClose={onClose}>
      <form noValidate className="space-y-3" onSubmit={(e) => { e.preventDefault(); setTried(true); if (!err) onConfirm(v.trim()); }}>
        <Field label={prompt}>
          {multiline ? <textarea aria-label={prompt} rows={4} value={v} onChange={(e) => setV(e.target.value)} dir="auto" className={INPUT} /> : <input aria-label={prompt} value={v} onChange={(e) => setV(e.target.value)} dir="auto" className={INPUT} />}
        </Field>
        {tried && err && <p role="alert" className="text-xs text-rose-700">{err}</p>}
        <div className="grid grid-cols-2 gap-3"><button type="button" onClick={onClose} className={BTN_GHOST}>Cancel</button><button type="submit" className={BTN}>{confirm}</button></div>
      </form>
    </Sheet>
  );
};

/** A tiny trend line for a goal's scores, with the criterion drawn as a dashed line. */
export const Trend: React.FC<{ scores: number[]; threshold: number }> = ({ scores, threshold }) => {
  const W = 260, H = 70, P = 8;
  if (scores.length === 0) return <p className="text-xs text-[#6B6785]">No scores yet.</p>;
  const x = (i: number) => (scores.length === 1 ? W / 2 : P + (i * (W - 2 * P)) / (scores.length - 1));
  const y = (v: number) => H - P - (Math.max(0, Math.min(100, v)) / 100) * (H - 2 * P);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" role="img" aria-label={`Scores ${scores.join(', ')} percent; criterion ${threshold} percent`}>
      <line x1={P} x2={W - P} y1={y(threshold)} y2={y(threshold)} stroke="#10B981" strokeDasharray="4 3" strokeWidth="1.2" />
      <polyline fill="none" stroke="#4F46E5" strokeWidth="2" points={scores.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
      {scores.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="#4F46E5" />)}
    </svg>
  );
};
