import { describe, expect, it } from 'vitest';
import {
  createConfiguredPresenceTransport,
  resolvePresenceTransportKind,
} from './presenceTransportFactory';

describe('resolvePresenceTransportKind', () => {
  it('returns "none" when NEXT_PUBLIC_PRESENCE_ENABLED is not "true"', () => {
    expect(resolvePresenceTransportKind({ enabled: undefined })).toBe('none');
    expect(resolvePresenceTransportKind({ enabled: 'false' })).toBe('none');
    expect(resolvePresenceTransportKind({ enabled: '', transport: 'sse' })).toBe('none');
  });

  it('in production build, NEVER chooses "mock" and always chooses "sse" when enabled', () => {
    // When transport is explicitly set to mock in production, it is still forced to sse
    expect(
      resolvePresenceTransportKind({
        enabled: 'true',
        transport: 'mock',
        nodeEnv: 'production',
      }),
    ).toBe('sse');

    // When transport is sse in production
    expect(
      resolvePresenceTransportKind({
        enabled: 'true',
        transport: 'sse',
        nodeEnv: 'production',
      }),
    ).toBe('sse');

    // When transport is unspecified in production
    expect(
      resolvePresenceTransportKind({
        enabled: 'true',
        transport: undefined,
        nodeEnv: 'production',
      }),
    ).toBe('sse');
  });

  it('in development/test build, respects NEXT_PUBLIC_PRESENCE_TRANSPORT', () => {
    expect(
      resolvePresenceTransportKind({
        enabled: 'true',
        transport: 'sse',
        nodeEnv: 'development',
      }),
    ).toBe('sse');

    expect(
      resolvePresenceTransportKind({
        enabled: 'true',
        transport: 'mock',
        nodeEnv: 'development',
      }),
    ).toBe('mock');

    // Default in development is mock
    expect(
      resolvePresenceTransportKind({
        enabled: 'true',
        transport: undefined,
        nodeEnv: 'development',
      }),
    ).toBe('mock');
  });
});

describe('createConfiguredPresenceTransport', () => {
  it('returns null when flag is disabled', () => {
    const transport = createConfiguredPresenceTransport({ enabled: 'false' });
    expect(transport).toBeNull();
  });

  it('returns mock transport when transport is mock in dev', () => {
    const transport = createConfiguredPresenceTransport({
      enabled: 'true',
      transport: 'mock',
      nodeEnv: 'development',
    });
    expect(transport).not.toBeNull();
    // mock transport has simulateDisconnect
    expect(typeof (transport as any).simulateDisconnect).toBe('function');
  });

  it('returns sse transport when transport is sse', () => {
    const transport = createConfiguredPresenceTransport({
      enabled: 'true',
      transport: 'sse',
      nodeEnv: 'development',
    });
    expect(transport).not.toBeNull();
    expect(typeof transport?.connect).toBe('function');
    expect(typeof transport?.sendWarmth).toBe('function');
  });
});
