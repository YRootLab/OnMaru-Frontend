import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

describe('Sorimaru media policy', () => {
  it('allows the Odii audio CDN without opening all external media', () => {
    const response = middleware(new NextRequest('https://www.onmaru.site/sorimaru'));
    const policy = response.headers.get('Content-Security-Policy') ?? '';

    expect(policy).toContain("media-src 'self' blob: https://sfj608538-sfj608538.ktcdn.co.kr");
    expect(policy).not.toMatch(/media-src[^;]*https:\s*(;|$)/);
  });
});
