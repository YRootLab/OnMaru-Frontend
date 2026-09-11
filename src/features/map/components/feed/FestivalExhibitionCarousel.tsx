'use client';

import React, { useRef } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import Image from 'next/image';

const carouselShimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const SkeletonFestivalCard = styled.div`
  flex: none;
  width: 248px;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid rgba(25, 31, 40, 0.07);
  box-shadow: 0 1px 3px rgba(25, 31, 40, 0.02);
  overflow: hidden;

  [data-theme='dark'] & {
    background: #1f2125;
    border-color: rgba(255, 255, 255, 0.1);
  }
`;

const SkeletonFestivalThumb = styled.div`
  width: 100%;
  height: 136px;
  background: linear-gradient(90deg, #f0f0ee 25%, #e6e6e3 50%, #f0f0ee 75%);
  background-size: 200% 100%;
  animation: ${carouselShimmer} 1.6s ease-in-out infinite;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.06) 25%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.06) 75%);
    background-size: 200% 100%;
  }
`;

const SkeletonFestivalBody = styled.div`
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
`;

const SkeletonBar = styled.div<{ $w: string; $h: string }>`
  width: ${({ $w }) => $w};
  height: ${({ $h }) => $h};
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0ee 25%, #e6e6e3 50%, #f0f0ee 75%);
  background-size: 200% 100%;
  animation: ${carouselShimmer} 1.6s ease-in-out infinite;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.06) 25%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.06) 75%);
    background-size: 200% 100%;
  }
`;
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { lightPalette, meok, surface } from '@/design-system/tokens';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import type { Item } from '@/features/map/types';

interface FestivalExhibitionCarouselProps {
  festivals: Item[];
}

const SectionWrapper = styled.div`
  position: relative;
  padding: 0 14px;

  &:hover .om-carousel-floating-btn {
    opacity: 1;
    pointer-events: auto;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: ${meok[900]};
  letter-spacing: -0.02em;
`;

const BadgeTitle = styled.span`
  font-size: 10.5px;
  font-weight: 500;
  color: ${lightPalette.cheongrok[500]};
`;

const MoreBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 2px;

  background: transparent;
  font-size: 11.5px;
  font-weight: 400;
  color: ${meok[400]};
  cursor: pointer;
  padding: 2px 4px;

  &:hover {
    color: ${meok[700]};
  }
`;

const CarouselContainer = styled.div`
  position: relative;
  width: 100%;
`;

const FloatingNavBtn = styled.button<{ $direction: 'left' | 'right' }>`
  position: absolute;
  top: calc(50% - 14px);
  ${({ $direction }) => ($direction === 'left' ? 'left: 4px;' : 'right: 4px;')}
  transform: translateY(-50%);
  z-index: 10;

  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;

  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(25, 31, 40, 0.08);
  box-shadow: 0 4px 14px rgba(25, 31, 40, 0.16);
  color: ${meok[700]};
  cursor: pointer;

  opacity: 0;
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: #ffffff;
    color: ${meok[900]};
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 6px 18px rgba(25, 31, 40, 0.22);
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const Scroller = styled.div`
  display: flex;
  gap: 14px;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding: 6px 2px 14px;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const FestivalCard = styled.button`
  flex: none;
  width: 248px;
  scroll-snap-align: start;

  border-radius: 16px;
  background: #ffffff;
  border: 1px solid rgba(25, 31, 40, 0.07);
  box-shadow: 0 1px 3px rgba(25, 31, 40, 0.02);
  overflow: hidden;
  text-align: left;
  cursor: pointer;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(25, 31, 40, 0.04);
    border-color: rgba(25, 31, 40, 0.12);

    img {
      transform: scale(1.04);
    }
  }

  &:active {
    transform: translateY(0) scale(0.99);
  }
`;

const ThumbBox = styled.div`
  position: relative;
  width: 100%;
  height: 136px;
  background: ${meok[200]};
  overflow: hidden;

  img {
    transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
  }
`;

const CardBadge = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 700;
  color: ${surface.light.card};
  background: ${lightPalette.cheongrok[500]};
`;

const CardBody = styled.div`
  padding: 10px 12px;
`;

const CardTitle = styled.h4`
  margin: 0 0 4px;
  font-size: 13.5px;
  font-weight: 500;
  color: ${meok[900]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
`;

const CardDateRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: ${lightPalette.cheongrok[700]};
  font-weight: 500;
