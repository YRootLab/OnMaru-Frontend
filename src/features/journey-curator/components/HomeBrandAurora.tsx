import styled from '@emotion/styled';

import { palette } from '@/design-system/tokens';

const AuroraField = styled.div`
  position: absolute;
  inset: 0 0 auto;
  z-index: 0;
  height: min(900px, 92dvh);
  overflow: hidden;
  pointer-events: none;
  contain: paint;
  mask-image: linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%);

  @media (max-width: 640px) {
    height: 650px;
    mask-image: linear-gradient(to bottom, #000 0%, #000 68%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 68%, transparent 100%);
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
    opacity: 0.28;
  }

  @media (max-width: 640px) {
    inset: -18%;
    background:
      radial-gradient(ellipse 76% 48% at 8% 18%, ${palette.cheongrok[50]} 0%, transparent 72%),
      radial-gradient(ellipse 76% 52% at 92% 12%, ${palette.jaha[50]} 0%, transparent 72%),
      radial-gradient(ellipse 68% 46% at 50% 46%, ${palette.kobalt[50]} 0%, transparent 74%);
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
    opacity: 0.22;
  }

  @media (max-width: 640px) {
    inset: -18%;
    background:
      radial-gradient(ellipse 62% 40% at 28% 48%, ${palette.hwanggeum[50]} 0%, transparent 74%),
      radial-gradient(ellipse 62% 42% at 74% 50%, ${palette.juhong[50]} 0%, transparent 74%);
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
