import React, { useState } from 'react';
import { 
  Languages,
  Undo2,
  Sparkles, 
  FileCheck, 
  Mic, 
  MicOff, 
  Radio
} from 'lucide-react';
import { DICTATION_LANGS, SoapFieldKey, useVoiceDictation } from '../../hooks/useVoiceDictation';
import { DictationPanel } from './DictationPanel';
import { TRANSLATE_LANGS, TranslateLang, translateText } from '../../utils/translate';

export interface SoapNoteCardProps {
  role: 'behavior' | 'speech' | 'ot' | 'remedial' | 'teacher';
  childName: string;
  language: 'en' | 'ar';
  soapSubjective: string;
  setSoapSubjective: (val: string) => void;
  soapObjective: string;
  setSoapObjective: (val: string) => void;
  soapAssessment: string;
  setSoapAssessment: (val: string) => void;
  soapPlan: string;
  setSoapPlan: (val: string) => void;
  onAutoDraft: () => void;
  isAutoDrafting: boolean;
  onSaveNote: () => void;
  sessionMetricsSummary?: {
    taskName?: string;
    trialsCount?: number;
    accuracyPercent?: number;
    promptLevel?: string;
  };
}

export const SoapNoteCard: React.FC<SoapNoteCardProps> = ({
  role,
  childName,
  language,
  soapSubjective,
  setSoapSubjective,
  soapObjective,
  setSoapObjective,
  soapAssessment,
  setSoapAssessment,
  soapPlan,
  setSoapPlan,
  onAutoDraft,
  isAutoDrafting,
  onSaveNote,
}) => {
  const isAr = language === 'ar';

  // Per-field translation state: target language, in-flight flag, error, and the pre-translation text for undo
  const [targetLang, setTargetLang] = useState<Record<string, TranslateLang>>({ S: 'ar', O: 'ar', A: 'ar', P: 'ar' });
  const [translating, setTranslating] = useState<SoapFieldKey | null>(null);
  const [translateError, setTranslateError] = useState<Record<string, string>>({});
  const [undoText, setUndoText] = useState<Record<string, string>>({});

  const handleTranslate = async (key: SoapFieldKey, value: string, setter: (v: string) => void) => {
    if (!value.trim() || translating) return;
    if (isListening && activeField === key) stopDictation();
    setTranslating(key);
    setTranslateError((e) => ({ ...e, [key]: '' }));
    try {
      const result = await translateText(value, targetLang[key]);
      if (result !== value) {
        setUndoText((u) => ({ ...u, [key]: value }));
        setter(result);
      }
    } catch {
      setTranslateError((e) => ({
        ...e,
        [key]: isAr ? 'تعذرت الترجمة. تحقق من الاتصال وحاول مجدداً.' : 'Translation failed. Check your connection and try again.',
      }));
    } finally {
      setTranslating(null);
    }
  };

  // Speech and behavior therapists dictate straight into the note: the mic button and the text are all they see.
  const showRecorder = role !== 'speech' && role !== 'behavior';
  const voice = useVoiceDictation({ language: isAr ? 'ar' : 'en', role, keepAudio: showRecorder });
  const {
    activeField,
    isListening,
    dictLang,
    setDictLang,
    error: dictError,
    clearError,
    hasSpeechSupport,
    canRecord,
    startDictation,
    stopDictation
  } = voice;

  const fields: Array<{
    key: SoapFieldKey;
    badgeColor: string;
    badgeBg: string;
    badgeBorder: string;
    titleEn: string;
    titleAr: string;
    subtitleEn: string;
    subtitleAr: string;
    value: string;
    setter: (val: string) => void;
    placeholderEn: string;
    placeholderAr: string;
  }> = [
    {
      key: 'S',
      badgeColor: 'text-indigo-600 dark:text-indigo-400',
      badgeBg: 'bg-indigo-50 dark:bg-indigo-950/70',
      badgeBorder: 'border-indigo-200 dark:border-indigo-800',
      titleEn: 'Subjective Observation',
      titleAr: 'الملاحظة الذاتية (S)',
      subtitleEn: 'Child Motivation, Affect & Regulation State',
      subtitleAr: 'دافعية الطفل، مزاجه، وحالته التنظيمية',
      value: soapSubjective,
      setter: setSoapSubjective,
      placeholderEn: 'Describe child affect, state of regulation, compliance, and fatigue upon arrival...',
      placeholderAr: 'اكتب أو تحدث عن دافعية الطفل، حالته المزاجية، واستجابته للتوجيه...'
    },
    {
      key: 'O',
      badgeColor: 'text-teal-600 dark:text-teal-400',
      badgeBg: 'bg-teal-50 dark:bg-teal-950/70',
      badgeBorder: 'border-teal-200 dark:border-teal-800',
      titleEn: 'Objective Metrics',
      titleAr: 'القياسات الموضوعية (O)',
      subtitleEn: 'Auto-synthesized from Session (e.g. Object-Location Tasks & Trials)',
      subtitleAr: 'مستخرجة تلقائياً من الجلسة (مهام الأماكن والمجسمات والمحاولات)',
      value: soapObjective,
      setter: setSoapObjective,
      placeholderEn: 'Quantifiable session performance: object-location trials, discrete trials, prompt levels, percentages...',
      placeholderAr: 'بيانات رقمية دقيقة: محاولات مطابقة الأماكن والمجسمات، نسب الاستقلالية، معدل التلقين...'
    },
    {
      key: 'A',
      badgeColor: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/70',
      badgeBorder: 'border-amber-200 dark:border-amber-800',
      titleEn: 'Clinical Assessment & Retrieval',
      titleAr: 'التقييم الإكلينيكي والاستجابة (A)',
      subtitleEn: 'Skill Acquisition Progress & Criterion Evaluation',
      subtitleAr: 'تقييم اكتساب المهارة ومعيار الإتقان الإكلينيكي',
      value: soapAssessment,
      setter: setSoapAssessment,
      placeholderEn: 'Clinical synthesis: acquisition speed, response to prompt fading, mastery criterion tracking...',
      placeholderAr: 'تحليل الأخصائي لمدى استيعاب الطفل للمهارة واستجابته لسحب المساعدات...'
    },
    {
      key: 'P',
      badgeColor: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/70',
      badgeBorder: 'border-emerald-200 dark:border-emerald-800',
      titleEn: 'Plan & Parent Carryover Activity',
      titleAr: 'الخطة والتعميم المنزلي (P)',
      subtitleEn: 'Next Session Targets & Home Generalization Protocols',
      subtitleAr: 'أهداف الجلسة القادمة وتوصيات التدريب المنزلي للأهل',
      value: soapPlan,
      setter: setSoapPlan,
      placeholderEn: 'Next steps, planned prompt modifications, and carryover activities shared with family...',
      placeholderAr: 'خطوات الجلسة المقبلة، تعديلات التلقين، وأنشطة التعميم المنزلي مع الأسرة...'
    }
  ];

  const errorText: Record<string, [string, string]> = {
    unsupported: [
      'Voice dictation is not available in this browser or app view. Use the keyboard microphone key instead.',
      'الإملاء الصوتي غير متاح في هذا المتصفح أو العرض. استخدم زر الميكروفون في لوحة المفاتيح.',
    ],
    denied: ['Microphone permission was denied. Allow it in settings and try again.', 'تم رفض إذن الميكروفون. اسمح به من الإعدادات وحاول مرة أخرى.'],
    'no-mic': ['No microphone found.', 'لم يتم العثور على ميكروفون.'],
    network: ['Speech recognition needs an internet connection.', 'التعرف على الكلام يحتاج إلى اتصال بالإنترنت.'],
    language: ['This language is not supported for dictation on this device.', 'هذه اللغة غير مدعومة للإملاء على هذا الجهاز.'],
    other: ['Dictation stopped unexpectedly. Please try again.', 'توقف الإملاء بشكل غير متوقع. حاول مرة أخرى.'],
  };

  return (
    <div className="bg-white dark:bg-[#1F1B3A] border border-blue-100/90 dark:border-[#38325E] rounded-2xl p-5 shadow-xs space-y-5 animate-in fade-in">
      {/* Top Header of Card */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800/80">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5] dark:text-indigo-400 block">
            {isAr ? 'التوثيق الإكلينيكي والفوترة الطبية' : 'CLINICAL DOCUMENTATION & BILLING'}
          </span>
          <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            {isAr ? 'ملاحظات جلسة SOAP الرسمية' : 'Session SOAP Notes'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr 
              ? 'سجل رسمي موثق زمنياً مدعوم بالإملاء الصوتي الذكي مع الكشف التلقائي عن اللغة (الإنجليزية، العربية، الأردية)' 
              : 'Timestamped official record with voice auto-writing & automatic language detection'}
          </p>
        </div>

        {/* Auto-Draft Button (Manual language pill removed as requested) */}
        <button
          onClick={onAutoDraft}
          disabled={isAutoDrafting}
          className="px-3.5 py-1.5 rounded-lg bg-[#0F766E] hover:bg-[#0B5F58] text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-xs shrink-0"
          title={isAr ? 'توليد تلقائي للملاحظات من بيانات الجلسة' : 'Synthesize notes from session data'}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isAutoDrafting ? (isAr ? 'جاري التوليد...' : 'Synthesizing...') : (isAr ? 'توليد تلقائي' : 'Auto-Draft')}</span>
        </button>
      </div>

      {/* Dictation language: pick once, applies to every field's microphone */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {isAr ? 'لغة الإملاء' : 'Dictation language'}
        </span>
        <div className="flex gap-1.5" role="radiogroup" aria-label={isAr ? 'لغة الإملاء' : 'Dictation language'}>
          {DICTATION_LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              role="radio"
              aria-checked={dictLang === l.code}
              onClick={() => setDictLang(l.code)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition active:scale-95 ${
                dictLang === l.code
                  ? 'bg-[#4338CA] border-[#4338CA] text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      {!hasSpeechSupport && canRecord && (
        <p className="text-xs rounded-xl px-3 py-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200" data-testid="recorder-only-banner">
          {isAr ? 'تحويل الكلام إلى نص غير متاح في هذا المتصفح أو العرض، لكن يمكنك تسجيل صوتك والاستماع إليه ثم كتابة الملاحظة.' : 'Speech-to-text is not available in this browser or app view. You can still record your voice, listen back, and type the note.'}
        </p>
      )}
      {!hasSpeechSupport && !canRecord && (
        <p className="text-xs rounded-xl px-3 py-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
          {errorText.unsupported[isAr ? 1 : 0]}
        </p>
      )}
      {dictError && hasSpeechSupport && (
        <p role="alert" className="text-xs rounded-xl px-3 py-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start justify-between gap-2">
          <span>{errorText[dictError][isAr ? 1 : 0]}</span>
          <button type="button" onClick={clearError} aria-label="Dismiss" className="font-bold">×</button>
        </p>
      )}

      {/* 4 SOAP Fields with Dedicated Microphones */}
      <div className="space-y-4">
        {fields.map((field) => {
          const isFieldListening = isListening && activeField === field.key;

          return (
            <div key={field.key} className="space-y-1.5">
              {/* Field Header: Badge, Label, and Dedicated Mic */}
              <div className="flex items-center justify-between gap-2">
                <label className="text-[13px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-xs font-extrabold ${field.badgeBg} ${field.badgeColor} border ${field.badgeBorder}`}>
                    {field.key}
                  </span>
                  <span>{isAr ? field.titleAr : field.titleEn}</span>
                  <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 hidden sm:inline">
                    ({isAr ? field.subtitleAr : field.subtitleEn})
                  </span>
                </label>

                {/* Dedicated Mic Button for this Field */}
                <button
                  type="button"
                  disabled={!hasSpeechSupport && !canRecord}
                  onClick={() => {
                    if (isFieldListening) {
                      stopDictation();
                    } else {
                      startDictation(field.key, field.value, field.setter);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shrink-0 border disabled:opacity-50 ${
                    isFieldListening
                      ? 'bg-rose-600 text-white border-rose-700 shadow-md animate-pulse ring-2 ring-rose-300 dark:ring-rose-900'
                      : 'bg-indigo-50/90 hover:bg-indigo-100 dark:bg-indigo-950/70 text-[#4338CA] dark:text-indigo-300 border-indigo-200/90 dark:border-indigo-800 shadow-2xs hover:shadow-xs'
                  }`}
                  title={`Voice dictate into field ${field.key}`}
                >
                  {isFieldListening ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      <MicOff className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إيقاف' : 'Stop'}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>{isAr ? `تحدث (${field.key})` : `Dictate ${field.key}`}</span>
                    </>
                  )}
                </button>
              </div>

              {/* The recorder: level, timer, live words, pause/stop, and the audio to listen back to */}
              {showRecorder && <DictationPanel v={voice} field={field.key} isAr={isAr} />}

              {/* Translate the dictated text into another language */}
              <div className="flex items-center gap-2 flex-wrap">
                <Languages className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <select
                  value={targetLang[field.key]}
                  onChange={(e) => setTargetLang((t) => ({ ...t, [field.key]: e.target.value as TranslateLang }))}
                  className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-2 py-1 outline-none"
                  aria-label={isAr ? 'لغة الترجمة' : 'Translate to'}
                >
                  {TRANSLATE_LANGS.map((l) => (
                    <option key={l.code} value={l.code}>{isAr ? l.labelAr : l.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleTranslate(field.key, field.value, field.setter)}
                  disabled={!field.value.trim() || translating !== null}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/70 text-[#4338CA] dark:text-indigo-300 disabled:opacity-50 transition active:scale-95"
                >
                  {translating === field.key ? (isAr ? 'جاري الترجمة...' : 'Translating...') : (isAr ? 'ترجمة' : 'Translate')}
                </button>
                {undoText[field.key] && (
                  <button
                    type="button"
                    onClick={() => {
                      field.setter(undoText[field.key]);
                      setUndoText((u) => ({ ...u, [field.key]: '' }));
                    }}
                    className="px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Undo2 className="w-3 h-3" />
                    {isAr ? 'تراجع' : 'Undo'}
                  </button>
                )}
                {translateError[field.key] && (
                  <span className="text-xs text-rose-600 dark:text-rose-400">{translateError[field.key]}</span>
                )}
              </div>

              {/* Large, comfortable textarea with direction auto-detect support for RTL/LTR */}
              <div className="relative">
                <textarea
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  rows={4}
                  dir="auto"
                  placeholder={isAr ? field.placeholderAr : field.placeholderEn}
                  className={`w-full min-h-[105px] text-sm p-3.5 rounded-xl border bg-[#FDFCFB] dark:bg-slate-900/80 text-slate-800 dark:text-slate-100 outline-none leading-relaxed transition shadow-2xs resize-y ${
                    isFieldListening
                      ? 'border-rose-500 ring-2 ring-rose-100 dark:ring-rose-950'
                      : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/50'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Official Clinical SOAP Note Button */}
      <button
        onClick={onSaveNote}
        className="w-full py-3.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-heading font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-98 shadow-sm"
      >
        <FileCheck className="w-4 h-4" />
        <span>{isAr ? 'حفظ واعتماد ملاحظات SOAP الإكلينيكية الرسمية' : 'Save Official Clinical SOAP Note'}</span>
      </button>
    </div>
  );
};
