/** Arabic names for the procedure and measure ids in clinicalCatalog.ts. */
export const PROCEDURE_AR: Record<string, string> = {
  // Skill acquisition and behavior increase
  pos_reinf: 'التعزيز الإيجابي', neg_reinf: 'التعزيز السلبي', shaping: 'التشكيل', fwd_chain: 'التسلسل الأمامي',
  back_chain: 'التسلسل الخلفي', total_chain: 'التسلسل الكلي للمهمة', prompting: 'التلقين', prompt_fading: 'تلاشي التلقين',
  dtt: 'التدريب بالمحاولات المنفصلة (DTT)', net: 'التعليم في البيئة الطبيعية (NET)', bst: 'التدريب على المهارات السلوكية (BST)',
  prt: 'العلاج بالاستجابة المحورية (PRT)', task_analysis: 'تحليل المهمة', diff_reinf: 'التعزيز التفاضلي',
  token_econ: 'نظام الرموز', generalization: 'التعميم', maintenance: 'برمجة الاستمرارية', stimulus_control: 'نقل ضبط المثير',
  // Behavior reduction
  extinction: 'الإطفاء', dra: 'التعزيز التفاضلي للسلوك البديل (DRA)', dri: 'التعزيز التفاضلي للسلوك المتعارض (DRI)',
  dro: 'التعزيز التفاضلي للسلوك الآخر (DRO)', drl: 'التعزيز التفاضلي للمعدلات المنخفضة (DRL)',
  drh: 'التعزيز التفاضلي للمعدلات المرتفعة (DRH)', fct: 'التدريب على التواصل الوظيفي (FCT)',
  antecedent: 'التدخلات السابقة للسلوك', pos_punish: 'العقاب الإيجابي', neg_punish: 'العقاب السلبي',
  resp_cost: 'تكلفة الاستجابة', time_out: 'فترة الإبعاد عن التعزيز الإيجابي',
  // Other treatment procedures
  high_p: 'تسلسل الطلبات عالية الاحتمال', beh_momentum: 'الزخم السلوكي', ncr: 'التعزيز غير المشروط (NCR)',
  premack: 'مبدأ بريماك', fba: 'التقييم الوظيفي للسلوك (FBA)', fa: 'التحليل الوظيفي (FA)', beh_contract: 'العقد السلوكي',
  self_mgmt: 'إدارة الذات', video_model: 'النمذجة بالفيديو', visual_schedules: 'الجداول البصرية',
  choice_making: 'اتخاذ الخيارات', task_mod: 'تعديل المهمة', noncont_attn: 'الانتباه غير المشروط',
  // Speech
  ta_activity: 'نشاط تحليل المهمة (غسل اليدين، ربط الأزرار…)', sensory_log: 'النظام الحسي وسجل الحس العميق',
  wh_drill: 'تدريب أسئلة الاستفهام (أين، ماذا، من…)', aac_pad: 'لوحة التواصل المعزز مع نطق صوتي', artic_drill: 'تدريب النطق (مخارج الحروف)',
  milieu: 'التدريس البيئي (Milieu)', time_delay: 'التأخير الزمني', mand_model: 'الطلب والنمذجة (Mand-model)',
  modeling_imitation: 'النمذجة والتقليد', expansion_recast: 'التوسيع وإعادة الصياغة',
  aac_input: 'المدخلات اللغوية بالوسائل البديلة (AAC)', cueing_hier: 'تسلسل التلميحات', minimal_pairs: 'الأزواج الصغرى',
  shared_reading: 'القراءة المشتركة للكتب', parent_coached: 'الروتينات بتدريب الوالدين',
  // OT
  graded_activity: 'النشاط المتدرج', sensory_diet: 'النظام الحسي (Sensory diet)', regulation_strat: 'استراتيجيات التنظيم',
  env_adaptation: 'تكييف البيئة والمعدات', graded_exposure: 'التعريض المتدرج (التغذية)',
  handwriting_prog: 'برنامج الكتابة اليدوية والإدراك البصري الحركي', bilateral_coord: 'التنسيق الثنائي',
  play_based: 'الأنشطة القائمة على اللعب', home_prog: 'البرنامج المنزلي',
  // Remedial
  explicit_inst: 'التدريس المباشر', error_corr: 'تصحيح الأخطاء', scaffolding: 'التدعيم (السقالات التعليمية)',
  graphic_org: 'المنظمات الرسومية', strategy_inst: 'التدريس بالاستراتيجيات', concrete_math: 'الرياضيات من المحسوس إلى المجرد',
  phonics: 'الصوتيات المنظمة', repeated_reading: 'القراءة المتكررة', cover_copy_comp: 'التغطية والنسخ والمقارنة',
  pre_teaching: 'التدريس المسبق', spaced_practice: 'التدريب الموزع', peer_tutoring: 'التدريس بالأقران',
};

export const MEASURE_AR: Record<string, string> = {
  frequency: 'التكرار (العدد)', rate: 'المعدل', duration: 'المدة', latency: 'زمن الاستجابة (الكمون)', irt: 'الزمن بين الاستجابات (IRT)',
  partial_interval: 'التسجيل بالفاصل الجزئي', whole_interval: 'التسجيل بالفاصل الكلي', mts: 'العينة الزمنية اللحظية (MTS)',
  permanent_product: 'تسجيل الناتج الدائم', percentage: 'النسبة المئوية', trials_to_crit: 'المحاولات حتى بلوغ المعيار',
  trial_by_trial: 'التسجيل محاولة بمحاولة', cold_probe: 'القياس بالمسح البارد', accuracy: 'قياس الدقة', baseline: 'قياس الخط القاعدي',
  ioa: 'اتفاق الملاحظين (IOA)', treatment_integrity: 'قياس سلامة تنفيذ العلاج',
  cueing_level: 'مستوى التلميح', mlu: 'عينة لغوية (MLU)', aac_core: 'اختيارات مفردات AAC الأساسية',
  wcpm: 'الكلمات الصحيحة في الدقيقة', digits_pm: 'الأرقام الصحيحة في الدقيقة', correct_incorrect_pm: 'الصحيح وغير الصحيح في الدقيقة',
  error_analysis: 'تحليل الأخطاء', writing_rubric: 'معيار تقييم الكتابة', work_sample: 'عينة عمل',
};
