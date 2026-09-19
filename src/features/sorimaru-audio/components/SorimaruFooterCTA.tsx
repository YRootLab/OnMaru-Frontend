'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion } from 'framer-motion';
import SHADOW from '@/data/solarShadow.json';
import { palette, meok, surface, fontSize } from '@/design-system/tokens';

function getNextSolarTerm(now = new Date()) {
  const year = now.getFullYear();
  const dated = [year, year + 1].flatMap((y) =>
    (SHADOW.stops || []).map((term) => ({ name: term.name, date: new Date(y, term.month - 1, term.day) })),
  );
  const next = dated.filter((term) => term.date >= now).sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  if (!next) return null;
  return {
    name: next.name,
    daysLeft: Math.ceil((next.date.getTime() - now.getTime()) / 86400000),
  };
}

const pulseAnimation = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const SectionContainer = styled.section`
  width: 100%;
  padding: 3rem 0;
  @media (min-width: 640px) {
    padding: 4rem 0;
  }
`;

const ContentWrapper = styled.div`
  width: 100%;
  text-align: center;
`;

const GlassCard = styled(motion.div)`
  position: relative;
  overflow: hidden;
  border-radius: 1.5rem;
  background: linear-gradient(to bottom right, #ffffff, ${palette.juhong[50]});
  padding: 2rem;
  color: ${meok[900]};
  backdrop-filter: blur(12px);

  [data-theme='dark'] & {
    background: linear-gradient(to bottom right, ${surface.dark.card}, #24211D);
    color: ${meok[100]};
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  @media (min-width: 640px) {
    padding: 3.5rem;
  }
`;

const RadialOverlay = styled.div`
  pointer-events: none;
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, transparent 60%, rgba(255, 244, 235, 0.8) 100%);

  [data-theme='dark'] & {
    background: radial-gradient(circle, rgba(45, 41, 36, 0.4) 0%, transparent 60%, rgba(36, 33, 29, 0.8) 100%);
  }
`;

const GlowOrbRight = styled.div`
  pointer-events: none;
  position: absolute;
  top: -4rem;
  right: -4rem;
  width: 14rem;
  height: 14rem;
  border-radius: 9999px;
  background: rgba(255, 85, 0, 0.1);
  filter: blur(48px);
`;

const GlowOrbLeft = styled.div`
  pointer-events: none;
  position: absolute;
  bottom: -4rem;
  left: -4rem;
  width: 14rem;
  height: 14rem;
  border-radius: 9999px;
  background: rgba(255, 120, 48, 0.12);
  filter: blur(48px);
`;

const InnerBody = styled.div`
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SolarBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  background: ${palette.juhong[50]};
  padding: 0.25rem 0.875rem;
  font-size: ${fontSize.xs};
  font-weight: 700;
  color: ${palette.juhong[500]};
  backdrop-filter: blur(4px);

  [data-theme='dark'] & {
    background: rgba(255, 85, 0, 0.15);
    color: ${palette.juhong[400]};
    border: 1px solid rgba(255, 85, 0, 0.25);
  }
`;

const PulseDot = styled.span`
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 9999px;
  background: ${palette.juhong[500]};
  animation: ${pulseAnimation} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;

const MainHeading = styled.h2`
  margin-top: 1.25rem;
  font-family: inherit;
  font-size: ${fontSize['2xl']};
  font-weight: 800;
  letter-spacing: -0.025em;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: #ffffff;
  }

  @media (min-width: 640px) {
    font-size: ${fontSize['4xl']};
  }
`;

const Description = styled.p`
  margin-top: 0.875rem;
  max-width: 36rem;
  font-size: ${fontSize.xs};
  line-height: 1.625;
  color: ${meok[700]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }

  @media (min-width: 640px) {
    font-size: ${fontSize.sm};
  }
`;

const ButtonRow = styled.div`
  margin-top: 2rem;
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.875rem;
  @media (min-width: 640px) {
    width: auto;
    flex-direction: row;
  }
`;

const PrimaryCtaLink = styled(Link)`
  position: relative;
  display: inline-flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  overflow: hidden;
  border-radius: 9999px;
  background: linear-gradient(to right, ${palette.juhong[500]}, ${palette.juhong[700]});
  padding: 0.875rem 1.75rem;
  font-size: ${fontSize.xs};
  font-weight: 700;
  color: #ffffff;
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    background: linear-gradient(to right, ${palette.juhong[600]}, ${palette.juhong[800]});
  }

  @media (min-width: 640px) {
    width: auto;
  }

  & .arrow {
    display: inline-block;
    transition: transform 0.3s ease;
  }

  &:hover .arrow {
    transform: translateX(4px);
  }
`;

const SecondaryCtaLink = styled(Link)`
  display: inline-flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: #ffffff;
  padding: 0.875rem 1.75rem;
  font-size: ${fontSize.xs};
  font-weight: 700;
  color: ${palette.juhong[500]};
  text-decoration: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    background: ${palette.juhong[50]};
  }

  [data-theme='dark'] & {
    background: ${surface.dark.surface};
    color: ${meok[100]};
    border: 1px solid rgba(255, 255, 255, 0.1);

    &:hover {
      background: ${surface.dark.elevated};
      color: #ffffff;
    }
  }

  @media (min-width: 640px) {
    width: auto;
  }
`;

const SubText = styled.p`
  margin-top: 2rem;
  font-size: ${fontSize.micro};
  font-weight: 500;
  color: ${meok[500]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

export const SorimaruFooterCTA: React.FC = () => {
  const term = useMemo(() => getNextSolarTerm(), []);

  const termText = (() => {
    if (!term) return '절기 알림';
    if (term.daysLeft === 0) return `${term.name} 오늘`;
    if (term.daysLeft === 1) return `${term.name} 내일`;
    return `${term.name}까지 D-${term.daysLeft}`;
  })();

  return (
    <SectionContainer aria-label="다음에 또 방문하기">
      <ContentWrapper>
        <GlassCard
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.12, 1, 0.2, 1] }}
        >
          {/* 분위기 비네트 래디얼 오버레이 */}
          <RadialOverlay />
          <GlowOrbRight />
          <GlowOrbLeft />

          <InnerBody>
            {/* 절기 알림 뱃지 */}
            <SolarBadge>
              <PulseDot />
              <span>{termText}</span>
            </SolarBadge>

            <MainHeading>
              다음 계절에도, 새로운 이야기를 만나요
            </MainHeading>

            <Description>
              계절과 날짜가 바뀌면 오늘의 대표 이야기도 새롭게 열립니다.
              다음에 돌아왔을 때 다른 장소의 온기를 이어서 들어보세요.
            </Description>

            {/* CTA 버튼 모음 */}
            <ButtonRow>
              <PrimaryCtaLink href="/map">
                <span>전국 한옥 지도에서 둘러보기</span>
                <span className="arrow">→</span>
              </PrimaryCtaLink>
              <SecondaryCtaLink href="/">
                온마루 3D 한옥 스토리가기 🇰🇷
              </SecondaryCtaLink>
            </ButtonRow>

            <SubText>오늘의 소리는 내일 또 다른 장면으로 이어집니다.</SubText>
          </InnerBody>
        </GlassCard>
      </ContentWrapper>
    </SectionContainer>
  );
};
