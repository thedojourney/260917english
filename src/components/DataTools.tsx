import { useRef, useState } from 'react';
import type { NewWordInput } from '../types';
import { parseWordsCSV } from '../utils/csv';

interface DataToolsProps {
  onExport: () => void;
  onImportFile: (file: File) => Promise<void> | void;
  onBulkAdd: (inputs: NewWordInput[]) => void;
}

export default function DataTools({ onExport, onImportFile, onBulkAdd }: DataToolsProps) {
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [csvText, setCsvText] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  async function handleImportChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onImportFile(file);
      setMessage({ type: 'success', text: '데이터를 성공적으로 가져왔습니다.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : '가져오기에 실패했습니다.' });
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  }

  function handleCsvSubmit() {
    if (!csvText.trim()) {
      setMessage({ type: 'error', text: 'CSV 내용을 입력해주세요.' });
      return;
    }
    try {
      const inputs = parseWordsCSV(csvText).filter((w) => w.english && w.meaning);
      if (inputs.length === 0) {
        setMessage({ type: 'error', text: '추가할 수 있는 유효한 행이 없습니다. english,meaning 형식을 확인해주세요.' });
        return;
      }
      onBulkAdd(inputs);
      setCsvText('');
      setMessage({ type: 'success', text: `${inputs.length}개의 단어를 추가했습니다.` });
    } catch {
      setMessage({ type: 'error', text: 'CSV 파싱 중 오류가 발생했습니다.' });
    }
  }

  return (
    <div className="data-tools">
      {message && (
        <p className={message.type === 'error' ? 'form-error' : 'form-success'} role="status">
          {message.text}
        </p>
      )}

      <section className="data-section">
        <h3>JSON 내보내기 / 가져오기</h3>
        <p className="muted">기기를 변경할 때 전체 데이터를 백업하거나 옮길 수 있습니다.</p>
        <div className="form-actions">
          <button className="btn btn-primary" onClick={onExport}>
            JSON으로 내보내기
          </button>
          <button className="btn btn-ghost" onClick={() => importInputRef.current?.click()}>
            JSON 파일 가져오기
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={handleImportChange}
          />
        </div>
      </section>

      <section className="data-section">
        <h3>CSV로 단어 일괄 등록</h3>
        <p className="muted">
          한 줄에 <code>영단어,뜻,예문(선택),태그(|로 구분, 선택)</code> 형식으로 입력하세요.
        </p>
        <textarea
          rows={5}
          placeholder={'apple,사과,I ate an apple.,음식|명사\nrun,달리다'}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
        />
        <div className="form-actions">
          <button className="btn btn-primary" onClick={handleCsvSubmit}>
            CSV 일괄 등록
          </button>
        </div>
      </section>
    </div>
  );
}
