'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { Compass, Clock, Landmark, Headphones, Play, Pause, Flame, ArrowRight } from 'lucide-react';
import { lightPalette, meok, surface } from '@/design-system/tokens';
import { transientProps } from '@/design-system/styled';
import { useJourneyStore } from '../store/useJourneyStore';

const Container = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 20px 48px;
`;

const SectionHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  font-family: 'MaruBuri', serif, sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #191f28;
  letter-spacing: -0.02em;
  margin: 0;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }
`;

const SectionTagline = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;

  [data-theme='dark'] & {
    color: #9ca3af;
  }
`;

const BentoGrid = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  grid-template-rows: auto auto;
  gap: 20px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const BaseCard = styled(motion.div)`
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.07);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.03);
  padding: 24px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  transition: all 0.22s ease;

  [data-theme='dark'] & {
    background: #1c1a17;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  &:hover {
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06);
    border-color: rgba(0, 0, 0, 0.12);

    [data-theme='dark'] & {
      border-color: rgba(255, 255, 255, 0.16);
    }
  }
`;

/* ── 1. Map Route Card ── */
const RouteCard = styled(BaseCard)`
  grid-column: 1 / 2;
  grid-row: 1 / 2;

  @media (max-width: 900px) {
    grid-column: 1;
    grid-row: auto;
  }
`;

const CardBadge = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: ${({ $color }) => $color};
  margin-bottom: 12px;
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #191f28;
  margin: 0 0 16px;
  letter-spacing: -0.02em;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }
`;

const RouteMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #4e5968;
  margin-bottom: 20px;

  [data-theme='dark'] & {
    color: #a1a1aa;
  }
`;

const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
`;

const Timeline = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  padding-left: 20px;
  margin-bottom: 24px;

  &::before {
    content: '';
    position: absolute;
    top: 6px;
    bottom: 6px;
    left: 6px;
    width: 2px;
    background: rgba(0, 0, 0, 0.08);

    [data-theme='dark'] & {
      background: rgba(255, 255, 255, 0.12);
    }
  }
`;

const TimelineStop = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;

  &::before {
    content: '';
    position: absolute;
    left: -20px;
    top: 5px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #3b82f6;
    border: 2px solid #ffffff;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);

    [data-theme='dark'] & {
      border-color: #1c1a17;
    }
  }
`;

const StopHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StopTime = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #3b82f6;
`;

const StopName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #191f28;

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const StopDesc = styled.span`
  font-size: 12.5px;
  color: #6b7280;

  [data-theme='dark'] & {
    color: #9ca3af;
  }
`;

/* ── 2. Hanok Card ── */
const HanokCard = styled(BaseCard)`
  grid-column: 2 / 3;
  grid-row: 1 / 2;

  @media (max-width: 900px) {
    grid-column: 1;
    grid-row: auto;
  }
`;

const HanokImageWrap = styled.div`
  position: relative;
  width: 100%;
  height: 160px;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 16px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  &:hover img {
    transform: scale(1.04);
  }
`;

const HanokDesc = styled.p`
  font-size: 13.5px;
  line-height: 1.6;
  color: #4e5968;
  margin: 0 0 20px;

  [data-theme='dark'] & {
    color: #a1a1aa;
  }
`;

/* ── 3. ODII Card ── */
const OdiiCard = styled(BaseCard)`
  grid-column: 1 / 2;
  grid-row: 2 / 3;

  @media (max-width: 900px) {
    grid-column: 1;
    grid-row: auto;
  }
`;

const AudioPlayBox = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(139, 92, 246, 0.06);
  border-radius: 14px;
  padding: 14px 18px;
  margin-bottom: 18px;

  [data-theme='dark'] & {
    background: rgba(139, 92, 246, 0.12);
  }
`;

const PlayBtn = styled.button<{ $playing?: boolean }>`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  background: #8b5cf6;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.15s ease;

  &:hover {
    transform: scale(1.08);
  }
`;

const AudioInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
`;

const AudioTitle = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #191f28;

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const AudioNarrator = styled.span`
  font-size: 12px;
  color: #6b7280;

  [data-theme='dark'] & {
    color: #9ca3af;
  }
`;

const ExcerptBox = styled.blockquote`
  margin: 0 0 20px;
  padding: 0 0 0 14px;
  border-left: 2px solid #8b5cf6;
  font-style: italic;
  font-size: 13px;
  line-height: 1.6;
  color: #4e5968;

  [data-theme='dark'] & {
    color: #a1a1aa;
  }
`;

/* ── 4. Warmth Card ── */
const WarmthCard = styled(BaseCard)`
  grid-column: 2 / 3;
  grid-row: 2 / 3;

  @media (max-width: 900px) {
    grid-column: 1;
    grid-row: auto;
  }
`;

const GaugeWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
`;

const GaugeBar = styled.div`
  width: 100%;
  height: 8px;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.06);
  overflow: hidden;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const GaugeFill = styled.div<{ $pct: number }>`
  width: ${({ $pct }) => $pct}%;
  height: 100%;
  border-radius: 9999px;
  background: ${lightPalette.juhong[500]};
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
`;

const GaugeMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;

  [data-theme='dark'] & {
    color: #9ca3af;
  }
`;

