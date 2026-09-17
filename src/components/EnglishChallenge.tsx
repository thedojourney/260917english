import { useState } from 'react';
import type { ChallengeQuestion, Word } from '../types';
import { generateChallenge, GeminiError, pickChallengeWords } from '../utils/gemini';
import { loadGeminiApiKey, saveGeminiApiKey, StorageError } from '../utils/storage';

interface EnglishChallengeProps {
  words: Word[];
  dueWords: Word[];
  onReview: (id: string, correct: boolean) => void;
}

const QUESTION_COUNT_OPTIONS = [5, 10];

type SelectedAnswer = { choiceIndex: number; correct: boolean };

export default function EnglishChallenge({ words, dueWords, onReview }: EnglishChallengeProps) {
  const [apiKey, setApiKey] = useState(() => loadGeminiApiKey());
  const [keyMessage, setKeyMessage] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState<ChallengeQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<SelectedAnswer | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSaveKey() {
    try {
      saveGeminiApiKey(apiKey.trim());
      setKeyMessage('API 키가 저장되었습니다.');
    } catch (err) {
      setKeyMessage(err instanceof StorageError ? err.message : 'API 키 저장에 실패했습니다.');
    }
  }

  function handleClearKey() {
    saveGeminiApiKey('');
    setApiKey('');
    setKeyMessage('API 키가 삭제되었습니다.');
  }

  async function handleStart() {
    setError(null);
    setLoading(true);
    try {
      const picked = pickChallengeWords(words, dueWords, Math.min(questionCount, words.length));
      const result = await generateChallenge(apiKey, picked, picked.length);
      setQuestions(result);
      setIndex(0);
      setSelected(null);
      setCorrectCount(0);
    } catch (err) {
      setError(err instanceof GeminiError ? err.message : 'AI 챌린지를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function handleAnswer(choiceIndex: number) {
    if (!questions) return;
    const current = questions[index];
    const correct = choiceIndex === current.answerIndex;
    setSelected({ choiceIndex, correct });
    if (correct) setCorrectCount((c) => c + 1);

    const matchedWord = words.find((w) => w.english === current.targetWord);
    if (matchedWord) onReview(matchedWord.id, correct);
  }

  function handleNext() {
    if (!questions) return;
    setSelected(null);
    setIndex((i) => i + 1);
  }

  function handleRestart() {
    setQuestions(null);
    setIndex(0);
    setSelected(null);
    setCorrectCount(0);
    setError(null);
  }

  const current = questions?.[index];
  const finished = questions !== null && index >= questions.length;

  return (
    <div className="challenge">
      <section className="data-section">
        <h3>🔑 Gemini API 키</h3>
        <p className="muted">
          키는 이 브라우저에만 저장되며, Google Gemini API로 직접 전송됩니다. 서버에 저장되지 않습니다.
        </p>
        <div className="form-row">
          <input
            type="password"
            placeholder="AIzaSy... 로 시작하는 Gemini API 키"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoComplete="off"
          />
        </div>
        {keyMessage && <p className="form-success">{keyMessage}</p>}
        <div className="form-actions">
          <button className="btn btn-ghost btn-sm" onClick={handleSaveKey}>
            키 저장
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleClearKey}>
            키 삭제
          </button>
        </div>
      </section>

      {!questions && (
        <section className="data-section challenge-start">
          <h3>🏆 오늘의 영어 챌린지</h3>
          <p className="muted">
            등록된 단어를 바탕으로 Gemini AI가 만든 객관식 문제를 풀어보세요. 복습이 필요한 단어가 우선
            출제됩니다.
          </p>
          {words.length === 0 ? (
            <p className="empty-state">먼저 단어를 등록해주세요.</p>
          ) : (
            <>
              <div className="form-row">
                <label htmlFor="challenge-count">문제 수</label>
                <select
                  id="challenge-count"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                >
                  {QUESTION_COUNT_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {Math.min(n, words.length)}문제
                    </option>
                  ))}
                </select>
              </div>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleStart} disabled={loading}>
                  {loading ? 'AI가 문제를 만드는 중...' : '챌린지 시작'}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {questions && !finished && current && (
        <section className="panel challenge-quiz">
          <p className="study-progress">
            {index + 1} / {questions.length}
          </p>
          <h3 className="challenge-question">{current.question}</h3>
          <div className="challenge-choices">
            {current.choices.map((choice, i) => {
              const isSelected = selected?.choiceIndex === i;
              const isAnswer = i === current.answerIndex;
              let stateClass = '';
              if (selected) {
                if (isAnswer) stateClass = 'choice-correct';
                else if (isSelected) stateClass = 'choice-wrong';
              }
              return (
                <button
                  key={i}
                  className={`challenge-choice ${stateClass}`}
                  disabled={!!selected}
                  onClick={() => handleAnswer(i)}
                >
                  {choice}
                </button>
              );
            })}
          </div>
          {selected && (
            <div className="challenge-feedback">
              <p className={selected.correct ? 'form-success' : 'form-error'}>
                {selected.correct ? '정답입니다! 🎉' : '아쉬워요, 오답이에요.'}
              </p>
              {current.explanation && <p className="muted">{current.explanation}</p>}
              <button className="btn btn-primary" onClick={handleNext}>
                {index + 1 === questions.length ? '결과 보기' : '다음 문제'}
              </button>
            </div>
          )}
        </section>
      )}

      {finished && questions && (
        <section className="panel challenge-result">
          <h3>챌린지 완료! 🏁</h3>
          <p className="stat-value">
            {correctCount} / {questions.length}
          </p>
          <p className="muted">정답을 맞힌 단어는 다음 박스로, 틀린 단어는 1번 박스로 이동했어요.</p>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleRestart}>
              새 챌린지 시작
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
