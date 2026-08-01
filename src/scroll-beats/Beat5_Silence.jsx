'use client';

import styled from '@emotion/styled';
import { motion } from 'framer-motion';

import { BEAT_RANGES } from '@/scroll-core/constants';
import { clamp01, usePrefersReducedMotion } from './BeatFrame';

const FONT = "'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, sans-serif";

export const RANGE = BEAT_RANGES.BEAT5;
const [RANGE_START, RANGE_END] = RANGE;

const Stage = styled.section`
  position: fixed;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  font-family: ${FONT};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  text-align: center;
`;

const ContentCard = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Headline = styled.h2`
  margin: 0;
  font-size: clamp(32px, 4.2vw, 58px);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #191f28;
  word-break: keep-all;
  line-height: 1.25;
`;

const MetaInfo = styled.div`
  margin: 24px 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: clamp(12px, 1.1vw, 14px);
  font-weight: 500;
  color: #8b95a1;
  letter-spacing: -0.01em;
  line-height: 1.6;
`;

export default function Beat5_Silence({ progress }) {
  const reduced = usePrefersReducedMotion();

  const active = progress >= RANGE_START && progress < RANGE_END;
  const local = active ? (progress - RANGE_START) / (RANGE_END - RANGE_START) : 0;

  if (!active) return null;

  // 진입/퇴장 시 부드러운 오파시티 보간
  const opacity = clamp01(local <= 0.15 ? local / 0.15 : local >= 0.85 ? (1 - local) / 0.15 : 1);

  return (
    <Stage>
      <ContentCard
        style={{
          opacity: reduced ? (active ? 1 : 0) : opacity,
          transform: `translateY(${(1 - opacity) * 12}px)`,
        }}
      >
        <Headline>이 집은, 실재합니다.</Headline>

        <MetaInfo>
          <span>서울 계동 · 1930년대</span>
          <span>국가유산청 3D 실측 데이터 · 공공누리 제1유형</span>
        </MetaInfo>
      </ContentCard>
    </Stage>
  );
}
