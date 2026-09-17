'use client';

import React, { useState, useMemo, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  MapPin,
  Calendar,
  Compass,
  ArrowRight,
  Headphones,
  CheckCircle2,
  ChevronRight,
  Flame,
  Award,
} from 'lucide-react';
import { meok, palette, lightPalette, surface, fluidHeading, fontSize } from '@/design-system/tokens';
import SectionHeader from '@/features/hanok-archive/components/SectionHeader';
import {
  KCULTURE_CATEGORIES,
  KCULTURE_REGIONS,
  KCULTURE_THEME_ITEMS,
  type KCultureCategoryKey,
  type KCultureRegionKey,
  type KCultureThemeItem,
} from '@/features/hanok-archive/data/kcultureThemes';

const Section = styled.section`
  position: relative;
`;

/* 토스 스타일 부드러운 필터 칩 바 */
const FilterBar = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 12px;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const RegionFilterBar = styled.div`
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 12px;
  margin-bottom: 24px;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const FilterChip = styled.button<{ $active: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 9999px;
  border: none;
  background: ${({ $active }) => ($active ? palette.kobalt[500] : 'rgba(78, 89, 104, 0.05)')};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  font-family: inherit;
  font-size: ${fontSize.sm};
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: ${({ $active }) => ($active ? palette.kobalt[500] : 'rgba(78, 89, 104, 0.1)')};
  }

  [data-theme='dark'] & {
    background: ${({ $active }) => ($active ? palette.kobalt[500] : 'rgba(255, 255, 255, 0.06)')};
    color: ${({ $active }) => ($active ? '#ffffff' : meok[200])};
  }
`;

const RegionChip = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 9999px;
  border: 1px solid ${({ $active }) => ($active ? palette.kobalt[500] : 'rgba(78, 89, 104, 0.15)')};
  background: ${({ $active }) => ($active ? 'rgba(27, 91, 255, 0.08)' : 'transparent')};
  color: ${({ $active }) => ($active ? lightPalette.kobalt[500] : meok[600])};
  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s ease;

  &:hover {
    border-color: ${lightPalette.kobalt[500]};
    color: ${lightPalette.kobalt[500]};
  }

  [data-theme='dark'] & {
    border-color: ${({ $active }) => ($active ? palette.kobalt[400] : 'rgba(255, 255, 255, 0.15)')};
    background: ${({ $active }) => ($active ? 'rgba(77, 130, 255, 0.15)' : 'transparent')};
    color: ${({ $active }) => ($active ? palette.kobalt[400] : meok[300])};
  }
`;

/* 당근 & 토스 스타일 에디토리얼 그리드 */
const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(16px, 2vw, 24px);

  @media (max-width: 840px) {
    grid-template-columns: 1fr;
  }
`;

const ThemeCard = styled(motion.div)`
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  transition: transform 0.22s ease, box-shadow 0.22s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
  }

  [data-theme='dark'] & {
    background: ${surface.dark.card};
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }
`;

const CardImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 220px;
  background: ${meok[200]};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  ${ThemeCard}:hover & img {
    transform: scale(1.04);
  }
`;

const ImageScrim = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 50%);
`;

const BadgeRow = styled.div`
  position: absolute;
  top: 14px;
  left: 14px;
  right: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
`;

const CategoryBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: ${fontSize.xs};
  font-weight: 600;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const SpecialBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: ${fontSize.xs};
  font-weight: 600;
  background: ${palette.hwanggeum[400]};
  color: ${meok[900]};
  box-shadow: 0 2px 8px rgba(255, 184, 0, 0.4);
`;

const ImageLocation = styled.div`
  position: absolute;
  bottom: 12px;
  left: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.9);
  font-size: ${fontSize.xs};
  z-index: 2;
`;

const CardBody = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const Eyebrow = styled.div`
  font-size: ${fontSize.xs};
  font-weight: 600;
  color: ${lightPalette.kobalt[500]};
  margin-bottom: 6px;
  letter-spacing: -0.01em;

  [data-theme='dark'] & {
    color: ${palette.kobalt[400]};
  }
`;

const CardTitle = styled.h3`
  font-family: var(--font-hanok);
  font-size: clamp(17px, 1.6vw, 20px);
  font-weight: 600;
  color: ${meok[900]};
  margin: 0 0 8px;
  line-height: 1.35;
  letter-spacing: -0.02em;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const CardSubtitle = styled.p`
  font-size: ${fontSize.sm};
  color: ${meok[600]};
  margin: 0 0 16px;
  line-height: 1.6;
  flex: 1;

  [data-theme='dark'] & {
    color: ${meok[300]};
  }
`;

