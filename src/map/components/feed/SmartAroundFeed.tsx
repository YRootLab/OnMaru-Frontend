'use client';

import React, { useRef } from 'react';
import styled from '@emotion/styled';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { lightPalette, meok } from '@/design-system/tokens';
import { useMapStore } from '@/map/hooks/useMapStore';
import type { Item } from '@/map/types';

interface SmartAroundFeedProps {
  items: Item[];
}

const Wrapper = styled.div`
  position: relative;
  padding: 12px 14px 14px;

  &:hover .om-feed-floating-btn {
    opacity: 1;
    pointer-events: auto;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const TitleBox = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 14.5px;
  font-weight: 600;
  color: ${meok[900]};
  letter-spacing: -0.01em;
`;

const SubText = styled.span`
  font-size: 11px;
  font-weight: 400;
  color: ${lightPalette.cheongrok[500]};
`;

const FeedContainer = styled.div`
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
  gap: 12px;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding-bottom: 6px;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const CuratedCard = styled.button`
  flex: none;
  width: 190px;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;

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

const PhotoBox = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 11;
  background: #f0eae0;
`;

const PhotoBadge = styled.div`
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: 9999px;
  background: rgba(25, 31, 40, 0.72);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 9.5px;
  font-weight: 600;
`;

const Body = styled.div`
  padding: 8px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Name = styled.h4`
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: ${meok[900]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
`;

const MoodReview = styled.p`
  margin: 2px 0 4px;
  font-size: 11px;
  font-weight: 400;
  color: ${meok[500]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10.5px;
  color: ${meok[500]};
`;

const DistTag = styled.span`
  font-weight: 500;
  color: ${lightPalette.cheongrok[700]};
`;

// 분위기 한줄평 자동 큐레이션 생성기
function getMoodReview(name: string, category: string): string {
  if (category === 'cafe') return '처마 밑 고즈넉한 전통차와 감성 디저트';
  if (category === 'stay') return '달빛 비추는 한옥 마당에서의 힐링 하룻밤';
  if (category === 'experience') return '곱게 차려입는 한복과 다도 체험';
  if (category === 'food') return '대를 이어온 전통의 깊은 손맛';
  if (category === 'culture' || category === 'spot') return '천년의 역사를 품은 고택의 정취';
  return '한국의 미가 살아 숨쉬는 한옥 명소';
}

export default function SmartAroundFeed({ items }: SmartAroundFeedProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const map = useMapStore((s) => s.map);
  const setSelectedId = useMapStore((s) => s.setSelectedId);
  const setDetailId = useMapStore((s) => s.setDetailId);

  // 이미지가 있고 매력적인 상위 12개 장소 선별
  const curatedSpots = items
    .filter((item) => Boolean(item.image))
    .slice(0, 12);

  if (curatedSpots.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
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
      map.setLevel(3, { animate: true });
    }
  };

  return (
    <Wrapper>
      <Header>
        <TitleBox>
          <Award size={15} color={lightPalette.cheongrok[500]} />
          <Title>추천 한옥 명소</Title>
          <SubText>추천</SubText>
        </TitleBox>
      </Header>

      <FeedContainer>
        <FloatingNavBtn
          className="om-feed-floating-btn"
          $direction="left"
          type="button"
          onClick={() => scroll('left')}
          aria-label="이전 추천 명소 보기"
        >
          <ChevronLeft size={18} />
        </FloatingNavBtn>

        <FloatingNavBtn
          className="om-feed-floating-btn"
          $direction="right"
          type="button"
          onClick={() => scroll('right')}
          aria-label="다음 추천 명소 보기"
        >
          <ChevronRight size={18} />
        </FloatingNavBtn>

        <Scroller ref={scrollerRef} onWheel={handleWheel} role="region" aria-label="추천 한옥 명소 목록">
        {curatedSpots.map((item) => (
          <CuratedCard key={item.id} type="button" onClick={() => handleClick(item)}>
            <PhotoBox>
              <Image
                src={item.image!}
                alt={item.name}
                fill
                sizes="190px"
                style={{ objectFit: 'cover' }}
                unoptimized
              />
            </PhotoBox>

            <Body>
              <Name title={item.name}>{item.name}</Name>
              <MoodReview>{getMoodReview(item.name, item.category)}</MoodReview>
              <MetaRow>
                <span>{item.category === 'cafe' ? '한옥카페' : item.category === 'stay' ? '한옥숙소' : '명소'}</span>
                {item.dist ? <DistTag>{Math.round(item.dist)}m</DistTag> : null}
              </MetaRow>
            </Body>
          </CuratedCard>
        ))}
      </Scroller>
      </FeedContainer>
    </Wrapper>
  );
}
