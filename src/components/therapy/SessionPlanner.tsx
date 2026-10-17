import React, { useState } from 'react';
import { SupervisorFeedbackCard } from '../common/SupervisorFeedbackCard';
import { Check, ClipboardList, RotateCcw, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PLAN_CONFIG, procedureName, measureName } from '../../data/planConfig';
import { TherapyRole } from '../../types';

interface Props {
  role: TherapyRole;
  /** Called after the plan is saved so the portal can open the datasheet. */
  onSaved: () => void;
}

const pillClass = (selected: boolean) =>
  `px-4 py-2 rounded-full text-[13px] leading-snug text-left border transition-all active:scale-[0.97] ${
    selected
      ? 'bg-[#D9F0EA] border-[#0F766E] text-[#0B4F49] font-bold border-[1.5px] dark:bg-teal-950 dark:border-teal-400 dark:text-teal-100 shadow-xs'
      : 'bg-white border-[#DCE3E1] text-[#16302C] hover:border-[#9DB5B0] dark:bg-[#1F1B3A] dark:border-[#38325E] dark:text-gray-200'
  }`;

export const SessionPlanner: React.FC<Props> = ({ role, onSaved }) => {
  const { 
    activeChild, 
    childrenList, 
    setSelectedChildId, 
    language, 
    getSessionPlan, 
    saveSessionPlan, 
    showNotification 
  } = useApp();
  const isAr = language === 'ar';
  const config = PLAN_CONFIG[role];

  const stored = getSessionPlan(activeChild.id, role);
  const [procedureIds, setProcedureIds] = useState<string[]>(stored.procedureIds);
  const [measureIds, setMeasureIds] = useState<string[]>(stored.measureIds);
  const [childMenuOpen, setChildMenuOpen] = useState(false);

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const handleSave = () => {
    if (measureIds.length === 0 && !procedureIds.includes('dtt')) {
      showNotification(
        isAr ? 'اختر طريقة قياس واحدة على الأقل لبناء ورقة البيانات.' : 'Pick at least one measurement method to build the datasheet.'
      );
      return;
    }
    saveSessionPlan(activeChild.id, role, procedureIds, measureIds);
    showNotification(
      isAr ? 'تم حفظ الخطة وبناء ورقة البيانات بنجاح.' : 'Plan saved. Datasheet configured from your choices.'
    );
    onSaved();
  };

  return (
    <div className="space-y-6 pb-28 animate-in fade-in" data-testid="session-planner">
      {/* What the supervisor said about your work lives in the plan */}
      <SupervisorFeedbackCard />
      {/* Top exact header row matching screenshots */}
      <div className="flex items-center justify-between pt-1 pb-1">
        <span className="text-sm font-bold text-[#0E5E57] dark:text-teal-300">
          {isAr ? config.roleLabelAr : config.roleLabelEn}
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setChildMenuOpen(!childMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-[#1F1B3A] text-xs font-semibold text-[#0F2A27] dark:text-white hover:border-[#0F766E] transition shadow-xs"
          >
            <span>[{activeChild.name}]</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#5C706C]" />
          </button>
          {childMenuOpen && (
            <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-1 w-48 bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-xl shadow-warm py-1 z-30">
              {childrenList.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedChildId(c.id);
                    setChildMenuOpen(false);
                  }}
                  className={`w-full text-left rtl:text-right px-3 py-1.5 text-xs flex items-center justify-between hover:bg-[#F4EEE6] dark:hover:bg-[#252044] ${c.id === activeChild.id ? 'font-bold text-[#0F766E]' : 'text-[#1F1B3A] dark:text-gray-300'}`}
                >
                  <span>{c.name}</span>
                  {c.id === activeChild.id && <Check className="w-3.5 h-3.5 text-[#0F766E]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-heading text-[28px] leading-tight font-bold text-[#0F2A27] dark:text-white mb-1.5">
          {isAr ? 'تخطيط الجلسة' : 'Plan the session'}
        </h2>
        <p className="text-sm text-[#5C706C] dark:text-[#A5A0C2]">
          {isAr
            ? 'اختر ما ستستخدمه. اختياراتك تبني ورقة البيانات.'
            : 'Choose what you will use. Your choices set up the datasheet.'}
        </p>
      </div>

      {/* Procedures */}
      <section className="space-y-5">
        <h3 className="font-heading text-xl font-bold text-[#0F2A27] dark:text-white">
          {isAr ? config.procedureHeadingAr : config.procedureHeadingEn}
        </h3>
        {config.procedureSections.map((section) => (
          <div key={section.key}>
            <h4 className="text-sm font-semibold text-[#2C4440] dark:text-[#C9C5E3] mb-2.5">
              {isAr ? section.titleAr : section.titleEn}
            </h4>
            <div className="flex flex-wrap gap-2">
              {section.items.map((item) => {
                const selected = procedureIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggle(procedureIds, setProcedureIds, item.id)}
                    className={pillClass(selected)}
                  >
                    {selected && '✓ '}
                    {isAr ? procedureName(item.id, true) : item.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Measurement methods */}
      <section className="space-y-5">
        <h3 className="font-heading text-xl font-bold text-[#0F2A27] dark:text-white">
          {isAr ? 'طرق القياس' : 'Measurement methods'}
        </h3>
        {config.measureSections.map((section) => (
          <div key={section.key}>
            <h4 className="text-sm font-semibold text-[#2C4440] dark:text-[#C9C5E3] mb-2.5">
              {isAr ? section.titleAr : section.titleEn}
            </h4>
            <div className="flex flex-wrap gap-2">
              {section.items.map((item) => {
                const selected = measureIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggle(measureIds, setMeasureIds, item.id)}
                    className={pillClass(selected)}
                  >
                    {selected && '✓ '}
                    {isAr ? measureName(item.id, true) : item.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Footer actions */}
      <div className="sticky bottom-20 z-10 -mx-1 px-1 pt-2 bg-gradient-to-t from-[#FBF7F2] via-[#FBF7F2] to-transparent dark:from-[#14122B] dark:via-[#14122B]">
        <div className="flex items-center justify-between text-xs text-[#5C706C] dark:text-gray-400 mb-2">
          <span>
            {procedureIds.length} {isAr ? 'إجراءات' : 'procedures'} · {measureIds.length} {isAr ? 'قياسات' : 'measures'}
          </span>
          <button
            type="button"
            onClick={() => {
              setProcedureIds([]);
              setMeasureIds([]);
            }}
            className="flex items-center gap-1 font-semibold text-[#0F766E] dark:text-teal-300"
          >
            <RotateCcw className="w-3 h-3" />
            {isAr ? 'مسح الكل' : 'Clear all'}
          </button>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3.5 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F58] text-white font-semibold text-sm shadow-warm flex items-center justify-center gap-2"
        >
          {procedureIds.length || measureIds.length ? <Check className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
          <span>{isAr ? 'حفظ الخطة وفتح ورقة البيانات' : 'Save plan & open datasheet'}</span>
        </button>
      </div>
    </div>
  );
};