const QuoteBox = styled.blockquote`
  margin: 0 0 18px;
  padding: 12px 14px;
  background: rgba(78, 89, 104, 0.04);
  border-left: 3px solid ${lightPalette.kobalt[500]};
  border-radius: 0 10px 10px 0;
  font-size: ${fontSize.xs};
  font-style: italic;
  color: ${meok[700]};
  line-height: 1.55;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.04);
    color: ${meok[300]};
  }
`;

const TagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 18px;
`;

const TagChip = styled.span`
  padding: 4px 10px;
  border-radius: 6px;
  font-size: ${fontSize.micro};
  background: rgba(78, 89, 104, 0.06);
  color: ${meok[600]};
  font-weight: 500;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.06);
    color: ${meok[300]};
  }
`;

/* 1박 2일 코스 미리보기 토글 아코디언 */
const CourseToggleBtn = styled.button<{ $open: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(78, 89, 104, 0.12);
  background: ${({ $open }) => ($open ? 'rgba(78, 89, 104, 0.06)' : 'transparent')};
  color: ${meok[900]};
  font-size: ${fontSize.xs};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  span {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  svg.arrow {
    transform: ${({ $open }) => ($open ? 'rotate(90deg)' : 'rotate(0deg)')};
    transition: transform 0.2s ease;
  }

  &:hover {
    background: rgba(78, 89, 104, 0.06);
  }

  [data-theme='dark'] & {
    border-color: rgba(255, 255, 255, 0.12);
    color: ${meok[100]};
  }
`;

const CourseTimeline = styled(motion.div)`
  margin-top: 12px;
  padding: 14px;
  border-radius: 12px;
  background: rgba(78, 89, 104, 0.03);
  display: flex;
  flex-direction: column;
  gap: 12px;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.03);
  }
`;

const DaySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const DayTitle = styled.div`
  font-size: ${fontSize.xs};
  font-weight: 700;
  color: ${lightPalette.kobalt[500]};

  [data-theme='dark'] & {
    color: ${palette.kobalt[400]};
  }
`;

const DayItem = styled.div`
  font-size: ${fontSize.micro};
  color: ${meok[700]};
  display: flex;
  align-items: flex-start;
  gap: 6px;
  line-height: 1.45;

  [data-theme='dark'] & {
    color: ${meok[300]};
  }
`;

interface KCultureThemeFeedProps {
  onSelectContent?: (contentId: string) => void;
}

