import assert from 'node:assert/strict';
import test from 'node:test';
import { formatDictation as f, joinDictation as j } from '../src/utils/dictationText.ts';

test('English: spoken punctuation, line breaks and capitals', () => {
  assert.equal(f('the child answered where questions comma then asked for help full stop he smiled', 'en'), 'the child answered where questions, then asked for help. He smiled');
  assert.equal(f('did he respond question mark yes exclamation mark', 'en'), 'did he respond? Yes!');
  assert.equal(f('subjective colon calm and happy new line objective colon eight trials', 'en'), 'subjective: calm and happy\nObjective: eight trials');
  assert.equal(f('first point new paragraph second point', 'en'), 'first point\n\nSecond point');
  assert.equal(f('  extra   spaces   here  ', 'en'), 'extra spaces here');
  assert.equal(f('', 'en'), '');
  assert.equal(f('a period of time', 'en'), 'a period of time', '"period" is an ordinary word, only "full stop" is a command');
  assert.equal(f('the commander arrived', 'en'), 'the commander arrived', 'commands only match whole words');
});

test('Arabic and Urdu spoken punctuation', () => {
  assert.equal(f('أجاب الطفل بشكل صحيح فاصلة ثم طلب المساعدة نقطة', 'ar'), 'أجاب الطفل بشكل صحيح، ثم طلب المساعدة.');
  assert.equal(f('هل استجاب علامة استفهام نعم', 'ar'), 'هل استجاب؟ نعم');
  assert.equal(f('السطر الأول سطر جديد السطر الثاني', 'ar'), 'السطر الأول\nالسطر الثاني');
  assert.equal(f('بچے نے جواب دیا کوما پھر مدد مانگی فل اسٹاپ', 'ur'), 'بچے نے جواب دیا، پھر مدد مانگی۔');
  assert.equal(f('کیا اس نے جواب دیا سوالیہ نشان', 'ur'), 'کیا اس نے جواب دیا؟');
});

test('joining dictation onto what is already in the note', () => {
  assert.equal(j('', 'hello there'), 'Hello there', 'starts with a capital');
  assert.equal(j('The child arrived.', 'he was calm'), 'The child arrived. He was calm', 'capital after a full stop');
  assert.equal(j('The child said', 'hello again'), 'The child said hello again', 'no capital mid-sentence');
  assert.equal(j('The child said', ', then left'), 'The child said, then left', 'no space before a mark');
  assert.equal(j('Line one\n', 'line two'), 'Line one\nLine two', 'capital after a new line, no extra space');
  assert.equal(j('Line one', '\nLine two'), 'Line one\nLine two');
  assert.equal(j('abc   ', 'def'), 'abc def', 'trailing spaces are not doubled');
  assert.equal(j('Existing note', ''), 'Existing note');
  assert.equal(j('', 'مرحبا بالجميع'), 'مرحبا بالجميع', 'Arabic is left as spoken');
});
