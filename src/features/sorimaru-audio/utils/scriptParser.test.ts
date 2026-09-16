import { describe, expect, it } from 'vitest';
import { parseScriptToLines } from './scriptParser';

describe('parseScriptToLines', () => {
  it('splits a single long narration into readable sentence cues', () => {
    const lines = parseScriptToLines('첫 문장입니다. 두 번째 문장입니다. 세 번째 문장입니다.', 30);

    expect(lines.map((line) => line.text)).toEqual([
      '첫 문장입니다.',
      '두 번째 문장입니다.',
      '세 번째 문장입니다.',
    ]);
    expect(lines.map((line) => line.timeSec)).toEqual([0, 10, 20]);
  });
});
