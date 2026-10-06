// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  buildPresenceStreamUrl,
  buildPresenceWarmthUrl,
  createSsePresenceTransport,
  getOrCreatePresenceClientId,
  parsePresenceSnapshot,
  parseWarmthEvent,
} from './ssePresenceTransport';

describe('ssePresenceTransport - Pure Functions', () => {
  describe('buildPresenceStreamUrl', () => {
    it('constructs stream URL correctly with clean base and query params', () => {
      const url = buildPresenceStreamUrl('https://staging-api.onmaru.site', 'hanok_anchae', 'c_test123');
      expect(url).toBe('https://staging-api.onmaru.site/api/v1/realtime/presence/stream?roomId=hanok_anchae&clientId=c_test123');
    });

    it('handles trailing slashes and existing /api/v1 prefix gracefully', () => {
      const url = buildPresenceStreamUrl('https://staging-api.onmaru.site/api/v1/', 'hanok_anchae', 'c_test123');
      expect(url).toBe('https://staging-api.onmaru.site/api/v1/realtime/presence/stream?roomId=hanok_anchae&clientId=c_test123');
    });

    it('works with relative proxy path', () => {
      const url = buildPresenceStreamUrl('/api/proxy', 'room1', 'client1');
      expect(url).toBe('/api/proxy/api/v1/realtime/presence/stream?roomId=room1&clientId=client1');
    });
  });

  describe('buildPresenceWarmthUrl', () => {
    it('constructs warmth POST URL correctly', () => {
      const url = buildPresenceWarmthUrl('https://staging-api.onmaru.site');
      expect(url).toBe('https://staging-api.onmaru.site/api/v1/realtime/warmth');
    });

    it('handles existing /api/v1 prefix without duplicating', () => {
      const url = buildPresenceWarmthUrl('https://staging-api.onmaru.site/api/v1');
      expect(url).toBe('https://staging-api.onmaru.site/api/v1/realtime/warmth');
    });
  });

  describe('parsePresenceSnapshot', () => {
    it('parses valid snapshot event data', () => {
      const raw = JSON.stringify({
        roomId: 'hanok_anchae',
        activeCount: 5,
        todayVisitors: 120,
        serverTime: 1740000000,
      });
      const parsed = parsePresenceSnapshot(raw);
      expect(parsed).toEqual({
        roomId: 'hanok_anchae',
        activeCount: 5,
        todayVisitors: 120,
        serverTime: 1740000000,
      });
    });

    it('returns null on malformed JSON without crashing', () => {
      expect(parsePresenceSnapshot('not-json{')).toBeNull();
    });

    it('returns null when required fields are missing or have wrong types', () => {
      // missing activeCount
      expect(parsePresenceSnapshot(JSON.stringify({ roomId: 'r1', todayVisitors: 10 }))).toBeNull();
      // non-number activeCount
      expect(parsePresenceSnapshot(JSON.stringify({ roomId: 'r1', activeCount: 'five', todayVisitors: 10, serverTime: 123 }))).toBeNull();
      // empty roomId
      expect(parsePresenceSnapshot(JSON.stringify({ roomId: '', activeCount: 5, todayVisitors: 10, serverTime: 123 }))).toBeNull();
      // non-finite number
      expect(parsePresenceSnapshot(JSON.stringify({ roomId: 'r1', activeCount: NaN, todayVisitors: 10, serverTime: 123 }))).toBeNull();
    });
  });

  describe('parseWarmthEvent', () => {
    it('parses single warmth event', () => {
      const raw = JSON.stringify({
        type: 'firefly',
        x: 0.45,
        ts: 1740000010,
      });
      const parsed = parseWarmthEvent(raw);
      expect(parsed).toEqual([{ type: 'firefly', x: 0.45, ts: 1740000010 }]);
    });

    it('parses array of coalesced warmth events', () => {
      const raw = JSON.stringify([
        { type: 'firefly', x: 0.2, ts: 1740000010 },
        { type: 'sparkle', x: 0.8, ts: 1740000011 },
      ]);
      const parsed = parseWarmthEvent(raw);
      expect(parsed).toHaveLength(2);
      expect(parsed?.[0].type).toBe('firefly');
      expect(parsed?.[1].type).toBe('sparkle');
    });

    it('parses { events: [...] } envelope structure', () => {
      const raw = JSON.stringify({
        events: [{ type: 'firefly', x: 0.5, ts: 1740000012 }],
      });
      const parsed = parseWarmthEvent(raw);
      expect(parsed).toEqual([{ type: 'firefly', x: 0.5, ts: 1740000012 }]);
    });

    it('returns null for x out of range (0~1) or missing fields', () => {
      expect(parseWarmthEvent(JSON.stringify({ type: 'firefly', x: 1.5, ts: 123 }))).toBeNull();
      expect(parseWarmthEvent(JSON.stringify({ type: 'firefly', x: -0.1, ts: 123 }))).toBeNull();
      expect(parseWarmthEvent(JSON.stringify({ type: '', x: 0.5, ts: 123 }))).toBeNull();
      expect(parseWarmthEvent('invalid-json')).toBeNull();
    });
  });

  describe('getOrCreatePresenceClientId', () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    it('creates an anonymous clientId and caches it in sessionStorage', () => {
      const id1 = getOrCreatePresenceClientId();
      expect(id1).toBeTruthy();
      expect(sessionStorage.getItem('omrp_cid')).toBe(id1);

      const id2 = getOrCreatePresenceClientId();
      expect(id2).toBe(id1);
    });
  });
});

