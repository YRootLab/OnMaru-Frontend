'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { MapPin, ArrowLeft, ArrowRight, RotateCcw, Volume2 } from 'lucide-react';
import { palette, fontSize, ringShadow } from '@/design-system/tokens';
import { useJourneyStore } from '../store/useJourneyStore';
import { useCuratedCourses, usePopularRegions, useTrendingSounds } from '../hooks/useHomeData';

const FeedContainer = styled.div`
  width: min(calc(100% - 40px), 1140px);
  max-width: 1140px;
  margin: 0 auto;
  padding: 24px 0 80px;
  display: flex;
  flex-direction: column;
  gap: 120px;

  @media (max-width: 1024px) {
    width: calc(100% - 28px);
    padding-bottom: 60px;
    gap: 74px;
  }

  @media (max-width: 640px) {
    width: calc(100% - 24px);
    gap: 52px;
  }
`;


const SectionHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const SectionTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SectionTitle = styled.h2`
  font-family: var(--font-hanok);
  font-size: ${fontSize['2xl']};
  font-weight: 700;
  color: #191f28;
  margin: 0;
  letter-spacing: -0.02em;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }

  @media (max-width: 768px) {
    font-size: ${fontSize.xl};
  }
`;

const SectionDescription = styled.p`
  font-size: ${fontSize.sm};
  color: #6b7684;
  margin: 0;

  [data-theme='dark'] & {
    color: #a1a1aa;
  }
`;

/* ── 1. 에디터 추천 코스 (상위 7개 무한 캐러셀) ── */
const CourseGrid = styled.div`
  position: relative;
`;

const CourseViewport = styled.div`
  position: relative;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 6px 4px 14px;
  margin: -6px -4px -14px;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const CourseSkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 14px;
  }
`;

const CourseRail = styled.div`
  display: flex;
  gap: 20px;
  width: 100%;

  @media (max-width: 1024px) {
    gap: 16px;
  }

  @media (max-width: 640px) {
    gap: 14px;
  }
`;

const CourseArrow = styled.button`
  position: absolute;
  z-index: 2;
  top: 50%;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(25, 31, 40, 0.1);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.94);
  color: #191f28;
  box-shadow: 0 8px 20px rgba(25, 31, 40, 0.12);
  cursor: pointer;
  top: calc(50% - 4px);
  transform: translate(-50%, -50%);

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }

  &[data-direction='prev'] {
    left: 0;
  }

  &[data-direction='next'] {
    right: 0;
    transform: translate(50%, -50%);
  }

  [data-theme='dark'] & {
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(36, 33, 29, 0.94);
    color: #f8f9fa;
  }

  @media (max-width: 640px) {
    width: 34px;
    height: 34px;

    &[data-direction='prev'] {
      left: 0;
    }

    &[data-direction='next'] {
      right: 0;
    }
  }
`;

const CourseIndicators = styled.div`
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 18px;
`;

const CourseIndicator = styled.button<{ $active: boolean }>`
  width: ${({ $active }) => ($active ? '22px' : '7px')};
  height: 7px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: ${({ $active }) => ($active ? palette.juhong[500] : '#d9d9d7')};
  cursor: pointer;
  transition: width 0.2s ease, background-color 0.2s ease;

  [data-theme='dark'] & {
    background: ${({ $active }) => ($active ? palette.juhong[400] : '#4b4741')};
  }
`;

const CourseCard = styled.button`
  text-align: left;
  display: flex;
  flex: 0 0 29.75%;
  flex-direction: column;
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  border: none;
  cursor: pointer;
  box-shadow: ${ringShadow.light.card};
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;

  [data-theme='dark'] & {
    background: #24211d;
    box-shadow: ${ringShadow.dark.card};
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${ringShadow.light.cardHoverGlow};

    [data-theme='dark'] & {
      box-shadow: ${ringShadow.dark.cardHoverGlow};
    }
  }

  &:active {
    transform: translateY(-1px);
  }

  @media (max-width: 1024px) {
    flex-basis: 46%;
  }

  @media (max-width: 640px) {
    flex-basis: 80%;
  }
`;

const CourseImageWrap = styled.div`
  position: relative;
  width: 100%;
  height: 165px;
  overflow: hidden;
  background: #f2f4f6;

  [data-theme='dark'] & {
    background: #1c1a17;
  }

  @media (max-width: 640px) {
    height: 150px;
  }
`;

const CourseImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;

  ${CourseCard}:hover & {
    transform: scale(1.05);
  }
`;

const CourseImagePlaceholder = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: #e5e5e3;

  [data-theme='dark'] & {
    background: #2d2924;
  }
`;

