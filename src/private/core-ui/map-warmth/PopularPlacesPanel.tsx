'use client';

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { X, Landmark } from 'lucide-react';
import { lightPalette, meok , fontSize } from '@/design-system/tokens';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import type { RankedPlace } from '@/features/map/types';

const REGIONS = [
  { id: 'all', label: '전국' },
  { id: '전주', label: '전주' },
  { id: '안동', label: '안동' },
  { id: '경주', label: '경주' },
  { id: '서울', label: '서울' },
  { id: '담양', label: '담양' },
  { id: '강릉', label: '강릉' },
  { id: '제주', label: '제주' },
];

const PanelRoot = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;

  [data-theme='dark'] & {
    background: #2D2924;
  }
`;


const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 10px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: ${fontSize.base};
  font-weight: 500;
  color: ${meok[900]};
  letter-spacing: -0.02em;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const CloseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;

  border-radius: 50%;
  background: rgba(25, 31, 40, 0.04);
  color: ${meok[700]};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(25, 31, 40, 0.1);
    color: ${meok[900]};
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
    color: ${meok[400]};

    &:hover {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
    }
  }
`;


const SubHeader = styled.div`
  padding: 0 20px 12px;
`;

const SubText = styled.p`
  margin: 0 0 12px;
  font-size: ${fontSize.xs};
  color: ${meok[500]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const RegionScroller = styled.div`
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const RegionChip = styled.button<{ $active: boolean }>`
  flex: none;
  padding: 6px 13px;

  border-radius: 9999px;
  background: ${({ $active }) =>
    $active ? meok[900] : 'rgba(78, 89, 104, 0.07)'};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $active }) =>
      $active ? meok[900] : 'rgba(78, 89, 104, 0.12)'};
    color: ${({ $active }) => ($active ? '#ffffff' : meok[900])};
  }

  [data-theme='dark'] & {
    background: ${({ $active }) =>
      $active ? '#ffffff' : 'rgba(255, 255, 255, 0.08)'};
    color: ${({ $active }) => ($active ? meok[900] : meok[400])};

    &:hover {
      background: ${({ $active }) =>
        $active ? '#ffffff' : 'rgba(255, 255, 255, 0.14)'};
      color: ${({ $active }) => ($active ? meok[900] : '#ffffff')};
    }
  }
`;


const ListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 4px 12px 24px;
`;

const PlaceRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 12px;
  margin-bottom: 6px;
  border-radius: 16px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(78, 89, 104, 0.05);
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.985);
  }

  [data-theme='dark'] & {
    background: #2D2924;

    &:hover {
      background: rgba(255, 255, 255, 0.06);
    }
  }
`;

const LeftCol = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
  flex: 1;
`;

const RankNum = styled.span<{ $rank: number }>`
  font-size: ${fontSize.base};
  font-weight: 700;
  color: ${({ $rank }) =>
    $rank === 1
      ? lightPalette.juhong[500]
      : $rank === 2
        ? '#d97706'
        : $rank === 3
          ? '#eab308'
          : meok[500]};
  width: 18px;
  flex-shrink: 0;
  line-height: 1.2;
`;

const PlaceInfo = styled.div`
  min-width: 0;
  flex: 1;
`;

const Name = styled.h4`
  margin: 0 0 4px;
  font-size: ${fontSize.sm};
  font-weight: 500;
  color: ${meok[900]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const Meta = styled.p`
  margin: 0;
  font-size: ${fontSize.xs};
  color: ${meok[500]};
  display: flex;
  align-items: center;
  gap: 6px;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const RightCol = styled.div`
  margin-left: 12px;
  flex-shrink: 0;
`;

const ThumbImg = styled.img`
  width: 58px;
  height: 58px;
  border-radius: 12px;
  object-fit: cover;
  background: #f0eae0;
`;

const PlaceholderThumb = styled.div`
  width: 58px;
  height: 58px;
  border-radius: 12px;
  background: #f7f1e6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${lightPalette.juhong[500]};
`;

export default function PopularPlacesPanel() {
  const map = useMapStore((s) => s.map);
  const items = useMapStore((s) => s.items);
  const setSelectedId = useMapStore((s) => s.setSelectedId);
  const setDetailFromPopular = useMapStore((s) => s.setDetailFromPopular);
  const setPopularPanelOpen = useMapStore((s) => s.setPopularPanelOpen);

  const [region, setRegion] = useState('all');
  const [rankedList, setRankedList] = useState<RankedPlace[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    setLoading(true);
    fetch(`/api/popular-places?region=${encodeURIComponent(region)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.items) {
          setRankedList(data.items);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [region]);

  const handleSelectPlace = (place: RankedPlace) => {
    const matched = items.find(
      (i) => i.id === place.placeId || i.name.includes(place.placeName.split(' ')[0]),
    );
    const targetId = matched?.id || place.placeId;

    setSelectedId(targetId);
    setDetailFromPopular(targetId);

    if (matched && map && window.kakao?.maps) {
      map.panTo(new window.kakao.maps.LatLng(matched.lat, matched.lng));
    } else if (place.lat && place.lng && map && window.kakao?.maps) {
      map.panTo(new window.kakao.maps.LatLng(place.lat, place.lng));
    }
  };

  return (
    <PanelRoot>
      {}
      <TopBar>
        <Title>실시간 인기 장소</Title>
        <CloseBtn
          type="button"
          onClick={() => setPopularPanelOpen(false)}
          aria-label="인기 장소 패널 닫기"
        >
          <X size={20} strokeWidth={2} />
        </CloseBtn>
      </TopBar>

      {}
      <SubHeader>
        <SubText>한국관광공사 TourAPI 조회순 상위 한옥·전통 명소예요.</SubText>
        <RegionScroller role="tablist" aria-label="지역별 인기 장소">
          {REGIONS.map((reg) => (
            <RegionChip
              key={reg.id}
              type="button"
              role="tab"
              aria-selected={region === reg.id}
              $active={region === reg.id}
              onClick={() => setRegion(reg.id)}
            >
              {reg.label}
            </RegionChip>
          ))}
        </RegionScroller>
      </SubHeader>

      {}
      <ListContainer>
        {rankedList.map((place, idx) => (
          <PlaceRow
            key={place.placeId || idx}
            onClick={() => handleSelectPlace(place)}
            role="button"
            aria-label={`${idx + 1}위 ${place.placeName}`}
          >
            <LeftCol>
              <RankNum $rank={idx + 1}>{idx + 1}</RankNum>
              <PlaceInfo>
                <Name>{place.placeName}</Name>
                {


}
                <Meta>
                  <span>{place.placeRegion}</span>
                  <span>·</span>
                  <span>{place.placeType}</span>
                </Meta>
              </PlaceInfo>
            </LeftCol>

            <RightCol>
              {place.image ? (
                <ThumbImg
                  src={place.image}
                  alt={place.placeName}
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <PlaceholderThumb>
                  <Landmark size={22} strokeWidth={2} />
                </PlaceholderThumb>
              )}
            </RightCol>
          </PlaceRow>
        ))}
      </ListContainer>
    </PanelRoot>
  );
}
