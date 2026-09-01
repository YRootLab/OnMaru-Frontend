'use client';

import React, { useState, useMemo } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';
import { transientProps } from '@/design-system/styled';
import { meok, lightPalette } from '@/design-system/tokens';
import SectionHeader from '@/hanok/components/SectionHeader';
import type { Village } from '@/hanok/types';
import { Home, Flame, Trees, Coffee, Sparkles, Leaf, Mountain, RotateCw, ArrowUpRight, ExternalLink } from 'lucide-react';

const pulseAnimation = keyframes`
  0% { opacity: 0.6; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.2); }
  100% { opacity: 0.6; transform: scale(0.9); }
`;

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

const RegionFilterChip = styled.button<{ $active: boolean }>`
  border: 1px solid
    ${({ $active }) => ($active ? lightPalette.kobalt[500] : 'rgba(78, 89, 104, 0.12)')};
  background: ${({ $active }) =>
    $active ? lightPalette.kobalt[500] : '#ffffff'};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[900])};
  font-size: 13px;
  font-weight: 600;
  padding: 8px 18px;
  border-radius: 9999px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s ease;

  &:hover {
    border-color: ${lightPalette.kobalt[400]};
    background: ${({ $active }) =>
      $active ? lightPalette.kobalt[500] : '#f8fafc'};
  }
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
  border: 1px solid rgba(255, 255, 255, 0.5);
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
      rgba(0, 0, 0, 0.05) 0%,
      rgba(0, 0, 0, 0.15) 45%,
      rgba(0, 0, 0, 0.76) 100%
    );
  }
`;

const PillIconButton = styled(motion.div, transientProps)<{ $active: boolean }>`
  position: absolute;
  bottom: 20px;
  left: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${({ $active }) => ($active ? '#ffffff' : 'rgba(255, 255, 255, 0.88)')};
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: grid;
  place-items: center;
  font-size: 20px;
  color: ${meok[900]};
  z-index: 5;
`;

const ActiveContentOverlay = styled(motion.div, transientProps)`
  position: absolute;
  bottom: 24px;
  left: 76px;
  right: 28px;
  z-index: 5;
  color: #ffffff;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    left: 76px;
    bottom: 20px;
  }
`;

const InfoGroup = styled.div`
  max-width: 420px;
`;

const TagRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

const StayTag = styled.span`
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${lightPalette.kobalt[100]};
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  padding: 3px 10px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

const LiveAvailableTag = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: #10b981;
  background: rgba(16, 185, 129, 0.18);
  border: 1px solid rgba(16, 185, 129, 0.4);
  padding: 3px 10px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  backdrop-filter: blur(8px);
`;

const PulseDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #10b981;
  animation: ${pulseAnimation} 1.6s ease-in-out infinite;
`;

const StayTitle = styled.h3`
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: clamp(20px, 2.5vw, 26px);
  font-weight: 700;
  margin: 0 0 6px;
  line-height: 1.25;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  color: #ffffff;
`;

const StayDesc = styled.p`
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const DirectBookingBtn = styled.a`
  background: linear-gradient(135deg, ${lightPalette.kobalt[500]} 0%, ${lightPalette.kobalt[700]} 100%);
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 700;
  padding: 9px 16px;
  border-radius: 9999px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  transition: transform 0.18s ease, opacity 0.18s ease;
  box-shadow: 0 4px 14px rgba(43, 92, 230, 0.35);

  &:hover {
    opacity: 0.95;
    transform: scale(1.04);
  }
`;

const DetailActionBtn = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(10px);
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 600;
  padding: 9px 16px;
  border-radius: 9999px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.32);
    border-color: #ffffff;
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
  font-weight: 600;
  color: ${meok[500]};
`;

const RefreshBtn = styled.button`
  border: 1px solid rgba(78, 89, 104, 0.14);
  background: #ffffff;
  color: ${meok[900]};
  font-size: 13px;
  font-weight: 700;
  padding: 8px 18px;
  border-radius: 9999px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${lightPalette.kobalt[400]};
    background: #f8fafc;
  }
`;

const EmptyState = styled.div`
  min-height: 240px;
  background: rgba(78, 89, 104, 0.03);
  border: 1px dashed rgba(78, 89, 104, 0.14);
  border-radius: 24px;
  display: grid;
  place-items: center;
  color: ${meok[500]};
  font-size: 14px;
