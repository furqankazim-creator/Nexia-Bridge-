import React from 'react';
import { Volume2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

/** Spoken tips the therapist recorded for this family: the written tip plus a player. */
export const VoiceTipsCard: React.FC = () => {
  const { activeChild, audioClips, language } = useApp();
  const isAr = language === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);
  // Child speech samples never show here: only clips marked as tips for parents.
  const tips = audioClips.filter((c) => c.childId === activeChild.id && c.kind === 'tip').slice(0, 3);
  if (tips.length === 0) return null;
  return (
    <section className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[22px] p-4 shadow-card space-y-3" data-testid="voice-tips-card">
      <div className="flex items-center gap-2">
        <Volume2 className="w-5 h-5 text-[#D97706]" />
        <h3 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white">{t('Spoken tips from your therapist', 'نصائح صوتية من المعالج')}</h3>
      </div>
      {tips.map((c) => (
        <div key={c.id} className="space-y-1.5 pt-2 border-t border-[#EDE8DF] dark:border-[#38325E] first:border-t-0 first:pt-0">
          <p className="text-sm font-semibold text-[#1F1B3A] dark:text-white" dir="auto">{c.label}</p>
          {c.note && <p className="text-sm text-[#1F1B3A] dark:text-gray-100 whitespace-pre-line" dir="auto">{c.note}</p>}
          <audio controls preload="none" src={c.data} className="w-full" aria-label={c.label} />
          <p className="text-[11px] text-[#6B6785]">{new Date(c.at).toLocaleDateString()} · {c.durationSec}s</p>
        </div>
      ))}
    </section>
  );
};
