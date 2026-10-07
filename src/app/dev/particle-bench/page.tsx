'use client';

import { notFound } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePresenceRoom } from '@/features/realtime-presence/application/usePresenceRoom';
import { createMockPresenceTransport } from '@/features/realtime-presence/infrastructure/mockPresenceTransport';
import type { MockPresenceTransportScenarios } from '@/features/realtime-presence/infrastructure/mockPresenceTransport';
import type { IPresenceTransport } from '@/features/realtime-presence/application/presence.port';
import { LivePresenceBadge } from '@/features/realtime-presence/presentation/components/LivePresenceBadge';
import { WarmthReactionButton } from '@/features/realtime-presence/presentation/components/WarmthReactionButton';
import {
  type FrameStats,
  type WarmthParticleEvent,
  WarmthParticleCanvas,
} from '@/features/realtime-presence/presentation/components/WarmthParticleCanvas';
import type { RefObject } from 'react';

if (process.env.NODE_ENV === 'production') notFound();

const RATES = [5, 30, 100] as const;
type Rate = (typeof RATES)[number];
type MockTransport = IPresenceTransport & MockPresenceTransportScenarios;
const LOG_MAX = 6;

export default function ParticleBenchPage() {
  const [rate, setRate] = useState<Rate>(30);
  const [pooling, setPooling] = useState(true);
  const [beeMode, setBeeMode] = useState(true);
  const [log, setLog] = useState<string[]>(['[시작] 데모 초기화']);
  const [fpsDisplay, setFpsDisplay] = useState<string>('–');

  const enqueueRef = useRef<((e: WarmthParticleEvent) => void) | null>(null);
  const frameStatsRef = useRef<RefObject<FrameStats | undefined> | null>(null);
  const rateRef = useRef(rate);
  rateRef.current = rate;

  const transport = useMemo<MockTransport>(
    () => createMockPresenceTransport({ initialCount: 3, countChangeIntervalMs: 4_000 }),
    [],
  );

  const { connection, snapshot, sendWarmth } = usePresenceRoom('demo_room', transport);

  const connectionRef = useRef(connection);
  connectionRef.current = connection;
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [`[${new Date().toLocaleTimeString('ko-KR')}] ${msg}`, ...prev].slice(0, LOG_MAX));
  }, []);

  // 연결 상태 변화 로그
  useEffect(() => {
    addLog(`연결: ${connection}`);
  }, [connection]); // eslint-disable-line react-hooks/exhaustive-deps

  // snapshot 수신 로그
  useEffect(() => {
    if (!snapshot) return;
    addLog(`snapshot: ${snapshot.activeCount}명 / 오늘 ${snapshot.todayVisitors}명`);
  }, [snapshot?.activeCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // transport warmth → 파티클 + 로그
  useEffect(() => {
    return transport.onWarmth((e) => {
      enqueueRef.current?.({ x: e.x, isMine: false });
      addLog(`warmth 수신: x=${e.x.toFixed(2)}`);
    });
  }, [transport, addLog]);

  // 자동 파티클: activeCount > 1, connection open일 때만
  useEffect(() => {
    const t = setInterval(() => {
      const enqueue = enqueueRef.current;
      if (!enqueue) return;
      if (connectionRef.current !== 'open') return;
      const total = snapshotRef.current?.activeCount ?? 1;
      if (total <= 1) return;
      const perInterval = total * (rateRef.current / 10);
      const whole = Math.floor(perInterval);
      const frac = perInterval - whole;
      const count = whole + (Math.random() < frac ? 1 : 0);
      for (let i = 0; i < count; i++) {
        enqueue({ x: Math.random(), isMine: Math.random() < 1 / total });
      }
    }, 100);
    return () => clearInterval(t);
  }, []);

  const handleMount = useCallback(
    (enqueue: (e: WarmthParticleEvent) => void, stats: RefObject<FrameStats | undefined>) => {
      enqueueRef.current = enqueue;
      frameStatsRef.current = stats;
    },
    [],
  );

  // FPS 폴링: 500ms마다 갱신
  useEffect(() => {
    const id = setInterval(() => {
      const stats = frameStatsRef.current?.current;
      setFpsDisplay(stats ? `${stats.fps} fps · ${stats.avgFrameMs}ms` : '–');
    }, 500);
    return () => clearInterval(id);
  }, []);

  const handleParticle = useCallback((x: number) => {
    enqueueRef.current?.({ x, isMine: true });
    addLog(`내 반응: x=${x.toFixed(2)}`);
  }, [addLog]);

  return (
    <div style={{ minHeight: '100dvh', background: '#111', color: '#eee', fontFamily: 'monospace', display: 'flex', flexDirection: 'column' }}>

      {/* 컨트롤 패널 */}
      <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', background: '#1a1a1a', borderBottom: '1px solid #333' }}>
        <strong style={{ fontSize: 13 }}>particle-bench</strong>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11 }}>
          반응 빈도 배율
          <div style={{ display: 'flex', gap: 5 }}>
            {RATES.map((r) => (
              <button key={r} onClick={() => setRate(r)} style={{ padding: '3px 8px', background: rate === r ? '#f5c842' : '#333', color: rate === r ? '#111' : '#eee', border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: 11 }}>
                {r}/s
              </button>
            ))}
          </div>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
          <input type="checkbox" checked={pooling} onChange={(e) => setPooling(e.target.checked)} />
          풀링 <span style={{ color: pooling ? '#4caf50' : '#f44336' }}>{pooling ? 'ON' : 'OFF'}</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
          <input type="checkbox" checked={beeMode} onChange={(e) => setBeeMode(e.target.checked)} />
          벌 비행 <span style={{ color: beeMode ? '#f5c842' : '#888' }}>{beeMode ? 'ON' : 'OFF'}</span>
        </label>

        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#aaa', textAlign: 'right' }}>
          <span style={{ color: connection === 'open' ? '#4caf50' : connection === 'degraded' ? '#f44336' : '#f5c842' }}>
            {connection}
          </span>
          {connection === 'open' && (
            <span style={{ color: '#555', marginLeft: 8 }}>
              타인 ~{(Math.max(0, (snapshot?.activeCount ?? 1) - 1) * 6).toFixed(0)}/s
            </span>
          )}
          <span style={{ color: '#4fc3f7', marginLeft: 12, fontVariantNumeric: 'tabular-nums' }}>
            {fpsDisplay}
          </span>
        </div>
      </div>

      {/* 배지 + 반응 버튼 + 시뮬레이션 */}
      <div style={{ padding: '14px 16px', background: '#181818', borderBottom: '1px solid #2a2a2a', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>

        {/* 배지 */}
        <div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>배지</div>
          <LivePresenceBadge connection={connection} snapshot={snapshot} />
        </div>

        {/* 반응 버튼 */}
        <div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>반응 버튼 (클릭해보세요)</div>
          <WarmthReactionButton
            onParticle={handleParticle}
            sendWarmth={sendWarmth}
            connection={connection}
          />
          <div style={{ fontSize: 10, color: '#444', marginTop: 4 }}>
            300ms 쓰로틀 · degraded/closed 시 로컬만
          </div>
        </div>

        {/* 시뮬레이션 */}
        <div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>시뮬레이션</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            <SimBtn label="혼자 (1명)" onClick={() => { transport.setActiveCount(1); addLog('setActiveCount(1)'); }} />
            <SimBtn label="급증 (20명)" onClick={() => { transport.setActiveCount(20); addLog('setActiveCount(20)'); }} />
            <SimBtn label="반응 폭주" onClick={() => { transport.simulateWarmthFlood(30); addLog('warmthFlood(30)'); }} />
            <SimBtn label="연결 끊김" color="#e57373" onClick={() => { transport.simulateDisconnect(); addLog('simulateDisconnect'); }} />
            <SimBtn label="서버 장애" color="#e57373" onClick={() => { transport.simulateServerError(); addLog('simulateServerError'); }} />
            <SimBtn label="서버 복구" color="#81c784" onClick={() => { transport.restoreServer(); addLog('restoreServer'); }} />
          </div>
        </div>

        {/* 이벤트 로그 */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>이벤트 로그</div>
          <div style={{ fontSize: 10, color: '#888', lineHeight: 1.8, maxHeight: 120, overflow: 'hidden' }}>
            {log.map((entry, i) => (
              <div key={i} style={{ opacity: 1 - i * 0.15 }}>{entry}</div>
            ))}
          </div>
        </div>
      </div>

      {/* 캔버스 영역 */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 360 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #1a0e05 0%, #2d1a0a 60%, #1a0e05 100%)' }} />
        <WarmthParticleCanvas
          key={String(pooling)}
          onMount={handleMount}
          poolingEnabled={pooling}
          beeMode={beeMode}
          style={{ position: 'absolute', inset: 0 }}
        />
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.25)', fontSize: 12, pointerEvents: 'none' }}>
          Performance 탭 → Record 로 프레임 타임 측정
        </div>
      </div>

      {/* 푸터 */}
      <div style={{ padding: '10px 16px', fontSize: 10, color: '#555', background: '#1a1a1a', borderTop: '1px solid #333' }}>
        풀링 ON/OFF → Memory 탭 GC 빈도 비교 · 6× CPU throttle 후 16.7ms 이하 확인
      </div>
    </div>
  );
}

function SimBtn({ label, onClick, color = '#444' }: { label: string; onClick: () => void; color?: string }) {
  return (
    <button onClick={onClick} style={{ padding: '4px 9px', background: color, color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: 11 }}>
      {label}
    </button>
  );
}
