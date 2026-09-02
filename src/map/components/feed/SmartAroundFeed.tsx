'use client';

import React from 'react';
import styled from '@emotion/styled';
import Image from 'next/image';
import { Star, MapPin, ChevronRight, Award, Coffee, Home, Sparkles } from 'lucide-react';
import { lightPalette, meok } from '@/design-system/tokens';
import { useMapStore } from '../../hooks/useMapStore';
import type { Item } from '../../types';

interface SmartAroundFeedProps {
  items: Item[];
}

const Wrapper = styled.div`
  padding: 10px 14px 14px;
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
  font-size: 14.5px;
  font-weight: 700;
  color: ${meok[900]};
`;

const SubText = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${lightPalette.cheongrok[500]};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

const CuratedCard = styled.button`
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(78, 89, 104, 0.12);
  border-radius: 12px;
  background: #ffffff;
  overflow: hidden;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(25, 31, 40, 0.05);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 14px rgba(25, 31, 40, 0.1);
    border-color: ${lightPalette.cheongrok[500]};
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
  background: rgba(25, 31, 40, 0.7);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 9.5px;
  font-weight: 700;
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
  font-weight: 700;
  color: ${meok[900]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MoodReview = styled.p`
  margin: 2px 0 4px;
  font-size: 11px;
  color: ${meok[700]};
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
  font-weight: 600;
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
  const map = useMapStore((s) => s.map);
  const setSelectedId = useMapStore((s) => s.setSelectedId);
  const setDetailId = useMapStore((s) => s.setDetailId);

  // 이미지가 있고 매력적인 상위 4개 장소 선별
  const curatedSpots = items
    .filter((item) => Boolean(item.image))
    .slice(0, 4);

  if (curatedSpots.length === 0) return null;

  const handleClick = (item: Item) => {
    setSelectedId(item.id);
    setDetailId(item.id);
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
          <Title>이번 주 추천 한옥 스팟</Title>
          <SubText>Smart Pick</SubText>
        </TitleBox>
      </Header>

      <Grid>
        {curatedSpots.map((item) => (
          <CuratedCard key={item.id} type="button" onClick={() => handleClick(item)}>
            <PhotoBox>
              <Image
                src={item.image!}
                alt={item.name}
                fill
                sizes="160px"
                style={{ objectFit: 'cover' }}
                unoptimized
              />
              <PhotoBadge>
                <Sparkles size={9} />
                <span>HOT</span>
              </PhotoBadge>
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
      </Grid>
    </Wrapper>
  );
}
