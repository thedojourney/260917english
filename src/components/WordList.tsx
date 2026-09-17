import { useMemo, useState } from 'react';
import type { Word } from '../types';
import WordForm from './WordForm';

interface WordListProps {
  words: Word[];
  onUpdate: (id: string, input: { english: string; meaning: string; example?: string; tags?: string[] }) => void;
  onDelete: (id: string) => void;
}

export default function WordList({ words, onUpdate, onDelete }: WordListProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    words.forEach((w) => w.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [words]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return words
      .filter((w) => (category === 'all' ? true : w.tags?.includes(category)))
      .filter((w) =>
        q ? w.english.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q) : true
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [words, query, category]);

  return (
    <div className="word-list">
      <div className="list-controls">
        <input
          type="search"
          placeholder="영단어 또는 뜻 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="단어 검색"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="카테고리 필터">
          <option value="all">전체 카테고리</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-state">등록된 단어가 없습니다. 위에서 새 단어를 추가해보세요.</p>
      ) : (
        <ul className="word-items">
          {filtered.map((word) => (
            <li key={word.id} className="word-item">
              {editingId === word.id ? (
                <WordForm
                  initial={word}
                  submitLabel="저장"
                  onCancel={() => setEditingId(null)}
                  onSubmit={(input) => {
                    onUpdate(word.id, input);
                    setEditingId(null);
                  }}
                />
              ) : (
                <>
                  <div className="word-item-main">
                    <div className="word-item-text">
                      <strong>{word.english}</strong>
                      <span className="word-meaning">{word.meaning}</span>
                    </div>
                    <span className={`box-badge box-${word.boxLevel}`}>Box {word.boxLevel}</span>
                  </div>
                  {word.example && <p className="word-example">{word.example}</p>}
                  {word.tags && word.tags.length > 0 && (
                    <div className="word-tags">
                      {word.tags.map((t) => (
                        <span key={t} className="tag-chip">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="word-item-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(word.id)}>
                      수정
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        if (confirm(`"${word.english}" 단어를 삭제할까요?`)) {
                          onDelete(word.id);
                        }
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
