'use client';

import React, { useState, useRef } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Clapperboard,
  Tv,
  Music2,
  Sparkles,
  Heart,
  ExternalLink,
} from 'lucide-react';
import { meok, lightPalette, fontSize } from '@/design-system/tokens';
import SectionHeader from '@/features/hanok-archive/components/SectionHeader';
import { useKCultureThemes } from '@/features/hanok-archive/hooks/useKCultureThemes';
import type { ScreenHanokItem, ScreenHanokMediaType } from '@/features/hanok-archive/services/screenHanok.service';

const Section = styled.section`
  position: relative;
`;

/* 영화 · 드라마 · K-POP 선택 칩 */
const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 4px 0 20px;
`;

const FilterChip = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 9999px;
  border: 1px solid ${({ $active }) => ($active ? lightPalette.juhong[500] : 'rgba(78, 89, 104, 0.16)')};
  background: ${({ $active }) => ($active ? lightPalette.juhong[500] : 'transparent')};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  font-size: ${fontSize.sm};
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;

  &:hover {
    border-color: ${lightPalette.juhong[500]};
  }

  [data-theme='dark'] & {
    color: ${({ $active }) => ($active ? '#ffffff' : meok[300])};
  }
`;

const EmptyFilterNote = styled.p`
  padding: 32px 0;
  text-align: center;
  font-size: ${fontSize.sm};
  color: ${meok[500]};
`;

/* 가로 스크롤 필름스트립 — 포스터 카드를 옆으로 넘겨 본다 */
const FilmStrip = styled.div<{ $dragging: boolean }>`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 4px 4px 16px;
  scroll-snap-type: ${({ $dragging }) => ($dragging ? 'none' : 'x mandatory')};
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  cursor: ${({ $dragging }) => ($dragging ? 'grabbing' : 'grab')};
  user-select: none;
  mask-image: linear-gradient(to right, transparent 0, black 24px, black calc(100% - 24px), transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0, black 24px, black calc(100% - 24px), transparent 100%);
  &::-webkit-scrollbar {
    display: none;
  }

  img {
    -webkit-user-drag: none;
    pointer-events: none;
  }
`;

const PosterCard = styled(motion.article)`
  position: relative;
  flex: 0 0 auto;
  width: clamp(200px, 24vw, 250px);
  aspect-ratio: 3 / 4.4;
  scroll-snap-align: start;
  border-radius: 18px;
  overflow: hidden;
  background: ${meok[200]};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &:hover img {
    transform: scale(1.05);
  }
`;

const PosterScrim = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.92) 0%, rgba(0, 0, 0, 0.5) 45%, rgba(0, 0, 0, 0.15) 75%);
`;

const TopActions = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 3;
`;

const CategoryBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  color: #ffffff;
  font-size: ${fontSize.micro};
  font-weight: 600;
  letter-spacing: -0.01em;
`;

const HeartButton = styled.button<{ $saved: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  color: ${({ $saved }) => ($saved ? '#ef4444' : '#ffffff')};
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease, color 0.18s ease;

  &:hover {
    transform: scale(1.12);
    background: rgba(0, 0, 0, 0.75);
  }

  &:active {
    transform: scale(0.92);
  }
`;

const PosterMeta = styled.div`
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 14px;
  z-index: 2;
`;

const WorkEyebrow = styled.p`
  margin: 0 0 2px;
  font-size: ${fontSize.micro};
  font-weight: 700;
  color: ${lightPalette.juhong[400]};
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const PlaceName = styled.h3`
  font-family: var(--font-hanok);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
  margin: 0 0 4px;
  letter-spacing: -0.01em;
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const RegionText = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: ${fontSize.micro};
  font-weight: 500;
  color: rgba(255, 255, 255, 0.82);
  margin-bottom: 6px;
`;

const Subtitle = styled.p`
  margin: 0 0 8px;
  font-size: 11.5px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.88);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
`;

const TagChip = styled.span`
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
`;

const SourceLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;
  transition: color 0.15s ease;
  max-width: 100%;

  span {
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    color: #ffffff;
    text-decoration: underline;
  }
`;

/* ── 중립 그레이 스켈레톤 로딩 (AGENTS.md 규칙: 최종 카드와 동일한 형태/크기) ── */
const shimmerAnim = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const SkeletonPoster = styled.div`
  flex: 0 0 auto;
  width: clamp(200px, 24vw, 250px);
  aspect-ratio: 3 / 4.4;
  border-radius: 18px;
  background: linear-gradient(90deg, #f0f0ee 25%, #e4e4e2 50%, #f0f0ee 75%);
  background-size: 200% 100%;
  animation: ${shimmerAnim} 1.6s infinite ease-in-out;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, #252422 25%, #32302d 50%, #252422 75%);
    background-size: 200% 100%;
  }
`;

