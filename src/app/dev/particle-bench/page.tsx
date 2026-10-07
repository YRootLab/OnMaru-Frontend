'use client';

import { notFound, useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePresenceRoom } from '@/features/realtime-presence/application/usePresenceRoom';
import { createMockPresenceTransport } from '@/features/realtime-presence/infrastructure/mockPresenceTransport';
import type { MockPresenceTransportScenarios } from '@/features/realtime-presence/infrastructure/mockPresenceTransport';
import type { IPresenceTransport } from '@/features/realtime-presence/application/presence.port';
import { LivePresenceBadge } from '@/features/realtime-presence/presentation/components/LivePresenceBadge';
import { WarmthReactionButton } from '@/features/realtime-presence/presentation/components/WarmthReactionButton';
import {
  type FrameStats,
  type FxMode,
  type WarmthParticleEvent,
  WarmthParticleCanvas,
} from '@/features/realtime-presence/presentation/components/WarmthParticleCanvas';
import { DEFAULT_MOTION, MOTION_LIMITS, type MotionParams } from '@/features/realtime-presence/domain/presence.motion';
import type { RefObject } from 'react';

if (process.env.NODE_ENV === 'production') notFound();

export default function ParticleBenchPageRoot() {
  return (
    <Suspense fallback={null}>
      <ParticleBenchPage />
    </Suspense>
  );
}

const RATES = [5, 30, 100] as const;
type Rate = (typeof RATES)[number];
type MockTransport = IPresenceTransport & MockPresenceTransportScenarios;
const LOG_MAX = 6;

// ─── URL param helpers ────────────────────────────────────────────────────────
const PARAM_KEYS: Record<keyof MotionParams, string> = {
  beeH:             'beeH',
  meDurationMs:     'meMs',
  otherDurationMs:  'otherMs',
  tailRate:         'tailRate',
  tailParticleSize: 'tailSize',
  sineAmp:          'sineAmp',
  startXJitter:     'xJitter',
};

function readMotionFromParams(params: URLSearchParams): Partial<MotionParams> {
  const out: Partial<MotionParams> = {};
  for (const [key, urlKey] of Object.entries(PARAM_KEYS) as [keyof MotionParams, string][]) {
    const raw = params.get(urlKey);
    if (raw !== null) {
      const val = parseFloat(raw);
      if (!isNaN(val)) (out as Record<string, number>)[key] = val;
    }
  }
  return out;
}

function motionToSearchString(fx: FxMode, m: MotionParams): string {
  const p = new URLSearchParams({ fx });
  for (const [key, urlKey] of Object.entries(PARAM_KEYS) as [keyof MotionParams, string][]) {
    p.set(urlKey, String(m[key]));
  }
  return p.toString();
}

