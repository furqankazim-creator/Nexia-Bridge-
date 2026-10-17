export interface ProcedureItem {
  id: string;
  name: string;
  category: 'skill_acquisition' | 'behavior_reduction' | 'other' | 'speech_specific' | 'ot_specific' | 'remedial_specific';
  description?: string;
}

export interface MeasureItem {
  id: string;
  name: string;
  category: 'continuous' | 'discontinuous' | 'other' | 'speech_specific' | 'remedial_specific';
  type: string;
}

export const BEHAVIOR_PROCEDURES: ProcedureItem[] = [
  // Skill acquisition and behavior increase
  { id: 'pos_reinf', name: 'Positive reinforcement', category: 'skill_acquisition' },
  { id: 'neg_reinf', name: 'Negative reinforcement', category: 'skill_acquisition' },
  { id: 'shaping', name: 'Shaping', category: 'skill_acquisition' },
  { id: 'fwd_chain', name: 'Forward chaining', category: 'skill_acquisition' },
  { id: 'back_chain', name: 'Backward chaining', category: 'skill_acquisition' },
  { id: 'total_chain', name: 'Total-task chaining', category: 'skill_acquisition' },
  { id: 'prompting', name: 'Prompting', category: 'skill_acquisition' },
  { id: 'prompt_fading', name: 'Prompt fading', category: 'skill_acquisition' },
  { id: 'dtt', name: 'Discrete-trial training (DTT)', category: 'skill_acquisition' },
  { id: 'net', name: 'Natural environment teaching (NET)', category: 'skill_acquisition' },
  { id: 'bst', name: 'Behavioral skills training (BST)', category: 'skill_acquisition' },
  { id: 'prt', name: 'Pivotal response treatment (PRT)', category: 'skill_acquisition' },
  { id: 'task_analysis', name: 'Task analysis', category: 'skill_acquisition' },
  { id: 'diff_reinf', name: 'Differential reinforcement', category: 'skill_acquisition' },
  { id: 'token_econ', name: 'Token economy', category: 'skill_acquisition' },
  { id: 'generalization', name: 'Generalization', category: 'skill_acquisition' },
  { id: 'maintenance', name: 'Maintenance programming', category: 'skill_acquisition' },
  { id: 'stimulus_control', name: 'Stimulus control transfer', category: 'skill_acquisition' },

  // Behavior reduction
  { id: 'extinction', name: 'Extinction', category: 'behavior_reduction' },
  { id: 'dra', name: 'Differential reinforcement of alternative behavior (DRA)', category: 'behavior_reduction' },
  { id: 'dri', name: 'Differential reinforcement of incompatible behavior (DRI)', category: 'behavior_reduction' },
  { id: 'dro', name: 'Differential reinforcement of other behavior (DRO)', category: 'behavior_reduction' },
  { id: 'drl', name: 'Differential reinforcement of low rates (DRL)', category: 'behavior_reduction' },
  { id: 'drh', name: 'Differential reinforcement of high rates (DRH)', category: 'behavior_reduction' },
  { id: 'fct', name: 'Functional communication training (FCT)', category: 'behavior_reduction' },
  { id: 'antecedent', name: 'Antecedent interventions', category: 'behavior_reduction' },
  { id: 'pos_punish', name: 'Positive punishment', category: 'behavior_reduction' },
  { id: 'neg_punish', name: 'Negative punishment', category: 'behavior_reduction' },
  { id: 'resp_cost', name: 'Response cost', category: 'behavior_reduction' },
  { id: 'time_out', name: 'Time-out from positive reinforcement', category: 'behavior_reduction' },

  // Other treatment procedures
  { id: 'high_p', name: 'High-probability request sequence', category: 'other' },
  { id: 'beh_momentum', name: 'Behavioral momentum', category: 'other' },
  { id: 'ncr', name: 'Noncontingent reinforcement (NCR)', category: 'other' },
  { id: 'premack', name: 'Premack principle', category: 'other' },
  { id: 'fba', name: 'Functional behavior assessment (FBA)', category: 'other' },
  { id: 'fa', name: 'Functional analysis (FA)', category: 'other' },
  { id: 'beh_contract', name: 'Behavior contract', category: 'other' },
  { id: 'self_mgmt', name: 'Self-management', category: 'other' },
  { id: 'video_model', name: 'Video modeling', category: 'other' },
  { id: 'visual_schedules', name: 'Visual schedules', category: 'other' },
  { id: 'choice_making', name: 'Choice-making', category: 'other' },
  { id: 'task_mod', name: 'Task modification', category: 'other' },
  { id: 'noncont_attn', name: 'Noncontingent attention', category: 'other' },
];

export const SPEECH_SPECIFIC_PROCEDURES: ProcedureItem[] = [
  // In-session tools: they appear on the Today screen only when they are in the plan.
  { id: 'wh_drill', name: 'WH-question drill (where, what, who…)', category: 'speech_specific' },
  { id: 'aac_pad', name: 'AAC pad with speech output', category: 'speech_specific' },
  { id: 'artic_drill', name: 'Articulation drill', category: 'speech_specific' },
  { id: 'milieu', name: 'Milieu teaching', category: 'speech_specific' },
  { id: 'time_delay', name: 'Time delay', category: 'speech_specific' },
  { id: 'mand_model', name: 'Mand-model', category: 'speech_specific' },
  { id: 'modeling_imitation', name: 'Modeling and imitation', category: 'speech_specific' },
  { id: 'expansion_recast', name: 'Expansion and recasting', category: 'speech_specific' },
  { id: 'aac_input', name: 'Aided language input (AAC)', category: 'speech_specific' },
  { id: 'cueing_hier', name: 'Cueing hierarchy', category: 'speech_specific' },
  { id: 'minimal_pairs', name: 'Minimal pairs', category: 'speech_specific' },
  { id: 'shared_reading', name: 'Shared book reading', category: 'speech_specific' },
  { id: 'parent_coached', name: 'Parent-coached routines', category: 'speech_specific' },
];

