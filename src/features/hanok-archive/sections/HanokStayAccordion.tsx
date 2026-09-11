'use client';

import React, { useState, useMemo } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { transientProps } from '@/design-system/styled';
import { meok, palette, surface } from '@/design-system/tokens';
import SectionHeader from '@/features/hanok-archive/components/SectionHeader';
import { STAY_TYPE } from '@/features/hanok-archive/types';
import type { Village } from '@/features/hanok-archive/types';
import { Home, Flame, Coffee, Sparkles, Leaf, MapPin, RotateCcw, ArrowRight, ExternalLink } from 'lucide-react';

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
    $active ? palette.kobalt[500] : '#ffffff'};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[900])};
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? 500 : 400)};
  padding: 8px 18px;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  opacity: ${({ $active, $empty }) => (!$active && $empty ? 0.45 : 1)};
  transition: all 0.18s ease;

  &:hover {
    background: ${({ $active }) =>
      $active ? palette.kobalt[500] : '#f8fafc'};
    opacity: 1;
  }

  [data-theme='dark'] & {
    background: ${({ $active }) =>
      $active ? palette.kobalt[500] : surface.dark.card};
    color: ${({ $active }) => ($active ? '#ffffff' : meok[100])};
  }

  [data-theme='dark'] &:hover {
    background: ${({ $active }) =>
      $active ? palette.kobalt[500] : 'rgba(255, 255, 255, 0.1)'};
  }
`;

/* 개수는 지역명보다 한 단계 물러나 있어야 이름이 먼저 읽힌다 */
const RegionChipCount = styled.span<{ $active: boolean }>`
  font-size: 11px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  color: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.75)' : meok[400])};
