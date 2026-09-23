'use client';

import { useEffect, useRef } from 'react';
import styled from '@emotion/styled';

import { BEAT_RANGES } from '../scroll-core/constants';
import { clamp01, easeOutQuad, progressIn, usePrefersReducedMotion } from './LandingSectionFrame';

const FONT = "'Spoqa Han Sans Neo', -apple-system, BlinkMacSystemFont, sans-serif";

const INK = '244, 239, 228';





export const RANGE = BEAT_RANGES.BEAT5;

const [RANGE_START, RANGE_END] = RANGE;












const CHAR_FADE = 0.4;
const CHAR_FADE_SLOW = 0.3;
const CHAR_FADE_OUT = 0.7;

const CHAR_RISE = 6;
const CHAR_BLUR = 3;


const GLOW_RADIUS = 180;
const GLOW_RADIUS_STRONG = 220;


const GLOW_LERP = 0.12;








const BLOCKS = [
  {
    id: 'explore',
    size: 'clamp(22px, 3.2vw, 42px)',
    weight: 700,
    gap: 0,
    lines: [
      {
        text: '완벽하게 계산된 공간을 지도 위 실제 데이터로 탐색하십시오.',
        enter: [0.15, 0.85],
        strong: true,
      },
    ],
  },
];







function charCue(local, line, index, count, reduced) {
  const fadeIn = line.strong ? CHAR_FADE_SLOW : CHAR_FADE;
  const at = count > 1 ? index / (count - 1) : 0;

  const enter = progressIn(local, ...line.enter);
  const shown = reduced
    ? easeOutQuad(enter)
    : easeOutQuad(clamp01((enter - at * (1 - fadeIn)) / fadeIn));

  let gone = 0;
  if (line.exit) {
    const out = progressIn(local, ...line.exit);
    gone = reduced
      ? easeOutQuad(out)
      : easeOutQuad(clamp01((out - at * (1 - CHAR_FADE_OUT)) / CHAR_FADE_OUT));
  }

  return {
    opacity: shown * (1 - gone),
    rise: CHAR_RISE * (1 - shown) - CHAR_RISE * gone,
    blur: reduced ? 0 : CHAR_BLUR * (1 - shown),
  };
}











function useProximityGlow(rootRef, visibleKey, reduced) {
  useEffect(() => {
    if (reduced || !rootRef.current) return undefined;

    const chars = Array.from(rootRef.current.querySelectorAll('[data-char]'));
    if (chars.length === 0) return undefined;

    let targets = [];

    const measure = () => {
      targets = chars.map((el) => {
        const box = el.getBoundingClientRect();
        return {
          el,
          x: box.left + box.width / 2,
          y: box.top + box.height / 2,
          radius: Number(el.dataset.radius),
          glow: 0,
        };
      });
    };

    measure();


    const pointer = { x: -9999, y: -9999 };
    const track = (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };

    let frame = 0;
    const step = () => {
      for (const target of targets) {

        const currentOpacity = parseFloat(target.el.style.opacity);
        if (currentOpacity < 0.01) {

          if (target.glow > 0.001) {
            target.glow = 0;
            target.el.style.setProperty('--glow', '0');
            target.el.style.setProperty('--scale', '1');
          }
          continue;
        }

        const distance = Math.hypot(pointer.x - target.x, pointer.y - target.y);
        const influence = Math.max(0, 1 - distance / target.radius);

        target.glow += (influence - target.glow) * GLOW_LERP;

        target.el.style.setProperty('--glow', target.glow.toFixed(3));
        target.el.style.setProperty('--scale', (1 + target.glow * 0.04).toFixed(4));
      }
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    window.addEventListener('pointermove', track, { passive: true });
    window.addEventListener('resize', measure);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', track);
      window.removeEventListener('resize', measure);
    };
  }, [rootRef, visibleKey, reduced]);
}





const Stage = styled.section`
  position: fixed;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  font-family: ${FONT};
`;







const Block = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  text-align: center;
`;

const Line = styled.p`
  margin: 0;
  line-height: 1.4;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;







const Char = styled.span`
  --rise: 0px;
  --glow: 0;
  --scale: 1;

  display: inline-block;
  white-space: pre;
  transform: translateY(var(--rise)) scale(var(--scale));
  color: rgba(${INK}, calc(0.85 + var(--glow) * 0.15));
  text-shadow:
    0 0 calc(32px + var(--glow) * 12px) rgba(${INK}, calc(0.18 + var(--glow) * 0.35)),
    0 0 80px rgba(${INK}, 0.08);

  &[data-strong='true'] {
    text-shadow:
      0 0 calc(40px + var(--glow) * 12px) rgba(${INK}, calc(0.28 + var(--glow) * 0.35)),
      0 0 100px rgba(${INK}, 0.12);
  }
`;


const SrOnly = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;









export default function LandingPhilosophy({ progress }) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef(null);

  const active = progress >= RANGE_START && progress < RANGE_END;
  const local = active ? (progress - RANGE_START) / (RANGE_END - RANGE_START) : 0;


  const visible = BLOCKS.filter((block) =>
    block.lines.some((line) => charCue(local, line, 0, 1, true).opacity > 0.001),
  );
  const visibleKey = visible.map((block) => block.id).join('|');

  useProximityGlow(rootRef, active ? visibleKey : '', reduced);

  if (!active) return null;

  return (
    <Stage ref={rootRef}>
      {}
      {}

      {}
      {visible.map((block) => (
        <Block key={block.id} style={{ gap: block.gap }}>
          {block.lines.map((line) => {
            const chars = line.text.split('');
            const radius = line.strong ? GLOW_RADIUS_STRONG : GLOW_RADIUS;

            return (
              <Line
                key={line.text}
                style={{ fontSize: block.size, fontWeight: block.weight }}
              >
                <SrOnly>{line.text}</SrOnly>

                <span aria-hidden="true">
                  {chars.map((char, index) => {
                    const cue = charCue(local, line, index, chars.length, reduced);

                    return (
                      <Char

                        key={index}
                        data-char
                        data-radius={radius}
                        data-strong={Boolean(line.strong)}
                        style={{
                          opacity: cue.opacity,
                          filter: cue.blur > 0.01 ? `blur(${cue.blur.toFixed(2)}px)` : 'none',
                          '--rise': `${cue.rise.toFixed(2)}px`,
                        }}
                      >
                        {char}
                      </Char>
                    );
                  })}
                </span>
              </Line>
            );
          })}
        </Block>
      ))}
    </Stage>
  );
}
