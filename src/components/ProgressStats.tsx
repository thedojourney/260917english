import { useMemo } from 'react';
import type { StudyStats, Word } from '../types';
import { accuracy, currentStreak } from '../utils/stats';

interface ProgressStatsProps {
  words: Word[];
  stats: StudyStats;
}

export default function ProgressStats({ words, stats }: ProgressStatsProps) {
  const boxCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    words.forEach((w) => {
      counts[w.boxLevel] = (counts[w.boxLevel] ?? 0) + 1;
    });
    return counts;
  }, [words]);

  const accuracyPct = Math.round(accuracy(stats) * 100);
  const streak = currentStreak(stats);

  return (
    <div className="progress-stats">
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{words.length}</span>
          <span className="stat-label">누적 등록 단어</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.totalReviews}</span>
          <span className="stat-label">총 복습 횟수</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.totalReviews === 0 ? '-' : `${accuracyPct}%`}</span>
          <span className="stat-label">정답률</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{streak}일</span>
          <span className="stat-label">연속 학습일</span>
        </div>
      </div>

      <h3>Leitner 박스 분포</h3>
      <ul className="box-distribution">
        {[1, 2, 3, 4, 5].map((box) => (
          <li key={box}>
            <span className={`box-badge box-${box}`}>Box {box}</span>
            <div className="box-bar-track">
              <div
                className="box-bar-fill"
                style={{
                  width: words.length ? `${(boxCounts[box] / words.length) * 100}%` : '0%',
                }}
              />
            </div>
            <span className="box-count">{boxCounts[box]}개</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
