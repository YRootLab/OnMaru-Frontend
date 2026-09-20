'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';
import {
  Clapperboard,
  Film,
  Music2,
  Sparkles,
  Heart,
  ExternalLink,
  MapPin,
  Hash,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { meok, lightPalette, surface, fontSize } from '@/design-system/tokens';
import SectionHeader from '@/features/hanok-archive/components/SectionHeader';
import { useKCultureThemes } from '@/features/hanok-archive/hooks/useKCultureThemes';
import type { ScreenHanokItem, ScreenHanokMediaType } from '@/features/hanok-archive/services/screenHanok.service';

// ─── 미디어 타입별 Lucide 아이콘 매핑 ────────────────────────────────
function getMediaIcon(mediaType: string, size = 14) {
  switch (mediaType) {
    case 'K_DRAMA': return <Clapperboard size={size} strokeWidth={2} />;
    case 'CINEMA':  return <Film size={size} strokeWidth={2} />;
    case 'KPOP':    return <Music2 size={size} strokeWidth={2} />;
    default:        return <Sparkles size={size} strokeWidth={2} />;
  }
}

// ─── 필터 칩 ────────────────────────────────────────────────────────
const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 4px 0 12px;
`;

const FilterChip = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 9999px;
  border: 1px solid ${({ $active }) => ($active ? lightPalette.juhong[500] : 'rgba(78,89,104,0.16)')};
  background: ${({ $active }) => ($active ? lightPalette.juhong[500] : 'transparent')};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  font-size: ${fontSize.sm};
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
  font-family: inherit;

  &:hover { border-color: ${lightPalette.juhong[500]}; }

  [data-theme='dark'] & {
    color: ${({ $active }) => ($active ? '#ffffff' : meok[300])};
  }
`;

// ─── Bento 그리드 ────────────────────────────────────────────────────
const BentoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto;
  gap: 7px;
  align-items: stretch;

  @media (min-width: 900px) {
    grid-template-columns: 55fr 45fr;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ThumbGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 5px;
  height: 100%;
  min-height: 0;
`;

// ─── HERO 카드 ────────────────────────────────────────────────────────
/*
  필터를 바꾸면 AnimatePresence가 나가는 카드와 들어오는 카드를 동시에 그리는데,
  HeroCard가 그리드의 보통 자식이면 그 순간 그리드 칸이 하나 늘어 ThumbGrid가
  밀렸다 돌아왔다 — 칩을 누를 때마다 "번쩍"이던 게 이 레이아웃 흔들림이었다.
  HeroSlot이 자리(칸 크기)를 고정해 쥐고, 카드들은 그 안에서 absolute로 겹친다.
*/
const KCultureSection = styled.section`
  & > div:first-child {
    margin-bottom: 14px;
  }
`;

const HeroSlot = styled.div`
  position: relative;
  border-radius: 22px;
  aspect-ratio: 4 / 5;

  @media (min-width: 640px) {
    aspect-ratio: 3 / 4;
  }
`;

const HeroCard = styled(motion.div)`
  position: absolute;
  inset: 0;
  border-radius: 22px;
  overflow: hidden;
  background: ${meok[200]};
  cursor: default;

  [data-theme='dark'] & { background: ${meok[800]}; }
`;

const HeroImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const HeroScrim = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.95) 0%,
    rgba(0, 0, 0, 0.6) 45%,
    rgba(0, 0, 0, 0.08) 80%
  );
`;

const HeroTopRow = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  z-index: 4;
`;

const MediaBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  color: #ffffff;
  font-size: ${fontSize.xs};
  font-weight: 600;
  letter-spacing: -0.01em;
`;

const SaveBtn = styled.button<{ $saved: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  color: ${({ $saved }) => ($saved ? '#ef4444' : '#ffffff')};
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease;

  &:hover { transform: scale(1.12); background: rgba(0,0,0,0.72); }
  &:active { transform: scale(0.9); }
`;

const HeroBody = styled.div`
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 18px;
  z-index: 4;
`;

const HeroWorkTitle = styled.p`
  font-family: var(--font-hanok);
  font-size: clamp(22px, 3.5vw, 30px);
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 5px;
  line-height: 1.2;
  letter-spacing: -0.03em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const HeroNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 10px;
  color: rgba(255,255,255,0.78);
  font-size: ${fontSize.sm};
  font-weight: 500;
`;

const HeroSubtitle = styled.p`
  font-size: 12.5px;
  line-height: 1.5;
  color: rgba(255,255,255,0.82);
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const HeroTagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 12px;
`;

const HeroTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(255,255,255,0.14);
  color: rgba(255,255,255,0.9);
  font-weight: 500;
`;

const HeroSourceLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: rgba(255,255,255,0.6);
  text-decoration: none;
  transition: color 0.15s ease;
  max-width: 100%;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
  }

  &:hover { color: #ffffff; }
`;

// ─── 썸네일 카드 (2×2 서브) ────────────────────────────────────────────
const ThumbCard = styled(motion.button)`
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  border: none;
  cursor: pointer;
  padding: 0;
  background: ${meok[100]};
  min-height: 120px;
  height: 100%;
  width: 100%;
  display: block;

  [data-theme='dark'] & { background: ${meok[700]}; }

  &:hover .thumb-overlay { opacity: 1; }
`;

const ThumbImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);

  ${ThumbCard}:hover & { transform: scale(1.06); }
`;

const ThumbScrim = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 55%);
`;

const ThumbMeta = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px 10px 10px;
`;

const ThumbWorkTitle = styled.p`
  font-family: var(--font-hanok);
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ThumbName = styled.p`
  font-size: 10.5px;
  color: rgba(255,255,255,0.7);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ThumbOverlay = styled.div`
  className: thumb-overlay;
  position: absolute;
  inset: 0;
  border: 2px solid ${lightPalette.juhong[400]};
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.18s ease;
`;

const ThumbIconBadge = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(6px);
  color: #ffffff;
`;

// ─── 스켈레톤 ──────────────────────────────────────────────────────────
const shimmerAnim = keyframes`
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
`;

const SkeletonBase = styled.div`
  border-radius: 22px;
  background: linear-gradient(90deg, #f0f0ee 25%, #e4e4e2 50%, #f0f0ee 75%);
  background-size: 200% 100%;
  animation: ${shimmerAnim} 1.6s infinite ease-in-out;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, #252422 25%, #32302d 50%, #252422 75%);
    background-size: 200% 100%;
  }
`;

const SkeletonHero = styled(SkeletonBase)`
  aspect-ratio: 3 / 4;

  @media (max-width: 640px) { aspect-ratio: 4 / 5; }
`;

const SkeletonThumb = styled(SkeletonBase)`
  aspect-ratio: 1 / 1;
  border-radius: 14px;
`;

const EmptyNote = styled.p`
  grid-column: 1 / -1;
  padding: 48px 0;
  text-align: center;
  font-size: ${fontSize.sm};
  color: ${meok[500]};
`;

// ─── 내비게이션 바 ─────────────────────────────────────────────────────
const NavRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
`;

const NavBtnGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NavBtn = styled.button<{ $disabled: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: ${({ $disabled }) => ($disabled ? '#f5f5f4' : '#ffffff')};
  color: ${({ $disabled }) => ($disabled ? meok[400] : meok[800])};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.45 : 1)};
  transition: all 0.18s ease;
  font-family: inherit;

  &:hover:not(:disabled) {
    background: #f0f0ee;
    border-color: rgba(0,0,0,0.18);
  }

  [data-theme='dark'] & {
    border-color: rgba(255,255,255,0.1);
    background: ${({ $disabled }) => ($disabled ? surface.dark.surface : surface.dark.card)};
    color: ${({ $disabled }) => ($disabled ? meok[600] : meok[200])};
  }
`;

const NavCounter = styled.span`
  font-size: ${fontSize.sm};
  font-weight: 600;
  color: ${meok[500]};
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;

  strong {
    color: ${meok[900]};
    [data-theme='dark'] & { color: ${meok[100]}; }
  }
`;

const ViewAllLink = styled.button`
  font-size: ${fontSize.sm};
  font-weight: 600;
  color: ${lightPalette.juhong[500]};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  transition: color 0.15s ease;

  &:hover { color: ${lightPalette.juhong[700]}; }
`;

// ─── 필터 상수 ─────────────────────────────────────────────────────────
const MEDIA_FILTERS: { key: 'all' | ScreenHanokMediaType; label: string }[] = [
  { key: 'all',     label: '전체' },
  { key: 'K_DRAMA', label: '드라마' },
  { key: 'CINEMA',  label: '영화' },
  { key: 'KPOP',    label: 'K-POP' },
];

export interface KCultureThemeFeedProps {
  onSelectPlace?: (item: ScreenHanokItem) => void;
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────
export default function KCultureThemeFeed({ onSelectPlace }: KCultureThemeFeedProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | ScreenHanokMediaType>('all');
  const { items, isLoading, isFirstLoad, toggleSave } = useKCultureThemes({
    mediaType: activeFilter === 'all' ? undefined : activeFilter,
  });

  const [heroIdx, setHeroIdx] = useState(0);

  // 필터 변경 시 hero를 0번으로 초기화
  const handleFilter = (key: 'all' | ScreenHanokMediaType) => {
    setActiveFilter(key);
    setHeroIdx(0);
  };

  // 이전/다음 내비게이션
  const navigate = (delta: -1 | 1) => {
    setHeroIdx((prev) => {
      const next = prev + delta;
      if (next < 0) return 0;
      if (next >= items.length) return items.length - 1;
      return next;
    });
  };

  const hero = items[heroIdx] ?? null;
  // 현재 hero 제외, hero 이후 항목 우선으로 4개 표시
  const thumbs = [
    ...items.slice(heroIdx + 1),
    ...items.slice(0, heroIdx),
  ].slice(0, 4);

  return (
    <KCultureSection aria-labelledby="screen-hanok-heading">
      <SectionHeader id="screen-hanok-heading" title="스크린 속 한옥" />

      <FilterRow role="group" aria-label="K-콘텐츠 유형 선택">
        {MEDIA_FILTERS.map(({ key, label }) => (
          <FilterChip
            key={key}
            type="button"
            $active={activeFilter === key}
            aria-pressed={activeFilter === key}
            onClick={() => handleFilter(key)}
          >
            {key !== 'all' && getMediaIcon(key, 13)}
            {label}
          </FilterChip>
        ))}
      </FilterRow>

      {/* 스켈레턴: 실제 데이터가 없을 때만(쳄 로드) 표시 */}
      {isFirstLoad && isLoading && (
        <BentoGrid>
          <SkeletonHero />
          <ThumbGrid>
            {[1, 2, 3, 4].map((i) => <SkeletonThumb key={i} />)}
          </ThumbGrid>
        </BentoGrid>
      )}

      {/* 데이터 없음 */}
      {!isLoading && items.length === 0 && (
        <EmptyNote>이 카테고리엔 아직 콘텐츠가 없어요. 다른 카테고리를 골라보세요.</EmptyNote>
      )}

      {/* Bento Hero + 2×2 썸네일 */}
      {!isFirstLoad && hero && (
        <LayoutGroup>
          <BentoGrid>
            {/* ── HERO ── */}
            <HeroSlot>
              <AnimatePresence mode="sync">
                <HeroCard
                  key={hero.placeId}
                  layoutId={`kculture-card-${hero.placeId}`}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
                  onClick={() => onSelectPlace?.(hero)}
                  style={{ cursor: onSelectPlace ? 'pointer' : 'default' }}
                >
                  <HeroImage
                    src={hero.imageUrl ?? 'https://tong.visitkorea.or.kr/cms/resource/80/3095780_image2_1.jpg'}
                    alt={hero.name}
                    loading="lazy"
                  />
                  <HeroScrim />

                  <HeroTopRow>
                    <MediaBadge>
                      {getMediaIcon(hero.mediaType, 13)}
                      <span>{hero.categoryLabel}</span>
                    </MediaBadge>
                    <SaveBtn
                      type="button"
                      $saved={hero.savedByMe}
                      aria-label={hero.savedByMe ? '찜 해제' : '찜하기'}
                      onClick={(e) => { e.stopPropagation(); toggleSave(hero.placeId); }}
                    >
                      <Heart size={16} fill={hero.savedByMe ? '#ef4444' : 'none'} strokeWidth={hero.savedByMe ? 0 : 2} />
                    </SaveBtn>
                  </HeroTopRow>

                  <HeroBody>
                    <HeroWorkTitle>{hero.workTitle}</HeroWorkTitle>
                    <HeroNameRow>
                      <MapPin size={12} strokeWidth={2} />
                      {hero.name} · {hero.region}
                    </HeroNameRow>
                    <HeroSubtitle>{hero.subtitle}</HeroSubtitle>
                    {hero.tags && hero.tags.length > 0 && (
                      <HeroTagRow>
                        {hero.tags.slice(0, 3).map((tag, i) => (
                          <HeroTag key={i}>
                            <Hash size={10} />
                            {tag.replace(/^#/, '')}
                          </HeroTag>
                        ))}
                      </HeroTagRow>
                    )}
                    {hero.sourceUrl && (
                      <HeroSourceLink
                        href={hero.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={11} />
                        <span>{hero.sourceTitle || '출처 보기'}</span>
                      </HeroSourceLink>
                    )}
                  </HeroBody>
                </HeroCard>
              </AnimatePresence>
            </HeroSlot>

            {/* ── 2×2 썸네일 그리드 ── */}
            <ThumbGrid>
              {thumbs.map((item, idx) => (
                <ThumbCard
                  key={item.placeId}
                  layoutId={`kculture-card-${item.placeId}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
                  aria-label={`${item.workTitle} — ${item.name}`}
                  onClick={() => {
                    const clickedOrigIdx = items.findIndex((it) => it.placeId === item.placeId);
                    setHeroIdx(clickedOrigIdx);
                  }}
                >
                  <ThumbImage
                    src={item.imageUrl ?? 'https://tong.visitkorea.or.kr/cms/resource/80/3095780_image2_1.jpg'}
                    alt={item.name}
                    loading="lazy"
                  />
                  <ThumbScrim />
                  <ThumbIconBadge>{getMediaIcon(item.mediaType, 12)}</ThumbIconBadge>
                  <ThumbMeta>
                    <ThumbWorkTitle>{item.workTitle}</ThumbWorkTitle>
                    <ThumbName>{item.name}</ThumbName>
                  </ThumbMeta>
                  <ThumbOverlay className="thumb-overlay" />
                </ThumbCard>
              ))}

              {/* 썸네일이 4개 미만일 때 빈 자리는 표시 안 함 */}
            </ThumbGrid>
          </BentoGrid>

          {/* ── 내비게이션 바 ── */}
          {items.length > 1 && (
            <NavRow>
              <NavBtnGroup>
                <NavBtn
                  type="button"
                  $disabled={heroIdx === 0}
                  disabled={heroIdx === 0}
                  aria-label="이전 항목"
                  onClick={() => navigate(-1)}
                >
                  <ChevronLeft size={16} strokeWidth={2.5} />
                </NavBtn>
                <NavCounter>
                  <strong>{heroIdx + 1}</strong> / {items.length}
                </NavCounter>
                <NavBtn
                  type="button"
                  $disabled={heroIdx === items.length - 1}
                  disabled={heroIdx === items.length - 1}
                  aria-label="다음 항목"
                  onClick={() => navigate(1)}
                >
                  <ChevronRight size={16} strokeWidth={2.5} />
                </NavBtn>
              </NavBtnGroup>
              <ViewAllLink type="button" onClick={() => setHeroIdx(0)}>
                처음으로
              </ViewAllLink>
            </NavRow>
          )}
        </LayoutGroup>
      )}
    </KCultureSection>
  );
}
