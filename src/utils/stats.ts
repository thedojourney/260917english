import type { StudyStats } from '../types';
import { addDays, toISODate } from './leitner';

export function recordReview(stats: StudyStats, correct: boolean, now: Date = new Date()): StudyStats {
  const today = toISODate(now);
  const studyDates = stats.studyDates.includes(today)
    ? stats.studyDates
    : [...stats.studyDates, today];
  return {
    totalReviews: stats.totalReviews + 1,
    correctReviews: stats.correctReviews + (correct ? 1 : 0),
    studyDates,
  };
}

export function accuracy(stats: StudyStats): number {
  if (stats.totalReviews === 0) return 0;
  return stats.correctReviews / stats.totalReviews;
}

// Counts consecutive days (including today, or yesterday if not yet
// studied today) that appear in studyDates, walking backwards from today.
export function currentStreak(stats: StudyStats, now: Date = new Date()): number {
  const dateSet = new Set(stats.studyDates);
  const today = toISODate(now);
  let cursor = dateSet.has(today) ? today : addDays(today, -1);
  if (!dateSet.has(cursor)) return 0;

  let streak = 0;
  while (dateSet.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