const LocationBadge = styled.span`
  position: absolute;
  top: 14px;
  left: 14px;
  padding: 4px 10px;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #ffffff;
  font-size: ${fontSize.xs};
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const CourseBody = styled.div`
  padding: 14px 20px 16px;
  display: flex;
  flex-direction: column;
  flex: 1;

  @media (max-width: 640px) {
    padding: 12px 16px 14px;
  }
`;

const CourseTitle = styled.h3`
  font-family: var(--font-hanok);
  font-size: ${fontSize.lg};
  font-weight: 700;
  color: #191f28;
  margin: 0 0 4px;
  line-height: 1.4;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }

  @media (max-width: 640px) {
    font-size: 16.5px;
  }
`;

const CourseDesc = styled.p`
  font-size: ${fontSize.sm};
  color: #4e5968;
  line-height: 1.55;
  margin: 0 0 8px;
  flex: 1;

  [data-theme='dark'] & {
    color: #a1a1aa;
  }

  @media (max-width: 640px) {
    font-size: 13.5px;
    margin-bottom: 6px;
  }
`;

const CourseFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 6px;
  border-top: 1px solid #f2f4f6;

  [data-theme='dark'] & {
    border-top-color: rgba(255, 255, 255, 0.08);
  }
`;

const TagList = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

const Tag = styled.span`
  font-size: 11px;
  color: #8b95a1;

  [data-theme='dark'] & {
    color: #71717a;
  }
`;

const ExploreText = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: ${fontSize.xs};
  font-weight: 700;
  color: ${palette.juhong[500]};
`;

/* ── 2. 소리마루 인기 프리뷰 ── */
const SoundGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 6px 4px 12px;
  margin: -6px -4px -12px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const SoundCard = styled(Link)`
  display: flex;
  align-items: center;
  gap: 16px;
  background: #ffffff;
  border-radius: 18px;
  padding: 16px 18px;
  border: none;
  box-shadow: ${ringShadow.light.card};
  text-decoration: none;
  transition: all 0.22s ease;

  [data-theme='dark'] & {
    background: #24211d;
    box-shadow: ${ringShadow.dark.card};
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${ringShadow.light.cardHoverGlow};

    [data-theme='dark'] & {
      box-shadow: ${ringShadow.dark.cardHoverGlow};
    }
  }
`;

const PlayIconWrap = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${palette.juhong[50]};
  color: ${palette.juhong[500]};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;

  [data-theme='dark'] & {
    background: rgba(255, 85, 0, 0.15);
    color: ${palette.juhong[400]};
  }

  ${SoundCard}:hover & {
    background: ${palette.juhong[500]};
    color: #ffffff;
    transform: scale(1.08);
  }
`;

const SoundInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
`;

const SoundTitle = styled.h4`
  font-family: var(--font-hanok);
  font-size: ${fontSize.base};
  font-weight: 700;
  color: #191f28;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }
`;

const SoundMeta = styled.span`
  font-size: ${fontSize.xs};
  color: #8b95a1;

  [data-theme='dark'] & {
    color: #a1a1aa;
  }
`;

/* ── 소리마루 스켈레톤 (AGENTS.md: 로딩은 최종 UI와 동일한 크기를 예약한다) ── */
const SkeletonCard = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  background: #ffffff;
  border-radius: 18px;
  padding: 16px 18px;
  border: none;
  box-shadow: ${ringShadow.light.card};

  [data-theme='dark'] & {
    background: #24211d;
    box-shadow: ${ringShadow.dark.card};
  }
`;

const SkeletonPulse = styled.div`
  @keyframes sk-pulse {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  background: linear-gradient(90deg, #e5e5e3 25%, #d9d9d7 50%, #e5e5e3 75%);
  background-size: 200% 100%;
  animation: sk-pulse 1.5s infinite;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, #2d2924 25%, #38342e 50%, #2d2924 75%);
    background-size: 200% 100%;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: #e5e5e3;

    [data-theme='dark'] & {
      background: #2d2924;
    }
  }
`;

const SkeletonCircle = styled(SkeletonPulse)`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const SkeletonLine = styled(SkeletonPulse)<{ $w?: string; $h?: string }>`
  height: ${({ $h }) => $h ?? '14px'};
  width: ${({ $w }) => $w ?? '100%'};
  border-radius: 6px;
`;

const FeedState = styled.div<{ $compact?: boolean }>`
  grid-column: 1 / -1;
  min-height: ${({ $compact }) => ($compact ? '132px' : '242px')};
  display: grid;
  place-items: center;
  padding: 20px;
  border: 1px dashed #d9d9d7;
  border-radius: 20px;
  background: #f8f8f7;
  text-align: center;

  [data-theme='dark'] & {
    border-color: #4a453f;
    background: #24211d;
  }
