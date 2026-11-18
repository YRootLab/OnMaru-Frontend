import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

describe('Sorimaru media policy', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('allows the Odii audio CDN without opening all external media', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.onmaru.site');
    const response = middleware(new NextRequest('https://www.onmaru.site/sorimaru'));
    const policy = response.headers.get('Content-Security-Policy') ?? '';

    expect(policy).toContain("media-src 'self' blob: https://sfj608538-sfj608538.ktcdn.co.kr");
    expect(policy).not.toMatch(/media-src[^;]*https:\s*(;|$)/);
    expect(policy).not.toContain('https://samplelib.com');
  });

  it('allows the staging sample audio host when using the staging API', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://staging-api.onmaru.site');
    const response = middleware(new NextRequest('http://localhost:3000/sorimaru'));

    expect(response.headers.get('Content-Security-Policy')).toContain('media-src \'self\' blob: https://sfj608538-sfj608538.ktcdn.co.kr https://samplelib.com');
  });

  it('redirects requests without locale prefix to localized path', () => {
    const response = middleware(new NextRequest('http://localhost:3000/map'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/ko/map');
  });

  it('does not redirect public 3D model assets', () => {
    const response = middleware(new NextRequest('http://localhost:3000/anchae.glb'));

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});
