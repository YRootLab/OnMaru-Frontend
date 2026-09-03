import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('../components/OdiiAudioFeature.tsx', import.meta.url), 'utf8');

describe('Odii concept integration', () => {
  it('preserves discovery anchors and removes the temporary study', () => {
    expect(source).toContain('장면을 골라 듣다');
    expect(source).toContain('오늘, 여기에서');
    expect(source).not.toContain('OdiiSection2Experiments');
  });
});
