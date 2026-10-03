import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchMapPlaces, MAP_LOAD_TIMEOUT_MS } from './fetchMapPlaces';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('fetchMapPlaces', () => {
  it('stays pending at 24,999ms and becomes a timeout at 25,000ms', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
    const request = fetchMapPlaces(
      { lat: 37.5, lng: 127, radius: 3000 },
      { fetcher, timeoutMs: MAP_LOAD_TIMEOUT_MS },
    );
    let settled = false;
    void request.then(
      () => { settled = true; },
      () => { settled = true; },
    );

    await vi.advanceTimersByTimeAsync(24_999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(request).rejects.toMatchObject({ kind: 'timeout', status: 408 });
  });

  it('preserves the HTTP status when no usable fallback data exists', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ items: [], error: { code: 'SERVICE_UNAVAILABLE', message: 'down' } }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    ));

    await expect(fetchMapPlaces(
      { lat: 37.5, lng: 127, radius: 3000 },
      { fetcher },
    )).rejects.toMatchObject({ kind: 'unavailable', status: 503 });
  });

  it('returns usable fallback data as degraded instead of throwing', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      items: [{ id: 'fallback-place' }], degraded: true, error: 'upstream unavailable',
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    await expect(fetchMapPlaces(
      { lat: 37.5, lng: 127, radius: 3000 },
      { fetcher },
    )).resolves.toMatchObject({ degraded: true, items: [{ id: 'fallback-place' }] });
  });
});
