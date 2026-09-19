'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { MapPin, ArrowRight, Volume2 } from 'lucide-react';
import { palette, meok, fontSize, ringShadow } from '@/design-system/tokens';
import { useJourneyStore } from '../store/useJourneyStore';

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

/* ── 1. 에디터 추천 코스 (3선 카드 덱) ── */
const CourseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 6px 4px 14px;
  margin: -6px -4px -14px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 14px;
  }
`;

const CourseCard = styled.button`
  text-align: left;
  display: flex;
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
`;

const CourseImageWrap = styled.div`
  position: relative;
  width: 100%;
  height: 190px;
  overflow: hidden;
  background: #f2f4f6;

  [data-theme='dark'] & {
    background: #1c1a17;
  }

  @media (max-width: 640px) {
    height: 170px;
  }
`;

const CourseImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;

  ${CourseCard}:hover & {
    transform: scale(1.05);
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
  padding: 18px 20px 20px;
  display: flex;
  flex-direction: column;
  flex: 1;

  @media (max-width: 640px) {
    padding: 16px;
  }
`;

const CourseTitle = styled.h3`
  font-family: var(--font-hanok);
  font-size: ${fontSize.lg};
  font-weight: 700;
  color: #191f28;
  margin: 0 0 8px;
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
  margin: 0 0 16px;
  flex: 1;

  [data-theme='dark'] & {
    color: #a1a1aa;
  }

  @media (max-width: 640px) {
    font-size: 13.5px;
    margin-bottom: 12px;
  }
`;

const CourseFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #f2f4f6;

  [data-theme='dark'] & {
    border-top-color: rgba(255, 255, 255, 0.08);
  }
`;

const TagList = styled.div`
  display: flex;
  gap: 6px;
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



interface RecommendedCourse {
  id: string;
  badge: string;
  title: string;
  description: string;
  image: string;
  query: string;
  tags: string[];
}

/** 백엔드 /hanoks 실데이터를 코스 카드로 매핑. 썸네일 없는 항목은 제외. */
interface SectionMetadata<T> {
  title: string;
  description: string;
  items: T[];
}

function useRecommendedCourses(): { data: SectionMetadata<RecommendedCourse> | null; loading: boolean } {
  const [data, setData] = useState<SectionMetadata<RecommendedCourse> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/home/recommended-courses')
      .then((r) => r.json())
      .then((res: { title: string; description: string; courses: RecommendedCourse[] }) => {
        if (cancelled) return;
        setData({ title: res.title, description: res.description, items: res.courses ?? [] });
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading };
}

/** /api/home/trending-sounds 반환 스키마 */
interface TrendingSound {
  id: string;
  title: string;
  location: string;
  duration: string;
  href: string;
  regionName: string;
  rank: number;
}



/** 실시간 인기 지역 소리마루 트랙을 가져온다. 오류 시 폴백 배열 반환. */
function useTrendingSounds(): { data: SectionMetadata<TrendingSound> | null; loading: boolean } {
  const [data, setData] = useState<SectionMetadata<TrendingSound> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/home/trending-sounds')
      .then((r) => r.json())
      .then((res: { title: string; description: string; sounds: TrendingSound[] }) => {
        if (cancelled) return;
        setData({ title: res.title, description: res.description, items: res.sounds ?? [] });
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { data, loading };
}

interface PopularRegion {
  name: string;
  sub: string;
  query: string;
}

function usePopularRegions(): { data: SectionMetadata<PopularRegion> | null; loading: boolean } {
  const [data, setData] = useState<SectionMetadata<PopularRegion> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/home/popular-regions')
      .then((r) => r.json())
      .then((res: { title: string; description: string; regions: PopularRegion[] }) => {
        if (cancelled) return;
        setData({ title: res.title, description: res.description, items: res.regions ?? [] });
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { data, loading };
}

export default function JourneyDiscoveryFeed() {
  const setQuery = useJourneyStore((s) => s.setQuery);
  const submitSearch = useJourneyStore((s) => s.submitSearch);
  const { data: trendingSounds, loading: soundsLoading } = useTrendingSounds();
  const { data: recommendedCourses } = useRecommendedCourses();
  const { data: popularRegions } = usePopularRegions();

  const handleSelectCourse = (query: string) => {
    setQuery(query);
    submitSearch(query);
  };

  return (
    <FeedContainer>
      {/* 1. 에디터 추천 코스 */}
      {recommendedCourses && (
        <section>
          <SectionHeader>
            <SectionTitleGroup>
              <SectionTitle>{recommendedCourses.title}</SectionTitle>
              <SectionDescription>{recommendedCourses.description}</SectionDescription>
            </SectionTitleGroup>
          </SectionHeader>

          <CourseGrid>
            {recommendedCourses.items.map((course) => (
            <CourseCard key={course.id} onClick={() => handleSelectCourse(course.query)}>
              <CourseImageWrap>
                <CourseImage src={course.image} alt={course.title} loading="lazy" />
                <LocationBadge>
                  <MapPin size={11} />
                  <span>{course.badge}</span>
                </LocationBadge>
              </CourseImageWrap>
              <CourseBody>
                <CourseTitle>{course.title}</CourseTitle>
                <CourseDesc>{course.description}</CourseDesc>
                <CourseFooter>
                  <TagList>
                    {course.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </TagList>
                  <ExploreText>
                    <span>일정 보기</span>
                    <ArrowRight size={12} />
                  </ExploreText>
                </CourseFooter>
              </CourseBody>
            </CourseCard>
          ))}
        </CourseGrid>
      </section>
      )}

      {/* 2. 소리마루 인기 프리뷰 */}
      {(trendingSounds || soundsLoading) && (
        <section>
          <SectionHeader>
            <SectionTitleGroup>
              <SectionTitle>{trendingSounds?.title || '지금 인기 있는 한옥 소리'}</SectionTitle>
              <SectionDescription>{trendingSounds?.description || '처마 밑 빗소리와 대청마루 풍경소리를 들어보세요.'}</SectionDescription>
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
            : trendingSounds?.items.map((sound) => (
                <SoundCard key={sound.id} href={sound.href}>
                  <PlayIconWrap>
                    <Volume2 size={20} />
                  </PlayIconWrap>
                  <SoundInfo>
                    <SoundTitle>{sound.title}</SoundTitle>
                    <SoundMeta>
                      {sound.location} · {sound.duration}
                    </SoundMeta>
                  </SoundInfo>
                </SoundCard>
              ))}
          </SoundGrid>
        </section>
      )}

      {/* 3. 지역별 한옥 퀵 탐색 */}
      {popularRegions && (
        <section>
          <SectionHeader>
            <SectionTitleGroup>
              <SectionTitle>{popularRegions.title}</SectionTitle>
              <SectionDescription>{popularRegions.description}</SectionDescription>
            </SectionTitleGroup>
          </SectionHeader>

          <RegionGrid>
            {popularRegions.items.map((region) => (
            <RegionCard key={region.name} onClick={() => handleSelectCourse(region.query)}>
              <RegionName>{region.name}</RegionName>
              <RegionSub>{region.sub}</RegionSub>
            </RegionCard>
          ))}
        </RegionGrid>
      </section>
      )}
    </FeedContainer>
  );
}
