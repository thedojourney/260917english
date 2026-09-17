# 영어 단어장 (English Flashcards)

브라우저에서 동작하는 영어 단어장/플래시카드 학습 웹앱입니다. Leitner 간격 반복 시스템으로
단어를 등록하고 복습하며 암기할 수 있습니다. 서버 없이 완전히 클라이언트 사이드(localStorage)로
동작하는 정적 SPA입니다.

## 기술 스택

- React 18 + TypeScript + Vite
- 별도 상태관리 라이브러리 없이 React 기본 훅(`useState`, `useEffect`, `useMemo`)만 사용
- Vitest + jsdom (단위 테스트)

## 주요 기능

- **단어 CRUD**: 영단어, 뜻, 예문(선택), 카테고리/태그(선택) 등록·수정·삭제
- **단어 목록**: 검색, 카테고리 필터
- **플래시카드 학습 모드**: 카드 클릭/스페이스바로 뒤집기, 정답/오답 처리
- **Leitner 5단계 간격 반복**: 정답 시 다음 박스로 이동(복습 주기 증가), 오답 시 1번 박스로 복귀.
  오늘 복습 예정인 카드만 학습 모드에 노출
- **localStorage 영속화**: 새로고침해도 단어·학습 진행 상태(박스 단계, 통계) 유지
- **JSON export/import**: 기기 변경 시 전체 데이터 백업/복원, 잘못된 형식은 명확한 에러 메시지 표시
- **CSV 일괄 등록**: `영단어,뜻,예문,태그` 형식으로 여러 단어를 한 번에 추가
- **학습 통계 대시보드**: 누적 단어 수, 총 복습 횟수, 정답률, 연속 학습일, 박스별 분포
- **다크모드**: 시스템 설정 자동 감지 + 수동 토글, 선택값은 localStorage에 저장
- **반응형 디자인**: 모바일 브라우저에서도 사용 가능

## 프로젝트 구조

```
├── src/
│   ├── components/
│   │   ├── WordForm.tsx       # 단어 등록/수정 폼
│   │   ├── WordList.tsx       # 단어 목록, 검색, 필터
│   │   ├── FlashcardStudy.tsx # 플래시카드 학습 모드
│   │   ├── ProgressStats.tsx  # 학습 통계 대시보드
│   │   └── DataTools.tsx      # JSON export/import, CSV 일괄 등록
│   ├── utils/
│   │   ├── leitner.ts         # Leitner 박스 이동 로직 (핵심 알고리즘)
│   │   ├── storage.ts         # localStorage 저장/불러오기, 검증
│   │   ├── stats.ts           # 정답률/연속 학습일 계산
│   │   ├── csv.ts             # CSV 파싱
│   │   ├── leitner.test.ts    # Leitner 로직 단위 테스트
│   │   └── storage.test.ts    # localStorage 로직 단위 테스트
│   ├── App.tsx                 # 전체 상태 관리 및 탭 라우팅
│   ├── types.ts                # Word, StudyStats 등 타입 정의
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
└── vite.config.ts
```

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (기본: http://localhost:5173)
npm run dev

# 단위 테스트 실행
npm test

# 프로덕션 빌드 (타입 체크 포함)
npm run build

# 빌드 결과 미리보기
npm run preview
```

빌드 결과물은 `dist/` 디렉터리에 생성되며, 별도 서버 없이 정적 파일로 어디에나 배포할 수 있습니다
(GitHub Pages, Netlify, Vercel, S3 등).

## Leitner 간격 반복 규칙

- 박스 1~5까지 존재하며, 신규 단어는 박스 1에서 시작합니다.
- **정답**: 다음 박스로 이동(최대 5), 복습 주기가 늘어납니다 (1일 → 2일 → 4일 → 8일 → 16일).
- **오답**: 박스 1로 초기화되고 내일 다시 복습 대상이 됩니다.
- 학습 모드에는 `nextReviewDate`가 오늘이거나 지난 단어만 표시됩니다.

## 데이터 형식

```typescript
interface Word {
  id: string;
  english: string;
  meaning: string;
  example?: string;
  tags?: string[];
  boxLevel: 1 | 2 | 3 | 4 | 5;
  nextReviewDate: string; // ISO date (YYYY-MM-DD)
  createdAt: string;      // ISO datetime
}
```

단어 데이터와 학습 통계는 각각 `flashcards.words.v1`, `flashcards.stats.v1` 키로 localStorage에
저장됩니다. "백업/가져오기" 탭에서 전체 데이터를 JSON 파일로 내보내거나, 다른 기기에서 내보낸
JSON 파일을 가져와 복원할 수 있습니다.
