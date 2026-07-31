'use client';

import React, { useRef } from 'react';
import styled from '@emotion/styled';
import { motion, useScroll, useTransform, useMotionValue, useSpring, MotionValue } from 'framer-motion';
import { darkPalette, lightPalette, meok, type OnmaruTheme } from '@/design-system/tokens';

function hexToRgb(hex: string): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

const CARDS_DATA: {
  id: number;
  title: string;
  subtitle?: string;
  description: string;
  image?: string;
  color: string;
  accent: string;
  textColor: string;
  descColor: string;
  vignetteRgb: string;
}[] = [
  {
    id: 1,
    title: '자연과의 조화',
    description: '한옥은 주변 자연환경에 맞춰 설계합니다. 건축 지역에서 구한 흙, 돌, 나무를 가공 없이 자재로 사용하며, 지형의 특성을 반영하여 집의 방향과 배치를 결정합니다.',
    image: '/images/about/1-harmony.jpg',
    color: `linear-gradient(135deg, ${lightPalette.cheongrok[50]} 0%, ${lightPalette.cheongrok[100]} 100%)`,
    accent: lightPalette.cheongrok[500],
    textColor: lightPalette.cheongrok[900],
    descColor: `rgba(${hexToRgb(lightPalette.cheongrok[900])}, 0.85)`,
    vignetteRgb: hexToRgb(lightPalette.cheongrok[900]),
  },
  {
    id: 2,
    title: '온돌의 따스함',
    description: '온돌은 방바닥을 직접 데우는 한옥의 고유 난방 방식입니다. 아궁이에 불을 때면 열기가 바닥 아래를 지나며 방 전체를 따뜻하게 하고, 동시에 취사 용도로도 활용할 수 있어 에너지 효율이 높습니다.',
    image: '/images/about/2-ondol.jpg',
    color: `linear-gradient(135deg, ${lightPalette.juhong[50]} 0%, ${lightPalette.juhong[100]} 100%)`,
    accent: lightPalette.juhong[500],
    textColor: lightPalette.juhong[900],
    descColor: `rgba(${hexToRgb(lightPalette.juhong[900])}, 0.85)`,
    vignetteRgb: hexToRgb(lightPalette.juhong[900]),
  },
  {
    id: 3,
    title: '친환경 건축',
    description: '한옥은 건축과 철거 과정에서 환경 훼손을 최소화합니다. 화학 물질이 들어가지 않은 천연 자재를 사용하므로 인체에 무해하며, 건축물의 수명이 다한 후에도 목재와 기와 등 대부분의 자재를 재활용할 수 있습니다.',
    image: '/images/about/3-eco.jpg',
    color: `linear-gradient(135deg, ${lightPalette.hwanggeum[50]} 0%, ${lightPalette.hwanggeum[100]} 100%)`,
    accent: lightPalette.hwanggeum[500],
    textColor: lightPalette.hwanggeum[900],
    descColor: `rgba(${hexToRgb(lightPalette.hwanggeum[900])}, 0.85)`,
    vignetteRgb: hexToRgb(lightPalette.hwanggeum[900]),
  },
  {
    id: 4,
    title: '곡선의 아름다움',
    description: '한옥의 지붕은 처마 끝을 위로 자연스럽게 들어 올린 곡선 형태를 띱니다. 이는 직선 구조를 주로 사용하는 다른 나라의 전통 건축과 구별되는 한옥만의 고유한 건축적 특징입니다.',
    image: '/images/about/4-curves.jpg',
    color: `linear-gradient(135deg, ${lightPalette.jangmi[50]} 0%, ${lightPalette.jangmi[100]} 100%)`,
    accent: lightPalette.jangmi[500],
    textColor: lightPalette.jangmi[900],
    descColor: `rgba(${hexToRgb(lightPalette.jangmi[900])}, 0.85)`,
    vignetteRgb: hexToRgb(lightPalette.jangmi[900]),
  },
  {
    id: 5,
    title: '열려있는 마루',
    description: '마루는 여름철 더위를 피하기 위해 널빤지를 깔아 만든 나무 바닥 공간입니다. 바닥을 지면에서 띄워 땅의 습기를 차단하고 바람이 잘 통하도록 설계했습니다. 또한, 방과 방을 연결하는 이동 통로로도 기능합니다.',
    image: '/images/about/5-maru.jpg',
    color: `linear-gradient(135deg, ${lightPalette.kobalt[50]} 0%, ${lightPalette.kobalt[100]} 100%)`,
    accent: lightPalette.kobalt[500],
    textColor: lightPalette.kobalt[900],
    descColor: `rgba(${hexToRgb(lightPalette.kobalt[900])}, 0.85)`,
    vignetteRgb: hexToRgb(lightPalette.kobalt[900]),
  },
];

