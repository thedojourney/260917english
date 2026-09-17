import { describe, expect, it } from 'vitest';
import { addDays, createWord, getDueWords, isDueToday, reviewWord, toISODate } from './leitner';

describe('leitner box movement', () => {
  const baseNow = new Date('2026-01-10T00:00:00.000Z');

  it('starts a new word at box 1, due today', () => {
    const word = createWord({ english: 'apple', meaning: '사과' }, baseNow);
    expect(word.boxLevel).toBe(1);
    expect(word.nextReviewDate).toBe('2026-01-10');
  });

  it('moves a word up one box and pushes out the next review date on a correct answer', () => {
    const word = createWord({ english: 'apple', meaning: '사과' }, baseNow);
    const afterCorrect = reviewWord(word, true, baseNow);
    expect(afterCorrect.boxLevel).toBe(2);
    expect(afterCorrect.nextReviewDate).toBe(addDays('2026-01-10', 2));
  });

  it('caps the box level at 5 on repeated correct answers', () => {
    let word = createWord({ english: 'apple', meaning: '사과' }, baseNow);
    for (let i = 0; i < 10; i++) {
      word = reviewWord(word, true, baseNow);
    }
    expect(word.boxLevel).toBe(5);
  });

  it('resets a word to box 1 on an incorrect answer', () => {
    let word = createWord({ english: 'apple', meaning: '사과' }, baseNow);
    word = reviewWord(word, true, baseNow); // box 2
    word = reviewWord(word, true, baseNow); // box 3
    const afterWrong = reviewWord(word, false, baseNow);
    expect(afterWrong.boxLevel).toBe(1);
    expect(afterWrong.nextReviewDate).toBe(addDays('2026-01-10', 1));
  });

  it('only surfaces words whose nextReviewDate has arrived', () => {
    const dueWord = createWord({ english: 'due', meaning: '만기' }, baseNow);
    const futureWord = {
      ...createWord({ english: 'future', meaning: '미래' }, baseNow),
      nextReviewDate: addDays(toISODate(baseNow), 5),
    };
    expect(isDueToday(dueWord, baseNow)).toBe(true);
    expect(isDueToday(futureWord, baseNow)).toBe(false);
    expect(getDueWords([dueWord, futureWord], baseNow)).toEqual([dueWord]);
  });
});
