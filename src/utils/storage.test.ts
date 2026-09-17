import { beforeEach, describe, expect, it } from 'vitest';
import { createWord } from './leitner';
import {
  EMPTY_STATS,
  loadStats,
  loadWords,
  parseImport,
  saveStats,
  saveWords,
  serializeExport,
  StorageError,
} from './storage';

describe('localStorage persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty defaults when nothing has been saved yet', () => {
    expect(loadWords()).toEqual([]);
    expect(loadStats()).toEqual(EMPTY_STATS);
  });

  it('round-trips words and stats through localStorage', () => {
    const word = createWord({ english: 'apple', meaning: '사과' });
    saveWords([word]);
    saveStats({ totalReviews: 3, correctReviews: 2, studyDates: ['2026-01-10'] });

    expect(loadWords()).toEqual([word]);
    expect(loadStats()).toEqual({ totalReviews: 3, correctReviews: 2, studyDates: ['2026-01-10'] });
  });

  it('survives a reload by reading back exactly what was written', () => {
    const word = createWord({ english: 'banana', meaning: '바나나' });
    saveWords([word]);
    // Simulate a fresh page load re-reading from the same localStorage.
    const reloaded = loadWords();
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0].english).toBe('banana');
  });

  it('throws a StorageError for malformed JSON on import', () => {
    expect(() => parseImport('{not valid json')).toThrow(StorageError);
  });

  it('throws a StorageError when imported data is missing required fields', () => {
    expect(() => parseImport(JSON.stringify({ words: [{ english: 'x' }] }))).toThrow(StorageError);
  });

  it('accepts a well-formed export/import round trip', () => {
    const word = createWord({ english: 'cat', meaning: '고양이' });
    const exported = serializeExport({
      words: [word],
      stats: { totalReviews: 1, correctReviews: 1, studyDates: ['2026-01-10'] },
    });
    const imported = parseImport(exported);
    expect(imported.words).toEqual([word]);
    expect(imported.stats.totalReviews).toBe(1);
  });

  it('throws a StorageError with a clear message when corrupted data is already stored', () => {
    localStorage.setItem('flashcards.words.v1', '{"not":"an array"}');
    expect(() => loadWords()).toThrow(StorageError);
  });
});
