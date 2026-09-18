'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { Sparkles, Headphones, Compass, MapPin, ArrowRight, Volume2 } from 'lucide-react';
import { palette, meok, fontSize } from '@/design-system/tokens';
import { useJourneyStore } from '../store/useJourneyStore';

const FeedContainer = styled.div`
  width: min(calc(100% - 40px), 1140px);
  max-width: 1140px;
  margin: 0 auto;
  padding: 24px 0 80px;
  display: flex;
  flex-direction: column;
  gap: 48px;

  @media (max-width: 1024px) {
    width: calc(100% - 28px);
    padding-bottom: 60px;
    gap: 40px;
  }

  @media (max-width: 640px) {
    width: calc(100% - 24px);
    gap: 32px;
  }
`;

const SectionDivider = styled.hr`
  border: none;
  height: 1px;
  width: 100%;
  margin: 0;
  background: rgba(0, 0, 0, 0.07);

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const SectionTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SectionBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: ${fontSize.xs};
  font-weight: 700;
  color: ${palette.juhong[500]};
  letter-spacing: 0.02em;
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

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
    gap: 16px;
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
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;

  [data-theme='dark'] & {
    background: #24211d;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.10);

    [data-theme='dark'] & {
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.50);
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

/* ── 2. 소리마루 인기 ASMR 프리뷰 ── */
const SoundGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 840px) {
    grid-template-columns: 1fr;
  }
`;