`;

const Mate = styled.div`
  position: relative;
  width: 48px;
  height: 38px;
  margin: 0 auto 10px;
  border: 2px solid #433d37;
  border-top: none;
  border-radius: 0 0 14px 14px;
  background: #ffffff;

  &::before {
    content: '';
    position: absolute;
    top: -13px;
    left: -6px;
    width: 56px;
    height: 20px;
    border: 2px solid #433d37;
    border-bottom-width: 4px;
    border-radius: 50% 50% 5px 5px;
    background: ${palette.juhong[400]};
  }

  &::after {
    content: '· ᴗ ·';
    position: absolute;
    inset: 9px 0 0;
    color: #433d37;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: -2px;
  }

  [data-theme='dark'] & {
    border-color: #d9d9d7;
    background: #312d28;

    &::before {
      border-color: #d9d9d7;
    }

    &::after {
      color: #f8f8f7;
    }
  }
`;

const FeedStateTitle = styled.p`
  margin: 0;
  color: #191f28;
  font-family: var(--font-hanok);
  font-size: ${fontSize.base};
  font-weight: 700;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }
`;

const FeedStateDescription = styled.p`
  margin: 5px 0 12px;
  color: #6b7684;
  font-size: ${fontSize.sm};

  [data-theme='dark'] & {
    color: #a1a1aa;
  }
`;

const RetryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 0;
  border-radius: 999px;
  padding: 7px 12px;
  background: #ffffff;
  box-shadow: ${ringShadow.light.button};
  color: ${palette.juhong[600]};
  cursor: pointer;
  font-size: ${fontSize.xs};
  font-weight: 700;

  [data-theme='dark'] & {
    background: #312d28;
    box-shadow: ${ringShadow.dark.button};
    color: ${palette.juhong[400]};
  }
`;

function HomeFeedFailure({
  compact = false,
  unavailable = false,
  onRetry,
}: {
  compact?: boolean;
  unavailable?: boolean;
  onRetry: () => void;
}) {
  return (
    <FeedState $compact={compact} role="status" aria-live="polite">
      <div>
        <Mate aria-hidden="true" />
        <FeedStateTitle>{unavailable ? '온마루가 소식을 모으고 있어요' : '잠시 길을 잃었어요'}</FeedStateTitle>
        <FeedStateDescription>
          {unavailable ? '새로운 이야기를 준비 중이에요. 잠시 후 다시 찾아올게요.' : '연결을 다시 확인해 볼까요?'}
        </FeedStateDescription>
        <RetryButton type="button" onClick={onRetry}>
          <RotateCcw size={13} />
          다시 불러오기
        </RetryButton>
      </div>
    </FeedState>
  );
}

