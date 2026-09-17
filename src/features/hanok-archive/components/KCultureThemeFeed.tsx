'use client';

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Compass,
  CheckCircle2,
  ChevronRight,
  Award,
  Clapperboard,
} from 'lucide-react';
import { meok, palette, lightPalette, surface, fontSize } from '@/design-system/tokens';
import SectionHeader from '@/features/hanok-archive/components/SectionHeader';
import type { KCultureThemeItem } from '@/features/hanok-archive/data/kcultureThemes';

const Section = styled.section`
  position: relative;
`;

/* 에디토리얼 그리드 (2열 반응형) */
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
  gap: 5px;
  padding: 6px 13px;
  border-radius: 9999px;
  font-size: ${fontSize.xs};
  font-weight: 600;
  background: rgba(0, 0, 0, 0.7);
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
  color: rgba(255, 255, 255, 0.95);
  font-size: ${fontSize.xs};
  font-weight: 500;
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
  font-weight: 700;
  color: ${lightPalette.kobalt[500]};
  margin-bottom: 6px;
  letter-spacing: -0.01em;

  [data-theme='dark'] & {
    color: ${palette.kobalt[400]};
  }
`;

const CardTitle = styled.h3`
  font-family: var(--font-hanok);
  font-size: clamp(18px, 1.6vw, 21px);
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

/* ── 중립 그레이 스켈레톤 로딩 (AGENTS.md 규칙: 최종 카드와 동일한 형태/크기) ── */
const shimmerAnim = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const SkeletonCard = styled.div`
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);

  [data-theme='dark'] & {
    background: ${surface.dark.card};
    border-color: rgba(255, 255, 255, 0.08);
  }
`;

const SkeletonThumb = styled.div`
  width: 100%;
  height: 220px;
  background: linear-gradient(90deg, #f0f0ee 25%, #e4e4e2 50%, #f0f0ee 75%);
  background-size: 200% 100%;
  animation: ${shimmerAnim} 1.6s infinite ease-in-out;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, #252422 25%, #32302d 50%, #252422 75%);
    background-size: 200% 100%;
  }
`;

const SkeletonBody = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SkeletonBar = styled.div<{ $w: string; $h: string }>`
  width: ${({ $w }) => $w};
  height: ${({ $h }) => $h};
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0ee 25%, #e4e4e2 50%, #f0f0ee 75%);
  background-size: 200% 100%;
  animation: ${shimmerAnim} 1.6s infinite ease-in-out;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, #252422 25%, #32302d 50%, #252422 75%);
    background-size: 200% 100%;
  }
`;

interface KCultureThemeFeedProps {
  onSelectContent?: (contentId: string) => void;
}

export default function KCultureThemeFeed({ onSelectContent }: KCultureThemeFeedProps) {
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [liveItems, setLiveItems] = useState<KCultureThemeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function fetchScreenHanok() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/tourapi/kculture?category=kdrama');
        if (!res.ok) throw new Error('API failed');
        const data = await res.json();
        if (!ignore && data?.items && Array.isArray(data.items) && data.items.length > 0) {
          const mapped: KCultureThemeItem[] = data.items.map((it: any) => ({
            id: `tour-${it.id}`,
            category: 'kdrama',
            categoryLabel: '스크린 속 한옥',
            categoryIcon: '🎬',
            isGyeongbukSpecial: it.region === '경북',
            eyebrow: it.drama || 'K-콘텐츠 & 사극 속 전통 한옥 문화유산',
            title: it.title,
            subtitle: it.subtitle || `${it.region}의 역사와 정취가 깃든 전통 한옥 명소입니다.`,
            contentId: it.id,
            villageName: it.title,
            region: it.region,
            addr: it.addr,
            image: it.image || 'https://tong.visitkorea.or.kr/cms/resource/80/3095780_image2_1.jpg',
            tags: it.tags || ['#드라마촬영지', '#전통한옥', '#문화유산', '#TourAPI'],
            coursePreview: it.coursePreview || {
              day1: ['14:00 촬영 명소 산책', '16:30 인근 고택 체크인', '18:30 향토 미식', '20:30 야경 산책'],
              day2: ['08:30 아침 산책 & 다도', '11:00 로컬 명소 탐방'],
            },
          }));
          setLiveItems(mapped);
        }
      } catch {
        // 목데이터를 쓰지 않고 빈 배열 유지 (사용자 명시적 요청)
        if (!ignore) setLiveItems([]);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    fetchScreenHanok();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <Section aria-labelledby="screen-hanok-heading">
      <SectionHeader
        id="screen-hanok-heading"
        title="스크린 속 한옥"
        subtitle="드라마 · 영화 · K-POP 뮤직비디오의 배경이 된 전국의 아름다운 전통 한옥과 명소 (TourAPI 4.0)"
      />

      <CardsGrid>
        {/* 로딩 중일 때는 동일한 레이아웃 크기의 스켈레톤 4개 표시 */}
        {isLoading && (
          <>
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} aria-hidden="true">
                <SkeletonThumb />
                <SkeletonBody>
                  <SkeletonBar $w="40%" $h="14px" />
                  <SkeletonBar $w="70%" $h="22px" />
                  <SkeletonBar $w="90%" $h="16px" />
                  <SkeletonBar $w="60%" $h="16px" />
                  <SkeletonBar $w="100%" $h="40px" />
                </SkeletonBody>
              </SkeletonCard>
            ))}
          </>
        )}

        {/* API 실시간 데이터 렌더링 (목데이터 없음) */}
        {!isLoading && liveItems.length > 0 && (
          <AnimatePresence mode="popLayout">
            {liveItems.map((item) => {
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
                        <span>{item.categoryIcon}</span> {item.categoryLabel}
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
                            <DayTitle>DAY 1. 스크린 속 한옥의 낮과 밤</DayTitle>
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
        )}
      </CardsGrid>
    </Section>
  );
}