const SoundCard = styled(Link)`
  display: flex;
  align-items: center;
  gap: 16px;
  background: #ffffff;
  border-radius: 18px;
  padding: 16px 18px;
  box-shadow: 0 3px 16px rgba(0, 0, 0, 0.04);
  text-decoration: none;
  transition: all 0.22s ease;

  [data-theme='dark'] & {
    background: #24211d;
    box-shadow: 0 3px 16px rgba(0, 0, 0, 0.3);
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);

    [data-theme='dark'] & {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
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
  box-shadow: 0 3px 16px rgba(0, 0, 0, 0.04);

  [data-theme='dark'] & {
    background: #24211d;
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
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  text-align: center;
  gap: 6px;

  [data-theme='dark'] & {
    background: #24211d;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
  }

  &:hover {
    transform: translateY(-2px);
    background: ${palette.juhong[50]};

    [data-theme='dark'] & {
      background: rgba(255, 85, 0, 0.12);
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

const RECOMMENDED_COURSES = [
  {
    id: 'course-seochon',
    badge: '서울 종로',
    title: '비 내리는 서촌 골목길과 한옥 찻집',
    description: '인왕산 자락 아래 빗소리와 툇마루에서 즐기는 따뜻한 차 한 잔',
    image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
    query: '비 오는 날 걷기 좋은 고즈넉한 서울 서촌 한옥길',
    tags: ['#서촌', '#상촌재', '#골목산책'],
  },
  {
    id: 'course-bukchon',
    badge: '서울 북촌',
    title: '북촌 100년 고택에서 즐기는 고즈넉한 쉼',
    description: '백인제가옥부터 삼청동 돌담길까지 이어지는 감성 시간 여행',
    image: 'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?auto=format&fit=crop&w=800&q=80',
    query: '북촌 백인제가옥과 삼청동 돌담길 고즈넉한 쉼',
    tags: ['#북촌', '#백인제가옥', '#전통마루'],
  },
  {
    id: 'course-jeonju',
    badge: '전북 전주',
    title: '달빛 아래 전주 한옥마을과 남부시장',
    description: '은은한 한지 등불 골목과 정겨운 야시장 먹거리의 정취',
    image: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=800&q=80',
    query: '전주 한옥마을과 남부시장 정겨운 야경 여정',
    tags: ['#전주한옥마을', '#경기전', '#남부시장'],
  },
];

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

/** VisitorService 오류 또는 소리마루 API 미매핑 시 표시할 폴백 */
const FALLBACK_SOUNDS: TrendingSound[] = [
  {
    id: 'sound-gangneung',
    title: '처마 밑 낙숫물 빗소리',
    location: '강릉 선교장 활래정',
    duration: '3분 45초',
    href: '/sorimaru?keyword=%EC%84%A0%EA%B5%90%EC%9E%A5&autoPlay=true',
    regionName: '강릉',
    rank: 1,
  },
  {
    id: 'sound-andong',
    title: '안채 대청마루 풍경소리',
    location: '안동 하회마을 양진당',
    duration: '2분 30초',
    href: '/sorimaru?keyword=%ED%95%98%ED%9A%8C%EB%A7%88%EC%9D%84&autoPlay=true',
    regionName: '안동',
    rank: 2,
  },
  {
    id: 'sound-gyeongju',
    title: '새벽 숲속 산사 종소리',
    location: '경주 교촌마을 & 월정교',
    duration: '4분 12초',
    href: '/sorimaru?keyword=%EA%B5%90%EC%B4%8C%EB%A7%88%EC%9D%84&autoPlay=true',
    regionName: '경주',
    rank: 3,
  },
];

/** 실시간 인기 지역 소리마루 트랙을 가져온다. 오류 시 폴백 배열 반환. */
function useTrendingSounds(): { sounds: TrendingSound[]; loading: boolean } {
  const [sounds, setSounds] = useState<TrendingSound[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/home/trending-sounds')
      .then((r) => r.json())
      .then((data: { sounds: TrendingSound[] }) => {
        if (cancelled) return;
        setSounds(data.sounds?.length ? data.sounds : FALLBACK_SOUNDS);
      })
      .catch(() => {
        if (!cancelled) setSounds(FALLBACK_SOUNDS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { sounds, loading };
}

const POPULAR_REGIONS = [
  { name: '서울', sub: '북촌 · 서촌 · 익선동', query: '서울 고즈넉한 한옥길' },
  { name: '안동', sub: '하회마을 · 도산서원', query: '안동 하회마을 고택 쉼' },
  { name: '전주', sub: '한옥마을 · 경기전', query: '전주 한옥마을 맛과 멋' },
  { name: '경주', sub: '교촌마을 · 양동마을', query: '경주 교촌마을과 고분 산책' },
  { name: '강릉', sub: '선교장 · 오죽헌', query: '강릉 선교장 정원 힐링' },
  { name: '제주', sub: '성읍민속마을 · 돌담집', query: '제주 돌담 한옥과 쉼' },
];

export default function JourneyDiscoveryFeed() {
  const setQuery = useJourneyStore((s) => s.setQuery);
  const submitSearch = useJourneyStore((s) => s.submitSearch);
  const { sounds: trendingSounds, loading: soundsLoading } = useTrendingSounds();

  const handleSelectCourse = (query: string) => {
    setQuery(query);
    submitSearch(query);
  };

  return (
    <FeedContainer>
      {/* 1. 에디터 추천 코스 */}
      <section>
        <SectionHeader>
          <SectionTitleGroup>
            <SectionBadge>
              <Sparkles size={14} />
              <span>에디터 큐레이션</span>
            </SectionBadge>
            <SectionTitle>이번 주 추천 한옥 코스</SectionTitle>
            <SectionDescription>이야기와 소리가 머무는 특별한 한옥 여행지 3곳을 만나보세요.</SectionDescription>
          </SectionTitleGroup>
        </SectionHeader>

        <CourseGrid>
          {RECOMMENDED_COURSES.map((course) => (
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
                    <span>코스 보기</span>
                    <ArrowRight size={12} />
                  </ExploreText>
                </CourseFooter>
              </CourseBody>
            </CourseCard>
          ))}
        </CourseGrid>
      </section>

      {/* 구분선 1 */}
      <SectionDivider />

      {/* 2. 소리마루 인기 ASMR 프리뷰 */}
      <section>
        <SectionHeader>
          <SectionTitleGroup>
            <SectionBadge>
              <Headphones size={14} />
              <span>소리로 떠나는 여행</span>
            </SectionBadge>
            <SectionTitle>지금 많이 듣는 소리마루</SectionTitle>
            <SectionDescription>실제 한옥 현장에서 채집한 힐링 자연음과 해설을 감상해보세요.</SectionDescription>
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
            : trendingSounds.map((sound) => (
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

      {/* 구분선 2 */}
      <SectionDivider />

      {/* 3. 지역별 한옥 퀵 탐색 */}
      <section>
        <SectionHeader>
          <SectionTitleGroup>
            <SectionBadge>
              <Compass size={14} />
              <span>지역별 둘러보기</span>
            </SectionBadge>
            <SectionTitle>전국 한옥 명소 퀵 브라우징</SectionTitle>
            <SectionDescription>가고 싶은 지역을 선택하면 맞춤형 여정 코스를 바로 추천해 드립니다.</SectionDescription>
          </SectionTitleGroup>
        </SectionHeader>

        <RegionGrid>
          {POPULAR_REGIONS.map((region) => (
            <RegionCard key={region.name} onClick={() => handleSelectCourse(region.query)}>
              <RegionName>{region.name}</RegionName>
              <RegionSub>{region.sub}</RegionSub>
            </RegionCard>
          ))}
        </RegionGrid>
      </section>
    </FeedContainer>
  );
}