const MEDIA_FILTERS: { key: 'all' | ScreenHanokMediaType; label: string; icon: typeof Tv }[] = [
  { key: 'all', label: '전체', icon: Sparkles },
  { key: 'K_DRAMA', label: '드라마', icon: Tv },
  { key: 'CINEMA', label: '영화', icon: Clapperboard },
  { key: 'KPOP', label: 'K-POP', icon: Music2 },
];

export interface KCultureThemeFeedProps {
  onSelectPlace?: (item: ScreenHanokItem) => void;
}

export default function KCultureThemeFeed({ onSelectPlace }: KCultureThemeFeedProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | ScreenHanokMediaType>('all');
  const { items, isLoading, toggleSave } = useKCultureThemes({
    mediaType: activeFilter === 'all' ? undefined : activeFilter,
  });
  const [isDragging, setIsDragging] = useState(false);

  const filmStripRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({ startX: 0, startScrollLeft: 0 });

  const handleDragStart = (event: React.MouseEvent) => {
    const el = filmStripRef.current;
    if (!el) return;
    dragRef.current = { startX: event.pageX, startScrollLeft: el.scrollLeft };
    setIsDragging(true);
  };

  const handleDragMove = (event: React.MouseEvent) => {
    const el = filmStripRef.current;
    if (!el || !isDragging) return;
    el.scrollLeft = dragRef.current.startScrollLeft - (event.pageX - dragRef.current.startX);
  };

  const handleDragEnd = () => setIsDragging(false);

  return (
    <Section aria-labelledby="screen-hanok-heading">
      <SectionHeader
        id="screen-hanok-heading"
        title="스크린 속 한옥"
      />

      <FilterRow role="group" aria-label="K-콘텐츠 유형 선택">
        {MEDIA_FILTERS.map(({ key, label, icon: Icon }) => (
          <FilterChip
            key={key}
            type="button"
            $active={activeFilter === key}
            aria-pressed={activeFilter === key}
            onClick={() => setActiveFilter(key)}
          >
            <Icon size={14} /> {label}
          </FilterChip>
        ))}
      </FilterRow>

      <FilmStrip
        ref={filmStripRef}
        $dragging={isDragging}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {isLoading &&
          [1, 2, 3, 4, 5, 6].map((i) => <SkeletonPoster key={i} aria-hidden="true" />)}

        {!isLoading && (
          <AnimatePresence mode="popLayout">
            {items.map((item) => {
              const fallbackImage =
                item.imageUrl ||
                'https://tong.visitkorea.or.kr/cms/resource/80/3095780_image2_1.jpg';

              return (
                <PosterCard
                  key={item.placeId}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                  onClick={() => onSelectPlace?.(item)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fallbackImage} alt={`${item.workTitle} - ${item.name}`} loading="lazy" />
                  <PosterScrim />

                  <TopActions>
                    <CategoryBadge>
                      <span>{item.categoryIcon}</span>
                      <span>{item.categoryLabel}</span>
                    </CategoryBadge>

                    <HeartButton
                      type="button"
                      aria-label="장소 찜하기"
                      $saved={item.savedByMe}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSave(item.placeId);
                      }}
                    >
                      <Heart
                        size={16}
                        fill={item.savedByMe ? '#ef4444' : 'none'}
                        strokeWidth={item.savedByMe ? 0 : 2}
                      />
                    </HeartButton>
                  </TopActions>

                  <PosterMeta>
                    <WorkEyebrow>{item.workTitle}</WorkEyebrow>
                    <PlaceName>{item.name}</PlaceName>
                    <RegionText>
                      <MapPin size={11} strokeWidth={2} />
                      {item.region}
                    </RegionText>
                    <Subtitle>{item.subtitle}</Subtitle>

                    {item.tags && item.tags.length > 0 && (
                      <TagRow>
                        {item.tags.slice(0, 3).map((tag, idx) => (
                          <TagChip key={idx}>{tag}</TagChip>
                        ))}
                      </TagRow>
                    )}

                    {item.sourceUrl && (
                      <SourceLink
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={10} />
                        <span>출처: {item.sourceTitle || '관련 보도 자료'}</span>
                      </SourceLink>
                    )}
                  </PosterMeta>
                </PosterCard>
              );
            })}
          </AnimatePresence>
        )}

        {!isLoading && items.length === 0 && (
          <EmptyFilterNote>선택한 유형의 콘텐츠가 아직 없어요. 다른 카테고리를 골라보세요.</EmptyFilterNote>
        )}
      </FilmStrip>
    </Section>
  );
}
