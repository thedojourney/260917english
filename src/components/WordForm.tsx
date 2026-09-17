import { FormEvent, useEffect, useState } from 'react';
import type { NewWordInput, Word } from '../types';

interface WordFormProps {
  initial?: Word;
  onSubmit: (input: NewWordInput) => void;
  onCancel?: () => void;
  submitLabel: string;
}

function toTagsInput(tags?: string[]): string {
  return tags?.join(', ') ?? '';
}

export default function WordForm({ initial, onSubmit, onCancel, submitLabel }: WordFormProps) {
  const [english, setEnglish] = useState(initial?.english ?? '');
  const [meaning, setMeaning] = useState(initial?.meaning ?? '');
  const [example, setExample] = useState(initial?.example ?? '');
  const [tagsInput, setTagsInput] = useState(toTagsInput(initial?.tags));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEnglish(initial?.english ?? '');
    setMeaning(initial?.meaning ?? '');
    setExample(initial?.example ?? '');
    setTagsInput(toTagsInput(initial?.tags));
  }, [initial]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!english.trim() || !meaning.trim()) {
      setError('영단어와 뜻은 필수 입력 항목입니다.');
      return;
    }
    setError(null);
    onSubmit({
      english: english.trim(),
      meaning: meaning.trim(),
      example: example.trim() || undefined,
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
    if (!initial) {
      setEnglish('');
      setMeaning('');
      setExample('');
      setTagsInput('');
    }
  }

  return (
    <form className="word-form" onSubmit={handleSubmit}>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-row">
        <label htmlFor="wf-english">영단어 *</label>
        <input
          id="wf-english"
          type="text"
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          placeholder="예: apple"
          autoComplete="off"
        />
      </div>
      <div className="form-row">
        <label htmlFor="wf-meaning">뜻 *</label>
        <input
          id="wf-meaning"
          type="text"
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          placeholder="예: 사과"
          autoComplete="off"
        />
      </div>
      <div className="form-row">
        <label htmlFor="wf-example">예문 (선택)</label>
        <textarea
          id="wf-example"
          value={example}
          onChange={(e) => setExample(e.target.value)}
          placeholder="예: I ate an apple this morning."
          rows={2}
        />
      </div>
      <div className="form-row">
        <label htmlFor="wf-tags">카테고리/태그 (쉼표로 구분, 선택)</label>
        <input
          id="wf-tags"
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="예: 음식, 명사"
          autoComplete="off"
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            취소
          </button>
        )}
      </div>
    </form>
  );
}