`;

const AccordionContainer = styled.div`
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 460px;
  padding: 8px 0;

  @media (max-width: 768px) {
    justify-content: flex-start;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    padding: 12px 4px 20px;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const AccordionPill = styled(motion.div, transientProps)<{ $active: boolean }>`
  position: relative;
  height: 440px;
  border-radius: ${({ $active }) => ($active ? '32px' : '9999px')};
  overflow: hidden;
  cursor: pointer;

  background-color: ${meok[900]};
  user-select: none;
  flex-shrink: 0;

  @media (max-width: 768px) {
    height: 380px;
    scroll-snap-align: center;
    border-radius: ${({ $active }) => ($active ? '28px' : '9999px')};
    width: ${({ $active }) => ($active ? 'calc(100vw - 80px)' : '72px')};
    max-width: 480px;
  }
`;

const PillImageLayer = styled(motion.div, transientProps)<{ $bg: string | null }>`
  position: absolute;
  inset: 0;
  ${({ $bg }) =>
    $bg
      ? `background-image: url("${$bg}"); background-size: cover; background-position: center 25%;`
      : 'background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);'}
  transition: transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.02) 0%,
      rgba(0, 0, 0, 0.15) 35%,
      rgba(0, 0, 0, 0.72) 70%,
      rgba(0, 0, 0, 0.92) 100%
    );
  }
`;

const CollapsedIconButton = styled(motion.div, transientProps)`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: grid;
  place-items: center;
  color: ${meok[900]};
  z-index: 5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
`;

const ActiveContentOverlay = styled(motion.div, transientProps)`
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  z-index: 5;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 10px;

  @media (max-width: 640px) {
    bottom: 16px;
    left: 16px;
    right: 16px;
    gap: 8px;
  }
`;

const ContentHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const TagRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const StayTag = styled.span`
  font-size: 11.5px;
  font-weight: 500;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  padding: 4px 11px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  letter-spacing: -0.01em;
`;

const StayTitle = styled.h3`
  font-family: var(--font-hanok);
  font-size: clamp(19px, 2.3vw, 25px);
  font-weight: 500;
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.28;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  color: #ffffff;
  word-break: keep-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const StayAddress = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.4;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  min-width: 0;
  width: 100%;
`;

const StayAddressText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: keep-all;
  flex: 1;
  min-width: 0;
`;

const BottomActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
`;

const ActiveIconButton = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #ffffff;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: grid;
  place-items: center;
  color: ${meok[900]};
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  transition: transform 0.18s ease;

  &:hover {
    transform: scale(1.06);
  }
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const DirectBookingBtn = styled.a`
  background: ${palette.cheongrok[700]};
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 500;
  padding: 9px 15px;
  border-radius: 9999px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  border: none;
  transition: transform 0.18s ease, background 0.18s ease;

  &:hover {
    background: ${palette.cheongrok[900]};
    transform: translateY(-1px);
  }

  [data-theme='dark'] & {
    background: ${palette.cheongrok[500]};
    &:hover {
      background: ${palette.cheongrok[400]};
    }
  }
`;

const DetailActionBtn = styled.button`
  background: rgba(45, 52, 43, 0.78);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 500;
  padding: 9px 15px;
  border-radius: 9999px;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.18s ease;

  &:hover {
    background: rgba(45, 52, 43, 0.95);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
`;

function getBookingUrl(item: Village): string {
  if (item.overview) {
    const match = item.overview.match(/https?:\/\/[^\s"']+/i);
    if (match) return match[0];
  }
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(item.name + ' 예약')}`;
}


const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding: 0 4px;
`;

const BatchInfo = styled.span`
  font-size: 13px;
  font-weight: 400;
  color: ${meok[500]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const RefreshBtn = styled.button`

  background: #ffffff;
  color: ${meok[900]};
  font-size: 13px;
  font-weight: 500;
  padding: 8px 18px;
  border-radius: 9999px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
  }

  [data-theme='dark'] & {
    background: ${surface.dark.card};
    color: ${meok[100]};
  }

  [data-theme='dark'] &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

/*
  빈 지역은 막다른 길이 아니다. 실제 한옥 스테이는 경북·전북에 몰려 있어
  부산·제주 같은 곳은 한두 곳뿐이거나 아예 없다. 그 사실을 숨기지 않되,
  "없다"로 끝내지 말고 다음 행동을 쥐여 준다.
*/
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

const EmptyHeadline = styled.p`
  margin: 0;
  font-size: clamp(16px, 1.8vw, 19px);
  font-weight: 300;
  letter-spacing: -0.02em;
  color: ${meok[900]};
  word-break: keep-all;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const EmptyHint = styled.p`
  margin: 0;
  font-size: 13.5px;
  font-weight: 400;
  line-height: 1.7;
  color: ${meok[500]};
  word-break: keep-all;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const EmptyAction = styled.button`
  margin-top: 6px;
  padding: 10px 22px;
  border-radius: 9999px;
  background: ${meok[900]};
  color: #ffffff;
  font-family: inherit;
  font-size: 13px;
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

/*
  시도를 행정구역 순으로 적어 둔 기준표. 탭 자체는 여기서 바로 그리지 않는다.

  전에는 이 배열이 곧 탭이었다. 그래서 두 가지가 동시에 틀렸다 —
  경북·경남·전남·광주·울산이 아예 빠져 있어 고택이 가장 많은 지역을 고를 수 없었고,
  마지막의 '전남광주통합특별시'는 region 값('전남'·'광주')과 겹치는 글자가 없어
  영원히 0곳인 칩으로 남아 있었다. 0곳 칩 다섯 개가 나란히 선 화면이 그 결과다.

  순서만 여기서 정하고, 실제로 설 탭은 수집분에 있는 지역으로 고른다.
*/
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

const ICONS = [
  <Home size={20} strokeWidth={2} key="home" />,
  <Flame size={20} strokeWidth={2} key="flame" />,
  <Leaf size={20} strokeWidth={2} key="trees" />,
  <Coffee size={20} strokeWidth={2} key="coffee" />,
  <Sparkles size={20} strokeWidth={2} key="sparkles" />,
  <Leaf size={20} strokeWidth={2} key="leaf" />,
  <MapPin size={20} strokeWidth={2} key="mountain" />,
];
const BATCH_SIZE = 7;

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [page, setPage] = useState(0);

  const allStays = useMemo(() => {
    /*
      예전엔 '고택' 뱃지만 붙어도 스테이로 셌다. 그러면 묵을 수 없는 고택까지 '숙소 N곳'에
      들어가고, 도감(스테이 제외)과 합이 전체 수집분을 넘어선다. 실제 숙박만 센다.

      여기에 hasImage 조건이 하나 더 붙어 있었다. 사진 없는 알약이 볼품없다는 이유였는데,
      도감 그리드는 스테이를 통째로 빼므로 그렇게 걸러진 곳은 페이지 어디에도 남지 않았다.
      인트로가 259곳이라 적고 도감이 159곳, 여기가 88곳이던 산술이 그 12곳이다.
      PillImageLayer가 사진 없을 때 쓸 바탕을 이미 갖고 있으니 조건을 걷는다.
    */
    const fetched = villages.filter((v) => v.type === STAY_TYPE);
    if (fetched.length >= 3) return fetched;
    return FALLBACK_STAYS;
  }, [villages]);

  /*
    설 탭은 수집분이 정한다.

    한 곳도 없는 지역을 세워 두면 '눌러도 아무 일이 없는 칩'이 되고, 그런 칩이 여럿이면
    데이터가 비어 보인다. 없는 지역은 아예 세우지 않는다.
  */
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

  // 칩마다 filter를 돌리면 지역 수만큼 전체 순회가 반복된다. 한 번에 세어 둔다.
  const countByRegion = useMemo(() => {
    const counts: Record<string, number> = { 전체: allStays.length };
    for (const tab of regionTabs) {
      if (tab === '전체') continue;
      counts[tab] = allStays.filter((s) => s.region.includes(tab)).length;
    }
    return counts;
  }, [allStays, regionTabs]);

  const maxPages = Math.max(1, Math.ceil(regionFilteredStays.length / BATCH_SIZE));
  const currentBatch = useMemo(() => {
    const start = (page % maxPages) * BATCH_SIZE;
    return regionFilteredStays.slice(start, start + BATCH_SIZE);
  }, [regionFilteredStays, page, maxPages]);

  const handleRegionSelect = (reg: string) => {
    setSelectedRegion(reg);
    setPage(0);
    setActiveIndex(0);
  };

  const handleNextBatch = () => {
    setPage((prev) => (prev + 1) % maxPages);
    setActiveIndex(0);
  };

  return (
    <Section id="hanok-stays" aria-labelledby="stay-heading">
      <SectionHeader
        id="stay-heading"
        title="지역별 한옥 스테이"
        // 부제는 도감 전체 규모를 말한다. 지역을 골라도 흔들리지 않아야
        // '전국'이라는 말과 어긋나지 않는다. 지금 몇 곳을 보고 있는지는 하단 페이저가 맡는다.
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
              <RegionChipCount $active={isActive}>{count}</RegionChipCount>
            </RegionFilterChip>
          );
        })}
      </RegionFilterBar>

      {currentBatch.length > 0 ? (
        <>
          <AccordionContainer>
            {currentBatch.map((item, idx) => {
              const isActive = idx === activeIndex;
              const icon = ICONS[idx % ICONS.length];

              return (
                <AccordionPill
                  key={item.id}
                  $active={isActive}
                  onClick={() => setActiveIndex(idx)}
                  animate={{
                    flex: isActive ? 3.5 : 0.6,
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                  whileHover={{ scale: isActive ? 1 : 1.03 }}
                >
                  <PillImageLayer $bg={item.hasImage ? item.image : null} />

                  {!isActive && (
                    <CollapsedIconButton>
                      <Home size={20} strokeWidth={2} />
                    </CollapsedIconButton>
                  )}

                  <AnimatePresence>
                    {isActive && (
                      <ActiveContentOverlay
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.22 }}
                      >
                        <ContentHeader>
                          <TagRow>
                            <StayTag>{item.region}</StayTag>
                          </TagRow>
                          <StayTitle>{item.name}</StayTitle>
                          <StayAddress>
                            <MapPin size={13} strokeWidth={2} style={{ flexShrink: 0 }} />
                            <StayAddressText>{item.addr}</StayAddressText>
                          </StayAddress>
                        </ContentHeader>

                        <BottomActionRow>
                          <ActiveIconButton
                            aria-label="한옥 숙소"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectStay) onSelectStay(item);
                              else if (onSelectVillage) onSelectVillage(item);
                            }}
                          >
                            <Home size={20} strokeWidth={2} />
                          </ActiveIconButton>

                          <ActionGroup>
                            <DirectBookingBtn
                              href={getBookingUrl(item)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              지금 예약하기 <ExternalLink size={13} strokeWidth={2} />
                            </DirectBookingBtn>
                            {(onSelectStay || onSelectVillage) && (
                              <DetailActionBtn
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onSelectStay) onSelectStay(item);
                                  else if (onSelectVillage) onSelectVillage(item);
                                }}
                              >
                                숙소 상세 <ArrowRight size={13} strokeWidth={2} />
                              </DetailActionBtn>
                            )}
                          </ActionGroup>
                        </BottomActionRow>
                      </ActiveContentOverlay>
                    )}
                  </AnimatePresence>
                </AccordionPill>
              );
            })}
          </AccordionContainer>

          {maxPages > 1 && (
            <ControlsRow>
              <BatchInfo>
                {page + 1} / {maxPages} · {selectedRegion} {regionFilteredStays.length}곳
              </BatchInfo>
              <RefreshBtn onClick={handleNextBatch}>
                <RotateCcw size={14} strokeWidth={2} /> 다른 스테이 보기
              </RefreshBtn>
            </ControlsRow>
          )}
        </>
      ) : (
        <EmptyState role="status" aria-live="polite">
          {selectedRegion === '전체' ? (
            <>
              <EmptyHeadline>아직 기록된 한옥 스테이가 없습니다</EmptyHeadline>
              <EmptyHint>잠시 뒤에 다시 열어 보시겠어요?</EmptyHint>
            </>
          ) : (
            <>
              <EmptyHeadline>{selectedRegion}에는 아직 묵어갈 한옥이 없습니다</EmptyHeadline>
              <EmptyHint>
                이 지역에서 하룻밤 묵어본 한옥이 있으신가요?
                <br />
                알려주시면 도감에 더하겠습니다.
              </EmptyHint>
              <EmptyAction type="button" onClick={() => handleRegionSelect('전체')}>
                전국 한옥 스테이 {allStays.length}곳 보기
              </EmptyAction>
            </>
          )}
        </EmptyState>
      )}
    </Section>
  );
}
