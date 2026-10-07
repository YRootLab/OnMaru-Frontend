'use client';








import { useCallback, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

import { surface } from '@/design-system/tokens';
import { useIsAppleDevice } from '@/shared/hooks/useIsAppleDevice';
import { SHADOW_RANGE } from './constants';
import { usePrefersReducedMotion } from './motion';
import StructureModal from './StructureModal';
import StructureCanvas from './StructureCanvas';
import SolarShadowPanel from './SolarShadowPanel';


const SHADOW_VIEW = (SHADOW_RANGE[0] + SHADOW_RANGE[1]) / 2;

const Body = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;














  background: radial-gradient(ellipse 75% 62% at 50% 49%, #ffffff 0%, #f8f8f7 56%, #ededeb 100%);


  [data-theme='dark'] & {
    background: radial-gradient(ellipse 82% 66% at 50% 48%, ${surface.dark.surface} 0%, ${surface.dark.app} 100%);
  }
`;

const particleDrift = keyframes`
  0% { transform: translate3d(-12px, -54px, 0); opacity: 0; }
  18% { opacity: 0.85; }
  55% { transform: translate3d(14px, 16px, 0); }
  82% { opacity: 0.85; }
  100% { transform: translate3d(-4px, 82px, 0); opacity: 0; }
`;

const Atmosphere = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  --particle: transparent;

  &[data-season='spring'] { --particle: rgba(157, 105, 130, 0.58); }
  &[data-season='summer'] { --particle: rgba(87, 137, 109, 0.58); }
  &[data-season='autumn'] { --particle: rgba(132, 115, 85, 0.58); }
  &[data-season='winter'] { --particle: rgba(105, 139, 167, 0.62); }

  [data-theme='dark'] &[data-season='spring'] { --particle: rgba(196, 165, 183, 0.4); }
  [data-theme='dark'] &[data-season='summer'] { --particle: rgba(154, 191, 166, 0.4); }
  [data-theme='dark'] &[data-season='autumn'] { --particle: rgba(191, 177, 154, 0.4); }
  [data-theme='dark'] &[data-season='winter'] { --particle: rgba(170, 197, 220, 0.44); }
`;

const SeasonLayer = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 900ms ease;
  --glow: transparent;

  &[data-active='true'] { opacity: 1; }
  &[data-season='spring'] { --glow: rgba(145, 177, 151, 0.18); }
  &[data-season='summer'] { --glow: rgba(120, 166, 143, 0.18); }
  &[data-season='autumn'] { --glow: rgba(155, 143, 115, 0.16); }
  &[data-season='winter'] { --glow: rgba(137, 164, 185, 0.2); }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 32% 52% at 0% 72%, var(--glow), transparent),
      radial-gradient(ellipse 30% 46% at 100% 24%, var(--glow), transparent);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;

const PARTICLES = [
  [7, 20, 3], [16, 36, 2], [5, 54, 3], [19, 70, 2], [10, 86, 3],
  [91, 18, 3], [82, 35, 2], [96, 53, 3], [84, 72, 2], [94, 87, 3],
] as const;

const Particle = styled.span`
  position: absolute;
  border-radius: 50%;
  color: var(--particle);
  background: currentColor;
  box-shadow: 0 0 7px 2px currentColor;
  transition: color 1100ms ease;
  animation: ${particleDrift} 9s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0.65;
  }
`;

const Reveal = styled.div<{ $ready: boolean }>`
  position: absolute;
  inset: 0;
  opacity: ${({ $ready }) => ($ready ? 1 : 0)};
  transform: translateY(${({ $ready }) => ($ready ? '0' : '24px')});
  transition: opacity 480ms ease, transform 620ms cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: ${({ $ready }) => ($ready ? 'auto' : 'none')};

  @media (prefers-reduced-motion: reduce) {
    transform: none;
    transition: none;
  }
`;

const Loading = styled.div<{ $ready: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: ${({ $ready }) => ($ready ? 0 : 1)};
  visibility: ${({ $ready }) => ($ready ? 'hidden' : 'visible')};
  transition: opacity 320ms ease, visibility 0s linear ${({ $ready }) => ($ready ? '320ms' : '0s')};
  pointer-events: none;
  color: #667085;
  font-size: 14px;

  video, img {
    width: clamp(180px, 24vw, 280px);
    height: clamp(180px, 24vw, 280px);
    object-fit: contain;
    filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.12));
  }

  [data-theme='dark'] & { color: #b8bec9; }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export default function SolarShadowModal({ onClose }: { onClose: () => void }) {
  const [ready, setReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [season, setSeason] = useState<string | null>(null);
  const isApple = useIsAppleDevice();
  const reducedMotion = usePrefersReducedMotion();
  const onReady = useCallback(() => setReady(true), []);

  return (
    <StructureModal title="절기에 따른 처마 그림자" onClose={onClose}>
      <Body>
        <Atmosphere data-season={season ?? undefined} aria-hidden="true">
          {SEASONS.map((item) => (
            <SeasonLayer key={item} data-season={item} data-active={season === item} />
          ))}
          {PARTICLES.map(([x, y, size], index) => (
            <Particle
              key={`${x}-${y}`}
              style={{
                left: `${x}%`, top: `${y}%`, width: size, height: size,
                animationDuration: `${7 + (index % 5) * 0.8}s`,
                animationDelay: `${-index * 1.3}s`,
              }}
            />
          ))}
        </Atmosphere>
        <Reveal $ready={ready} inert={!ready}>
          <StructureCanvas progress={SHADOW_VIEW} onReady={onReady} />
          <SolarShadowPanel onSeasonChange={setSeason} />
        </Reveal>
        <Loading $ready={ready} role="status" aria-live="polite" aria-hidden={ready}>
          {isApple || videoError || reducedMotion ? (
            <img src="/images/character/Oni_loading.png" alt="" />
          ) : (
            <video autoPlay loop muted playsInline preload="auto" aria-hidden="true" onError={() => setVideoError(true)}>
              <source src="/videos/Oni_loading.webm" type="video/webm" onError={() => setVideoError(true)} />
            </video>
          )}
          <span>한옥 모형을 불러오고 있어요</span>
        </Loading>
      </Body>
    </StructureModal>
  );
}
