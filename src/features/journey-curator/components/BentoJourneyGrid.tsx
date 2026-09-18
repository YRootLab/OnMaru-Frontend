'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import {
  Compass,
  Clock,
  Landmark,
  Headphones,
  Play,
  Pause,
  Flame,
  ArrowRight,
  Sparkles,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth';
import { useSavedJourneyStore } from '../store/useSavedJourneyStore';
import { lightPalette, meok, surface , fontSize } from '@/design-system/tokens';
import { transientProps } from '@/design-system/styled';
import { useJourneyStore } from '../store/useJourneyStore';

const Container = styled.div`
  width: min(calc(100% - 40px), 1140px);
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 0 48px;

  @media (max-width: 1024px) {
    width: calc(100% - 28px);
  }

  @media (max-width: 640px) {
    width: calc(100% - 24px);
  }
`;

const SectionHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
`;

const BookmarkBtn = styled.button<{ $saved: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 9999px;
  border: 1px solid ${({ $saved }) => ($saved ? '#00b882' : 'rgba(0, 0, 0, 0.1)')};
  background: ${({ $saved }) => ($saved ? 'rgba(0, 184, 130, 0.1)' : '#ffffff')};
  color: ${({ $saved }) => ($saved ? '#00b882' : '#4e5968')};
  font-size: ${fontSize.xs};
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;

  [data-theme='dark'] & {
    background: ${({ $saved }) => ($saved ? 'rgba(0, 184, 130, 0.15)' : '#24211d')};
    border-color: ${({ $saved }) => ($saved ? '#00b882' : 'rgba(255, 255, 255, 0.12)')};
    color: ${({ $saved }) => ($saved ? '#00b882' : '#a1a1aa')};
  }

  &:hover {
    transform: translateY(-1px);
    border-color: #00b882;
    color: #00b882;
  }
`;

const DayTabsWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  overflow-x: auto;
  padding-bottom: 2px;