export const OT_SPECIFIC_PROCEDURES: ProcedureItem[] = [
  // In-session tools: they appear on the Today screen only when they are in the plan.
  { id: 'ta_activity', name: 'Task analysis activity (hand-washing, buttoning…)', category: 'ot_specific' },
  { id: 'sensory_log', name: 'Sensory diet & proprioceptive log', category: 'ot_specific' },
  { id: 'graded_activity', name: 'Graded activity', category: 'ot_specific' },
  { id: 'sensory_diet', name: 'Sensory diet', category: 'ot_specific' },
  { id: 'regulation_strat', name: 'Regulation strategies', category: 'ot_specific' },
  { id: 'env_adaptation', name: 'Environment and equipment adaptation', category: 'ot_specific' },
  { id: 'graded_exposure', name: 'Graded exposure (feeding)', category: 'ot_specific' },
  { id: 'handwriting_prog', name: 'Handwriting and visual-motor program', category: 'ot_specific' },
  { id: 'bilateral_coord', name: 'Bilateral coordination', category: 'ot_specific' },
  { id: 'play_based', name: 'Play-based activities', category: 'ot_specific' },
  { id: 'home_prog', name: 'Home program', category: 'ot_specific' },
];

export const REMEDIAL_SPECIFIC_PROCEDURES: ProcedureItem[] = [
  { id: 'explicit_inst', name: 'Explicit instruction', category: 'remedial_specific' },
  { id: 'error_corr', name: 'Error correction', category: 'remedial_specific' },
  { id: 'scaffolding', name: 'Scaffolding', category: 'remedial_specific' },
  { id: 'graphic_org', name: 'Graphic organizers', category: 'remedial_specific' },
  { id: 'strategy_inst', name: 'Strategy instruction', category: 'remedial_specific' },
  { id: 'concrete_math', name: 'Concrete-to-abstract math', category: 'remedial_specific' },
  { id: 'phonics', name: 'Structured phonics', category: 'remedial_specific' },
  { id: 'repeated_reading', name: 'Repeated reading', category: 'remedial_specific' },
  { id: 'cover_copy_comp', name: 'Cover-copy-compare', category: 'remedial_specific' },
  { id: 'pre_teaching', name: 'Pre-teaching', category: 'remedial_specific' },
  { id: 'spaced_practice', name: 'Spaced practice', category: 'remedial_specific' },
  { id: 'peer_tutoring', name: 'Peer tutoring', category: 'remedial_specific' },
];

export const CLINICAL_MEASURES: MeasureItem[] = [
  // Continuous
  { id: 'frequency', name: 'Frequency (count)', category: 'continuous', type: 'counter' },
  { id: 'rate', name: 'Rate', category: 'continuous', type: 'rate' },
  { id: 'duration', name: 'Duration', category: 'continuous', type: 'timer' },
  { id: 'latency', name: 'Latency', category: 'continuous', type: 'latency' },
  { id: 'irt', name: 'Interresponse time (IRT)', category: 'continuous', type: 'irt' },

  // Discontinuous
  { id: 'partial_interval', name: 'Partial-interval recording', category: 'discontinuous', type: 'interval' },
  { id: 'whole_interval', name: 'Whole-interval recording', category: 'discontinuous', type: 'interval' },
  { id: 'mts', name: 'Momentary time sampling (MTS)', category: 'discontinuous', type: 'sampling' },

  // Other
  { id: 'permanent_product', name: 'Permanent product recording', category: 'other', type: 'score' },
  { id: 'percentage', name: 'Percentage', category: 'other', type: 'percent' },
  { id: 'trials_to_crit', name: 'Trials-to-criterion', category: 'other', type: 'sessions' },
  { id: 'trial_by_trial', name: 'Trial-by-trial recording', category: 'other', type: 'dtt' },
  { id: 'cold_probe', name: 'Cold-probe measurement', category: 'other', type: 'probe' },
  { id: 'accuracy', name: 'Accuracy measurement', category: 'other', type: 'error_analysis' },
  { id: 'baseline', name: 'Baseline measurement', category: 'other', type: 'baseline' },
  { id: 'ioa', name: 'Interobserver agreement (IOA)', category: 'other', type: 'ioa' },
  { id: 'treatment_integrity', name: 'Treatment integrity measurement', category: 'other', type: 'fidelity' },

  // Speech specific
  { id: 'cueing_level', name: 'Cueing level', category: 'speech_specific', type: 'cueing' },
  { id: 'mlu', name: 'Language sample (MLU)', category: 'speech_specific', type: 'mlu' },
  { id: 'aac_core', name: 'AAC core selections', category: 'speech_specific', type: 'aac' },

  // Remedial specific
  { id: 'wcpm', name: 'Words correct per minute', category: 'remedial_specific', type: 'fluency' },
  { id: 'digits_pm', name: 'Digits correct per minute', category: 'remedial_specific', type: 'fluency' },
  { id: 'correct_incorrect_pm', name: 'Correct and incorrect per minute', category: 'remedial_specific', type: 'rate' },
  { id: 'error_analysis', name: 'Error analysis', category: 'remedial_specific', type: 'rubric' },
  { id: 'writing_rubric', name: 'Writing rubric', category: 'remedial_specific', type: 'rubric' },
  { id: 'work_sample', name: 'Work sample', category: 'remedial_specific', type: 'sample' },
];
