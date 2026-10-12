import styled from '@emotion/styled';

import { palette } from '@/design-system/tokens';

const AuroraField = styled.div`
  position: absolute;
  inset: 0 0 auto;
  z-index: 0;
  height: 1200px;
  max-height: 140vh;
  overflow: hidden;
  pointer-events: none;
  contain: paint;
  mask-image: linear-gradient(to bottom, #000 0%, #000 45%, rgba(0, 0, 0, 0.6) 65%, rgba(0, 0, 0, 0.2) 82%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 45%, rgba(0, 0, 0, 0.6) 65%, rgba(0, 0, 0, 0.2) 82%, transparent 100%);

  @media (max-width: 640px) {
    height: 850px;
    mask-image: linear-gradient(to bottom, #000 0%, #000 48%, rgba(0, 0, 0, 0.5) 70%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 48%, rgba(0, 0, 0, 0.5) 70%, transparent 100%);
  }
`;

const AuroraLayer = styled.div`
  position: absolute;
  inset: -12%;
  will-change: transform;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transform: none;
    will-change: auto;
  }
`;

const PrimaryLayer = styled(AuroraLayer)`
  background:
    radial-gradient(ellipse 60% 55% at 12% 18%, ${palette.cheongrok[50]} 0%, transparent 72%),
    radial-gradient(ellipse 58% 60% at 82% 10%, ${palette.jaha[50]} 0%, transparent 72%),
    radial-gradient(ellipse 54% 48% at 50% 42%, ${palette.kobalt[50]} 0%, transparent 74%);
  animation: drift-primary 18s ease-in-out infinite alternate;

  @keyframes drift-primary {
    from {
      transform: translate3d(-4%, -1.5%, 0) scale(1.01);
    }
    to {
      transform: translate3d(5%, 2%, 0) scale(1.05);
    }
  }

  [data-theme='dark'] & {
    opacity: 0.52;
    background:
      radial-gradient(ellipse 65% 60% at 14% 18%, rgba(0, 217, 127, 0.22) 0%, transparent 72%),
      radial-gradient(ellipse 62% 64% at 84% 12%, rgba(153, 51, 255, 0.20) 0%, transparent 72%),
      radial-gradient(ellipse 58% 52% at 50% 38%, rgba(61, 143, 255, 0.18) 0%, transparent 74%);
    filter: blur(28px);
  }

  @media (max-width: 640px) {
    inset: -18%;
    background:
      radial-gradient(ellipse 76% 48% at 8% 18%, ${palette.cheongrok[50]} 0%, transparent 72%),
      radial-gradient(ellipse 76% 52% at 92% 12%, ${palette.jaha[50]} 0%, transparent 72%),
      radial-gradient(ellipse 68% 46% at 50% 46%, ${palette.kobalt[50]} 0%, transparent 74%);

    [data-theme='dark'] & {
      background:
        radial-gradient(ellipse 80% 50% at 10% 18%, rgba(0, 217, 127, 0.25) 0%, transparent 72%),
        radial-gradient(ellipse 80% 54% at 90% 14%, rgba(153, 51, 255, 0.23) 0%, transparent 72%),
        radial-gradient(ellipse 72% 48% at 50% 42%, rgba(61, 143, 255, 0.20) 0%, transparent 74%);
    }
  }
`;

const WarmthLayer = styled(AuroraLayer)`
  background:
    radial-gradient(ellipse 48% 42% at 36% 46%, ${palette.hwanggeum[50]} 0%, transparent 74%),
    radial-gradient(ellipse 46% 44% at 68% 48%, ${palette.juhong[50]} 0%, transparent 74%);
  animation: drift-warmth 24s ease-in-out infinite alternate-reverse;

  @keyframes drift-warmth {
    from {
      transform: translate3d(4.5%, 1.5%, 0) scale(1.03);
    }
    to {
      transform: translate3d(-4%, -2%, 0) scale(1.07);
    }
  }

  [data-theme='dark'] & {
    opacity: 0.46;
    background:
      radial-gradient(ellipse 52% 46% at 34% 48%, rgba(254, 220, 0, 0.15) 0%, transparent 74%),
      radial-gradient(ellipse 50% 48% at 68% 46%, rgba(255, 85, 0, 0.16) 0%, transparent 74%);
    filter: blur(32px);
  }

  @media (max-width: 640px) {
    inset: -18%;
    background:
      radial-gradient(ellipse 62% 40% at 28% 48%, ${palette.hwanggeum[50]} 0%, transparent 74%),
      radial-gradient(ellipse 62% 42% at 74% 50%, ${palette.juhong[50]} 0%, transparent 74%);

    [data-theme='dark'] & {
      background:
        radial-gradient(ellipse 66% 44% at 26% 48%, rgba(254, 220, 0, 0.18) 0%, transparent 74%),
        radial-gradient(ellipse 66% 46% at 74% 48%, rgba(255, 85, 0, 0.18) 0%, transparent 74%);
    }
  }
`;

export default function HomeBrandAurora() {
  return (
    <AuroraField data-testid="home-brand-aurora" aria-hidden="true">
      <PrimaryLayer data-aurora-layer="primary" />
      <WarmthLayer data-aurora-layer="warmth" />
    </AuroraField>
  );
}
