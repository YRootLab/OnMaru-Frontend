'use client';

import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

import { lightPalette, meok } from '@/design-system/tokens';
import { BEAT_RANGES } from '@/scroll-core/constants';
import { clamp01, progressIn, usePrefersReducedMotion } from './BeatFrame';

// ─────────────────────────────────────────
// 구간 (Beat6: 0.82 ~ 1.0)
// ─────────────────────────────────────────

export const RANGE = BEAT_RANGES.BEAT6;
const [RANGE_START, RANGE_END] = RANGE;

const FONT_SPOQA = "'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, sans-serif";
const FONT_MARU = "'MaruBuri', serif";

// ─────────────────────────────────────────
// 애니메이션 Keyframes
// ─────────────────────────────────────────

const floatSlow = keyframes`
  0%, 100% { transform: translateY(0px); }
  50%      { transform: translateY(-6px); }
`;

const shimmer = keyframes`
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// ─────────────────────────────────────────
// 스타일
// ─────────────────────────────────────────

const Stage = styled.section`
  position: fixed;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  pointer-events: none;
  font-family: ${FONT_SPOQA};
`;

const ContentBox = styled.div`
  width: 100%;
  max-width: 840px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const HeaderGroup = styled.div`
  transition: all 0.5s ease-out;
  will-change: opacity, transform;
`;

const Headline = styled.h2`
  margin: 0;
  font-family: ${FONT_MARU};
  font-size: clamp(32px, 4.8vw, 62px);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #f4efe4;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  word-break: keep-all;
`;

const SourceMeta = styled.p`
  margin: 16px 0 0;
  font-size: clamp(13px, 1.4vw, 16px);
  font-weight: 400;
  color: ${lightPalette.hwanggeum[400]};
  letter-spacing: -0.01em;
  opacity: 0.9;
  word-break: keep-all;
`;

const TransitionText = styled.h3`
  margin: 32px 0 28px;
  font-family: ${FONT_MARU};
  font-size: clamp(22px, 3vw, 38px);
  font-weight: 600;
  color: ${meok[100]};
  letter-spacing: -0.02em;
  word-break: keep-all;
  transition: all 0.5s ease-out;
  will-change: opacity, transform;
`;

/* 라이브 데이터 카드 3장 레이아웃 */
const CardsGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 40px;
  transition: all 0.5s ease-out;
  will-change: opacity, transform;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const DataCardPlaceholder = styled.div`
  background: rgba(28, 26, 23, 0.85);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(212, 175, 55, 0.28);
  border-radius: 16px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  transition: transform 0.3s ease, border-color 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(212, 175, 55, 0.6);
  }
`;

const CityName = styled.span`
  font-size: clamp(14px, 1.4vw, 17px);
  font-weight: 700;
  color: ${meok[200]};
  margin-bottom: 8px;
`;

const CountSkeleton = styled.div`
  font-size: clamp(20px, 2vw, 28px);
  font-weight: 700;
  color: ${lightPalette.hwanggeum[400]};
  background: linear-gradient(90deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.28) 50%, rgba(212, 175, 55, 0.1) 100%);
  background-size: 200% 100%;
  animation: ${shimmer} 2.5s infinite linear;
  border-radius: 6px;
  padding: 2px 14px;
`;

const CtaButton = styled.a`
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 36px;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.95) 0%, rgba(180, 140, 30, 0.95) 100%);
  color: #1c1a17;
  font-size: clamp(15px, 1.5vw, 18px);
  font-weight: 700;
  letter-spacing: -0.02em;
  border-radius: 40px;
  text-decoration: none;
  box-shadow: 0 10px 32px rgba(212, 175, 55, 0.3);
  transition: all 0.3s ease-out;
  animation: ${floatSlow} 3s ease-in-out infinite;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 14px 40px rgba(212, 175, 55, 0.5);
    background: linear-gradient(135deg, #e5be48 0%, #c49a26 100%);
  }

  &:focus-visible {
    outline: 3px solid #f4efe4;
    outline-offset: 3px;
  }
`;

// ─────────────────────────────────────────
// Beat6_Invite
// ─────────────────────────────────────────

export default function Beat6_Invite({ progress }) {
  const reduced = usePrefersReducedMotion();

  if (progress < RANGE_START) return null;

  const local = clamp01((progress - RANGE_START) / (RANGE_END - RANGE_START));

  // 단계별 등장 타임라인 (0.0 ~ 1.0)
  const headerOpacity = progressIn(local, 0.0, 0.3);
  const transitionOpacity = progressIn(local, 0.35, 0.6);
  const cardAndCtaOpacity = progressIn(local, 0.55, 0.85);

  return (
    <Stage aria-label="Beat 6 초대 — 실재하는 한옥과 전국 한옥 공간">
      <ContentBox>
        {/* 헤드라인 및 출처 메타데이터 */}
        <HeaderGroup
          style={{
            opacity: headerOpacity,
            transform: reduced ? 'none' : `translateY(${16 * (1 - headerOpacity)}px)`,
          }}
        >
          <Headline>이 집은, 실재합니다.</Headline>
          <SourceMeta>서울 계동 · 1930년대 · 국가유산청 3D 실측 데이터</SourceMeta>
        </HeaderGroup>

        {/* ── 전환 서사 ── */}
        <TransitionText
          style={{
            opacity: transitionOpacity,
            transform: reduced ? 'none' : `translateY(${16 * (1 - transitionOpacity)}px)`,
          }}
        >
          그리고, 이런 집들이 전국에 있습니다.
        </TransitionText>

        {/* 라이브 데이터 카드 3장 Placeholder (전주, 안동, 경주) */}
        <CardsGrid
          style={{
            opacity: cardAndCtaOpacity,
            transform: reduced ? 'none' : `translateY(${20 * (1 - cardAndCtaOpacity)}px)`,
          }}
        >
          <DataCardPlaceholder>
            <CityName>전주</CityName>
            <CountSkeleton>-- 곳</CountSkeleton>
          </DataCardPlaceholder>

          <DataCardPlaceholder>
            <CityName>안동</CityName>
            <CountSkeleton>-- 곳</CountSkeleton>
          </DataCardPlaceholder>

          <DataCardPlaceholder>
            <CityName>경주</CityName>
            <CountSkeleton>-- 곳</CountSkeleton>
          </DataCardPlaceholder>
        </CardsGrid>

        {/* CTA 버튼 */}
        <div
          style={{
            opacity: cardAndCtaOpacity,
            transform: reduced ? 'none' : `translateY(${16 * (1 - cardAndCtaOpacity)}px)`,
            transition: 'all 0.5s ease-out',
          }}
        >
          <CtaButton href="#hanok-map" aria-label="전국 한옥 지도 보기">
            전국 한옥 지도 보기 →
          </CtaButton>
        </div>
      </ContentBox>
    </Stage>
  );
}
