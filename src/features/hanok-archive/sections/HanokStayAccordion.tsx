'use client';

import React, { useState, useMemo } from 'react';
import styled from '@emotion/styled';
import { meok, palette, surface, fontSize } from '@/design-system/tokens';
import SectionHeader from '@/features/hanok-archive/components/SectionHeader';
import VillageCard from '@/features/hanok-archive/components/VillageCard';
import { STAY_TYPE, type Village } from '@/features/hanok-archive/types';
import { OniSearchEmpty } from '@/shared/components/OniSearchEmpty/OniSearchEmpty';

const Section = styled.section`
  position: relative;
`;

const RegionFilterBar = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 24px;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const RegionFilterChip = styled.button<{ $active: boolean; $empty?: boolean }>`
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  background: ${({ $active }) =>
    $active ? palette.juhong[500] : '#ffffff'};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[900])};
  font-size: ${fontSize.xs};
  font-weight: ${({ $active }) => ($active ? 500 : 400)};
  padding: 8px 18px;
  border-radius: 9999px;
  border: 1px solid ${({ $active }) => ($active ? 'transparent' : meok[300])};
  cursor: pointer;
  white-space: nowrap;
  opacity: ${({ $active, $empty }) => (!$active && $empty ? 0.45 : 1)};
  transition: all 0.18s ease;

  &:hover {
    background: ${({ $active }) =>
      $active ? palette.juhong[500] : '#f8fafc'};
    opacity: 1;
  }

  [data-theme='dark'] & {
    background: ${({ $active }) =>
      $active ? palette.juhong[500] : surface.dark.card};
    color: ${({ $active }) => ($active ? '#ffffff' : meok[100])};
    border-color: ${({ $active }) => ($active ? 'transparent' : meok[700])};
  }

  [data-theme='dark'] &:hover {
    background: ${({ $active }) =>
      $active ? palette.juhong[500] : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const StayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;

  @media (min-width: 800px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  @media (min-width: 1080px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }
`;







const EmptyState = styled.div`
  min-height: 240px;
  background: rgba(78, 89, 104, 0.03);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 32px 24px;
  text-align: center;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.04);
  }
`;


const EmptyAction = styled.button`
  margin-top: 6px;
  padding: 10px 22px;
  border-radius: 9999px;
  background: ${meok[900]};
  color: #ffffff;
  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.18s ease, transform 0.18s ease;

  &:hover {
    opacity: 0.88;
    transform: translateY(-1px);
  }

  [data-theme='dark'] & {
    background: ${meok[100]};
    color: ${meok[900]};
  }
`;

const FALLBACK_STAYS: Village[] = [
  {
    id: 'stay-1',
    name: '강릉 선교장 열화당 고택',
    region: '강원',
    addr: '강원특별자치도 강릉시 운정길 63',
    lat: 37.7865,
    lng: 128.8872,
    type: STAY_TYPE,
    badges: ['고택숙박', '세계유산', '전통정원'],
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    hasImage: true,
    summary: '300년 사대부 가옥 열화당과 연못 정자 활래정.',
    overview: '300년 된 사대부 가옥에서 하룻밤 묵습니다. 연못 위에 세운 정자 활래정과 사랑채 열화당을 함께 둘러볼 수 있습니다.',
  },
  {
    id: 'stay-2',
    name: '전주 한옥마을 학인당',
    region: '전북',
    addr: '전북특별자치도 전주시 완산구 향교길 45',
    lat: 35.814,
    lng: 127.153,
    type: STAY_TYPE,
    badges: ['민속문화재', '고택숙박', '도심접근'],
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    hasImage: true,
    summary: '1908년에 지은 전주 한옥마을 최고(最古) 고택.',
    overview: '조선 왕실 후손이 1908년에 지은 고택입니다. 100년 넘은 기와지붕 아래 툇마루에서 전통 차를 마시고 온돌방에서 묵습니다.',
  },
  {
    id: 'stay-3',
    name: '안동 지례예술촌 고택',
    region: '경북',
    addr: '경상북도 안동시 임동면 지례예술촌길 427',
    lat: 36.562,
    lng: 128.91,
    type: STAY_TYPE,
    badges: ['산자락', '호수뷰', '고택숙박'],
    image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=80',
    hasImage: true,
    summary: '임하호 물안개를 마루에서 바라보는 산자락 고택.',
    overview: '임하호가 내려다보이는 산자락 끝 사대부 고택입니다. 툇마루에 앉으면 아침마다 호수 위로 물안개가 오릅니다.',
  },
  {
    id: 'stay-4',
    name: '경주 락희원 한옥스테이',
    region: '경북',
    addr: '경상북도 경주시 첨성로 81-5',
    lat: 35.834,
    lng: 129.215,
    type: STAY_TYPE,
    badges: ['첨성대근처', '조선시대', '포토스팟'],
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    hasImage: true,
    summary: '첨성대와 황리단길을 걸어서 오가는 경주 한옥.',
    overview: '첨성대와 대릉원 돌담길을 걸어서 오갑니다. 전통 기와지붕은 그대로 두고 실내는 현대식으로 고쳤습니다.',
  },
  {
    id: 'stay-5',
    name: '함양 개평마을 일두고택 스테이',
    region: '경남',
    addr: '경상남도 함양군 지곡면 개평길 59-1',
    lat: 35.565,
    lng: 127.767,
    type: STAY_TYPE,
    badges: ['국가지정', '선비마을', '고택숙박'],
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    hasImage: true,
    summary: '조선 오현 정여창의 생가, 돌담과 솔숲의 개평마을.',
    overview: '조선 오현 정여창의 생가입니다. 돌담길과 솔숲이 이어진 개평한옥마을에서 사대부 가옥 구조를 방 안에서 직접 봅니다.',
  },
  {
    id: 'stay-6',
    name: '공주 공주한옥마을 숙박동',
    region: '충남',
    addr: '충청남도 공주시 관광단지길 12',
    lat: 36.462,
    lng: 127.115,
    type: STAY_TYPE,
    badges: ['온돌구들', '전통체험', '공공건축물'],
    image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=80',
    hasImage: true,
    summary: '참나무 장작으로 직접 불을 때는 황토 온돌방.',
    overview: '백제의 도읍 공주, 한옥마을 안에 있는 숙박동입니다. 참나무 장작으로 직접 불을 때는 황토 온돌방에서 묵습니다.',
  },
  {
    id: 'stay-7',
    name: '서울 은평한옥마을 일오재',
    region: '서울',
    addr: '서울특별시 은평구 진관길 24-10',
    lat: 37.641,
    lng: 126.942,
    type: STAY_TYPE,
    badges: ['도심접근', '북한산뷰', '신조성마을'],
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    hasImage: true,
    summary: '안방 대청 너머로 북한산 능선이 드는 도심 한옥.',
    overview: '은평한옥마을 한가운데 자리한 독채 한옥입니다. 안방 대청 너머로 북한산 능선이 그대로 들어옵니다.',
  },
];











