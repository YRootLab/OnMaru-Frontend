'use client';

import React, { useRef } from 'react';
import styled from '@emotion/styled';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import type { OnmaruTheme } from '@/design-system/tokens';

const CARDS_DATA = [
  {
    id: 1,
    title: '기단과 주춧돌',
    description: '자연의 지형을 거스르지 않고 돌을 쌓아 집의 바탕을 만듭니다. 그랭이 기법으로 나무와 돌이 완벽하게 맞물립니다.',
    color: '#18181A',
  },
  {
    id: 2,
    title: '숨쉬는 황토 벽체',
    description: '자연에서 온 흙으로 빚은 벽은 스스로 숨을 쉬며 습도와 온도를 조절하는 천연 단열재 역할을 합니다.',
    color: '#201A18',
  },
  {
    id: 3,
    title: '바람길, 대청마루',
    description: '앞뒤가 탁 트인 대청마루는 뒷산의 시원한 바람을 집 안으로 끌어들이는 한옥만의 과학적인 천연 에어컨입니다.',
    color: '#18201C',
  },
  {
    id: 4,
    title: '빛을 들이는 창호',
    description: '문살에 바른 한지는 직사광선을 부드러운 빛으로 바꾸어 낮에는 햇살을, 밤에는 달빛을 은은하게 머금습니다.',
    color: '#1C1820',
  },
  {
    id: 5,
    title: '과학적인 처마선',
    description: '깊게 뻗은 기와 지붕의 처마는 여름의 뜨거운 태양을 가리고, 겨울의 따스한 빛을 집 안 깊숙이 끌어들입니다.',
    color: '#1F1F1F',
  },
];

const SectionContainer = styled.section`
  position: relative;
  width: 100%;
  background-color: ${({ theme }) => (theme as OnmaruTheme).colors.bg.app};
  padding-top: 160px;
  z-index: 10;
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 80px;
  padding: 0 24px;
`;

const MainTitle = styled(motion.h2)`
  font-family: ${({ theme }) => (theme as OnmaruTheme).typography.fontFamily.traditional};
  font-size: clamp(36px, 6vw, 64px);
  font-weight: ${({ theme }) => (theme as OnmaruTheme).typography.fontWeight.bold};
  color: ${({ theme }) => (theme as OnmaruTheme).colors.text.primary};
  margin-bottom: 16px;
  letter-spacing: -0.02em;
`;

const SubTitle = styled(motion.p)`
  font-family: ${({ theme }) => (theme as OnmaruTheme).typography.fontFamily.sans};
  font-size: clamp(18px, 2vw, 24px);
  color: ${({ theme }) => (theme as OnmaruTheme).colors.text.secondary};
  word-break: keep-all;
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
  pointer-events: none; /* Let scroll pass through */
`;

const CardInner = styled(motion.div)<{ bg: string }>`
  width: min(92%, 1100px);
  height: min(85vh, 800px);
  background-color: ${(props) => props.bg};
  border-radius: 40px;
  padding: clamp(32px, 5vw, 64px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transform-origin: top center;
  overflow: hidden;
  position: relative;
  pointer-events: auto;

  @media (max-width: 768px) {
    height: 75vh;
    border-radius: 32px;
  }
`;

const CardTop = styled.div`
  z-index: 2;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const CardTitle = styled.h3`
  font-family: ${({ theme }) => (theme as OnmaruTheme).typography.fontFamily.traditional};
  font-size: clamp(28px, 4vw, 48px);
  font-weight: ${({ theme }) => (theme as OnmaruTheme).typography.fontWeight.bold};
  color: ${({ theme }) => (theme as OnmaruTheme).colors.text.primary};
  margin-bottom: 20px;
  background: linear-gradient(180deg, #fff 0%, #d4af37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const CardDescription = styled.p`
  font-family: ${({ theme }) => (theme as OnmaruTheme).typography.fontFamily.sans};
  font-size: clamp(16px, 1.8vw, 22px);
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
  max-width: 600px;
  word-break: keep-all;
`;

// 임시 이미지 영역 (추후 실제 이미지로 교체)
const CardMediaPlaceholder = styled.div`
  position: absolute;
  bottom: -5%;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 60%;
  background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%);
  border-radius: 24px 24px 0 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: none;
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  
  &::after {
    content: '이미지/영상 영역';
    color: rgba(255, 255, 255, 0.2);
    font-size: 14px;
    letter-spacing: 0.1em;
  }
`;

interface FeatureCardProps {
  data: typeof CARDS_DATA[0];
  index: number;
  progress: MotionValue<number>;
  totalCards: number;
}

function FeatureCard({ data, index, progress, totalCards }: FeatureCardProps) {
  const targetProgress = index / (totalCards - 1);
  const prevTarget = Math.max(0, (index - 1) / (totalCards - 1));

  // Y-axis translation: Entry from bottom (100vh) to center (0vh), then stack slightly upwards (-Xvh)
  const y = useTransform(
    progress,
    [prevTarget, targetProgress, 1],
    index === 0 
      ? ['0vh', '0vh', `-${(totalCards - 1 - index) * 4}vh`]
      : ['100vh', '0vh', `-${(totalCards - 1 - index) * 4}vh`]
  );

  // Scale down when pushed back to create Z-axis depth
  const scale = useTransform(
    progress,
    [targetProgress, 1],
    [1, 1 - 0.05 * (totalCards - 1 - index)]
  );

  // Fade slightly when pushed back
  const opacity = useTransform(
    progress,
    [targetProgress, 1],
    [1, 1 - 0.15 * (totalCards - 1 - index)]
  );

  return (
    <CardWrapper style={{ y, zIndex: index }}>
      <CardInner bg={data.color} style={{ scale, opacity }}>
        <CardTop>
          <CardTitle>{data.title}</CardTitle>
          <CardDescription>{data.description}</CardDescription>
        </CardTop>
        <CardMediaPlaceholder />
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
          일단 핵심부터.
        </MainTitle>
        <SubTitle
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          자연과 맞닿은 한옥의 5가지 과학적 설계
        </SubTitle>
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