export default function KCultureThemeFeed({ onSelectContent }: KCultureThemeFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<KCultureCategoryKey>('all');
  const [selectedRegion, setSelectedRegion] = useState<KCultureRegionKey>('all');
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [liveItems, setLiveItems] = useState<KCultureThemeItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function fetchLiveKCulture() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/tourapi/kculture?category=${selectedCategory}&region=${selectedRegion}`);
        if (!res.ok) throw new Error('API failed');
        const data = await res.json();
        if (!ignore && data?.items && Array.isArray(data.items) && data.items.length > 0) {
          const mapped: KCultureThemeItem[] = data.items.map((it: any) => ({
            id: `live-${it.id}`,
            category: it.category,
            categoryLabel: it.categoryLabel,
            categoryIcon: it.categoryIcon,
            isGyeongbukSpecial: it.region === '경북',
            eyebrow: it.drama || '한국관광공사 TourAPI 4.0 인증 문화유산',
            title: it.title,
            subtitle: `${it.region}의 역사와 정취가 깃든 전통 명소입니다.`,
            contentId: it.id,
            villageName: it.title,
            region: it.region,
            addr: it.addr,
            image: it.image || 'https://tong.visitkorea.or.kr/cms/resource/48/2993048_image2_1.jpg',
            tags: it.tags || ['#TourAPI공공데이터', '#전통문화유산', '#K컬처'],
            coursePreview: it.coursePreview || {
              day1: ['14:00 전통 유적지 산책', '16:30 인근 고택 체크인', '18:30 향토 미식', '20:30 야경 산책'],
              day2: ['08:30 아침 산책 & 다도', '11:00 로컬 명소 탐방'],
            },
          }));
          setLiveItems(mapped);
        }
      } catch {
        // 네트워크 실패 시 정적 큐레이션 폴백 유지
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    fetchLiveKCulture();
    return () => {
      ignore = true;
    };
  }, [selectedCategory, selectedRegion]);

  const displayItems = useMemo(() => {
    let items = liveItems && liveItems.length > 0 ? liveItems : KCULTURE_THEME_ITEMS;
    if (selectedCategory !== 'all') {
      items = items.filter((item) => item.category === selectedCategory);
    }
    if (selectedRegion !== 'all') {
      items = items.filter((item) => item.region === selectedRegion || item.region.includes(selectedRegion) || item.tags.some(t => t.includes(selectedRegion)));
    }
    return items;
  }, [selectedCategory, selectedRegion, liveItems]);

  return (
    <Section aria-labelledby="kculture-heading">
      <SectionHeader
        id="kculture-heading"
        title="전국 K-컬처 테마 큐레이션"
        subtitle="한국관광공사 TourAPI(12:드라마촬영지 · 15:달빛야행축제 · 39:종가미식) 실시간 데이터로 엮어낸 1박 2일 시공간 코스"
      />

      {/* 1. K-컬처 테마 카테고리 탭 (K-드라마 · 달빛 야간기행 · 종가 다도 & 미식) */}
      <FilterBar role="tablist" aria-label="테마 카테고리">
        {KCULTURE_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <FilterChip
              key={cat.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              $active={isActive}
              onClick={() => setSelectedCategory(cat.key)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </FilterChip>
          );
        })}
      </FilterBar>

      {/* 2. 전국 권역/지역 필터 태그 바 */}
      <RegionFilterBar role="tablist" aria-label="전국 지역 필터">
        {KCULTURE_REGIONS.map((reg) => {
          const isActive = selectedRegion === reg.key;
          return (
            <RegionChip
              key={reg.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              $active={isActive}
              onClick={() => setSelectedRegion(reg.key)}
            >
              <span>{reg.label}</span>
            </RegionChip>
          );
        })}
      </RegionFilterBar>

      <CardsGrid>
        <AnimatePresence mode="popLayout">
          {displayItems.map((item) => {
            const isCourseOpen = expandedCourseId === item.id;

            return (
              <ThemeCard
                key={item.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <CardImageContainer>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.title} loading="lazy" />
                  <ImageScrim />

                  <BadgeRow>
                    <CategoryBadge>
                      {item.categoryIcon} {item.categoryLabel}
                    </CategoryBadge>
                    {item.isGyeongbukSpecial && (
                      <SpecialBadge>
                        <Award size={13} /> 경북 헤리티지 특화
                      </SpecialBadge>
                    )}
                  </BadgeRow>

                  <ImageLocation>
                    <MapPin size={13} />
                    <span>
                      {item.region} · {item.villageName}
                    </span>
                  </ImageLocation>
                </CardImageContainer>

                <CardBody>
                  <Eyebrow>{item.eyebrow}</Eyebrow>
                  <CardTitle>{item.title}</CardTitle>
                  <CardSubtitle>{item.subtitle}</CardSubtitle>

                  {item.quote && <QuoteBox>{item.quote}</QuoteBox>}

                  <TagsRow>
                    {item.tags.map((tag, i) => (
                      <TagChip key={i}>{tag}</TagChip>
                    ))}
                  </TagsRow>

                  <CourseToggleBtn
                    type="button"
                    $open={isCourseOpen}
                    onClick={() => setExpandedCourseId(isCourseOpen ? null : item.id)}
                  >
                    <span>
                      <Compass size={14} /> 1박 2일 몰입형 시공간 코스 보기
                    </span>
                    <ChevronRight size={14} className="arrow" />
                  </CourseToggleBtn>

                  <AnimatePresence>
                    {isCourseOpen && (
                      <CourseTimeline
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <DaySection>
                          <DayTitle>DAY 1. 고택의 낮과 밤</DayTitle>
                          {item.coursePreview.day1.map((step, idx) => (
                            <DayItem key={idx}>
                              <CheckCircle2 size={12} color={lightPalette.kobalt[500]} style={{ flexShrink: 0, marginTop: 2 }} />
                              <span>{step}</span>
                            </DayItem>
                          ))}
                        </DaySection>

                        <DaySection>
                          <DayTitle>DAY 2. 아침의 정취와 여정</DayTitle>
                          {item.coursePreview.day2.map((step, idx) => (
                            <DayItem key={idx}>
                              <CheckCircle2 size={12} color={lightPalette.kobalt[500]} style={{ flexShrink: 0, marginTop: 2 }} />
                              <span>{step}</span>
                            </DayItem>
                          ))}
                        </DaySection>
                      </CourseTimeline>
                    )}
                  </AnimatePresence>
                </CardBody>
              </ThemeCard>
            );
          })}
        </AnimatePresence>
      </CardsGrid>
    </Section>
  );
}
