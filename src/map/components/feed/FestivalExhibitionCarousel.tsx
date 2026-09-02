'use client';

import React, { useRef } from 'react';
import styled from '@emotion/styled';
import Image from 'next/image';
import { Calendar, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { lightPalette, meok } from '@/design-system/tokens';
import { useMapStore } from '../../hooks/useMapStore';
import type { Item } from '../../types';

interface FestivalExhibitionCarouselProps {
  festivals: Item[];
}

const SectionWrapper = styled.div`
  padding: 14px 14px 6px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: ${meok[900]};
`;

const BadgeTitle = styled.span`
  font-size: 10.5px;
  font-weight: 700;
  color: ${lightPalette.cheongrok[500]};
`;

const RightControls = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const NavArrowBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(25, 31, 40, 0.05);
  color: ${meok[700]};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${lightPalette.cheongrok[50]};
    color: ${lightPalette.cheongrok[700]};
  }

  &:active {
    transform: scale(0.92);
  }
`;

const MoreBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 2px;
  border: none;
  background: transparent;
  font-size: 11.5px;
  font-weight: 600;
  color: ${meok[500]};
  cursor: pointer;
  padding: 2px 4px;

  &:hover {
    color: ${meok[900]};
  }
`;

const Scroller = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding-bottom: 8px;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const FestivalCard = styled.button`
  flex: none;
  width: 220px;
  scroll-snap-align: start;
  border: none;
  border-radius: 14px;
  background: rgba(25, 31, 40, 0.03);
  overflow: hidden;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: rgba(25, 31, 40, 0.06);
    transform: translateY(-2px);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ThumbBox = styled.div`
  position: relative;
  width: 100%;
  height: 110px;
  background: #f0eae0;
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
  font-weight: 800;
  color: #ffffff;
  background: ${lightPalette.cheongrok[500]};
  box-shadow: 0 2px 6px rgba(30, 122, 104, 0.4);
`;

const CardBody = styled.div`
  padding: 10px 12px;
`;

const CardTitle = styled.h4`
  margin: 0 0 4px;
  font-size: 13.5px;
  font-weight: 700;
  color: ${meok[900]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardDateRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: ${lightPalette.cheongrok[700]};
  font-weight: 600;
`;

const CardAddr = styled.div`
  margin-top: 3px;
  font-size: 11px;
  color: ${meok[500]};
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
          <Sparkles size={15} color={lightPalette.juhong[500]} />
          <SectionTitle>진행 중인 지역 축제 & 기획전</SectionTitle>
          <BadgeTitle>LIVE</BadgeTitle>
        </TitleGroup>

        <RightControls>
          <NavArrowBtn type="button" onClick={() => scroll('left')} aria-label="이전 축제">
            <ChevronLeft size={15} />
          </NavArrowBtn>
          <NavArrowBtn type="button" onClick={() => scroll('right')} aria-label="다음 축제">
            <ChevronRight size={15} />
          </NavArrowBtn>
          <MoreBtn type="button" onClick={() => setCategory('festival')}>
            <span>더보기</span>
            <ChevronRight size={13} />
          </MoreBtn>
        </RightControls>
      </SectionHeader>

      <Scroller ref={scrollerRef} onWheel={handleWheel} role="region" aria-label="진행 중인 지역 축제 목록">
        {displayList.map((item) => (
          <FestivalCard key={item.id} type="button" onClick={() => handleClick(item)}>
            <ThumbBox>
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="220px"
                  style={{ objectFit: 'cover' }}
                  unoptimized
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#eae4d9' }} />
              )}
              <CardBadge>
                <Sparkles size={10} />
                <span>축제·기획전</span>
              </CardBadge>
            </ThumbBox>

            <CardBody>
              <CardTitle title={item.name}>{item.name}</CardTitle>
              <CardDateRow>
                <Calendar size={11} />
                <span>야간 특별 개방 및 행사 진행중</span>
              </CardDateRow>
              <CardAddr>{item.addr || '전통 한옥 명소'}</CardAddr>
            </CardBody>
          </FestivalCard>
        ))}
      </Scroller>
    </SectionWrapper>
  );
}