const SectionContainer = styled.section`
  position: relative;
  width: 100%;
  background-color: ${({ theme }) => (theme as OnmaruTheme).colors.bg.app};
  padding-top: 30px;
  z-index: 10;
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 60px;
  padding: 0 24px;
`;

const MainTitle = styled(motion.h2)`
  font-family: ${({ theme }) => (theme as OnmaruTheme).typography.fontFamily.traditional};
  font-size: clamp(36px, 6vw, 64px);
  font-weight: ${({ theme }) => (theme as OnmaruTheme).typography.fontWeight.bold};
  color: ${({ theme }) => (theme as OnmaruTheme).colors.text.primary};
  margin: 0;
  letter-spacing: -0.02em;
`;

const StickyContainer = styled.div`
  height: 500vh; /* 5 cards = 500vh scroll area */
  position: relative;
`;

const StickyContent = styled.div`
  position: sticky;
  top: 0;
  height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  perspective: 1200px;
`;

const CardWrapper = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: transform, opacity;
  pointer-events: none;
`;

const CardInner = styled(motion.div)<{ bg: string; accent: string }>`
  width: min(94vw, 1020px);
  aspect-ratio: 4 / 3;
  max-height: min(82vh, 765px);
  background: ${(props) => props.bg};
  border-radius: 32px;
  padding: clamp(20px, 3vw, 36px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.12), 0 10px 30px rgba(0, 0, 0, 0.06);
  border: none;
  transform-origin: top center;
  transform-style: preserve-3d;
  overflow: hidden;
  position: relative;
  pointer-events: auto;
  cursor: pointer;
  transition: box-shadow 0.4s ease;

  &:hover {
    box-shadow: 0 40px 90px rgba(0, 0, 0, 0.22), 0 16px 40px rgba(0, 0, 0, 0.12);
  }

  @media (max-width: 768px) {
    width: min(94vw, 540px);
    aspect-ratio: 4 / 3;
    border-radius: 24px;
    padding: 18px;
  }
`;

const TextWrapper = styled.div`
  flex-shrink: 0;
  margin-bottom: 12px;
`;

const CardCategory = styled.span<{ accent: string }>`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: ${(props) => props.accent};
  margin-bottom: 6px;
  display: block;
`;

const CardTitle = styled.h3<{ color?: string }>`
  font-family: ${({ theme }) => (theme as OnmaruTheme).typography.fontFamily.traditional};
  font-size: clamp(22px, 3vw, 36px);
  font-weight: ${({ theme }) => (theme as OnmaruTheme).typography.fontWeight.bold};
  color: ${(props) => props.color || '#191F28'};
  margin: 0 0 8px 0;
  word-break: keep-all;
`;

const CardDescription = styled.p<{ color?: string }>`
  font-family: ${({ theme }) => (theme as OnmaruTheme).typography.fontFamily.sans};
  font-size: clamp(14px, 1.4vw, 18px);
  line-height: 1.6;
  color: ${(props) => props.color || '#4E5968'};
  max-width: 620px;
  word-break: keep-all;
`;

const CardMediaContainer = styled.div<{ accent: string; hasImage?: boolean }>`
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.2) 100%);
  border-radius: 20px;
  border: none;
  box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.02);
  overflow: hidden;
  padding: 6px;

  &::after {
    content: '3D 그래픽 / 인터랙티브 미디어 영역';
    color: ${(props) => props.accent};
    opacity: 0.85;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.08em;
  }
`;

const FullBleedBgImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  z-index: 1;
  border-radius: 32px;

  @media (max-width: 768px) {
    border-radius: 24px;
  }
`;

const EditorialVignetteOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  background: linear-gradient(
      to right,
      rgba(14, 16, 22, 0.5) 0%,
      rgba(14, 16, 22, 0.2) 35%,
      transparent 75%
    ),
    linear-gradient(to top, rgba(14, 16, 22, 0.35) 0%, transparent 40%);
  pointer-events: none;
  border-radius: 32px;

  @media (max-width: 768px) {
    border-radius: 24px;
    background: linear-gradient(
      to top,
      rgba(14, 16, 22, 0.6) 0%,
      rgba(14, 16, 22, 0.2) 50%,
      transparent 100%
    );
  }
`;

const FullBleedContent = styled(motion.div)`
  position: relative;
  z-index: 5;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: clamp(24px, 3.5vw, 40px);
  max-width: 580px;
  pointer-events: none;