const REGION_ORDER = [
  '서울',
  '부산',
  '대구',
  '인천',
  '광주',
  '대전',
  '울산',
  '세종',
  '경기',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
];


interface HanokStayAccordionProps {
  villages: Village[];
  onSelectVillage?: (v: Village) => void;
  onSelectStay?: (stay: Village) => void;
}

export default function HanokStayAccordion({
  villages,
  onSelectVillage,
  onSelectStay,
}: HanokStayAccordionProps) {
  const [selectedRegion, setSelectedRegion] = useState('전체');

  const allStays = useMemo(() => {









    const fetched = villages.filter((v) => v.type === STAY_TYPE);
    if (fetched.length >= 3) return fetched;
    return FALLBACK_STAYS;
  }, [villages]);







  const regionTabs = useMemo(() => {
    const present = REGION_ORDER.filter((region) =>
      allStays.some((stay) => stay.region.includes(region)),
    );
    return ['전체', ...present];
  }, [allStays]);

  const regionFilteredStays = useMemo(() => {
    if (selectedRegion === '전체') return allStays;
    return allStays.filter((s) => s.region.includes(selectedRegion));
  }, [allStays, selectedRegion]);


  const countByRegion = useMemo(() => {
    const counts: Record<string, number> = { 전체: allStays.length };
    for (const tab of regionTabs) {
      if (tab === '전체') continue;
      counts[tab] = allStays.filter((s) => s.region.includes(tab)).length;
    }
    return counts;
  }, [allStays, regionTabs]);

  const handleRegionSelect = (reg: string) => {
    setSelectedRegion(reg);
  };

  return (
    <Section id="hanok-stays" aria-labelledby="stay-heading">
      <SectionHeader
        id="stay-heading"
        title="지역별 한옥 스테이"


        subtitle={`${allStays.length}곳`}
      />

      <RegionFilterBar>
        {regionTabs.map((reg) => {
          const count = countByRegion[reg] ?? 0;
          const isActive = selectedRegion === reg;
          return (
            <RegionFilterChip
              key={reg}
              $active={isActive}
              $empty={count === 0}
              onClick={() => handleRegionSelect(reg)}
              aria-label={`${reg} ${count}곳`}
            >
              {reg}
            </RegionFilterChip>
          );
        })}
      </RegionFilterBar>

      {regionFilteredStays.length > 0 ? (
        <StayGrid>
          {regionFilteredStays.map((item) => (
            <VillageCard
              key={item.id}
              village={item}
              onClick={onSelectStay ?? onSelectVillage}
            />
          ))}
        </StayGrid>
      ) : (
        <EmptyState role="status" aria-live="polite">
          <OniSearchEmpty
            size="md"
            title={
              selectedRegion === '전체'
                ? '아직 기록된 한옥 스테이가 없습니다'
                : `${selectedRegion}에는 아직 묵어갈 한옥이 없습니다`
            }
            description={
              selectedRegion === '전체'
                ? '잠시 후 다시 확인해 주세요.'
                : '이 지역은 아직 모으는 중이에요.\n다른 지역의 한옥 스테이부터 둘러보시겠어요?'
            }
            action={
              selectedRegion !== '전체' ? (
                <EmptyAction type="button" onClick={() => handleRegionSelect('전체')}>
                  전국 한옥 스테이 {allStays.length}곳 보기
                </EmptyAction>
              ) : undefined
            }
          />
        </EmptyState>
      )}
    </Section>
  );
}