`;

const DayTabBtn = styled.button<{ $active: boolean }>`
  padding: 5px 14px;
  border-radius: 9999px;
  font-size: ${fontSize.xs};
  font-weight: 500;
  cursor: pointer;
  border: 1px solid ${({ $active }) => ($active ? '#3b82f6' : 'rgba(0, 0, 0, 0.08)')};
  background: ${({ $active }) => ($active ? '#3b82f6' : 'transparent')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#6b7280')};
  transition: all 0.18s ease;
  white-space: nowrap;

  [data-theme='dark'] & {
    border-color: ${({ $active }) => ($active ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)')};
    color: ${({ $active }) => ($active ? '#ffffff' : '#9ca3af')};
  }

  &:hover {
    background: ${({ $active }) => ($active ? '#3b82f6' : 'rgba(0, 0, 0, 0.04)')};

    [data-theme='dark'] & {
      background: ${({ $active }) => ($active ? '#3b82f6' : 'rgba(255, 255, 255, 0.06)')};
    }
  }
`;

const DayTitleBadge = styled.div`
  font-size: ${fontSize.xs};
  color: #3b82f6;
  font-weight: 500;
  margin-bottom: 8px;
`;

const AiBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: ${fontSize.micro};
  font-weight: 500;
  color: ${lightPalette.cheongrok[500]};
  background: rgba(0, 184, 130, 0.08);
  border: 1px solid rgba(0, 184, 130, 0.2);
  padding: 3px 10px;
  border-radius: 9999px;
  width: fit-content;
`;

const SectionTitle = styled.h2`
  font-family: var(--font-hanok);
  font-size: ${fontSize['2xl']};
  font-weight: 300;
  letter-spacing: -0.02em;
  color: #191f28;
  letter-spacing: -0.02em;
  margin: 0;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }
`;

const SectionTagline = styled.p`
  font-size: ${fontSize.sm};
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
  font-size: ${fontSize.xs};
  font-weight: 500;
  letter-spacing: 0.06em;
  color: ${({ $color }) => $color};
  margin-bottom: 12px;
`;

const CardTitle = styled.h3`
  font-size: ${fontSize.lg};
  font-weight: 500;
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
  font-size: ${fontSize.xs};
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
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: #3b82f6;
`;

const StopName = styled.span`
  font-size: ${fontSize.sm};
  font-weight: 500;
  color: #191f28;

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const StopDesc = styled.span`
  font-size: ${fontSize.xs};
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
  font-size: ${fontSize.sm};
  line-height: 1.6;
  color: #4e5968;
  margin: 0 0 20px;

  [data-theme='dark'] & {
    color: #a1a1aa;
  }
`;

/* ── 3. SORIMARU Card ── */
const SorimaruCard = styled(BaseCard)`
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
  font-size: ${fontSize.sm};
  font-weight: 500;
  color: #191f28;

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const AudioNarrator = styled.span`
  font-size: ${fontSize.xs};
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
  font-size: ${fontSize.xs};
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
  font-size: ${fontSize.xs};
  font-weight: 400;
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
  font-size: ${fontSize.sm};
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
  const router = useRouter();
  const plan = useJourneyStore((s) => s.currentPlan);
  const isGenerating = useJourneyStore((s) => s.isGenerating);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  const { isLoggedIn } = useAuth();
  const saveJourney = useSavedJourneyStore((s) => s.saveJourney);
  const removeJourney = useSavedJourneyStore((s) => s.removeJourney);
  const isSaved = useSavedJourneyStore((s) => s.isSaved);
  const loadSaved = useSavedJourneyStore((s) => s.loadSaved);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  useEffect(() => {
    setSelectedDayIdx(0);
  }, [plan.id]);

  const isCurrentSaved = isSaved(plan.id, plan.title);

  const handleBookmarkToggle = () => {
    if (!isLoggedIn) {
      toast.info('로그인하면 마음에 드는 여정을 저장할 수 있어요.', {
        action: {
          label: '로그인하기',
          onClick: () => router.push('/auth/login'),
        },
      });
      return;
    }

    if (isCurrentSaved) {
      removeJourney(plan.id);
      toast.success('여정 저장을 취소했어요.');
    } else {
      saveJourney(plan);
      toast.success(`✨ '${plan.title}' 여정을 저장했어요!`);
    }
  };

  const { routeCard, hanokCard, sorimaruCard, warmthCard } = plan;
  const days = routeCard.days;
  const hasMultipleDays = Array.isArray(days) && days.length > 1;
  const activeDay = hasMultipleDays ? days[selectedDayIdx] || days[0] : null;

  const currentStops = activeDay ? activeDay.stops : routeCard.stops;
  const currentDuration = activeDay ? activeDay.duration : routeCard.duration;
  const currentWalkingTime = activeDay ? activeDay.walkingTime : routeCard.walkingTime;
  const currentMapLink = activeDay?.mapLink || routeCard.mapLink;

  return (
    <Container style={{ opacity: isGenerating ? 0.6 : 1, transition: 'opacity 0.25s ease' }}>
      <SectionHeader>
        <HeaderRow>
          <div>
            {plan.isAiGenerated && (
              <AiBadge>
                <Sparkles size={12} />
                <span>실시간 맞춤 여정</span>
              </AiBadge>
            )}
            <SectionTitle>{plan.title}</SectionTitle>
            <SectionTagline>{plan.tagline}</SectionTagline>
          </div>

          <BookmarkBtn
            type="button"
            $saved={isCurrentSaved}
            onClick={handleBookmarkToggle}
            title={isCurrentSaved ? '저장 취소' : '여정 저장하기'}
          >
            {isCurrentSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            <span>{isCurrentSaved ? '저장됨' : '여정 저장하기'}</span>
          </BookmarkBtn>
        </HeaderRow>
      </SectionHeader>

      <BentoGrid>
        {/* 1. Map Route Card */}
        <RouteCard>
          <CardBadge $color="#3b82f6">
            <Compass size={14} strokeWidth={2} />
            <span>추천 코스 동선</span>
          </CardBadge>

          {hasMultipleDays && (
            <DayTabsWrap>
              {days.map((day, idx) => (
                <DayTabBtn
                  key={day.dayNumber}
                  type="button"
                  $active={selectedDayIdx === idx}
                  onClick={() => setSelectedDayIdx(idx)}
                >
                  {day.dayNumber}일차
                </DayTabBtn>
              ))}
            </DayTabsWrap>
          )}

          {activeDay?.dayTitle && <DayTitleBadge>{activeDay.dayTitle}</DayTitleBadge>}

          <CardTitle>
            {hasMultipleDays
              ? `${activeDay?.dayNumber}일차: ${activeDay?.theme || routeCard.title}`
              : routeCard.title}
          </CardTitle>

          <RouteMeta>
            <MetaItem>
              <Clock size={14} strokeWidth={2} />
              <span>
                {hasMultipleDays ? `${activeDay?.dayNumber}일차 소요: ` : '총 소요: '}
                {currentDuration}
              </span>
            </MetaItem>
            <MetaItem>
              <span>{currentWalkingTime}</span>
            </MetaItem>
          </RouteMeta>

          <Timeline>
            {currentStops.map((stop, idx) => (
              <TimelineStop key={idx}>
                <StopHeader>
                  <StopTime>{stop.time}</StopTime>
                  <StopName>{stop.name}</StopName>
                </StopHeader>
                <StopDesc>{stop.description}</StopDesc>
              </TimelineStop>
            ))}
          </Timeline>

          <ActionLink href={currentMapLink} $color="#3b82f6">
            <span>
              {hasMultipleDays
                ? `${activeDay?.dayNumber}일차 동선 지도로 보기`
                : '지도에서 전체 동선 보기'}
            </span>
            <ArrowRight size={14} strokeWidth={2} />
          </ActionLink>
        </RouteCard>

        {/* 2. Hanok Heritage Card */}
        <HanokCard>
          <CardBadge $color={lightPalette.cheongrok[500]}>
            <Landmark size={14} strokeWidth={2} />
            <span>공간 기록</span>
          </CardBadge>
          <CardTitle>{hanokCard.title}</CardTitle>

          <HanokImageWrap>
            <img src={hanokCard.imageUrl} alt={hanokCard.title} />
          </HanokImageWrap>

          <HanokDesc>{hanokCard.architecturalPoint}</HanokDesc>

          <ActionLink href={hanokCard.hanokLink} $color={lightPalette.cheongrok[500]}>
            <span>한옥 구조 살펴보기</span>
            <ArrowRight size={14} strokeWidth={2} />
          </ActionLink>
        </HanokCard>

        {/* 3. SORIMARU Audio Card */}
        <SorimaruCard>
          <CardBadge $color="#8b5cf6">
            <Headphones size={14} strokeWidth={2} />
            <span>공간 오디오 해설</span>
          </CardBadge>
          <CardTitle>{sorimaruCard.title}</CardTitle>

          <AudioPlayBox>
            <PlayBtn
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? '오디오 일시정지' : '오디오 듣기'}
            >
              {isPlaying ? <Pause size={18} strokeWidth={2} /> : <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />}
            </PlayBtn>
            <AudioInfo>
              <AudioTitle>{sorimaruCard.subtitle}</AudioTitle>
              <AudioNarrator>
                {sorimaruCard.narrator} · {sorimaruCard.duration}
              </AudioNarrator>
            </AudioInfo>
          </AudioPlayBox>

          <ExcerptBox>"{sorimaruCard.excerpt}"</ExcerptBox>

          <ActionLink href={sorimaruCard.sorimaruLink} $color="#8b5cf6">
            <span>오디오 전체 이야기 듣기</span>
            <ArrowRight size={14} strokeWidth={2} />
          </ActionLink>
        </SorimaruCard>

        {/* 4. Warmth & Crowd Card */}
        <WarmthCard>
          <CardBadge $color={lightPalette.juhong[500]}>
            <Flame size={14} strokeWidth={2} />
            <span>실시간 분위기와 혼잡도</span>
          </CardBadge>
          <CardTitle>현재 분위기: '{warmthCard.status}'</CardTitle>

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
            <span>여행자 온기 이야기 보기</span>
            <ArrowRight size={14} strokeWidth={2} />
          </ActionLink>
        </WarmthCard>
      </BentoGrid>
    </Container>
  );
}
