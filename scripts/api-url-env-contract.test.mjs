import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const publicRuntimeFiles = [
  '.env.example',
  '.github/workflows/accessibility.yml',
  '.github/workflows/bundle-size.yml',
  '.github/workflows/changelog.yml',
  '.github/workflows/deploy.yml',
  '.github/workflows/lighthouse.yml',
  '.github/workflows/performance-regression.yml',
  '.github/workflows/playwright.yml',
  '.github/workflows/test.yml',
  'scripts/probe-auth-flow.mjs',
  'src/app/api/map/heat/route.ts',
  'src/features/map/services/place.service.ts',
  'src/lib/api/client.ts',
];

describe('API URL environment contract', () => {
  it('keeps the browser base URL public and the proxy upstream scoped to Next config', () => {
    const publicSources = publicRuntimeFiles.map((file) => [file, readFileSync(file, 'utf8')]);
    const nextConfigSource = readFileSync('next.config.ts', 'utf8');

    for (const [file, source] of publicSources) {
      expect(source, `${file} still references NEXT_PUBLIC_API_BASE_URL`).not.toContain(
        'NEXT_PUBLIC_API_BASE_URL',
      );
      expect(source, `${file} still references NEXT_PUBLIC_API_URL_INTERNAL`).not.toContain(
        'NEXT_PUBLIC_API_URL_INTERNAL',
      );
    }

    expect(nextConfigSource).not.toContain('NEXT_PUBLIC_API_BASE_URL');
    expect(nextConfigSource).toContain('NEXT_PUBLIC_API_URL_INTERNAL');
    expect(publicSources.some(([, source]) => /\bNEXT_PUBLIC_API_URL\b/.test(source))).toBe(true);
  });
});
