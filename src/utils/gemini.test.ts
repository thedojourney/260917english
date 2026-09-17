import { describe, expect, it } from 'vitest';
import { createWord } from './leitner';
import { buildChallengePrompt, GeminiError, parseChallengeResponse, pickChallengeWords } from './gemini';

describe('pickChallengeWords', () => {
  it('prioritizes due words before topping up with the rest of the deck', () => {
    const due = [createWord({ english: 'due1', meaning: 'd1' }), createWord({ english: 'due2', meaning: 'd2' })];
    const rest = [createWord({ english: 'rest1', meaning: 'r1' }), createWord({ english: 'rest2', meaning: 'r2' })];
    const all = [...rest, ...due];

    const picked = pickChallengeWords(all, due, 3);
    expect(picked.map((w) => w.english)).toEqual(['due1', 'due2', 'rest1']);
  });

  it('trims to the requested count', () => {
    const words = Array.from({ length: 5 }, (_, i) => createWord({ english: `w${i}`, meaning: `m${i}` }));
    expect(pickChallengeWords(words, [], 2)).toHaveLength(2);
  });
});

describe('buildChallengePrompt', () => {
  it('includes each word and the requested question count in the prompt', () => {
    const words = [
      { english: 'apple', meaning: '사과', example: 'I ate an apple.' },
      { english: 'run', meaning: '달리다' },
    ];
    const prompt = buildChallengePrompt(words, 5);
    expect(prompt).toContain('apple');
    expect(prompt).toContain('사과');
    expect(prompt).toContain('run');
    expect(prompt).toContain('5개');
  });
});

describe('parseChallengeResponse', () => {
  const validWords = new Set(['apple', 'run']);

  it('parses a well-formed response into challenge questions', () => {
    const raw = JSON.stringify({
      questions: [
        {
          targetWord: 'apple',
          question: '사과를 뜻하는 단어는?',
          choices: ['apple', 'banana', 'grape', 'melon'],
          answerIndex: 0,
          explanation: 'apple은 사과입니다.',
        },
      ],
    });
    const result = parseChallengeResponse(raw, validWords);
    expect(result).toHaveLength(1);
    expect(result[0].targetWord).toBe('apple');
    expect(result[0].answerIndex).toBe(0);
  });

  it('throws a GeminiError for malformed JSON', () => {
    expect(() => parseChallengeResponse('{not json', validWords)).toThrow(GeminiError);
  });

  it('drops questions referencing a word outside the registered list', () => {
    const raw = JSON.stringify({
      questions: [
        {
          targetWord: 'unknown-word',
          question: '???',
          choices: ['a', 'b', 'c', 'd'],
          answerIndex: 0,
        },
      ],
    });
    expect(() => parseChallengeResponse(raw, validWords)).toThrow(GeminiError);
  });

  it('drops individual malformed questions but keeps valid ones', () => {
    const raw = JSON.stringify({
      questions: [
        { targetWord: 'apple', question: 'q1', choices: ['a', 'b', 'c'], answerIndex: 0 }, // only 3 choices
        { targetWord: 'run', question: 'q2', choices: ['a', 'b', 'c', 'd'], answerIndex: 1 },
      ],
    });
    const result = parseChallengeResponse(raw, validWords);
    expect(result).toHaveLength(1);
    expect(result[0].targetWord).toBe('run');
  });
});
