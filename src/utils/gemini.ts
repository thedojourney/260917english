import type { ChallengeQuestion, Word } from '../types';

export const GEMINI_MODEL = 'gemini-3.5-flash-lite';

const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export class GeminiError extends Error {}

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          targetWord: {
            type: 'string',
            description: "입력 목록에 있는 단어의 english 값과 정확히 일치해야 함",
          },
          question: { type: 'string' },
          choices: {
            type: 'array',
            items: { type: 'string' },
            minItems: 4,
            maxItems: 4,
          },
          answerIndex: { type: 'integer' },
          explanation: { type: 'string' },
        },
        required: ['targetWord', 'question', 'choices', 'answerIndex'],
      },
    },
  },
  required: ['questions'],
};

type ChallengeWord = Pick<Word, 'english' | 'meaning' | 'example'>;

// Picks words to quiz on: due-for-review words first (keeps the challenge
// tied to what the learner actually needs right now), topped up with the
// rest of the deck, then trimmed to `count`.
export function pickChallengeWords(words: Word[], dueWords: Word[], count: number): Word[] {
  const dueIds = new Set(dueWords.map((w) => w.id));
  const rest = words.filter((w) => !dueIds.has(w.id));
  return [...dueWords, ...rest].slice(0, count);
}

export function buildChallengePrompt(words: ChallengeWord[], count: number): string {
  const wordList = words
    .map((w) => `- english: "${w.english}", meaning: "${w.meaning}"${w.example ? `, example: "${w.example}"` : ''}`)
    .join('\n');

  return `당신은 영어 학습 앱의 퀴즈 출제자입니다. 아래 등록된 영단어 목록을 바탕으로 4지선다 객관식 문제를 ${count}개 만들어주세요.

단어 목록:
${wordList}

규칙:
- 각 문제의 targetWord는 반드시 위 목록의 english 값과 정확히 동일해야 합니다.
- 단순 뜻 암기뿐 아니라 문맥 속 쓰임, 유의어 구분, 빈칸 채우기 등 다양한 유형을 섞어주세요.
- choices는 정확히 4개이고, 그 중 정답은 하나만 있어야 하며 오답도 그럴듯해야 합니다.
- answerIndex는 정답 choice의 0부터 시작하는 인덱스입니다.
- explanation에는 정답인 이유를 한국어로 한 문장으로 설명해주세요.
- 문제(question)는 한국어로 작성하되, 필요한 영단어/예문은 영어 그대로 사용하세요.
- 목록에 있는 단어를 가능한 한 겹치지 않게 고루 사용해주세요.`;
}

export function parseChallengeResponse(rawText: string, validWords: Set<string>): ChallengeQuestion[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new GeminiError('AI 응답을 해석하지 못했습니다. 다시 시도해주세요.');
  }

  const questions = (parsed as Record<string, unknown> | null)?.questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new GeminiError('AI가 문제를 생성하지 못했습니다. 다시 시도해주세요.');
  }

  const valid: ChallengeQuestion[] = [];
  for (const item of questions) {
    if (!item || typeof item !== 'object') continue;
    const q = item as Record<string, unknown>;
    if (
      typeof q.targetWord !== 'string' ||
      typeof q.question !== 'string' ||
      !Array.isArray(q.choices) ||
      q.choices.length !== 4 ||
      !q.choices.every((c) => typeof c === 'string') ||
      typeof q.answerIndex !== 'number' ||
      q.answerIndex < 0 ||
      q.answerIndex > 3 ||
      !validWords.has(q.targetWord)
    ) {
      continue;
    }
    valid.push({
      targetWord: q.targetWord,
      question: q.question,
      choices: q.choices as string[],
      answerIndex: q.answerIndex,
      explanation: typeof q.explanation === 'string' ? q.explanation : undefined,
    });
  }

  if (valid.length === 0) {
    throw new GeminiError('AI 응답 형식이 올바르지 않습니다. 다시 시도해주세요.');
  }
  return valid;
}

export async function generateChallenge(
  apiKey: string,
  words: Word[],
  count: number
): Promise<ChallengeQuestion[]> {
  if (!apiKey.trim()) {
    throw new GeminiError('Gemini API 키를 입력해주세요.');
  }
  if (words.length === 0) {
    throw new GeminiError('챌린지를 만들려면 먼저 단어를 등록해주세요.');
  }

  const prompt = buildChallengePrompt(words, count);

  let response: Response;
  try {
    response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey.trim(),
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });
  } catch {
    throw new GeminiError('네트워크 오류로 챌린지를 불러오지 못했습니다. 인터넷 연결을 확인해주세요.');
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new GeminiError('API 키가 유효하지 않습니다. 키를 다시 확인해주세요.');
    }
    if (response.status === 429) {
      throw new GeminiError('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
    }
    throw new GeminiError(`AI 요청이 실패했습니다. (상태 코드: ${response.status})`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') {
    throw new GeminiError('AI 응답 형식이 올바르지 않습니다. 다시 시도해주세요.');
  }

  const validWords = new Set(words.map((w) => w.english));
  return parseChallengeResponse(text, validWords);
}
