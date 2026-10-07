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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return transport.onWarmth((e) => {
      enqueueRef.current?.({ x: e.x, isMine: false });
    });
  }, [transport]);

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

        {/* 반응 버튼 + 닫기: open 시 fade-in, closed 시 fade-out (항상 DOM에 있어 exit 애니메이션 작동) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: open ? 1 : 0,
            transform: open ? 'scale(1) translateX(0)' : 'scale(0.88) translateX(6px)',
            transition: 'opacity 0.18s ease, transform 0.18s ease',
            pointerEvents: open ? 'auto' : 'none',
          }}
        >
          <WarmthReactionButton
            onParticle={handleParticle}
            sendWarmth={sendWarmth}
            connection={connection}
          />
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setOpen(false)}
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(22, 20, 17, 0.65)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.08)',
              cursor: 'pointer',
              fontSize: 10,
              color: 'rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.75)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)'; }}
          >
            ✕
          </button>
        </div>

        {/* 트리거: 반딧불 원형 버튼 */}
        <button
          type="button"
          aria-label="반딧불 띄우기"
          onClick={() => setOpen((prev) => !prev)}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(22, 20, 17, 0.72)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: open
              ? '0 0 0 1.5px rgba(245,200,66,0.35), 0 2px 14px rgba(0,0,0,0.28)'
              : '0 0 0 1px rgba(245,200,66,0.18), 0 2px 12px rgba(0,0,0,0.22)',
            cursor: 'pointer',
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'box-shadow 0.2s ease, transform 0.15s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.93)'; }}
          onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/me.png"
            alt=""
            aria-hidden="true"
            style={{ width: 28, height: 28, objectFit: 'contain' }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              const span = document.createElement('span');
              span.textContent = '✨';
              span.style.fontSize = '18px';
              e.currentTarget.parentElement?.appendChild(span);
            }}
          />
        </button>
      </div>
    </>
  );
}
