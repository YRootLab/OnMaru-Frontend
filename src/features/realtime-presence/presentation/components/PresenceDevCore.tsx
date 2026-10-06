'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { IPresenceTransport } from '../../application/presence.port';
import { usePresenceRoom } from '../../application/usePresenceRoom';
import { createMockPresenceTransport } from '../../infrastructure/mockPresenceTransport';
import { createConfiguredPresenceTransport } from '../../infrastructure/presenceTransportFactory';
import { LivePresenceBadge } from './LivePresenceBadge';
import { WarmthReactionButton } from './WarmthReactionButton';
import {
  WarmthParticleCanvas,
  type WarmthParticleEvent,
} from './WarmthParticleCanvas';

interface PresenceDevCoreProps {
  roomId: string;
  transport?: IPresenceTransport;
}

export default function PresenceDevCore({
  roomId,
  transport: externalTransport,
}: PresenceDevCoreProps) {
  const transport = useMemo(
    () =>
      externalTransport ??
      createConfiguredPresenceTransport() ??
      createMockPresenceTransport({ initialCount: 2, countChangeIntervalMs: 5_000 }),
    [externalTransport],
  );

  const { connection, snapshot, sendWarmth } = usePresenceRoom(roomId, transport);
  const enqueueRef = useRef<((e: WarmthParticleEvent) => void) | null>(null);

  // 타인 warmth 이벤트 → 은은한 파티클만 수신
  useEffect(() => {
    return transport.onWarmth((e) => {
      enqueueRef.current?.({ x: e.x, isMine: false });
    });
  }, [transport]);

  // 내 반응 클릭 → 내 위치에서 은은한 골드 파티클
  const handleParticle = useCallback((x: number) => {
    enqueueRef.current?.({ x, isMine: true });
  }, []);

  return (
    <>
      {/*
       * 파티클 캔버스: 뷰포트 전체 덮음.
       * pointer-events:none 으로 기존 카드·지도 조작 방해 없음.
       * z-index 90: 콘텐츠 위, 헤더(z99) 아래.
       */}
      <WarmthParticleCanvas
        onMount={(enqueue) => { enqueueRef.current = enqueue; }}
        style={{ position: 'fixed', inset: 0, zIndex: 90 }}
      />

      {/*
       * 토스/피그마 스타일 실시간 Presence 배지 & 리액션 칩: 우상단 고정
       */}
      <div
        style={{
          position: 'fixed',
          top: 80,
          right: 16,
          zIndex: 95,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 8,
        }}
      >
        <LivePresenceBadge connection={connection} snapshot={snapshot} />
        <WarmthReactionButton
          onParticle={handleParticle}
          sendWarmth={sendWarmth}
          connection={connection}
        />
      </div>
    </>
  );
}