// ─── Slider row ───────────────────────────────────────────────────────────────
function SliderRow({
  label, value, min, max, step, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
      <span style={{ width: 90, flexShrink: 0, color: '#aaa' }}>{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: '#f5c842' }}
      />
      <span style={{ width: 46, textAlign: 'right', color: '#f5c842', fontVariantNumeric: 'tabular-nums' }}>
        {Number.isInteger(step) ? value : value.toFixed(2)}
      </span>
    </label>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function ParticleBenchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [rate, setRate] = useState<Rate>(30);
  const [pooling, setPooling] = useState(true);
  const [fx, setFx] = useState<FxMode>(() => (searchParams.get('fx') === 'bee' ? 'bee' : 'light'));
  const [motion, setMotion] = useState<MotionParams>(() => ({
    ...DEFAULT_MOTION,
    ...readMotionFromParams(searchParams),
  }));
  const [debugOpen, setDebugOpen] = useState(true);
  const [log, setLog] = useState<string[]>(['[시작] 데모 초기화']);
  const [fpsDisplay, setFpsDisplay] = useState<string>('–');
  const [batchMsg, setBatchMsg] = useState('');
  const [copied, setCopied] = useState(false);

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

  useEffect(() => { addLog(`연결: ${connection}`); }, [connection]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!snapshot) return;
    addLog(`snapshot: ${snapshot.activeCount}명 / 오늘 ${snapshot.todayVisitors}명`);
  }, [snapshot?.activeCount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return transport.onWarmth((e) => {
      enqueueRef.current?.({ x: e.x, isMine: false });
      addLog(`warmth 수신: x=${e.x.toFixed(2)}`);
    });
  }, [transport, addLog]);

  // 자동 파티클
  useEffect(() => {
    const t = setInterval(() => {
      const enqueue = enqueueRef.current;
      if (!enqueue || connectionRef.current !== 'open') return;
      const total = snapshotRef.current?.activeCount ?? 1;
      if (total <= 1) return;
      const perInterval = total * (rateRef.current / 10);
      const whole = Math.floor(perInterval);
      const count = whole + (Math.random() < (perInterval - whole) ? 1 : 0);
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

  useEffect(() => {
    const id = setInterval(() => {
      const s = frameStatsRef.current?.current;
      setFpsDisplay(s ? `${s.fps} fps · ${s.avgFrameMs}ms` : '–');
    }, 500);
    return () => clearInterval(id);
  }, []);

  const handleParticle = useCallback((x: number) => {
    enqueueRef.current?.({ x, isMine: true });
    addLog(`내 반응: x=${x.toFixed(2)}`);
  }, [addLog]);

  const handleOtherBatch = useCallback((count: number) => {
    setBatchMsg(`${count}명이 반딧불을 보냈어요`);
    addLog(`other batch: ${count}명`);
    setTimeout(() => setBatchMsg(''), 3_000);
  }, [addLog]);

  // URL 쿼리 동기화 (debounce 없이, motion은 slider가 완만하게 바뀜)
  useEffect(() => {
    router.replace(`?${motionToSearchString(fx, motion)}`, { scroll: false });
  }, [fx, motion]); // eslint-disable-line react-hooks/exhaustive-deps

  const setParam = useCallback((key: keyof MotionParams, value: number) => {
    setMotion((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleCopyJson = useCallback(() => {
    const json = JSON.stringify({ fx, ...motion }, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1_500);
    });
  }, [fx, motion]);

  const handleReset = useCallback(() => {
    setMotion({ ...DEFAULT_MOTION });
    setFx('light');
  }, []);

  return (
    <div style={{ minHeight: '100dvh', background: '#111', color: '#eee', fontFamily: 'monospace', display: 'flex', flexDirection: 'column' }}>

      {/* 컨트롤 패널 */}
      <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', background: '#1a1a1a', borderBottom: '1px solid #333' }}>
        <strong style={{ fontSize: 13 }}>particle-bench</strong>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11 }}>
          반응 빈도
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

        {/* fx 토글 */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11 }}>
          이펙트
          <div style={{ display: 'flex', gap: 5 }}>
            {(['light', 'bee'] as FxMode[]).map((mode) => (
              <button key={mode} onClick={() => setFx(mode)} style={{ padding: '3px 8px', background: fx === mode ? '#f5c842' : '#333', color: fx === mode ? '#111' : '#eee', border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: 11 }}>
                {mode === 'light' ? '✨ light' : '🐝 bee'}
              </button>
            ))}
          </div>
        </label>

        <button onClick={() => setDebugOpen((v) => !v)} style={{ padding: '3px 8px', background: '#2a2a2a', color: '#aaa', border: '1px solid #444', borderRadius: 3, cursor: 'pointer', fontSize: 11 }}>
          {debugOpen ? '▲ 디버그 패널' : '▼ 디버그 패널'}
        </button>

        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#aaa', textAlign: 'right' }}>
          <span style={{ color: connection === 'open' ? '#4caf50' : connection === 'degraded' ? '#f44336' : '#f5c842' }}>
            {connection}
          </span>
          {batchMsg && <span style={{ marginLeft: 8, color: '#f5c842' }}>{batchMsg}</span>}
          <span style={{ color: '#4fc3f7', marginLeft: 12, fontVariantNumeric: 'tabular-nums' }}>
            {fpsDisplay}
          </span>
        </div>
      </div>

      {/* 디버그 패널 */}
      {debugOpen && (
        <div style={{ padding: '12px 16px', background: '#141414', borderBottom: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: '#666' }}>motion params</span>
            <span style={{ fontSize: 10, color: '#444', marginLeft: 4 }}>URL로 공유됩니다</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button onClick={handleReset} style={{ padding: '3px 9px', background: '#2a2a2a', color: '#888', border: '1px solid #444', borderRadius: 3, cursor: 'pointer', fontSize: 10 }}>기본값</button>
              <button onClick={handleCopyJson} style={{ padding: '3px 9px', background: copied ? '#2d5a1b' : '#2a2a2a', color: copied ? '#81c784' : '#f5c842', border: '1px solid #444', borderRadius: 3, cursor: 'pointer', fontSize: 10 }}>
                {copied ? '✓ 복사됨' : 'JSON 복사'}
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '6px 20px' }}>
            <SliderRow label="벌 크기 (px)" value={motion.beeH} {...MOTION_LIMITS.beeH} onChange={(v) => setParam('beeH', v)} />
            <SliderRow label="me 비행 (ms)" value={motion.meDurationMs} {...MOTION_LIMITS.meDurationMs} onChange={(v) => setParam('meDurationMs', v)} />
            <SliderRow label="other 비행 (ms)" value={motion.otherDurationMs} {...MOTION_LIMITS.otherDurationMs} onChange={(v) => setParam('otherDurationMs', v)} />
            <SliderRow label="꼬리 방출량" value={motion.tailRate} {...MOTION_LIMITS.tailRate} onChange={(v) => setParam('tailRate', v)} />
            <SliderRow label="꼬리 입자 (px)" value={motion.tailParticleSize} {...MOTION_LIMITS.tailParticleSize} onChange={(v) => setParam('tailParticleSize', v)} />
            <SliderRow label="사인 진폭 (px)" value={motion.sineAmp} {...MOTION_LIMITS.sineAmp} onChange={(v) => setParam('sineAmp', v)} />
            <SliderRow label="시작 x 지터 (px)" value={motion.startXJitter} {...MOTION_LIMITS.startXJitter} onChange={(v) => setParam('startXJitter', v)} />
          </div>
          <div style={{ fontSize: 10, color: '#3a3a3a', marginTop: 2 }}>
            light 모드: 벌 크기·꼬리·비행 슬라이더는 bee 모드에서만 유효
          </div>
        </div>
      )}

      {/* 배지 + 반응 버튼 + 시뮬레이션 */}
      <div style={{ padding: '14px 16px', background: '#181818', borderBottom: '1px solid #2a2a2a', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>배지</div>
          <LivePresenceBadge connection={connection} snapshot={snapshot} />
        </div>

        <div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>반응 버튼</div>
          <WarmthReactionButton onParticle={handleParticle} sendWarmth={sendWarmth} connection={connection} />
        </div>

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
        <div style={{
          position: 'absolute', inset: 0,
          background: fx === 'light'
            ? 'linear-gradient(180deg, #f8f6f0 0%, #faf4e8 60%, #f5efe0 100%)'
            : 'linear-gradient(180deg, #1a0e05 0%, #2d1a0a 60%, #1a0e05 100%)',
          transition: 'background 0.4s ease',
        }} />
        <WarmthParticleCanvas
          key={`${String(pooling)}-${fx}`}
          onMount={handleMount}
          poolingEnabled={pooling}
          fx={fx}
          motionParams={motion}
          onOtherBatch={handleOtherBatch}
          style={{ position: 'absolute', inset: 0 }}
        />
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', color: fx === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.25)', fontSize: 12, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          {fx === 'light' ? '✨ light 모드 (흰 배경 확인)' : '🐝 bee 모드'}
        </div>
      </div>

      <div style={{ padding: '10px 16px', fontSize: 10, color: '#555', background: '#1a1a1a', borderTop: '1px solid #333' }}>
        풀링 ON/OFF → Memory 탭 GC 빈도 비교 · 6× CPU throttle 후 16.7ms 이하 확인 · URL 공유로 동일 값 재현
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