`;

const FALLBACK_STAYS: Village[] = [
  {
    id: 'stay-1',
    name: '강릉 선교장 열화당 고택',
    region: '강원',
    addr: '강원특별자치도 강릉시 운정길 63',
    lat: 37.7865,
    lng: 128.8872,
    type: '한옥 고택 스테이',
    badges: ['고택숙박', '세계유산', '전통정원'],
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    hasImage: true,
    summary: '300년 사대부 가옥 열화당과 연못 정자 활래정.',
    overview: '조선 사대부 대저택 강릉 선교장에서 선비의 기품과 수중 정자 활래정의 정취를 누리며 머무는 품격 높은 한옥 스테이입니다.',
  },
  {
    id: 'stay-2',
    name: '전주 한옥마을 학인당',
    region: '전북',
    addr: '전북특별자치도 전주시 완산구 향교길 45',
    lat: 35.814,
    lng: 127.153,
    type: '한옥 고택 스테이',
    badges: ['민속문화재', '고택숙박', '도심접근'],
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    hasImage: true,
    summary: '1908년에 지은 전주 한옥마을 최고(最古) 고택.',
    overview: '조선 왕실 후손이 건립한 전주 대표 한옥 학인당은 100년이 넘는 기와지붕과 고풍스러운 툇마루에서 전통 차와 온돌의 온기를 전합니다.',
  },
  {
    id: 'stay-3',
    name: '안동 지례예술촌 고택',
    region: '경북',
    addr: '경상북도 안동시 임동면 지례예술촌길 427',
    lat: 36.562,
    lng: 128.91,
    type: '한옥 고택 스테이',
    badges: ['산자락', '호수뷰', '고택숙박'],
    image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=80',
    hasImage: true,
    summary: '임하호 물안개를 마루에서 바라보는 산자락 고택.',
    overview: '물안개 피어오르는 임하호 산자락 끝에 위치하여 툇마루에 앉아 자연의 쉼을 만끽하는 고즈넉한 사대부 한옥 스테이입니다.',
  },
  {
    id: 'stay-4',
    name: '경주 락희원 한옥스테이',
    region: '경북',
    addr: '경상북도 경주시 첨성로 81-5',
    lat: 35.834,
    lng: 129.215,
    type: '한옥 고택 스테이',
    badges: ['첨성대근처', '조선시대', '포토스팟'],
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    hasImage: true,
    summary: '첨성대와 황리단길을 걸어서 오가는 경주 한옥.',
    overview: '첨성대와 대릉원 돌담길을 따라 걸을 수 있는 최적의 위치에 전통 기와지붕과 현대식 아늑함을 접목한 명품 한옥 스테이입니다.',
  },
  {
    id: 'stay-5',
    name: '함양 개평마을 일두고택 스테이',
    region: '경남',
    addr: '경상남도 함양군 지곡면 개평길 59-1',
    lat: 35.565,
    lng: 127.767,
    type: '한옥 고택 스테이',
    badges: ['국가지정', '선비마을', '고택숙박'],
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    hasImage: true,
    summary: '조선 오현 정여창의 생가, 돌담과 솔숲의 개평마을.',
    overview: '돌담길과 솔숲이 어우러진 개평한옥마을의 으뜸 고택으로 조선 시대 사대부 가옥의 웅장함을 직접 입실해 경험할 수 있습니다.',
  },
  {
    id: 'stay-6',
    name: '공주 공주한옥마을 숙박동',
    region: '충남',
    addr: '충청남도 공주시 관광단지길 12',
    lat: 36.462,
    lng: 127.115,
    type: '한옥 고택 스테이',
    badges: ['온돌구들', '전통체험', '공공건축물'],
    image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=80',
    hasImage: true,
    summary: '참나무 장작으로 직접 불을 때는 황토 온돌방.',
    overview: '백제의 숨결이 흐르는 공주한옥마을 단지 내 전통 참나무 구들목 장작불을 직접 때는 최고급 온돌 힐링 한옥 스테이입니다.',
  },
  {
    id: 'stay-7',
    name: '서울 은평한옥마을 일오재',
    region: '서울',
    addr: '서울특별시 은평구 진관길 24-10',
    lat: 37.641,
    lng: 126.942,
    type: '한옥 고택 스테이',
    badges: ['도심접근', '북한산뷰', '신조성마을'],
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    hasImage: true,
    summary: '안방 대창 너머로 북한산 절경이 드는 도심 한옥.',
    overview: '은평 한옥마을 정중앙에 위치하여 북한산 마루와 맑은 공기를 품고 도심 속 휴식을 제공하는 모던 프라이빗 한옥스테이입니다.',
  },
];

const REGION_TABS = ['전체', '경북', '전북', '강원', '경남', '충남', '서울', '경기'];

const ICONS = [
  <Home size={20} key="home" />,
  <Flame size={20} key="flame" />,
  <Trees size={20} key="trees" />,
  <Coffee size={20} key="coffee" />,
  <Sparkles size={20} key="sparkles" />,
  <Leaf size={20} key="leaf" />,
  <Mountain size={20} key="mountain" />,
];
const BATCH_SIZE = 7;

interface HanokStayAccordionProps {
  villages: Village[];
  onSelectVillage?: (v: Village) => void;
}

export default function HanokStayAccordion({
  villages,
  onSelectVillage,
}: HanokStayAccordionProps) {
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [activeIndex, setActiveIndex] = useState(0);
  const [page, setPage] = useState(0);

  const allStays = useMemo(() => {
    // 예전엔 '고택' 뱃지만 붙어도 스테이로 셌다. 그러면 묵을 수 없는 고택까지 '숙소 N곳'에
    // 들어가고, 도감(스테이 제외)과 합이 전체 수집분을 넘어선다. 실제 숙박(contentTypeId 32)만.
    // 아코디언은 사진이 전부다. 이미지 없는 항목은 까만 빈 알약으로 남아 없느니만 못하다.
    const fetched = villages.filter((v) => v.type === '한옥 고택 스테이' && v.hasImage);
    if (fetched.length >= 3) return fetched;
    return FALLBACK_STAYS;
  }, [villages]);

  const regionFilteredStays = useMemo(() => {
    if (selectedRegion === '전체') return allStays;
    return allStays.filter((s) => s.region.includes(selectedRegion));
  }, [allStays, selectedRegion]);

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
        title="지역별 한옥 고택 스테이"
        subtitle={`대청마루와 온돌을 갖춘 전국 고택 숙소 ${regionFilteredStays.length}곳`}
      />

      <RegionFilterBar>
        {REGION_TABS.map((reg) => (
          <RegionFilterChip
            key={reg}
            $active={selectedRegion === reg}
            onClick={() => handleRegionSelect(reg)}
          >
            {reg}
          </RegionFilterChip>
        ))}
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

                  <PillIconButton $active={isActive}>
                    {icon}
                  </PillIconButton>

                  <AnimatePresence>
                    {isActive && (
                      <ActiveContentOverlay
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.22 }}
                      >
                        <InfoGroup>
                          <TagRow>
                            <StayTag>{item.region}</StayTag>
                            <StayTag>{item.type}</StayTag>
                            <LiveAvailableTag>
                              <PulseDot /> 실시간 예약 연동
                            </LiveAvailableTag>
                          </TagRow>
                          <StayTitle>{item.name}</StayTitle>
                          {/* TourAPI 목록 응답엔 설명이 없다. 없으면 주소라도 보여준다. */}
                          <StayDesc>{item.summary || item.addr}</StayDesc>
                        </InfoGroup>

                        <ActionGroup>
                          <DirectBookingBtn
                            href={getBookingUrl(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            실시간 예약하기 <ExternalLink size={13} />
                          </DirectBookingBtn>
                          {onSelectVillage && (
                            <DetailActionBtn
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectVillage(item);
                              }}
                            >
                              도감 상세 보기 <ArrowUpRight size={13} />
                            </DetailActionBtn>
                          )}
                        </ActionGroup>
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
                <RotateCw size={14} /> 다른 스테이 보기
              </RefreshBtn>
            </ControlsRow>
          )}
        </>
      ) : (
        <EmptyState role="status" aria-live="polite">
          {selectedRegion === '전체'
            ? '등록된 한옥 스테이가 아직 없습니다.'
            : `${selectedRegion}에 등록된 스테이가 없습니다. 다른 지역을 선택해 보세요.`}
        </EmptyState>
      )}
    </Section>
  );
}