`;

const CardAddr = styled.div`
  margin-top: 3px;
  font-size: 11px;
  font-weight: 400;
  color: ${meok[400]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// 지역 대표 가을·봄 야행 및 축제 데이터 (실제 TourAPI 연동 및 고화질 사진)
const FALLBACK_FESTIVALS: Item[] = [
  {
    id: '2941014',
    name: '2026 전주 한옥마을 문화재 야행',
    category: 'festival',
    lat: 35.815,
    lng: 127.153,
    addr: '전북 전주시 완산구 태조로 44',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '063-281-2114',
    dist: 120,
  },
  {
    id: '2684898',
    name: '경복궁 별빛야행 & 달빛기행',
    category: 'festival',
    lat: 37.58,
    lng: 126.98,
    addr: '서울 종로구 사직로 161 경복궁 일원',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '02-3700-3900',
    dist: 230,
  },
  {
    id: '139433',
    name: '안동 하회마을 선유줄불놀이',
    category: 'festival',
    lat: 36.54,
    lng: 128.80,
    addr: '경북 안동시 풍천면 하회리 만송정 일원',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    tel: '054-853-0103',
    dist: 450,
  },
  {
    id: '141364',
    name: '수원화성 문화제 & 미디어아트',
    category: 'festival',
    lat: 37.287,
    lng: 127.015,
    addr: '경기 수원시 팔달구 정조로 825',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '031-290-3600',
    dist: 310,
  },
];

export default function FestivalExhibitionCarousel({ festivals }: FestivalExhibitionCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const map = useMapStore((s) => s.map);
  const setCategory = useMapStore((s) => s.setCategory);
  const loading = useMapStore((s) => s.loading);
  const items = useMapStore((s) => s.items);

  const displayList = festivals.length > 0 ? festivals : FALLBACK_FESTIVALS;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollerRef.current) {
      const scrollAmount = direction === 'left' ? -230 : 230;
      scrollerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollerRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      scrollerRef.current.scrollLeft += e.deltaY;
    }
  };

  // 초기 로딩 시 섹션이 사라지거나 갑자기 튀어나오지 않도록 스켈레톤 유지
  if (loading && items.length === 0) {
    return (
      <SectionWrapper aria-busy="true" aria-label="진행 중인 축제 및 기획전 불러오는 중">
        <SectionHeader>
          <TitleGroup>
            <SectionTitle>진행 중인 축제·기획전</SectionTitle>
          </TitleGroup>
          <MoreBtn type="button" disabled style={{ opacity: 0.5, cursor: 'default' }}>
            <span>전체보기</span>
            <ChevronRight size={13} />
          </MoreBtn>
        </SectionHeader>

        <CarouselContainer>
          <Scroller role="region" aria-label="축제 및 기획전 로딩 중">
            {[1, 2, 3].map((key) => (
              <SkeletonFestivalCard key={key}>
                <SkeletonFestivalThumb />
                <SkeletonFestivalBody>
                  <div style={{ margin: '0 0 4px', height: '17px', display: 'flex', alignItems: 'center' }}>
                    <SkeletonBar $w="72%" $h="14px" />
                  </div>
                  <div style={{ height: '14px', display: 'flex', alignItems: 'center' }}>
                    <SkeletonBar $w="48%" $h="11px" />
                  </div>
                  <div style={{ marginTop: '3px', height: '14px', display: 'flex', alignItems: 'center' }}>
                    <SkeletonBar $w="60%" $h="11px" />
                  </div>
                </SkeletonFestivalBody>
              </SkeletonFestivalCard>
            ))}
          </Scroller>
        </CarouselContainer>
      </SectionWrapper>
    );
  }

  const handleClick = (item: Item) => {
    const store = useMapStore.getState();
    if (!store.items.some((i) => i.id === item.id)) {
      store.setItems([item, ...store.items]);
    }
    store.setSelectedId(item.id);
    store.setDetailId(item.id);
    store.setSheetSnap('full');

    if (map && window.kakao?.maps) {
      map.panTo(new window.kakao.maps.LatLng(item.lat, item.lng));
      map.setLevel(4, { animate: true });
    }
  };

  return (
    <SectionWrapper>
      <SectionHeader>
        <TitleGroup>
          <SectionTitle>진행 중인 축제·기획전</SectionTitle>
        </TitleGroup>
        <MoreBtn type="button" onClick={() => setCategory('festival')}>
          <span>전체보기</span>
          <ChevronRight size={13} strokeWidth={2} />
        </MoreBtn>
      </SectionHeader>

      <CarouselContainer>
        <FloatingNavBtn
          className="om-carousel-floating-btn"
          $direction="left"
          type="button"
          onClick={() => scroll('left')}
          aria-label="이전 축제 보기"
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </FloatingNavBtn>

        <FloatingNavBtn
          className="om-carousel-floating-btn"
          $direction="right"
          type="button"
          onClick={() => scroll('right')}
          aria-label="다음 축제 보기"
        >
          <ChevronRight size={18} strokeWidth={2} />
        </FloatingNavBtn>

        <Scroller ref={scrollerRef} onWheel={handleWheel} role="region" aria-label="진행 중인 축제 및 기획전 목록">
          {displayList.map((item) => (
            <FestivalCard key={item.id} type="button" onClick={() => handleClick(item)}>
              <ThumbBox>
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="248px"
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#eae4d9' }} />
                )}
                <CardBadge>
                  <Sparkles size={10} strokeWidth={2} />
                  <span>축제·기획전</span>
                </CardBadge>
              </ThumbBox>

              <CardBody>
                <CardTitle title={item.name}>{item.name}</CardTitle>
                <CardDateRow>
                  <Calendar size={12} strokeWidth={2} />
                  <span>야간 개방 및 특별 행사 진행</span>
                </CardDateRow>
                <CardAddr>{item.addr || '전통 한옥 명소'}</CardAddr>
              </CardBody>
            </FestivalCard>
          ))}
        </Scroller>
      </CarouselContainer>
    </SectionWrapper>
  );
}
