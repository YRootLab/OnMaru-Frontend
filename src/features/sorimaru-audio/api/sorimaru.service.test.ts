import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { SorimaruService } from './sorimaru.service';

const ORIGINAL_ENV = process.env;

function clearSorimaruEnv() {
  delete process.env.SORIMARU_API_KEY;
  delete process.env.NEXT_PUBLIC_SORIMARU_API_KEY;
  delete process.env.ODII_API_KEY;
  delete process.env.NEXT_PUBLIC_ODII_API_KEY;
}

describe('SorimaruService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  it('accepts the Odii API key alias from the backend handoff env', async () => {
    process.env = { ...ORIGINAL_ENV };
    clearSorimaruEnv();
    process.env.ODII_API_KEY = 'odii-key';
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          response: { body: { items: { item: [{ stid: 'story-1' }] }, totalCount: 1 } },
        }),
      ),
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await SorimaruService.proxyRequest(
      new NextRequest('http://localhost/api/sorimaru?type=stories&pageNo=1'),
    );
    const body = await response.json();

    expect(body.degraded).toBeUndefined();
    expect(body.response.body.items.item).toEqual([{ stid: 'story-1' }]);
    expect(String(fetchMock.mock.calls[0][0])).toContain('serviceKey=odii-key');
  });

  it('returns degraded empty data when no compatible API key is configured', async () => {
    process.env = { ...ORIGINAL_ENV };
    clearSorimaruEnv();

    const response = await SorimaruService.proxyRequest(
      new NextRequest('http://localhost/api/sorimaru?type=stories&pageNo=1'),
    );
    const body = await response.json();

    expect(body).toMatchObject({
      degraded: true,
      response: { header: { resultMsg: 'SORIMARU_API_KEY_MISSING' } },
    });
  });
});
