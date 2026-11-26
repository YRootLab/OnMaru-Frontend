import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

describe('dev:prod-api', () => {
  it('starts Next with the local API proxy on every supported shell', () => {
    assert.equal(packageJson.scripts['dev:prod-api'], 'node scripts/dev-prod-api.mjs');

    const script = readFileSync(new URL('./dev-prod-api.mjs', import.meta.url), 'utf8');
    assert.match(script, /fileURLToPath/);
    assert.match(script, /NEXT_PUBLIC_API_URL.*api\/proxy/);
    assert.match(script, /NEXT_PUBLIC_API_URL_INTERNAL.*https:\/\/api\.onmaru\.site/);
    assert.match(script, /next.*dev/);
  });
});
