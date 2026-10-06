import type { IPresenceTransport } from '../application/presence.port';
import { createMockPresenceTransport } from './mockPresenceTransport';
import { createSsePresenceTransport } from './ssePresenceTransport';

export type PresenceTransportKind = 'none' | 'mock' | 'sse';

export interface PresenceEnvConfig {
  enabled?: string;
  transport?: string;
  nodeEnv?: string;
}

/**
 * 환경변수 및 빌드 환경에 따른 Transport 모드 결정
 * - NEXT_PUBLIC_PRESENCE_ENABLED === 'true' 일 때만 켜짐 (기본값: false/꺼짐)
 * - 운영 빌드(NODE_ENV === 'production'): 'mock' 선택 불가, 무조건 'sse'
 * - 개발/테스트 환경: NEXT_PUBLIC_PRESENCE_TRANSPORT 에 따라 'mock' | 'sse' (미지정 시 기본 'mock')
 */
export function resolvePresenceTransportKind(
  config: PresenceEnvConfig = {
    enabled: process.env.NEXT_PUBLIC_PRESENCE_ENABLED,
    transport: process.env.NEXT_PUBLIC_PRESENCE_TRANSPORT,
    nodeEnv: process.env.NODE_ENV,
  },
): PresenceTransportKind {
  if (config.enabled !== 'true') {
    return 'none';
  }

  if (config.nodeEnv === 'production') {
    // 운영 빌드에서는 mock 선택 방지, flag가 켜져 있으면 항상 sse
    return 'sse';
  }

  if (config.transport === 'sse') {
    return 'sse';
  }

  return 'mock';
}

/**
 * 활성화된 IPresenceTransport 인스턴스 생성.
 * 기능이 비활성화('none')된 경우 null 반환.
 */
export function createConfiguredPresenceTransport(
  config?: PresenceEnvConfig,
): IPresenceTransport | null {
  const kind = resolvePresenceTransportKind(config);

  if (kind === 'sse') {
    return createSsePresenceTransport();
  }

  if (kind === 'mock') {
    return createMockPresenceTransport({
      initialCount: 2,
      countChangeIntervalMs: 5_000,
    });
  }

  return null;
}