`;

const FullBleedTitle = styled.h3`
  font-family: ${({ theme }) => (theme as OnmaruTheme).typography.fontFamily.traditional};
  font-size: clamp(24px, 3.5vw, 42px);
  font-weight: ${({ theme }) => (theme as OnmaruTheme).typography.fontWeight.bold};
  color: #ffffff;
  margin: 0 0 10px 0;
  word-break: keep-all;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7), 0 4px 20px rgba(0, 0, 0, 0.4);
`;

const FullBleedDescription = styled.p`
  font-family: ${({ theme }) => (theme as OnmaruTheme).typography.fontFamily.sans};
  font-size: clamp(14px, 1.5vw, 18px);
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.95);
  word-break: keep-all;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7), 0 4px 16px rgba(0, 0, 0, 0.4);
`;

interface FeatureCardProps {
  data: typeof CARDS_DATA[0];
  index: number;
  progress: MotionValue<number>;
  totalCards: number;
}

function FeatureCard({ data, index, progress, totalCards }: FeatureCardProps) {
  const [imgError, setImgError] = React.useState(false);
  const targetProgress = index / (totalCards - 1);
  const prevTarget = Math.max(0, (index - 1) / (totalCards - 1));

  // "삐요오옹!" Unique Springy Card Unfold & Scale Transforms
  const cardRotate = useTransform(
    progress,
    index === 0 ? [0, 1] : [prevTarget, targetProgress],
    index === 0 ? [0, 0] : [index % 2 === 0 ? 6 : -6, 0]
  );

  const cardScale = useTransform(
    progress,
    index === 0 ? [0, targetProgress, 1] : [prevTarget, targetProgress, 1],
    index === 0
      ? [1, 1, 1 - 0.04 * (totalCards - 1 - index)]
      : [0.85, 1.0, 1 - 0.04 * (totalCards - 1 - index)]
  );

  const textY = useTransform(
    progress,
    index === 0 ? [0, 1] : [prevTarget, targetProgress],
    index === 0 ? [0, 0] : [32, 0]
  );

  const textScale = useTransform(
    progress,
    index === 0 ? [0, 1] : [prevTarget, targetProgress],
    index === 0 ? [1, 1] : [0.88, 1]
  );

  const y = useTransform(
    progress,
    [prevTarget, targetProgress, 1],
    index === 0
      ? ['0vh', '0vh', `-${(totalCards - 1 - index) * 4}vh`]
      : ['100vh', '0vh', `-${(totalCards - 1 - index) * 4}vh`]
  );

  const opacity = useTransform(
    progress,
    [targetProgress, 1],
    [1, 1 - 0.12 * (totalCards - 1 - index)]
  );

  const hasValidImage = data.image && !imgError;

  return (
    <CardWrapper style={{ y, zIndex: index }}>
      <CardInner
        bg={data.color}
        accent={data.accent}
        style={{ scale: cardScale, rotate: cardRotate, opacity }}
      >
        {hasValidImage ? (
          <>
            <FullBleedBgImage
              src={data.image}
              alt={data.title}
              onError={() => setImgError(true)}
            />
            <EditorialVignetteOverlay />
            <FullBleedContent style={{ y: textY, scale: textScale }}>
              {data.subtitle && <CardCategory accent={data.accent}>{data.subtitle}</CardCategory>}
              <FullBleedTitle>{data.title}</FullBleedTitle>
              <FullBleedDescription>{data.description}</FullBleedDescription>
            </FullBleedContent>
          </>
        ) : (
          <>
            <TextWrapper>
              {data.subtitle && <CardCategory accent={data.accent}>{data.subtitle}</CardCategory>}
              <CardTitle color={data.textColor}>{data.title}</CardTitle>
              <CardDescription color={data.descColor}>{data.description}</CardDescription>
            </TextWrapper>
            <CardMediaContainer accent={data.accent} hasImage={false} />
          </>
        )}
      </CardInner>
    </CardWrapper>
  );
}

export default function AboutHanokSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <SectionContainer id="about-hanok-section">
      <SectionHeader>
        <MainTitle
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          한옥의 미학과 철학.
        </MainTitle>
      </SectionHeader>

      <StickyContainer ref={containerRef}>
        <StickyContent>
          {CARDS_DATA.map((card, idx) => (
            <FeatureCard
              key={card.id}
              data={card}
              index={idx}
              progress={scrollYProgress}
              totalCards={CARDS_DATA.length}
            />
          ))}
        </StickyContent>
      </StickyContainer>
    </SectionContainer>
  );
}
