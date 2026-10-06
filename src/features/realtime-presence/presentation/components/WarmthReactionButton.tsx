'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { canSendWarmth } from '../../domain/presence.policy';
import type { ConnectionState, WarmthType } from '../../domain/presence.types';

// 버튼 문구: 한 곳에서 관리
const LABEL_DEFAULT = '반딧불 띄우기';
const LABEL_SENT = '반딧불을 보냈어요!';
const LABEL_RESET_MS = 1_500;
const WARMTH_TYPE: WarmthType = 'firefly';

const STYLES = `
[data-omrp-react-btn]:focus-visible {
  outline: 3px solid rgba(245,200,66,0.7);
  outline-offset: 2px;
}
[data-omrp-react-btn]:active {
  transform: scale(0.94);
}
@keyframes omrp-btn-glow {
  0%   { box-shadow: 0 0 0 0   rgba(245,200,66,0.85); }
  100% { box-shadow: 0 0 0 14px rgba(245,200,66,0);   }
}
[data-omrp-react-btn].omrp-btn-glow {
  animation: omrp-btn-glow 0.4s ease-out forwards;
}
`;

let stylesInjected = false;
function ensureStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = STYLES;
  document.head.appendChild(el);
  stylesInjected = true;
}

export interface WarmthReactionButtonProps {
  /**
   * 클릭 시 파티클 발생 위치(0–1)를 전달받는 콜백.
   * 버튼이 canvas에 직접 접근하지 않고 부모가 enqueue를 결정한다.
   */
  onParticle: (x: number) => void;
  sendWarmth: (type: WarmthType, x: number) => void;
  connection: ConnectionState;
  className?: string;
  style?: React.CSSProperties;
}

export function WarmthReactionButton({
  onParticle,
  sendWarmth,
  connection,
  className,
  style,
}: WarmthReactionButtonProps) {
  const [ariaLabel, setAriaLabel] = useState(LABEL_DEFAULT);
  const [combo, setCombo] = useState(0);
  const [glowing, setGlowing] = useState(false);
  const lastSentRef = useRef(0);
  const labelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    ensureStyles();
    reducedMotionRef.current =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      // x: 버튼 중심 기준 0–1 뷰포트 비율
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const now = Date.now();
      const reduced = reducedMotionRef.current;

      // 콤보 카운트 업데이트
      setCombo((prev) => prev + 1);
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = setTimeout(() => {
        setCombo(0);
      }, 1800);

      // 로컬 이펙트: 항상 (연타 포함)
      if (reduced) {
        // prefers-reduced-motion: 파티클 대신 버튼 글로우 페이드
        setGlowing(false);
        requestAnimationFrame(() => setGlowing(true));
      } else {
        onParticle(x);
      }

      // 전송: 300ms 쓰로틀 + degraded/closed 제외
      if (
        canSendWarmth(lastSentRef.current, now) &&
        connection !== 'degraded' &&
        connection !== 'closed'
      ) {
        lastSentRef.current = now;
        sendWarmth(WARMTH_TYPE, x);
        setAriaLabel(LABEL_SENT);
        if (labelTimerRef.current) clearTimeout(labelTimerRef.current);
        labelTimerRef.current = setTimeout(
          () => setAriaLabel(LABEL_DEFAULT),
          LABEL_RESET_MS,
        );
      }
    },
    [connection, onParticle, sendWarmth],
  );

  useEffect(
    () => () => {
      if (labelTimerRef.current) clearTimeout(labelTimerRef.current);
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    },
    [],
  );
  return (
    <button
      type="button"
      data-omrp-react-btn=""
      aria-label={ariaLabel}
      onClick={handleClick}
      onAnimationEnd={() => setGlowing(false)}
      className={`${glowing ? 'omrp-btn-glow' : ''} ${className ?? ''}`.trim() || undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 15px',
        borderRadius: 20,
        border: '1px solid rgba(212, 175, 55, 0.35)',
        background: 'rgba(28, 26, 23, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: '#f5c842',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        outline: 'none',
        fontFamily: 'inherit',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
        transition: 'background 0.2s, border-color 0.2s, transform 0.12s ease',
        ...style,
      }}
    >
      <span aria-hidden="true">✨</span>
      {ariaLabel}
    </button>
  );
}
