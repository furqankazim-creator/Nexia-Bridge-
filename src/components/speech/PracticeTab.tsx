import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SentenceBuilder } from './SentenceBuilder';
import { WeeklyQuestions } from './WeeklyQuestions';
import { ArticulationTracker } from './ArticulationTracker';
import { AudioRecorder } from './AudioRecorder';

/** Speech practice: weekly WH-questions and sentence-building tasks. */
export const PracticeTab: React.FC = () => {
  const { language, activeChild } = useApp();
  const isAr = language === 'ar';
  const [section, setSection] = useState<'questions' | 'sentences' | 'articulation' | 'recordings'>('questions');
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const items = [
    { id: 'questions' as const, en: 'Weekly questions', ar: 'أسئلة الأسبوع' },
    { id: 'sentences' as const, en: 'Sentence building', ar: 'بناء الجمل' },
    { id: 'articulation' as const, en: 'Articulation', ar: 'النطق' },
    { id: 'recordings' as const, en: 'Recordings', ar: 'التسجيلات' },
  ];
  return (
    <div className="space-y-4 pb-28 animate-in fade-in" data-testid="practice-tab">
      <div>
        <h2 className="font-heading text-[28px] leading-tight font-bold text-[#0F2A27] dark:text-white">{t('Speech practice', 'تدريب النطق واللغة')}</h2>
        <p className="text-sm text-[#5C706C] dark:text-[#A5A0C2] mt-1">{t('Questions and sentences for', 'أسئلة وجمل لـ')} {activeChild.name}.</p>
      </div>
      <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#EDE8DF] dark:bg-[#252044]" role="tablist" aria-label={t('Practice area', 'مجال التدريب')}>
        {items.map((it) => (
          <button key={it.id} type="button" role="tab" aria-selected={section === it.id} onClick={() => setSection(it.id)}
            className={`py-2 rounded-xl text-sm font-semibold transition ${section === it.id ? 'bg-white dark:bg-[#1F1B3A] shadow-card text-[#0F2A27] dark:text-white' : 'text-[#5C706C]'}`}>
            {t(it.en, it.ar)}
          </button>
        ))}
      </div>
      {section === 'questions' && <WeeklyQuestions />}
      {section === 'sentences' && <SentenceBuilder />}
      {section === 'articulation' && <ArticulationTracker />}
      {section === 'recordings' && <AudioRecorder />}
    </div>
  );
};
