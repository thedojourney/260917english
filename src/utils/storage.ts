import type { AppData, StudyStats, Word } from '../types';

const WORDS_KEY = 'flashcards.words.v1';
const STATS_KEY = 'flashcards.stats.v1';
const GEMINI_API_KEY_KEY = 'flashcards.geminiApiKey.v1';

export const EMPTY_STATS: StudyStats = {
  totalReviews: 0,
  correctReviews: 0,
  studyDates: [],
};

export class StorageError extends Error {}

function isWord(value: unknown): value is Word {
  if (!value || typeof value !== 'object') return false;
  const w = value as Record<string, unknown>;
  return (
    typeof w.id === 'string' &&
    typeof w.english === 'string' &&
    typeof w.meaning === 'string' &&
    typeof w.boxLevel === 'number' &&
    w.boxLevel >= 1 &&
    w.boxLevel <= 5 &&
    typeof w.nextReviewDate === 'string' &&
    typeof w.createdAt === 'string'
  );
}

function isStats(value: unknown): value is StudyStats {
  if (!value || typeof value !== 'object') return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.totalReviews === 'number' &&
    typeof s.correctReviews === 'number' &&
    Array.isArray(s.studyDates)
  );
}

export function loadWords(): Word[] {
  try {
    const raw = localStorage.getItem(WORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isWord)) {
      throw new StorageError('저장된 단어 데이터 형식이 올바르지 않습니다.');
    }
    return parsed;
  } catch (err) {
    if (err instanceof StorageError) throw err;
    throw new StorageError('저장된 단어 데이터를 불러오는 중 오류가 발생했습니다.');
  }
}

export function saveWords(words: Word[]): void {
  try {
    localStorage.setItem(WORDS_KEY, JSON.stringify(words));
  } catch (err) {
    throw new StorageError(
      err instanceof DOMException && err.name === 'QuotaExceededError'
        ? '브라우저 저장 공간이 가득 찼습니다. 불필요한 단어를 삭제한 뒤 다시 시도해주세요.'
        : '단어 데이터를 저장하는 중 오류가 발생했습니다.'
    );
  }
}

export function loadStats(): StudyStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { ...EMPTY_STATS };
    const parsed = JSON.parse(raw);
    if (!isStats(parsed)) {
      throw new StorageError('저장된 학습 통계 형식이 올바르지 않습니다.');
    }
    return parsed;
  } catch (err) {
    if (err instanceof StorageError) throw err;
    throw new StorageError('저장된 학습 통계를 불러오는 중 오류가 발생했습니다.');
  }
}

export function saveStats(stats: StudyStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (err) {
    throw new StorageError(
      err instanceof DOMException && err.name === 'QuotaExceededError'
        ? '브라우저 저장 공간이 가득 찼습니다. 불필요한 단어를 삭제한 뒤 다시 시도해주세요.'
        : '학습 통계를 저장하는 중 오류가 발생했습니다.'
    );
  }
}

export function exportData(): AppData {
  return { words: loadWords(), stats: loadStats() };
}

export function serializeExport(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function parseImport(json: string): AppData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new StorageError('올바른 JSON 형식이 아닙니다. 파일 내용을 확인해주세요.');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new StorageError('가져온 파일의 데이터 구조가 올바르지 않습니다.');
  }
  const data = parsed as Record<string, unknown>;
  const words = data.words;
  const stats = data.stats;
  if (!Array.isArray(words) || !words.every(isWord)) {
    throw new StorageError('가져온 파일에 단어 데이터가 없거나 형식이 올바르지 않습니다.');
  }
  if (!isStats(stats)) {
    throw new StorageError('가져온 파일에 학습 통계 데이터가 없거나 형식이 올바르지 않습니다.');
  }
  return { words, stats };
}

export function importData(data: AppData): void {
  saveWords(data.words);
  saveStats(data.stats);
}

// The Gemini API key is stored only in this browser's localStorage and is
// sent directly from the browser to Google's API — it never passes through
// any server of ours.
export function loadGeminiApiKey(): string {
  try {
    return localStorage.getItem(GEMINI_API_KEY_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveGeminiApiKey(key: string): void {
  try {
    if (key) {
      localStorage.setItem(GEMINI_API_KEY_KEY, key);
    } else {
      localStorage.removeItem(GEMINI_API_KEY_KEY);
    }
  } catch {
    throw new StorageError('API 키를 저장하는 중 오류가 발생했습니다.');
  }
}
