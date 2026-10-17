import {
  BEHAVIOR_PROCEDURES,
  SPEECH_SPECIFIC_PROCEDURES,
  OT_SPECIFIC_PROCEDURES,
  REMEDIAL_SPECIFIC_PROCEDURES,
  CLINICAL_MEASURES,
  ProcedureItem,
  MeasureItem,
} from './clinicalCatalog';
import { TherapyRole } from '../types';
import { MEASURE_AR, PROCEDURE_AR } from './clinicalCatalogAr';

export interface PlanSection<T> {
  key: string;
  titleEn: string;
  titleAr: string;
  items: T[];
}

export interface RolePlanConfig {
  role: TherapyRole;
  roleLabelEn: string;
  roleLabelAr: string;
  procedureHeadingEn: string;
  procedureHeadingAr: string;
  procedureSections: PlanSection<ProcedureItem>[];
  measureSections: PlanSection<MeasureItem>[];
}

const proc = (ids: string[]): ProcedureItem[] =>
  ids.map((id) => {
    const found = BEHAVIOR_PROCEDURES.find((p) => p.id === id);
    if (!found) throw new Error(`Unknown procedure id: ${id}`);
    return found;
  });

const meas = (ids: string[]): MeasureItem[] =>
  ids.map((id) => {
    const found = CLINICAL_MEASURES.find((m) => m.id === id);
    if (!found) throw new Error(`Unknown measure id: ${id}`);
    return found;
  });

const REDUCTION_CORE = ['extinction', 'dra', 'dri', 'dro', 'drl', 'drh'];
const REDUCTION_PUNISH = ['pos_punish', 'neg_punish', 'resp_cost', 'time_out'];

const OTHER_MEASURES = [
  'permanent_product',
  'percentage',
  'trials_to_crit',
  'trial_by_trial',
  'cold_probe',
  'accuracy',
  'baseline',
  'ioa',
  'treatment_integrity',
];

const OT_OTHER_MEASURES = ['permanent_product', 'percentage', 'trials_to_crit', 'accuracy', 'baseline', 'ioa'];

const measureSections = (continuous: string[], discontinuous: string[], other: string[] = OTHER_MEASURES): PlanSection<MeasureItem>[] => [
  { key: 'continuous', titleEn: 'Continuous', titleAr: 'القياس المستمر', items: meas(continuous) },
  { key: 'discontinuous', titleEn: 'Discontinuous', titleAr: 'القياس غير المستمر', items: meas(discontinuous) },
  { key: 'other', titleEn: 'Other', titleAr: 'طرق أخرى', items: meas(other) },
];

