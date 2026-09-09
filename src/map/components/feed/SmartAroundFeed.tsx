'use client';

import React, { useRef } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import Image from 'next/image';

const feedShimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const SkeletonCuratedCard = styled.div`
  flex: none;
  width: 240px;
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

const SkeletonPhoto = styled.div`
  width: 100%;
  aspect-ratio: 16 / 11;
  background: linear-gradient(90deg, #f0f0ee 25%, #e6e6e3 50%, #f0f0ee 75%);
  background-size: 200% 100%;
  animation: ${feedShimmer} 1.6s ease-in-out infinite;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.06) 25%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.06) 75%);
    background-size: 200% 100%;
  }
`;

const SkeletonCardBody = styled.div`
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const SkeletonBar = styled.div<{ $w: string; $h: string; $radius?: string }>`
  width: ${({ $w }) => $w};
  height: ${({ $h }) => $h};
  border-radius: ${({ $radius }) => $radius || '4px'};
  background: linear-gradient(90deg, #f0f0ee 25%, #e6e6e3 50%, #f0f0ee 75%);
  background-size: 200% 100%;
  animation: ${feedShimmer} 1.6s ease-in-out infinite;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.06) 25%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.06) 75%);
    background-size: 200% 100%;
  }
`;
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { lightPalette, meok } from '@/design-system/tokens';
import { useMapStore } from '@/map/hooks/useMapStore';
import type { Item } from '@/map/types';

interface SmartAroundFeedProps {
  items: Item[];
}

const Wrapper = styled.div`
  position: relative;
  padding: 0 14px;

  &:hover .om-feed-floating-btn {
    opacity: 1;
    pointer-events: auto;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const TitleBox = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 16.5px;
  font-weight: 700;
  color: ${meok[900]};
  letter-spacing: -0.02em;
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

const CuratedCard = styled.button`
  flex: none;
  width: 240px;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;

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

const PhotoBox = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 11;
  background: #f0eae0;
  overflow: hidden;

  img {
    transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
  }
`;

const DistanceOverlay = styled.div`
  position: absolute;
  bottom: 6px;
  right: 6px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  padding: 2.5px 7px;
  border-radius: 9999px;
  background: rgba(25, 31, 40, 0.68);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: -0.01em;
`;

const Body = styled.div`
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const Name = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: ${meok[900]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
`;

const MoodReview = styled.p`
  margin: 1px 0 4px;
  font-size: 11.5px;
  font-weight: 400;
  color: ${meok[500]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TagRow = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 2px;
`;

const HashTag = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 500;
  color: ${lightPalette.cheongrok[700]};
  background: rgba(30, 122, 104, 0.08);
  padding: 2px 7px;
  border-radius: 6px;
  letter-spacing: -0.01em;
`;

function getPlaceTags(item: Item): string[] {
  const tags: string[] = [];

  // 1. 지역 추출 (예: '서울 종로구 ...' -> '#종로', '전북 전주시 ...' -> '#전주')
  if (item.addr) {
    const parts = item.addr.split(' ');
    if (parts.length >= 2) {
      const city = parts[1].replace(/특별시|광역시|특별자치시|특별자치도|도|시|군|구/g, '').trim();
      if (city && city.length >= 2) {
        tags.push(`#${city}`);
      }
    }
  }

  // 2. 카테고리 태그 (예: #고택명소, #한옥카페, #한옥숙소, #문화재, #전통체험)
  const categoryTagMap: Record<string, string> = {
    spot: '#고택명소',
    cafe: '#한옥카페',
    stay: '#한옥숙소',
    experience: '#전통체험',
    culture: '#문화재·서원',
    festival: '#축제·야행',
    food: '#향토음식',
    market: '#전통시장',
  };
  tags.push(categoryTagMap[item.category] || '#한옥명소');

  return tags;
}

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
  const loading = useMapStore((s) => s.loading);

  // 이미지가 있고 매력적인 상위 12개 장소 선별
  const curatedSpots = items
    .filter((item) => Boolean(item.image))
    .slice(0, 12);

  // 초기 로딩 시 섹션이 사라지지 않고 정위치에서 스켈레톤 유지 (CLS 방지)
  if (loading && items.length === 0) {
    return (
      <Wrapper aria-busy="true" aria-label="추천 한옥 명소 불러오는 중">
        <Header>
          <TitleBox>
            <Title>추천 한옥 명소</Title>
            <SubText>AI 감성 큐레이션</SubText>
          </TitleBox>
        </Header>

        <FeedContainer>
          <Scroller role="region" aria-label="추천 한옥 명소 로딩 중">
            {[1, 2, 3].map((key) => (
              <SkeletonCuratedCard key={key}>
                <SkeletonPhoto />
                <SkeletonCardBody>
                  <div style={{ height: '18px', display: 'flex', alignItems: 'center' }}>
                    <SkeletonBar $w="68%" $h="15px" />
                  </div>
                  <div style={{ margin: '1px 0 4px', height: '15px', display: 'flex', alignItems: 'center' }}>
                    <SkeletonBar $w="88%" $h="12px" />
                  </div>
                  <div style={{ display: 'flex', gap: '5px', marginTop: '2px' }}>
                    <SkeletonBar $w="48px" $h="19px" $radius="6px" />
                    <SkeletonBar $w="54px" $h="19px" $radius="6px" />
                  </div>
                </SkeletonCardBody>
              </SkeletonCuratedCard>
            ))}
          </Scroller>
        </FeedContainer>
      </Wrapper>
    );
  }

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
          <Title>추천 한옥 명소</Title>
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
          <ChevronLeft size={18} strokeWidth={2} />
        </FloatingNavBtn>

        <FloatingNavBtn
          className="om-feed-floating-btn"
          $direction="right"
          type="button"
          onClick={() => scroll('right')}
          aria-label="다음 추천 명소 보기"
        >
          <ChevronRight size={18} strokeWidth={2} />
        </FloatingNavBtn>

        <Scroller ref={scrollerRef} onWheel={handleWheel} role="region" aria-label="추천 한옥 명소 목록">
        {curatedSpots.map((item) => (
          <CuratedCard key={item.id} type="button" onClick={() => handleClick(item)}>
            <PhotoBox>
              <Image
                src={item.image!}
                alt={item.name}
                fill
                sizes="240px"
                style={{ objectFit: 'cover' }}
                unoptimized
              />
              {item.dist ? (
                <DistanceOverlay>
                  {Math.round(item.dist) >= 1000
                    ? `${(item.dist / 1000).toFixed(1)}km`
                    : `${Math.round(item.dist)}m`}
                </DistanceOverlay>
              ) : null}
            </PhotoBox>

            <Body>
              <Name title={item.name}>{item.name}</Name>
              <MoodReview>{getMoodReview(item.name, item.category)}</MoodReview>
              <TagRow>
                {getPlaceTags(item).map((tag) => (
                  <HashTag key={tag}>{tag}</HashTag>
                ))}
              </TagRow>
            </Body>
          </CuratedCard>
        ))}
      </Scroller>
      </FeedContainer>
    </Wrapper>
  );
}
