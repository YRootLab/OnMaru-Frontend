'use client';

import { useEffect, useRef, useState } from 'react';
import { palette, meok } from '@/design-system/tokens';
import type { ConnectionState, PresenceSnapshot } from '../../domain/presence.types';
import {
  DISPLAY_DEBOUNCE_MS,
  DISPLAY_MIN_HOLD_MS,
  getMainText,
  getTodayVisitorsText,
  shouldAnnounce,
} from '../badgeLogic';

export interface LivePresenceBadgeProps {
  connection: ConnectionState;
  snapshot: PresenceSnapshot | null;
}

const ROLL_DURATION_MS = 250;
const ARIA_INTERVAL_MS = 5_000;

// ── 인라인 스타일 상수 ──────────────────────────────────────────────────────

// 골드 펄스·롤링 애니메이션을 전역 <style>로 한 번만 삽입
const KEYFRAMES = `
@keyframes omrp-pulse {
  0%,100% { opacity:1; transform:scale(1); }
  50%      { opacity:0.55; transform:scale(1.35); }
}
@keyframes omrp-roll {
  from { opacity:0; transform:translateY(60%); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes omrp-oni-float {
  0%,100% { transform:translateY(0); }
  50%      { transform:translateY(-3px); }
}
@media (prefers-reduced-motion:reduce) {
  .omrp-roll-num  { animation:none !important; }
  .omrp-pulse-dot { animation:none !important; }
  .omrp-oni       { animation:none !important; }
}
`;

let stylesInjected = false;
function ensureStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = KEYFRAMES;
  document.head.appendChild(el);
  stylesInjected = true;
}

// ── 컴포넌트 ───────────────────────────────────────────────────────────────

export function LivePresenceBadge({ connection, snapshot }: LivePresenceBadgeProps) {
  const [displayCount, setDisplayCount] = useState(snapshot?.activeCount ?? 0);
  const [rollKey, setRollKey] = useState(0); // 증가할 때마다 롤링 애니메이션 트리거
  const [ariaText, setAriaText] = useState('');

  const displayCountRef = useRef(displayCount);
  const pendingCountRef = useRef<number | null>(null);
  const lastUpdatedRef = useRef(0);
  const lastAnnouncedRef = useRef(0);

  useEffect(() => { ensureStyles(); }, []);

  // 디바운스 + 최소 유지 시간 적용
  useEffect(() => {
    if (!snapshot) return;
    const incoming = snapshot.activeCount;
    // 이미 표시 중인 값과 같고 pending도 없으면 무시
    if (incoming === displayCountRef.current && pendingCountRef.current === null) return;

    pendingCountRef.current = incoming;

    const now = Date.now();
    const sinceLastUpdate = now - lastUpdatedRef.current;
    const holdRemaining = Math.max(0, DISPLAY_MIN_HOLD_MS - sinceLastUpdate);
    const totalDelay = Math.max(DISPLAY_DEBOUNCE_MS, holdRemaining);

    const t = setTimeout(() => {
      const count = pendingCountRef.current;
      if (count === null) return;
      pendingCountRef.current = null;
      displayCountRef.current = count;
      lastUpdatedRef.current = Date.now();

      setDisplayCount(count);
      setRollKey((k) => k + 1);

      if (shouldAnnounce(lastAnnouncedRef.current, Date.now())) {
        lastAnnouncedRef.current = Date.now();
        setAriaText(getMainText(count).text);
      }
    }, totalDelay);

    return () => clearTimeout(t);
  }, [snapshot?.activeCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDegraded = connection === 'degraded';
  const isReconnecting = connection === 'reconnecting';
  const { isAlone } = getMainText(displayCount);
  const todayText = snapshot ? getTodayVisitorsText(snapshot.todayVisitors) : null;

  // ── 렌더 ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* aria-live 발표 영역: 5초 디바운스 */}
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
      >
        {ariaText}
      </span>

      {/* 배지 컨테이너: degraded일 때 visibility:hidden으로 자리 유지 */}
      <div
        style={{
          /* 3.1절: 고정 높이·최소 너비 → CLS 0 */
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 2,
          minWidth: 200,
          minHeight: 44,
          padding: '6px 12px 6px 10px',
          borderRadius: 22,
          fontVariantNumeric: 'tabular-nums',
          /* light 기본 */
          background: `rgba(255,255,255,0.82)`,
          border: `1px solid ${meok[200]}`,
          boxShadow: '0 2px 8px rgba(25,31,40,0.06)',
          /* 상태에 따른 투명도 */
          visibility: isDegraded ? 'hidden' : 'visible',
          opacity: isReconnecting ? 0.5 : 1,
          transition: 'opacity 0.4s ease',
          /* dark mode: data-theme 속성으로 전환 — emotion 없이 CSS 변수 사용 */
        }}
        data-omrp-badge=""
      >
        <MainRow
          isAlone={isAlone}
          displayCount={displayCount}
          rollKey={rollKey}
          isReconnecting={isReconnecting}
        />
        {todayText && (
          <span
            style={{
              fontSize: 11,
              color: meok[500],
              lineHeight: 1.4,
              paddingLeft: 18,
            }}
          >
            {todayText}
          </span>
        )}
      </div>

      {/* dark mode 오버라이드 (data-theme='dark' 전략) */}
      <style>{`
        [data-theme='dark'] [data-omrp-badge] {
          background: rgba(23,30,43,0.88);
          border-color: rgba(255,255,255,0.12);
          box-shadow: 0 2px 8px rgba(0,0,0,0.44);
        }
        [data-theme='dark'] [data-omrp-today] {
          color: rgba(255,255,255,0.38);
        }
      `}</style>
    </>
  );
}

// ── 메인 행: 펄스 점 + 문구 ──────────────────────────────────────────────

interface MainRowProps {
  isAlone: boolean;
  displayCount: number;
  rollKey: number;
  isReconnecting: boolean;
}

function MainRow({ isAlone, displayCount, rollKey, isReconnecting }: MainRowProps) {
  if (isAlone) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* 온이 캐릭터 플레이스홀더 — 실제 에셋으로 교체 예정 */}
        <span
          className="omrp-oni"
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: palette.hwanggeum[50],
            border: `1.5px solid ${palette.hwanggeum[300]}`,
            fontSize: 11,
            fontWeight: 700,
            color: palette.hwanggeum[700],
            flexShrink: 0,
            animation: 'omrp-oni-float 2.5s ease-in-out infinite',
          }}
        >
          온
        </span>
        <span style={{ fontSize: 13, color: meok[700], lineHeight: 1.4 }}>
          지금 대청마루에는 온이와 함께 있어요
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {/* 골드 펄스 점 */}
      <span
        className="omrp-pulse-dot"
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: palette.hwanggeum[400],
          flexShrink: 0,
          animation: isReconnecting
            ? 'none'
            : 'omrp-pulse 1.8s ease-in-out infinite',
        }}
      />
      {/* 롤링 숫자 */}
      <span
        key={rollKey}
        className="omrp-roll-num"
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: palette.hwanggeum[700],
          animation: `omrp-roll ${ROLL_DURATION_MS}ms ease-out`,
          display: 'inline-block',
          overflow: 'hidden',
        }}
        aria-hidden="true"
      >
        {displayCount}
      </span>
      <span style={{ fontSize: 13, color: meok[700] }}>명이 함께 머무는 중</span>
    </div>
  );
}