export const PLAN_CONFIG: Record<TherapyRole, RolePlanConfig> = {
  behavior: {
    role: 'behavior',
    roleLabelEn: 'Behavior therapist',
    roleLabelAr: 'أخصائي السلوك',
    procedureHeadingEn: 'Treatment procedures',
    procedureHeadingAr: 'الإجراءات العلاجية',
    procedureSections: [
      {
        key: 'skill_acquisition',
        titleEn: 'Skill acquisition and behavior increase',
        titleAr: 'اكتساب المهارات وزيادة السلوك',
        items: BEHAVIOR_PROCEDURES.filter((p) => p.category === 'skill_acquisition'),
      },
      {
        key: 'behavior_reduction',
        titleEn: 'Behavior reduction',
        titleAr: 'خفض السلوكيات غير المرغوبة',
        items: BEHAVIOR_PROCEDURES.filter((p) => p.category === 'behavior_reduction'),
      },
      {
        key: 'other',
        titleEn: 'Other treatment procedures',
        titleAr: 'إجراءات علاجية أخرى',
        items: BEHAVIOR_PROCEDURES.filter((p) => p.category === 'other'),
      },
    ],
    measureSections: measureSections(
      ['frequency', 'rate', 'duration', 'latency', 'irt'],
      ['partial_interval', 'whole_interval', 'mts'],
    ),
  },

  speech: {
    role: 'speech',
    roleLabelEn: 'Speech therapist',
    roleLabelAr: 'أخصائي النطق',
    procedureHeadingEn: 'Teaching and treatment procedures',
    procedureHeadingAr: 'إجراءات التعليم والعلاج',
    procedureSections: [
      {
        key: 'shared',
        titleEn: 'Shared behavior procedures',
        titleAr: 'إجراءات سلوكية مشتركة',
        items: proc([
          'pos_reinf', 'shaping', 'prompting', 'prompt_fading', 'dtt', 'net', 'prt', 'bst',
          'task_analysis', 'token_econ', 'generalization', 'maintenance', 'fct',
          'video_model', 'visual_schedules', 'choice_making', 'self_mgmt',
        ]),
      },
      {
        key: 'speech_specific',
        titleEn: 'Speech-specific procedures',
        titleAr: 'إجراءات خاصة بالنطق واللغة',
        items: SPEECH_SPECIFIC_PROCEDURES,
      },
      {
        key: 'reduction',
        titleEn: 'Behavior reduction procedures',
        titleAr: 'إجراءات خفض السلوك',
        items: proc([...REDUCTION_CORE, 'antecedent', ...REDUCTION_PUNISH]),
      },
    ],
    measureSections: [
      ...measureSections(['frequency', 'rate', 'duration', 'latency'], ['mts']),
      { key: 'speech_specific', titleEn: 'Speech-specific measures', titleAr: 'قياسات خاصة بالنطق واللغة', items: meas(['cueing_level', 'mlu', 'aac_core']) },
    ],
  },

  ot: {
    role: 'ot',
    roleLabelEn: 'Occupational therapist',
    roleLabelAr: 'أخصائي العلاج الوظيفي',
    procedureHeadingEn: 'Teaching and treatment procedures',
    procedureHeadingAr: 'إجراءات التعليم والعلاج',
    procedureSections: [
      {
        key: 'shared',
        titleEn: 'Shared behavior procedures',
        titleAr: 'إجراءات سلوكية مشتركة',
        items: proc([
          'pos_reinf', 'shaping', 'fwd_chain', 'back_chain', 'total_chain', 'prompting',
          'prompt_fading', 'task_analysis', 'token_econ', 'generalization', 'maintenance',
          'antecedent', 'visual_schedules', 'choice_making', 'task_mod', 'self_mgmt', 'video_model',
        ]),
      },
      {
        key: 'ot_specific',
        titleEn: 'OT-specific procedures',
        titleAr: 'إجراءات خاصة بالعلاج الوظيفي',
        items: OT_SPECIFIC_PROCEDURES,
      },
      {
        key: 'reduction',
        titleEn: 'Behavior reduction procedures',
        titleAr: 'إجراءات خفض السلوك',
        items: proc([...REDUCTION_CORE, 'fct', ...REDUCTION_PUNISH]),
      },
    ],
    // PDF page 3: three discontinuous methods; "Other" has no trial-by-trial, cold-probe or integrity.
    measureSections: measureSections(['frequency', 'rate', 'duration', 'latency'], ['partial_interval', 'whole_interval', 'mts'], OT_OTHER_MEASURES),
  },

  remedial: {
    role: 'remedial',
    roleLabelEn: 'Remedial teacher',
    roleLabelAr: 'معلم التربية الخاصة',
    procedureHeadingEn: 'Teaching and treatment procedures',
    procedureHeadingAr: 'إجراءات التعليم والعلاج',
    procedureSections: [
      {
        key: 'shared',
        titleEn: 'Shared behavior procedures',
        titleAr: 'إجراءات سلوكية مشتركة',
        items: proc([
          'pos_reinf', 'shaping', 'prompting', 'prompt_fading', 'task_analysis', 'diff_reinf', 'token_econ',
          'generalization', 'maintenance', 'beh_contract', 'self_mgmt', 'antecedent', 'resp_cost', 'high_p',
          'beh_momentum', 'task_mod', 'choice_making', 'visual_schedules', 'video_model',
        ]),
      },
      {
        key: 'remedial_specific',
        titleEn: 'Remedial-specific procedures',
        titleAr: 'إجراءات خاصة بالتربية الخاصة',
        items: REMEDIAL_SPECIFIC_PROCEDURES,
      },
      {
        key: 'reduction',
        titleEn: 'Behavior reduction procedures',
        titleAr: 'إجراءات خفض السلوك',
        items: proc(['extinction', 'dra', 'dri', 'dro', 'drl', 'drh', 'fct', 'pos_punish', 'neg_punish', 'time_out']),
      },
    ],
    measureSections: [
      ...measureSections(['frequency', 'rate', 'duration', 'latency'], ['partial_interval', 'whole_interval', 'mts']),
      {
        key: 'remedial_specific',
        titleEn: 'Remedial-specific measures',
        titleAr: 'قياسات خاصة بالتربية الخاصة',
        items: meas(['wcpm', 'digits_pm', 'correct_incorrect_pm', 'error_analysis', 'writing_rubric', 'work_sample']),
      },
    ],
  },
};

/** Look up display names for ids chosen in a plan (any role). */
export const procedureName = (id: string, ar = false): string => {
  if (ar && PROCEDURE_AR[id]) return PROCEDURE_AR[id];
  const all: ProcedureItem[] = [
    ...BEHAVIOR_PROCEDURES,
    ...SPEECH_SPECIFIC_PROCEDURES,
    ...OT_SPECIFIC_PROCEDURES,
    ...REMEDIAL_SPECIFIC_PROCEDURES,
  ];
  return all.find((p) => p.id === id)?.name ?? id;
};

export const measureName = (id: string, ar = false): string =>
  (ar && MEASURE_AR[id]) || (CLINICAL_MEASURES.find((m) => m.id === id)?.name ?? id);
