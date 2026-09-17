import type { BoxLevel, Word } from '../types';

// Review interval (in days) before a card in each box comes due again.
// Box 1 = review daily, each higher box doubles the gap (Leitner system).
export const BOX_INTERVALS_DAYS: Record<BoxLevel, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 8,
  5: 16,
};

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toISODate(date);
}

export function createWord(
  input: { english: string; meaning: string; example?: string; tags?: string[] },
  now: Date = new Date()
): Word {
  const nowISO = now.toISOString();
  return {
    id: generateId(),
    english: input.english.trim(),
    meaning: input.meaning.trim(),
    example: input.example?.trim() || undefined,
    tags: input.tags?.map((t) => t.trim()).filter(Boolean),
    boxLevel: 1,
    nextReviewDate: toISODate(now),
    createdAt: nowISO,
  };
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

// Applies a review result to a word, returning the updated word.
// Correct: move up one box (max 5) and push the next review date out
// by that box's interval. Incorrect: drop back to box 1 and schedule
// review for tomorrow, so mistakes get reinforced sooner.
export function reviewWord(word: Word, correct: boolean, now: Date = new Date()): Word {
  const today = toISODate(now);
  if (correct) {
    const nextBox = Math.min(5, word.boxLevel + 1) as BoxLevel;
    return {
      ...word,
      boxLevel: nextBox,
      nextReviewDate: addDays(today, BOX_INTERVALS_DAYS[nextBox]),
    };
  }
  return {
    ...word,
    boxLevel: 1,
    nextReviewDate: addDays(today, BOX_INTERVALS_DAYS[1]),
  };
}

export function isDueToday(word: Word, now: Date = new Date()): boolean {
  return word.nextReviewDate <= toISODate(now);
}

export function getDueWords(words: Word[], now: Date = new Date()): Word[] {
  return words.filter((w) => isDueToday(w, now));
}
