import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const runtimeFiles = [
  '.env.example',
  '.github/workflows/accessibility.yml',
  '.github/workflows/bundle-size.yml',
  '.github/workflows/changelog.yml',
  '.github/workflows/deploy.yml',
  '.github/workflows/lighthouse.yml',
  '.github/workflows/performance-regression.yml',
  '.github/workflows/playwright.yml',
  '.github/workflows/test.yml',
  'next.config.ts',
  'scripts/probe-auth-flow.mjs',
  'src/app/api/map/heat/route.ts',
  'src/features/map/services/place.service.ts',
  'src/lib/api/client.ts',
];

describe('API URL environment contract', () => {
  it('uses NEXT_PUBLIC_API_URL as the only runtime API base URL key', () => {
    const sources = runtimeFiles.map((file) => [file, readFileSync(file, 'utf8')]);

    for (const [file, source] of sources) {
      expect(source, `${file} still references NEXT_PUBLIC_API_BASE_URL`).not.toContain(
        'NEXT_PUBLIC_API_BASE_URL',
      );
      expect(source, `${file} still references NEXT_PUBLIC_API_URL_INTERNAL`).not.toContain(
        'NEXT_PUBLIC_API_URL_INTERNAL',
      );
    }

    expect(sources.some(([, source]) => source.includes('NEXT_PUBLIC_API_URL'))).toBe(true);
  });
});
