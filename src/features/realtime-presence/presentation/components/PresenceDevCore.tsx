'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { usePresenceRoom } from '../../application/usePresenceRoom';
import { createMockPresenceTransport } from '../../infrastructure/mockPresenceTransport';
import { LivePresenceBadge } from './LivePresenceBadge';
import { WarmthReactionButton } from './WarmthReactionButton';
import {
  WarmthParticleCanvas,
  type WarmthParticleEvent,
} from './WarmthParticleCanvas';

interface PresenceDevCoreProps {
  roomId: string;
}

export default function PresenceDevCore({ roomId }: PresenceDevCoreProps) {
  const transport = useMemo(
    () => createMockPresenceTransport({ initialCount: 2, countChangeIntervalMs: 5_000 }),
    [],
  );

  const { connection, snapshot, sendWarmth } = usePresenceRoom(roomId, transport);
  const enqueueRef = useRef<((e: WarmthParticleEvent) => void) | null>(null);

  // 타인 warmth 이벤트 → 파티클
  useEffect(() => {
    return transport.onWarmth((e) => {
      enqueueRef.current?.({ x: e.x, isMine: false });
    });
  }, [transport]);

  // 반응 버튼 클릭 → 내 파티클 (isMine: true)
  const handleParticle = useCallback((x: number) => {
    enqueueRef.current?.({ x, isMine: true });
  }, []);

  return (
    <>
      {/*
       * 파티클 캔버스: 뷰포트 전체 덮음.
       * pointer-events:none 으로 3D 뷰어·지도 등 기존 조작 방해 없음.
       * z-index 20: 콘텐츠 위, 헤더(z99) 아래.
       */}
      <WarmthParticleCanvas
        onMount={(enqueue) => { enqueueRef.current = enqueue; }}
        style={{ position: 'fixed', inset: 0, zIndex: 20 }}
      />

      {/*
       * 배지 + 반응 버튼: 우상단 고정.
       * position: fixed 이므로 기존 레이아웃에 영향 없음 (CLS 0).
       * top 84px: 헤더(~76px) 바로 아래.
       */}
      <div
        style={{
          position: 'fixed',
          top: 84,
          right: 16,
          zIndex: 21,
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
