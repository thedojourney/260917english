import { useEffect, useMemo, useState } from 'react';
import type { Word } from '../types';

interface FlashcardStudyProps {
  dueWords: Word[];
  onReview: (id: string, correct: boolean) => void;
}

export default function FlashcardStudy({ dueWords, onReview }: FlashcardStudyProps) {
  // Snapshot the queue when the session starts so cards don't jump around
  // mid-session as their box levels (and due status) change.
  const [queue, setQueue] = useState<Word[]>(dueWords);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });

  useEffect(() => {
    setQueue(dueWords);
    setIndex(0);
    setFlipped(false);
    setSessionStats({ correct: 0, incorrect: 0 });
    // Intentionally only re-snapshot when the due count identity changes
    // (e.g. navigating into the study tab), not on every word mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dueWords.length]);

  const current = queue[index];

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.code === 'Space' && current) {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [current]);

  const progressLabel = useMemo(
    () => (queue.length === 0 ? '' : `${Math.min(index + 1, queue.length)} / ${queue.length}`),
    [index, queue.length]
  );

  function handleAnswer(correct: boolean) {
    if (!current) return;
    onReview(current.id, correct);
    setSessionStats((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      incorrect: s.incorrect + (correct ? 0 : 1),
    }));
    setFlipped(false);
    setIndex((i) => i + 1);
  }

  if (queue.length === 0) {
    return (
      <div className="study-empty">
        <p>오늘 복습할 단어가 없습니다.</p>
        <p className="muted">새 단어를 등록하거나 내일 다시 확인해보세요.</p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="study-empty">
        <p>오늘의 학습을 모두 마쳤습니다! 🎉</p>
        <p className="muted">
          정답 {sessionStats.correct}개 · 오답 {sessionStats.incorrect}개
        </p>
      </div>
    );
  }

  return (
    <div className="study-mode">
      <p className="study-progress">{progressLabel}</p>
      <div
        className={`flashcard ${flipped ? 'flipped' : ''}`}
        onClick={() => setFlipped((f) => !f)}
        role="button"
        tabIndex={0}
        aria-label="카드를 클릭하거나 스페이스바를 눌러 뒤집기"
      >
        <div className="flashcard-inner">
          <div className="flashcard-face flashcard-front">
            <span className={`box-badge box-${current.boxLevel}`}>Box {current.boxLevel}</span>
            <h2>{current.english}</h2>
            <p className="muted">클릭하거나 스페이스바를 눌러 뜻 보기</p>
          </div>
          <div className="flashcard-face flashcard-back">
            <h3>{current.meaning}</h3>
            {current.example && <p className="flashcard-example">{current.example}</p>}
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="answer-actions">
          <button className="btn btn-danger" onClick={() => handleAnswer(false)}>
            오답
          </button>
          <button className="btn btn-success" onClick={() => handleAnswer(true)}>
            정답
          </button>
        </div>
      ) : (
        <div className="answer-hint">
          <button className="btn btn-primary" onClick={() => setFlipped(true)}>
            뒤집기
          </button>
        </div>
      )}
    </div>
  );
}
