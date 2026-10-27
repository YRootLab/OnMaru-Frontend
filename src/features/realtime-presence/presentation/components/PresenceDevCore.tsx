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
import type { MotionParams } from '../../domain/presence.motion';

interface PresenceDevCoreProps {
  roomId: string;
  transport?: IPresenceTransport;
  motionParams?: Partial<MotionParams>;
}

export default function PresenceDevCore({
  roomId,
  transport: externalTransport,
  motionParams,
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
  const [batchMsg, setBatchMsg] = useState('');

  useEffect(() => {
    return transport.onWarmth((e) => {
      enqueueRef.current?.({ x: e.x, isMine: false });
    });
  }, [transport]);

  const handleOtherBatch = useCallback((count: number) => {
    setBatchMsg(`${count}명이 반딧불을 보냈어요`);
    const t = setTimeout(() => setBatchMsg(''), 3_000);
    return () => clearTimeout(t);
  }, []);

  const handleParticle = useCallback((x: number) => {
    enqueueRef.current?.({ x, isMine: true });
  }, []);

  return (
    <>
      <div aria-live="polite" aria-atomic="true" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        {batchMsg}
      </div>

      <WarmthParticleCanvas
        onMount={(enqueue) => { enqueueRef.current = enqueue; }}
        motionParams={motionParams}
        onOtherBatch={handleOtherBatch}
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
            fontSize: 18,
            color: 'rgba(255,200,50,0.9)',
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
          ✨
        </button>
      </div>
    </>
  );
}