const ActionLink = styled(Link, transientProps)<{ $color?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  font-size: 13.5px;
  font-weight: 700;
  color: ${({ $color }) => $color || '#191f28'};
  text-decoration: none;
  transition: gap 0.15s ease;

  [data-theme='dark'] & {
    color: ${({ $color }) => $color || '#ffffff'};
  }

  &:hover {
    gap: 10px;
  }
`;

export default function BentoJourneyGrid() {
  const plan = useJourneyStore((s) => s.currentPlan);
  const [isPlaying, setIsPlaying] = useState(false);

  const { routeCard, hanokCard, odiiCard, warmthCard } = plan;

  return (
    <Container>
      <SectionHeader>
        <SectionTitle>{plan.title}</SectionTitle>
        <SectionTagline>{plan.tagline}</SectionTagline>
      </SectionHeader>

      <BentoGrid>
        {/* 1. Map Route Card */}
        <RouteCard>
          <CardBadge $color="#3b82f6">
            <Compass size={14} strokeWidth={2} />
            <span>추천 공간 동선 (지도 연동)</span>
          </CardBadge>
          <CardTitle>{routeCard.title}</CardTitle>

          <RouteMeta>
            <MetaItem>
              <Clock size={14} strokeWidth={2} />
              <span>총 소요: {routeCard.duration}</span>
            </MetaItem>
            <MetaItem>
              <span>{routeCard.walkingTime}</span>
            </MetaItem>
          </RouteMeta>

          <Timeline>
            {routeCard.stops.map((stop, idx) => (
              <TimelineStop key={idx}>
                <StopHeader>
                  <StopTime>{stop.time}</StopTime>
                  <StopName>{stop.name}</StopName>
                </StopHeader>
                <StopDesc>{stop.description}</StopDesc>
              </TimelineStop>
            ))}
          </Timeline>

          <ActionLink href={routeCard.mapLink} $color="#3b82f6">
            <span>지도에서 전체 동선 및 장소 보기</span>
            <ArrowRight size={14} strokeWidth={2} />
          </ActionLink>
        </RouteCard>

        {/* 2. Hanok Heritage Card */}
        <HanokCard>
          <CardBadge $color={lightPalette.cheongrok[500]}>
            <Landmark size={14} strokeWidth={2} />
            <span>한옥 건축·문화재 도감</span>
          </CardBadge>
          <CardTitle>{hanokCard.title}</CardTitle>

          <HanokImageWrap>
            <img src={hanokCard.imageUrl} alt={hanokCard.title} />
          </HanokImageWrap>

          <HanokDesc>{hanokCard.architecturalPoint}</HanokDesc>

          <ActionLink href={hanokCard.hanokLink} $color={lightPalette.cheongrok[500]}>
            <span>3D 한옥 조립 및 도감 보기</span>
            <ArrowRight size={14} strokeWidth={2} />
          </ActionLink>
        </HanokCard>

        {/* 3. ODII Audio Card */}
        <OdiiCard>
          <CardBadge $color="#8b5cf6">
            <Headphones size={14} strokeWidth={2} />
            <span>소리마루 공간 오디오 해설</span>
          </CardBadge>
          <CardTitle>{odiiCard.title}</CardTitle>

          <AudioPlayBox>
            <PlayBtn
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? '오디오 일시정지' : '오디오 듣기'}
            >
              {isPlaying ? <Pause size={18} strokeWidth={2} /> : <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />}
            </PlayBtn>
            <AudioInfo>
              <AudioTitle>{odiiCard.subtitle}</AudioTitle>
              <AudioNarrator>
                {odiiCard.narrator} · {odiiCard.duration}
              </AudioNarrator>
            </AudioInfo>
          </AudioPlayBox>

          <ExcerptBox>"{odiiCard.excerpt}"</ExcerptBox>

          <ActionLink href={odiiCard.odiiLink} $color="#8b5cf6">
            <span>소리마루에서 전체 이야기 듣기</span>
            <ArrowRight size={14} strokeWidth={2} />
          </ActionLink>
        </OdiiCard>

        {/* 4. Warmth & Crowd Card */}
        <WarmthCard>
          <CardBadge $color={lightPalette.juhong[500]}>
            <Flame size={14} strokeWidth={2} />
            <span>실시간 온기 및 혼잡도</span>
          </CardBadge>
          <CardTitle>현재 상태: '{warmthCard.status}'</CardTitle>

          <GaugeWrap>
            <GaugeBar>
              <GaugeFill $pct={warmthCard.percentage} />
            </GaugeBar>
            <GaugeMeta>
              <span>혼잡 지수 {warmthCard.percentage}%</span>
              <span>최근 온기 {warmthCard.recentCount}개</span>
            </GaugeMeta>
          </GaugeWrap>

          <HanokDesc style={{ marginBottom: 12 }}>
            <strong>추천 시간대:</strong> {warmthCard.bestTime}
          </HanokDesc>
          <HanokDesc>{warmthCard.vibeComment}</HanokDesc>

          <ActionLink href="/map" $color={lightPalette.juhong[500]}>
            <span>실시간 여행자 온기 피드 보기</span>
            <ArrowRight size={14} strokeWidth={2} />
          </ActionLink>
        </WarmthCard>
      </BentoGrid>
    </Container>
  );
}