describe('createSsePresenceTransport', () => {
  let fakeEventSources: FakeEventSource[] = [];

  class FakeEventSource {
    url: string;
    onopen: (() => void) | null = null;
    onerror: (() => void) | null = null;
    listeners: Map<string, ((e: any) => void)[]> = new Map();
    closed = false;

    constructor(url: string) {
      this.url = url;
      fakeEventSources.push(this);
    }

    addEventListener(event: string, handler: (e: any) => void) {
      const list = this.listeners.get(event) || [];
      list.push(handler);
      this.listeners.set(event, list);
    }

    emit(event: string, data: any) {
      const list = this.listeners.get(event) || [];
      list.forEach((fn) => fn({ data }));
    }

    close() {
      this.closed = true;
    }
  }

  beforeEach(() => {
    fakeEventSources = [];
  });

  it('connects to the stream URL and notifies open', () => {
    const transport = createSsePresenceTransport({
      baseUrl: 'https://staging-api.onmaru.site',
      eventSourceFactory: (url) => new FakeEventSource(url) as any,
    });

    const connSpy = vi.fn();
    transport.onConnectionChange(connSpy);

    transport.connect('hanok_room', 'client_1');

    expect(fakeEventSources).toHaveLength(1);
    expect(fakeEventSources[0].url).toContain('/api/v1/realtime/presence/stream?roomId=hanok_room&clientId=client_1');

    // Simulate onopen
    fakeEventSources[0].onopen?.();
    expect(connSpy).toHaveBeenCalledWith('open');
  });

  it('dispatches parsed snapshot events and ignores invalid data', () => {
    const transport = createSsePresenceTransport({
      baseUrl: 'https://staging-api.onmaru.site',
      eventSourceFactory: (url) => new FakeEventSource(url) as any,
    });

    const snapshotSpy = vi.fn();
    transport.onSnapshot(snapshotSpy);

    transport.connect('hanok_room', 'client_1');
    const es = fakeEventSources[0];

    // Emit valid snapshot
    es.emit('snapshot', JSON.stringify({
      roomId: 'hanok_room',
      activeCount: 3,
      todayVisitors: 50,
      serverTime: 1740000000,
    }));

    expect(snapshotSpy).toHaveBeenCalledWith({
      roomId: 'hanok_room',
      activeCount: 3,
      todayVisitors: 50,
      serverTime: 1740000000,
    });

    // Emit invalid snapshot - ignored
    es.emit('snapshot', 'malformed');
    expect(snapshotSpy).toHaveBeenCalledTimes(1);
  });

  it('dispatches parsed warmth events and ignores invalid data', () => {
    const transport = createSsePresenceTransport({
      baseUrl: 'https://staging-api.onmaru.site',
      eventSourceFactory: (url) => new FakeEventSource(url) as any,
    });

    const warmthSpy = vi.fn();
    transport.onWarmth(warmthSpy);

    transport.connect('hanok_room', 'client_1');
    const es = fakeEventSources[0];

    es.emit('warmth', JSON.stringify({ type: 'firefly', x: 0.6, ts: 1740000010 }));
    expect(warmthSpy).toHaveBeenCalledWith({ type: 'firefly', x: 0.6, ts: 1740000010 });

    es.emit('warmth', JSON.stringify({ type: 'invalid', x: 999, ts: 123 }));
    expect(warmthSpy).toHaveBeenCalledTimes(1);
  });

  it('closes EventSource immediately on error and notifies state machine with closed', () => {
    const transport = createSsePresenceTransport({
      baseUrl: 'https://staging-api.onmaru.site',
      eventSourceFactory: (url) => new FakeEventSource(url) as any,
    });

    const connSpy = vi.fn();
    transport.onConnectionChange(connSpy);

    transport.connect('hanok_room', 'client_1');
    const es = fakeEventSources[0];

    // Trigger error
    es.onerror?.();

    // EventSource must be closed immediately to prevent browser automatic reconnect loop
    expect(es.closed).toBe(true);
    // State machine receives 'closed' event to handle backoff
    expect(connSpy).toHaveBeenCalledWith('closed');
  });

  it('close() terminates the active EventSource and emits closed', () => {
    const transport = createSsePresenceTransport({
      baseUrl: 'https://staging-api.onmaru.site',
      eventSourceFactory: (url) => new FakeEventSource(url) as any,
    });

    const connSpy = vi.fn();
    transport.onConnectionChange(connSpy);

    transport.connect('hanok_room', 'client_1');
    const es = fakeEventSources[0];

    transport.close();
    expect(es.closed).toBe(true);
    expect(connSpy).toHaveBeenCalledWith('closed');
  });

  it('sendWarmth performs fire-and-forget POST and silently ignores 429 or network errors', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('HTTP 429 Rate Limited'));

    const transport = createSsePresenceTransport({
      baseUrl: 'https://staging-api.onmaru.site',
      fetcher: fetchMock,
    });

    transport.connect('hanok_room', 'client_1');

    // Calling sendWarmth should not throw despite 429 rejection
    expect(() => {
      transport.sendWarmth({ roomId: 'hanok_room', type: 'firefly', x: 0.3 });
    }).not.toThrow();

    expect(fetchMock).toHaveBeenCalledWith('https://staging-api.onmaru.site/api/v1/realtime/warmth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId: 'hanok_room',
        clientId: 'client_1',
        type: 'firefly',
        x: 0.3,
      }),
    });
  });
});
