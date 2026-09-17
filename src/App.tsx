import { useEffect, useMemo, useState } from 'react';
import WordForm from './components/WordForm';
import WordList from './components/WordList';
import FlashcardStudy from './components/FlashcardStudy';
import ProgressStats from './components/ProgressStats';
import DataTools from './components/DataTools';
import type { NewWordInput, StudyStats, Word } from './types';
import { createWord, getDueWords, reviewWord as applyReview } from './utils/leitner';
import { recordReview } from './utils/stats';
import {
  EMPTY_STATS,
  exportData,
  importData,
  loadStats,
  loadWords,
  parseImport,
  saveStats,
  saveWords,
  serializeExport,
  StorageError,
} from './utils/storage';

type Tab = 'list' | 'study' | 'stats' | 'data';

const THEME_KEY = 'flashcards.theme.v1';

function loadInitialTheme(): 'light' | 'dark' {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [words, setWords] = useState<Word[]>([]);
  const [stats, setStats] = useState<StudyStats>(EMPTY_STATS);
  const [tab, setTab] = useState<Tab>('list');
  const [theme, setTheme] = useState<'light' | 'dark'>(loadInitialTheme);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setWords(loadWords());
      setStats(loadStats());
    } catch (err) {
      setLoadError(err instanceof StorageError ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.');
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  function persistWords(next: Word[]) {
    setWords(next);
    try {
      saveWords(next);
    } catch (err) {
      alert(err instanceof StorageError ? err.message : '단어 저장 중 오류가 발생했습니다.');
    }
  }

  function persistStats(next: StudyStats) {
    setStats(next);
    try {
      saveStats(next);
    } catch (err) {
      alert(err instanceof StorageError ? err.message : '통계 저장 중 오류가 발생했습니다.');
    }
  }

  function handleAddWord(input: NewWordInput) {
    persistWords([...words, createWord(input)]);
  }

  function handleBulkAdd(inputs: NewWordInput[]) {
    const now = new Date();
    persistWords([...words, ...inputs.map((input) => createWord(input, now))]);
  }

  function handleUpdateWord(id: string, input: NewWordInput) {
    persistWords(
      words.map((w) =>
        w.id === id
          ? { ...w, english: input.english, meaning: input.meaning, example: input.example, tags: input.tags }
          : w
      )
    );
  }

  function handleDeleteWord(id: string) {
    persistWords(words.filter((w) => w.id !== id));
  }

  function handleReview(id: string, correct: boolean) {
    persistWords(words.map((w) => (w.id === id ? applyReview(w, correct) : w)));
    persistStats(recordReview(stats, correct));
  }

  function handleExport() {
    const data = exportData();
    const blob = new Blob([serializeExport(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `flashcards-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File) {
    const text = await file.text();
    const data = parseImport(text);
    importData(data);
    setWords(data.words);
    setStats(data.stats);
  }

  const dueWords = useMemo(() => getDueWords(words), [words]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>📚 영어 단어장</h1>
        <button
          className="btn btn-ghost btn-sm theme-toggle"
          onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          aria-label="다크모드 전환"
        >
          {theme === 'light' ? '🌙 다크모드' : '☀️ 라이트모드'}
        </button>
      </header>

      {loadError && (
        <p className="form-error banner" role="alert">
          {loadError}
        </p>
      )}

      <nav className="tab-nav">
        <button className={tab === 'list' ? 'active' : ''} onClick={() => setTab('list')}>
          단어 목록
        </button>
        <button className={tab === 'study' ? 'active' : ''} onClick={() => setTab('study')}>
          학습 모드
          {dueWords.length > 0 && <span className="due-badge">{dueWords.length}</span>}
        </button>
        <button className={tab === 'stats' ? 'active' : ''} onClick={() => setTab('stats')}>
          통계
        </button>
        <button className={tab === 'data' ? 'active' : ''} onClick={() => setTab('data')}>
          백업/가져오기
        </button>
      </nav>

      <main className="app-main">
        {tab === 'list' && (
          <>
            <section className="panel">
              <h2>새 단어 등록</h2>
              <WordForm onSubmit={handleAddWord} submitLabel="추가" />
            </section>
            <section className="panel">
              <h2>단어 목록 ({words.length})</h2>
              <WordList words={words} onUpdate={handleUpdateWord} onDelete={handleDeleteWord} />
            </section>
          </>
        )}

        {tab === 'study' && (
          <section className="panel">
            <h2>오늘의 학습</h2>
            <FlashcardStudy dueWords={dueWords} onReview={handleReview} />
          </section>
        )}

        {tab === 'stats' && (
          <section className="panel">
            <h2>학습 통계</h2>
            <ProgressStats words={words} stats={stats} />
          </section>
        )}

        {tab === 'data' && (
          <section className="panel">
            <h2>백업 및 가져오기</h2>
            <DataTools onExport={handleExport} onImportFile={handleImportFile} onBulkAdd={handleBulkAdd} />
          </section>
        )}
      </main>
    </div>
  );
}
