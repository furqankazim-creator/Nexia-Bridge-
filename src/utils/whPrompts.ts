import type { WhType } from '../types';

export interface DrillPrompt { q: string; a: string }

/** Starter prompts per question type, used when the week's question set has none of that type. */
export const PROMPT_BANK: Record<'en' | 'ar', Record<WhType, DrillPrompt[]>> = {
  en: {
    where: [{ q: 'Where is the teddy bear hiding?', a: 'Under the green chair' }, { q: 'Where do we sleep?', a: 'In the bed' }, { q: 'Where is the ball?', a: 'On the table' }, { q: 'Where do fish live?', a: 'In the water' }],
    what: [{ q: 'What do you use to drink?', a: 'A cup' }, { q: 'What is the boy doing?', a: 'Running' }, { q: 'What do you wear on your feet?', a: 'Shoes' }, { q: 'What says meow?', a: 'The cat' }],
    who: [{ q: 'Who is eating the apple?', a: 'The girl' }, { q: 'Who drives the bus?', a: 'The driver' }, { q: 'Who reads you a story?', a: 'Mama' }, { q: 'Who is sleeping?', a: 'The baby' }],
    why: [{ q: 'Why do we wear a coat?', a: 'Because it is cold' }, { q: 'Why do we wash our hands?', a: 'To get clean' }, { q: 'Why do we sleep?', a: 'Because we are tired' }, { q: 'Why is he crying?', a: 'Because he is sad' }],
    when: [{ q: 'When do we sleep?', a: 'At night' }, { q: 'When do we eat breakfast?', a: 'In the morning' }, { q: 'When do we brush our teeth?', a: 'After eating' }, { q: 'When do we see the sun?', a: 'In the day' }],
    how: [{ q: 'How do you wash your hands?', a: 'With soap and water' }, { q: 'How do you go to school?', a: 'By bus' }, { q: 'How do you open the door?', a: 'Turn the handle' }, { q: 'How do you eat soup?', a: 'With a spoon' }],
  },
  ar: {
    where: [{ q: 'أين الدب مختبئ؟', a: 'تحت الكرسي الأخضر' }, { q: 'أين ننام؟', a: 'في السرير' }, { q: 'أين الكرة؟', a: 'على الطاولة' }, { q: 'أين تعيش السمكة؟', a: 'في الماء' }],
    what: [{ q: 'بماذا تشرب؟', a: 'بكوب' }, { q: 'ماذا يفعل الولد؟', a: 'يركض' }, { q: 'ماذا تلبس في قدميك؟', a: 'حذاء' }, { q: 'من يقول مياو؟', a: 'القطة' }],
    who: [{ q: 'من يأكل التفاحة؟', a: 'البنت' }, { q: 'من يقود الحافلة؟', a: 'السائق' }, { q: 'من يقرأ لك قصة؟', a: 'ماما' }, { q: 'من النائم؟', a: 'الطفل' }],
    why: [{ q: 'لماذا نلبس المعطف؟', a: 'لأن الجو بارد' }, { q: 'لماذا نغسل أيدينا؟', a: 'لنكون نظيفين' }, { q: 'لماذا ننام؟', a: 'لأننا متعبون' }, { q: 'لماذا يبكي؟', a: 'لأنه حزين' }],
    when: [{ q: 'متى ننام؟', a: 'في الليل' }, { q: 'متى نتناول الفطور؟', a: 'في الصباح' }, { q: 'متى ننظف أسناننا؟', a: 'بعد الأكل' }, { q: 'متى نرى الشمس؟', a: 'في النهار' }],
    how: [{ q: 'كيف تغسل يديك؟', a: 'بالصابون والماء' }, { q: 'كيف تذهب إلى المدرسة؟', a: 'بالحافلة' }, { q: 'كيف تفتح الباب؟', a: 'أدير المقبض' }, { q: 'كيف تأكل الشوربة؟', a: 'بالملعقة' }],
  },
};