/* ── 3. 지역별 한옥 퀵 탐색 ── */
const RegionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  padding: 6px 4px 10px;
  margin: -6px -4px -10px;

  @media (max-width: 960px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 540px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const RegionCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 18px 12px;
  background: #ffffff;
  border-radius: 16px;
  border: none;
  cursor: pointer;
  box-shadow: ${ringShadow.light.button};
  transition: all 0.2s ease;
  text-align: center;
  gap: 6px;

  [data-theme='dark'] & {
    background: #24211d;
    box-shadow: ${ringShadow.dark.button};
  }

  &:hover {
    transform: translateY(-2px);
    background: ${palette.juhong[50]};
    box-shadow: ${ringShadow.light.buttonHoverGlow};

    [data-theme='dark'] & {
      background: rgba(255, 85, 0, 0.12);
      box-shadow: ${ringShadow.dark.buttonHoverGlow};
    }
  }

  &:active {
    transform: scale(0.97);
  }
`;

const RegionName = styled.span`
  font-family: var(--font-hanok);
  font-size: ${fontSize.base};
  font-weight: 700;
  color: #191f28;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }

  ${RegionCard}:hover & {
    color: ${palette.juhong[600]};

    [data-theme='dark'] & {
      color: ${palette.juhong[400]};
    }
  }
`;

const RegionSub = styled.span`
  font-size: 11px;
  color: #8b95a1;

  [data-theme='dark'] & {
    color: #71717a;
  }
`;

export default function JourneyDiscoveryFeed() {
  const setQuery = useJourneyStore((s) => s.setQuery);
  const submitSearch = useJourneyStore((s) => s.submitSearch);
  const { data: courses, loading: coursesLoading, failed: coursesFailed, unavailable: coursesUnavailable, retry: retryCourses } = useCuratedCourses();
  const { data: trendingSounds, loading: soundsLoading, failed: soundsFailed, unavailable: soundsUnavailable, retry: retrySounds } = useTrendingSounds();
  const { data: popularRegions, loading: regionsLoading, failed: regionsFailed, unavailable: regionsUnavailable, retry: retryRegions } = usePopularRegions();
  const featuredCourses = courses.slice(0, 7);
  const courseViewportRef = useRef<HTMLDivElement>(null);
  const [visibleCourseCount, setVisibleCourseCount] = useState(3);
  const [activeCourseIndex, setActiveCourseIndex] = useState(0);

  const handleSelectCourse = (query: string) => {
    setQuery(query);
    submitSearch(query);
  };

  useEffect(() => {
    const updateVisibleCourseCount = () => {
      setVisibleCourseCount(window.innerWidth <= 640 ? 1 : window.innerWidth <= 1024 ? 2 : 3);
    };
    updateVisibleCourseCount();
    window.addEventListener('resize', updateVisibleCourseCount);
    return () => window.removeEventListener('resize', updateVisibleCourseCount);
  }, []);

  const maxCourseIndex = Math.max(0, featuredCourses.length - visibleCourseCount);
  const currentCourseIndex = Math.min(activeCourseIndex, maxCourseIndex);

  useEffect(() => {
    const viewport = courseViewportRef.current;
    if (!viewport) return;

    const updateActiveCourseIndex = () => {
      const firstCard = viewport.querySelector<HTMLElement>('[data-course-card]');
      const secondCard = viewport.querySelector<HTMLElement>('[data-course-card]:nth-child(2)');
      const step = firstCard && secondCard ? secondCard.offsetLeft - firstCard.offsetLeft : firstCard?.offsetWidth ?? 0;
      if (step > 0) {
        setActiveCourseIndex(Math.min(maxCourseIndex, Math.round(viewport.scrollLeft / step)));
      }
    };

    viewport.addEventListener('scroll', updateActiveCourseIndex, { passive: true });
    return () => viewport.removeEventListener('scroll', updateActiveCourseIndex);
  }, [maxCourseIndex]);

  const moveCourseCarousel = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, maxCourseIndex));
    const viewport = courseViewportRef.current;
    const firstCard = viewport?.querySelector<HTMLElement>('[data-course-card]');
    const secondCard = viewport?.querySelector<HTMLElement>('[data-course-card]:nth-child(2)');
    const step = firstCard && secondCard ? secondCard.offsetLeft - firstCard.offsetLeft : firstCard?.offsetWidth ?? 0;

    setActiveCourseIndex(nextIndex);
    viewport?.scrollTo({ left: step * nextIndex, behavior: 'smooth' });
  };

  const renderCourseCard = (course: (typeof featuredCourses)[number], key: string) => (
    <CourseCard
      key={key}
      data-course-card
      onClick={() => handleSelectCourse(`${course.regionName} ${course.name}`)}
    >
      <CourseImageWrap>
        {course.thumbnailUrl ? (
          <>
            <CourseImage
              src={course.thumbnailUrl}
              alt={course.name}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
            <CourseImagePlaceholder aria-label={`${course.name} 이미지 없음`} role="img" />
          </>
        ) : (
          <CourseImagePlaceholder aria-label={`${course.name} 이미지 없음`} role="img" />
        )}
        <LocationBadge>
          <MapPin size={14} strokeWidth={2.2} />
          <span>{course.regionName}</span>
        </LocationBadge>
      </CourseImageWrap>
      <CourseBody>
        <CourseTitle>{course.name}</CourseTitle>
        <CourseDesc>{course.summary}</CourseDesc>
        <CourseFooter>
          <TagList>
            <Tag>{course.category}</Tag>
            {course.tags.map((tag) => (
              <Tag key={tag}>#{tag}</Tag>
            ))}
            {course.savedByMe && <Tag>저장됨</Tag>}
          </TagList>
          <ExploreText>
            <span>일정 보기</span>
            <ArrowRight size={12} />
          </ExploreText>
        </CourseFooter>
      </CourseBody>
    </CourseCard>
  );

  return (
    <FeedContainer>
      {/* 1. 에디터 추천 코스 */}
      <section>
        <SectionHeader>
          <SectionTitleGroup>
            <SectionTitle>이번 주 추천 코스</SectionTitle>
            <SectionDescription>정취와 소리가 머무는 장소를 둘러보세요.</SectionDescription>
          </SectionTitleGroup>
        </SectionHeader>

        <CourseGrid>
          {coursesLoading
            ? <CourseSkeletonGrid>
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonCard key={index} aria-hidden="true">
                    <SkeletonLine $h="165px" />
                    <SoundInfo>
                      <SkeletonLine $w="70%" $h="16px" />
                      <SkeletonLine $w="100%" $h="40px" />
                    </SoundInfo>
                  </SkeletonCard>
                ))}
              </CourseSkeletonGrid>
            : coursesFailed ? (
              <HomeFeedFailure unavailable={coursesUnavailable} onRetry={retryCourses} />
            ) : (
              <>
                <CourseViewport ref={courseViewportRef}>
                                <CourseArrow
                                  type="button"
                                  data-direction="prev"
                                  aria-label="이전 추천 코스"
                                  disabled={currentCourseIndex === 0}
                                  onClick={() => moveCourseCarousel(currentCourseIndex - 1)}
                                >
                                  <ArrowLeft size={17} aria-hidden="true" />
                                </CourseArrow>
                  <CourseRail>
                    {featuredCourses.map((course) => renderCourseCard(course, course.placeId))}
                  </CourseRail>
                                <CourseArrow
                                  type="button"
                                  data-direction="next"
                                  aria-label="다음 추천 코스"
                                  disabled={currentCourseIndex >= maxCourseIndex}
                                  onClick={() => moveCourseCarousel(currentCourseIndex + 1)}
                                >
                                  <ArrowRight size={17} aria-hidden="true" />
                                </CourseArrow>
                </CourseViewport>
                {featuredCourses.length > visibleCourseCount && (
                  <CourseIndicators aria-label="추천 코스 위치">
                    {Array.from({ length: maxCourseIndex + 1 }, (_, index) => (
                      <CourseIndicator
                        key={index}
                        type="button"
                        $active={currentCourseIndex === index}
                        aria-label={`${index + 1}번째 추천 코스 보기`}
                        aria-current={currentCourseIndex === index ? 'true' : undefined}
                        onClick={() => moveCourseCarousel(index)}
                      />
                    ))}
                  </CourseIndicators>
                )}
              </>
            )}
        </CourseGrid>
      </section>

      {/* 2. 소리마루 인기 프리뷰 */}
      <section>
          <SectionHeader>
            <SectionTitleGroup>
              <SectionTitle>지금 인기 있는 한옥 소리</SectionTitle>
              <SectionDescription>처마 밑 빗소리와 대청마루 풍경소리를 들어보세요.</SectionDescription>
            </SectionTitleGroup>
          </SectionHeader>

          <SoundGrid>
            {soundsLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} aria-hidden="true">
                  <SkeletonCircle />
                  <SoundInfo>
                    <SkeletonLine $w="70%" $h="16px" />
                    <SkeletonLine $w="50%" $h="12px" />
                  </SoundInfo>
                </SkeletonCard>
              ))
            : soundsFailed ? (
                <HomeFeedFailure compact unavailable={soundsUnavailable} onRetry={retrySounds} />
              ) : trendingSounds.map((sound) => (
                <SoundCard key={sound.storyId} href={`/sorimaru?stid=${encodeURIComponent(sound.storyId)}`}>
                  <PlayIconWrap>
                    <Volume2 size={20} />
                  </PlayIconWrap>
                  <SoundInfo>
                    <SoundTitle>{sound.audioTitle || sound.title}</SoundTitle>
                    <SoundMeta>
                      {[sound.locationName, sound.formattedDuration || sound.playTime].filter(Boolean).join(' · ')}
                    </SoundMeta>
                  </SoundInfo>
                </SoundCard>
              ))}
          </SoundGrid>
      </section>

      {/* 3. 지역별 한옥 퀵 탐색 */}
      <section>
          <SectionHeader>
            <SectionTitleGroup>
              <SectionTitle>인기 지역</SectionTitle>
              <SectionDescription>방문 후기가 많이 쌓인 지역을 둘러보세요.</SectionDescription>
            </SectionTitleGroup>
          </SectionHeader>

          <RegionGrid>
            {regionsLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <SkeletonCard key={index} aria-hidden="true">
                    <SkeletonLine $w="54%" $h="16px" />
                    <SkeletonLine $w="70%" $h="12px" />
                  </SkeletonCard>
                ))
              : regionsFailed ? (
                <HomeFeedFailure compact unavailable={regionsUnavailable} onRetry={retryRegions} />
              )
              : popularRegions.map((region) => (
            <RegionCard key={region.region.regionCode} onClick={() => handleSelectCourse(region.region.name)}>
              <RegionName>{region.region.name}</RegionName>
              <RegionSub>후기 {region.reviewCount}개</RegionSub>
            </RegionCard>
          ))}
        </RegionGrid>
      </section>
    </FeedContainer>
  );
}
