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
} from 'lucide-react';
import { meok, lightPalette, fontSize } from '@/design-system/tokens';
import SectionHeader from '@/features/hanok-archive/components/SectionHeader';
import { KCULTURE_THEME_ITEMS } from '@/features/hanok-archive/data/kcultureThemes';
import { useKCultureThemes } from '@/features/hanok-archive/hooks/useKCultureThemes';

// 이 섹션은 "스크린 속 한옥"(영화·드라마·K-POP)만 다룬다 — 달빛기행·다도 같은
// 다른 큐레이션 테마는 여기 섞지 않는다.
const CURATED_SCREEN_ITEMS = KCULTURE_THEME_ITEMS.filter((item) => item.category === 'kdrama');

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
  gap: 14px;
  overflow-x: auto;
  padding: 4px 4px 12px;
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

/* 정보는 항상 보이게 두고, 호버 때 살짝 들리는 스프링 모션만 얹는다 (토스류 탄력) */
const PosterCard = styled(motion.div)`
  position: relative;
  flex: 0 0 auto;
  width: clamp(148px, 19vw, 192px);
  aspect-ratio: 2 / 3;
  scroll-snap-align: start;
  border-radius: 16px;
  overflow: hidden;
  background: ${meok[200]};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

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
  background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.05) 45%, rgba(0, 0, 0, 0) 65%);
`;

const PosterEyebrow = styled.p`
  margin: 0 0 3px;
  font-size: ${fontSize.micro};
  font-weight: 700;
  color: ${lightPalette.juhong[400]};
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const MediaBadge = styled.span`
  position: absolute;
  top: 10px;
  left: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  color: #ffffff;
  z-index: 2;
`;

const PosterMeta = styled.div`
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 2;
`;

const PosterTitle = styled.h3`
  font-family: var(--font-hanok);
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.32;
  margin: 0 0 4px;
  letter-spacing: -0.01em;
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const PosterRegion = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: ${fontSize.micro};
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
`;

/* ── 중립 그레이 스켈레톤 로딩 (AGENTS.md 규칙: 최종 카드와 동일한 형태/크기) ── */
const shimmerAnim = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const SkeletonPoster = styled.div`
  flex: 0 0 auto;
  width: clamp(148px, 19vw, 192px);
  aspect-ratio: 2 / 3;
  border-radius: 16px;
  background: linear-gradient(90deg, #f0f0ee 25%, #e4e4e2 50%, #f0f0ee 75%);
  background-size: 200% 100%;
  animation: ${shimmerAnim} 1.6s infinite ease-in-out;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, #252422 25%, #32302d 50%, #252422 75%);
    background-size: 200% 100%;
  }
`;

type MediaType = 'drama' | 'movie' | 'mv';

const MEDIA_ICONS: Record<MediaType, typeof Tv> = {
  movie: Clapperboard,
  drama: Tv,
  mv: Music2,
};

const MEDIA_FILTERS: { key: 'all' | MediaType; label: string; icon: typeof Tv }[] = [
  { key: 'all', label: '전체', icon: Sparkles },
  { key: 'movie', label: '영화', icon: Clapperboard },
  { key: 'drama', label: '드라마', icon: Tv },
  { key: 'mv', label: 'K-POP', icon: Music2 },
];

export default function KCultureThemeFeed() {
  const { items: liveItems, isLoading } = useKCultureThemes();
  const [mediaFilter, setMediaFilter] = useState<'all' | MediaType>('all');
  const [isDragging, setIsDragging] = useState(false);

  // overflow-x: auto는 트랙패드 제스처에만 반응한다 — 마우스로 잡고 미는 동작은
  // 직접 scrollLeft를 옮겨줘야 한다.
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

  // 손으로 고른 작품(실제 대사·출처가 있는 것)을 앞세우고, 그 뒤를 실시간 공공데이터로 채운다.
  const allItems = [...CURATED_SCREEN_ITEMS, ...liveItems];
  const filteredItems =
    mediaFilter === 'all' ? allItems : allItems.filter((item) => item.mediaType === mediaFilter);

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
            $active={mediaFilter === key}
            aria-pressed={mediaFilter === key}
            onClick={() => setMediaFilter(key)}
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
            {filteredItems.map((item) => {
              const MediaIcon = MEDIA_ICONS[item.mediaType ?? 'drama'];

              return (
                <PosterCard
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.title} loading="lazy" />
                  <PosterScrim />

                  <MediaBadge aria-hidden="true">
                    <MediaIcon size={13} strokeWidth={2} />
                  </MediaBadge>

                  <PosterMeta>
                    <PosterEyebrow>{item.eyebrow}</PosterEyebrow>
                    <PosterTitle>{item.title}</PosterTitle>
                    <PosterRegion>
                      <MapPin size={11} strokeWidth={2} />
                      {item.region}
                    </PosterRegion>
                  </PosterMeta>
                </PosterCard>
              );
            })}
          </AnimatePresence>
        )}

        {!isLoading && filteredItems.length === 0 && (
          <EmptyFilterNote>선택한 유형의 콘텐츠가 아직 없어요. 다른 카테고리를 골라보세요.</EmptyFilterNote>
        )}
      </FilmStrip>
    </Section>
  );
}
