import { describe, expect, it } from 'vitest';
import { validateEnvContractFromFiles, validateEnvValues } from './validate-env-contract.mjs';

describe('validateEnvValues', () => {
  it('accepts the backend handoff Odii API key name', () => {
    expect(validateEnvValues({ ODII_API_KEY: 'secret' }).errors).toEqual([]);
  });

  it('rejects env sets without any supported Odii API key alias', () => {
    expect(validateEnvValues({ ODII_API_URL: 'https://apis.data.go.kr/B551011/Odii' }).errors).toContain(
      'Missing Odii API key alias. Set one of: ODII_API_KEY, SORIMARU_API_KEY, NEXT_PUBLIC_ODII_API_KEY, NEXT_PUBLIC_SORIMARU_API_KEY',
    );
  });
});

describe('validateEnvContractFromFiles', () => {
  it('requires .env.example to stay tracked through .gitignore while .env.local stays ignored', () => {
    const result = validateEnvContractFromFiles({
      gitignoreText: ['.env*', '!.env.example'].join('\n'),
      envExampleText: 'ODII_API_KEY=replace-me\n',
      envLocalText: 'ODII_API_KEY=real-secret\n',
      trackedFiles: [],
    });

    expect(result.errors).toEqual([]);
  });

  it('blocks tracked local secret files', () => {
    const result = validateEnvContractFromFiles({
      gitignoreText: ['.env*', '!.env.example'].join('\n'),
      envExampleText: 'ODII_API_KEY=replace-me\n',
      envLocalText: 'ODII_API_KEY=real-secret\n',
      trackedFiles: ['.env.local'],
    });

    expect(result.errors).toContain('Secret env file is tracked by git: .env.local');
  });
});
