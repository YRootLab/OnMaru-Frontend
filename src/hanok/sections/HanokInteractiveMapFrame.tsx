'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, MapPin, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { lightPalette, meok, surface } from '@/design-system/tokens';
import type { Village } from '@/hanok/types';
import { filterLabel } from '@/hanok/filterLabels';
import { createKakaoResourceScope, type KakaoResourceScope } from './kakaoMapResources';

// Light Kobalt & Soft Gray Theme Tokens
const KOBALT_PRIMARY = lightPalette.kobalt[500]; // #2B5CE6
const KOBALT_DEEP = lightPalette.kobalt[700]; // #1A3898
const KOBALT_LIGHT = lightPalette.kobalt[50]; // #EEF3FF
const KOBALT_SUBTLE = 'rgba(43, 92, 230, 0.08)';
const KOBALT_BORDER = 'rgba(43, 92, 230, 0.18)';

// Default Fallback Hanok Photos
const FALLBACK_HANOK_IMAGES = [
  '/images/hanok/hanok-exterior.png',
  '/images/hanok/hanok-main.png',
  '/images/hanok/hanok-porch.png',
  '/images/hanok/hanok-interior.png',
  '/images/hanok/giwa-detail.png',
  '/images/hanok/maru-detail.png',
];

/* HanokMap의 MapWrapper와 같은 식이어야 한다. 다르면 프레임이 감싸는 상자를 비집는다. */
const Frame = styled.div`
  position: relative;
  width: 100%;
  height: clamp(360px, 60vh, 580px);
  overflow: hidden;
  border-radius: 28px;
  background: #ffffff;
  border: 1px solid rgba(43, 92, 230, 0.12);
  box-shadow: none;

  [data-theme='dark'] & {
    background: ${surface.dark.card};
  }
`;

const MapCanvas = styled.div`
  width: 100%;
  height: 100%;

  /* ── Photo Circle Avatar Marker Pins ── */
  .custom-overlay-pin {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transform: translate(-50%, -50%);
    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), z-index 0.1s ease;
    z-index: 10;

    &:hover {
      z-index: 300 !important;
      transform: translate(-50%, -60%) scale(1.15);

      .avatar-thumb {
        border-color: ${KOBALT_PRIMARY};
        box-shadow: none;
      }

      .avatar-label {
        background: #ffffff;
        border-color: ${KOBALT_PRIMARY};
        color: ${KOBALT_DEEP};
        box-shadow: none;
      }
    }
  }

  .avatar-thumb {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid #ffffff;
    background-size: cover;
    background-position: center;
    background-color: ${KOBALT_PRIMARY};
    box-shadow: none;
    flex-shrink: 0;
    transition: all 0.2s ease;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  .avatar-label {
    margin-top: 2px;
    padding: 2px 7px;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid ${KOBALT_BORDER};
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: ${meok[900]};
    white-space: nowrap;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    box-shadow: none;
    font-family: var(--font-hanok);
    transition: all 0.2s ease;
  }
`;

const MapLoadingState = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #ffffff;
  color: ${KOBALT_PRIMARY};
  font-size: 13px;
  font-weight: 500;
  z-index: 10;
  text-align: center;
  padding: 16px;

  [data-theme='dark'] & {
    background: ${surface.dark.card};
  }
`;

const ErrorSubtext = styled.p`
  font-size: 11.5px;
  color: ${meok[700]};
  max-width: 340px;
  line-height: 1.45;
  margin-top: 2px;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

/* ── Bottom Floating Region Bar (Flat White Glass Dock) ── */
const BottomRegionBar = styled.div`
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid ${KOBALT_BORDER};
  border-radius: 9999px;
  padding: 3px 4px;
  display: flex;
  align-items: center;
  gap: 2px;
  box-shadow: none;
  max-width: calc(100% - 28px);
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  [data-theme='dark'] & {
    background: rgba(45, 41, 36, 0.92);
  }
`;

const RegionChip = styled.button<{ $active: boolean }>`
  background: ${({ $active }) =>
    $active
      ? `linear-gradient(135deg, ${KOBALT_PRIMARY} 0%, ${KOBALT_DEEP} 100%)`
      : 'transparent'};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[900])};
  border: none;
  border-radius: 9999px;
  padding: 5px 11px;
  font-size: 12px;
  font-weight: ${({ $active }) => ($active ? 500 : 400)};
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $active }) =>
      $active
        ? `linear-gradient(135deg, ${KOBALT_PRIMARY} 0%, ${KOBALT_DEEP} 100%)`
        : KOBALT_SUBTLE};
    color: ${({ $active }) => ($active ? '#ffffff' : KOBALT_PRIMARY)};
  }

  [data-theme='dark'] & {
    color: ${({ $active }) => ($active ? '#ffffff' : meok[100])};
  }
`;

/* ── Left Collapsible Story Side Panel (Flat Light Glass Drawer) ── */
const LeftPanel = styled(motion.div)`
  position: absolute;
  top: 14px;
  left: 14px;
  width: 280px;
  max-height: calc(100% - 28px);
  z-index: 20;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid ${KOBALT_BORDER};
  border-radius: 18px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  box-shadow: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  [data-theme='dark'] & {
    background: rgba(45, 41, 36, 0.94);
  }

  @media (max-width: 900px) {
    top: auto;
    bottom: 14px;
    left: 14px;
    right: 14px;
    width: auto;
    max-height: 220px;
  }
`;

const PanelHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;

const PanelSubHeader = styled.div`
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.03em;
  color: ${KOBALT_PRIMARY};
`;

const CollapseBtn = styled.button`
  background: rgba(43, 92, 230, 0.08);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${meok[900]};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${KOBALT_PRIMARY};
    color: #ffffff;
  }

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const PanelTitle = styled.h3`
  font-family: var(--font-hanok);
  font-size: 17px;
  font-weight: 500;
  color: ${meok[900]};
  margin: 0 0 4px;
  line-height: 1.25;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const PanelCountBadge = styled.span`
  display: inline-block;
  font-size: 11px;
  font-weight: 500;
  color: ${KOBALT_PRIMARY};
  background: ${KOBALT_LIGHT};
  border: 1px solid ${KOBALT_BORDER};
  padding: 2px 9px;
  border-radius: 9999px;
  margin-bottom: 10px;
  align-self: flex-start;
`;

const PanelDesc = styled.p`
  font-size: 12px;
  color: ${meok[700]};
  line-height: 1.45;
  margin: 0 0 10px;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const MiniCardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const MiniCard = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(43, 92, 230, 0.1);
  border-radius: 12px;
  padding: 7px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${KOBALT_LIGHT};
    border-color: ${KOBALT_PRIMARY};
    box-shadow: none;
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.06);
  }

  [data-theme='dark'] &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
`;

const MiniThumb = styled.div<{ $bg: string | null }>`
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background-color: ${KOBALT_LIGHT};
  ${({ $bg }) =>
    $bg
      ? `background-image: url("${$bg}"); background-size: cover; background-position: center;`
      : `background: linear-gradient(135deg, ${KOBALT_LIGHT} 0%, rgba(43, 92, 230, 0.2) 100%);`}
  flex-shrink: 0;
`;

const MiniInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const MiniTitle = styled.h4`
  font-size: 13px;
  font-weight: 500;
  color: ${meok[900]};
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const MiniMeta = styled.div`
  font-size: 11px;
  font-weight: 400;
  color: ${meok[500]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

/* ── Collapsed Floating Trigger Pill (Flat Glass) ── */
const CollapsedPillBtn = styled(motion.button)`
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 20;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid ${KOBALT_BORDER};
  border-radius: 9999px;
  padding: 7px 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${meok[900]};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: none;
  transition: all 0.2s ease;

  &:hover {
    background: ${KOBALT_LIGHT};
    border-color: ${KOBALT_PRIMARY};
    color: ${KOBALT_PRIMARY};
  }

  [data-theme='dark'] & {
    background: rgba(45, 41, 36, 0.92);
    color: ${meok[100]};
  }
`;

interface HanokInteractiveMapFrameProps {
  villages: Village[];
  onSelectVillage?: (v: Village) => void;
}

interface KakaoMapInstance {
  getLevel(): number;
  panTo(position: unknown): void;
  relayout(): void;
  setBounds(bounds: unknown, ...padding: number[]): void;
  setLevel(level: number, options: { animate: boolean }): void;
}

interface KakaoOverlayInstance {
  setMap(map: KakaoMapInstance | null): void;
}

interface KakaoMarkerInstance {
  setMap(map: KakaoMapInstance | null): void;
}

interface KakaoClustererInstance {
  addMarkers(markers: KakaoMarkerInstance[]): void;
  clear(): void;
}

interface KakaoCluster {
  getCenter(): unknown;
}

const REGIONS = ['전체', '서울', '경북', '전북', '경남', '충남', '강원', '경기', '전남'];

const REGION_STORIES: Record<string, string> = {
  전체: '전국에 남은 궁궐과 고택, 서원과 한옥마을을 지도에서 찾아보세요.',
  서울: '경복궁과 창덕궁부터 청운문학도서관까지, 도심에 남은 궁궐과 현대 한옥.',
  경북: '안동 하회마을과 병산서원 만대루, 유교 문화와 종택의 본향.',
  전북: '전주 한옥마을 학인당과 경기전 돌담길, 호남 사대부의 가옥.',
  경남: '지리산 자락에 선 함양 개평한옥마을 일두고택.',
  충남: '공주한옥마을의 구들장과 외암민속마을 돌담길.',
  강원: '강릉 선교장 열화당과 연못 위 활래정.',
  경기: '화성행궁 곁에 이어진 수원 남문 한옥 거리.',
  전남: '해남 윤선도 고택과 나주 향교, 남도 유학의 자취.',
};

export default function HanokInteractiveMapFrame({
  villages,
  onSelectVillage,
}: HanokInteractiveMapFrameProps) {
  const kakaoAppKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const clustererRef = useRef<KakaoClustererInstance | null>(null);
  const overlaysRef = useRef<KakaoOverlayInstance[]>([]);
  const markersRef = useRef<KakaoMarkerInstance[]>([]);
  const mapResourcesRef = useRef<KakaoResourceScope | null>(null);
  const markerResourcesRef = useRef<KakaoResourceScope | null>(null);

  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(() => kakaoAppKey
    ? null
    : 'NEXT_PUBLIC_KAKAO_MAP_KEY 환경 변수가 없습니다. 개발 서버(npm run dev)를 재시작해 보세요.');

  const validVillages = useMemo(
    () => villages.filter((v) => typeof v.lat === 'number' && typeof v.lng === 'number'),
    [villages]
  );

  const regionVillages = useMemo(() => {
    if (selectedRegion === '전체') return validVillages;
    return validVillages.filter((v) => v.region.includes(selectedRegion));
  }, [validVillages, selectedRegion]);

  // 대한민국 전체 지점이 화면 100%에 맞춰 가득 차도록 바운즈 자동 계산
  const fitKoreaBounds = useCallback((mapInstance: KakaoMapInstance, targets: Village[]) => {
    if (!mapInstance || !window.kakao || !window.kakao.maps || targets.length === 0) return;

    const bounds = new window.kakao.maps.LatLngBounds();
    targets.forEach((v) => {
      if (typeof v.lat === 'number' && typeof v.lng === 'number') {
        bounds.extend(new window.kakao.maps.LatLng(v.lat, v.lng));
      }
    });

    // 상하좌우 여백(32px)으로 대한민국 전역이 시원하게 중앙 렌더링되도록 함
    mapInstance.setBounds(bounds, 32, 32, 32, 32);
  }, []);

  // Kakao Map & MarkerClusterer 초기화
  const initMap = useCallback(() => {
    if (!containerRef.current) return;
    if (!window.kakao || !window.kakao.maps) {
      console.warn('[KakaoMap] kakao.maps is not available on window object.');
      return;
    }

    try {
      window.kakao.maps.load(() => {
        if (!containerRef.current) return;
        const options = {
          center: new window.kakao.maps.LatLng(36.25, 127.6),
          level: 11,
        };


        const map = new window.kakao.maps.Map(containerRef.current, options) as KakaoMapInstance;
        mapRef.current = map;
        mapResourcesRef.current?.dispose();
        const mapResources = createKakaoResourceScope((target, eventName, listener) => {
          window.kakao.maps.event.removeListener(target, eventName, listener);
        });
        mapResourcesRef.current = mapResources;

        // 바탕 지도 클릭 시 스토리 패널 접기
        const handleMapClick = () => {
          setIsStoryExpanded(false);
        };
        window.kakao.maps.event.addListener(map, 'click', handleMapClick);
        mapResources.trackListener(map, 'click', handleMapClick);

        // 클러스터러 스타일 (그림자 제거, 미디엄 폰트)
        if (window.kakao.maps.MarkerClusterer) {
          const clusterer = new window.kakao.maps.MarkerClusterer({
            map,
            averageCenter: true,
            minLevel: 8,
            calculator: [10, 30, 50],
            styles: [
              {
                width: '46px',
                height: '46px',
                background: 'rgba(255, 255, 255, 0.94)',
                border: '1.5px solid #2B5CE6',
                borderRadius: '50%',
                color: '#1A3898',
                textAlign: 'center',
                lineHeight: '43px',
                fontWeight: '500',
                fontSize: '13px',
                boxShadow: 'none',
                fontFamily: 'var(--font-hanok)',
              },
              {
                width: '54px',
                height: '54px',
                background: 'linear-gradient(135deg, #2B5CE6 0%, #1A3898 100%)',
                border: '2px solid #ffffff',
                borderRadius: '50%',
                color: '#ffffff',
                textAlign: 'center',
                lineHeight: '50px',
                fontWeight: '500',
                fontSize: '14px',
                boxShadow: 'none',
                fontFamily: 'var(--font-hanok)',
              },
            ],
          }) as KakaoClustererInstance;
          clustererRef.current = clusterer;
          mapResources.trackCleanup(() => clusterer.clear());
        }

        setIsLoaded(true);

        const relayoutTimer = window.setTimeout(() => {
          map.relayout();
          fitKoreaBounds(map, validVillages);
        }, 120);
        mapResources.trackTimer(relayoutTimer, window.clearTimeout);
      });
    } catch (err: unknown) {
      console.error('[KakaoMap] Map initialization error:', err);
      setErrorMessage('카카오 지도를 초기화하는 중 오류가 발생했습니다.');
    }
  }, [fitKoreaBounds, validVillages]);

  // 마커 / 클러스터러 / 사진 아바타 오버레이 업데이트
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.kakao || !window.kakao.maps) return;

    markerResourcesRef.current?.dispose();
    const markerResources = createKakaoResourceScope((target, eventName, listener) => {
      window.kakao.maps.event.removeListener(target, eventName, listener);
    });
    markerResourcesRef.current = markerResources;

    // 기존 오버레이 및 마커 클리어
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];

    if (clustererRef.current) {
      clustererRef.current.clear();
    }
    markersRef.current = [];

    const newMarkers: KakaoMarkerInstance[] = [];

    regionVillages.forEach((village, idx) => {
      if (typeof village.lat !== 'number' || typeof village.lng !== 'number') return;

      const position = new window.kakao.maps.LatLng(village.lat, village.lng);

      const photoUrl = village.hasImage && village.image
        ? village.image
        : FALLBACK_HANOK_IMAGES[idx % FALLBACK_HANOK_IMAGES.length];

      // 1. 커스텀 사진 오버레이 핀
      const content = document.createElement('div');
      content.className = 'custom-overlay-pin';
      content.innerHTML = `
        <div class="avatar-thumb">
          <img src="${photoUrl}" alt="${village.name}" loading="lazy" decoding="async" onerror="this.src='${FALLBACK_HANOK_IMAGES[0]}'" />
        </div>
        <div class="avatar-label">${village.name}</div>
      `;

      const handleOverlayClick = (e: MouseEvent) => {
        e.stopPropagation();
        setIsStoryExpanded(false); // 핀 클릭 시 스토리 패널 자동 접기
        onSelectVillage?.(village);
        mapRef.current?.panTo(position);
      };
      content.addEventListener('click', handleOverlayClick);
      markerResources.trackCleanup(() => content.removeEventListener('click', handleOverlayClick));

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position,
        content,
        yAnchor: 0.5,
      }) as KakaoOverlayInstance;
      overlaysRef.current.push(customOverlay);
      markerResources.trackOverlay(customOverlay);

      // 2. 마커 클러스터러용 마커 객체
      const transparentImage = new window.kakao.maps.MarkerImage(
        'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        new window.kakao.maps.Size(1, 1)
      );

      const marker = new window.kakao.maps.Marker({
        position,
        image: transparentImage,
      }) as KakaoMarkerInstance;
      const handleMarkerClick = () => {
        setIsStoryExpanded(false); // 마커 클릭 시 스토리 패널 자동 접기
        onSelectVillage?.(village);
        mapRef.current?.panTo(position);
      };
      window.kakao.maps.event.addListener(marker, 'click', handleMarkerClick);
      markerResources.trackListener(marker, 'click', handleMarkerClick);
      markerResources.trackMarker(marker);
      newMarkers.push(marker);
    });

    markersRef.current = newMarkers;

    // 줌 레벨 및 지역 선택에 따른 오버레이 표시 상태 갱신 함수
    const syncOverlayVisibility = () => {
      if (!mapRef.current) return;
      const currentLevel = mapRef.current.getLevel();
      const showOverlays = selectedRegion !== '전체' || currentLevel < 8;

      overlaysRef.current.forEach((overlay) => {
        overlay.setMap(showOverlays ? mapRef.current : null);
      });
    };

    // 초기 상태 갱신
    syncOverlayVisibility();

    // 줌 레벨 변경 시 동적 노출 갱신
    window.kakao.maps.event.addListener(mapRef.current, 'zoom_changed', syncOverlayVisibility);
    markerResources.trackListener(mapRef.current, 'zoom_changed', syncOverlayVisibility);

    // 전국 전체 보기일 때 마커 클러스터러 적용
    if (selectedRegion === '전체' && clustererRef.current) {
      clustererRef.current.addMarkers(newMarkers);

      // 클러스터 클릭 시 스토리 패널 접기 및 해당 위치로 확대
      const handleClusterClick = (cluster: KakaoCluster) => {
        const map = mapRef.current;
        if (!map) return;
        setIsStoryExpanded(false); // 클러스터 클릭 시 스토리 패널 자동 접기
        const level = map.getLevel() - 2;
        const targetLevel = level < 1 ? 1 : level;
        map.setLevel(targetLevel, { animate: true });
        map.panTo(cluster.getCenter());
        const visibilityTimer = window.setTimeout(syncOverlayVisibility, 250);
        markerResources.trackTimer(visibilityTimer, window.clearTimeout);
      };
      window.kakao.maps.event.addListener(clustererRef.current, 'clusterclick', handleClusterClick);
      markerResources.trackListener(clustererRef.current, 'clusterclick', handleClusterClick);
    }

    return () => {
      markerResources.dispose();
      if (markerResourcesRef.current === markerResources) markerResourcesRef.current = null;
      overlaysRef.current = [];
      markersRef.current = [];
    };
  }, [regionVillages, onSelectVillage, isLoaded, selectedRegion]);

  useEffect(() => () => {
    markerResourcesRef.current?.dispose();
    mapResourcesRef.current?.dispose();
    markerResourcesRef.current = null;
    mapResourcesRef.current = null;
    clustererRef.current = null;
    mapRef.current = null;
  }, []);

  // 컨테이너 최종 크기가 초기화 이후에 확정되면(웹폰트 로드, 레이아웃 시프트, 창 리사이즈)
  // 지도는 옛 크기 그대로 남아 오른쪽에 빈 띠가 생기고 바운즈도 어긋난 채 굳는다.
  // 크기가 바뀔 때마다 relayout하고, 전체 보기 상태면 바운즈를 다시 맞춘다.
  useEffect(() => {
    const el = containerRef.current;
    if (!isLoaded || !el) return;

    const observer = new ResizeObserver(() => {
      if (!mapRef.current) return;
      mapRef.current.relayout();
      if (selectedRegion === '전체') {
        fitKoreaBounds(mapRef.current, validVillages);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoaded, selectedRegion, validVillages, fitKoreaBounds]);

  // 지역 클릭 시 지도 이동 및 바운즈 피팅
  const handleRegionClick = (region: string) => {
    setSelectedRegion(region);

    if (!mapRef.current || !window.kakao || !window.kakao.maps) return;

    if (region === '전체') {
      fitKoreaBounds(mapRef.current, validVillages);
    } else {
      const targets = validVillages.filter((v) => v.region.includes(region));
      if (targets.length > 0) {
        fitKoreaBounds(mapRef.current, targets);
      }
    }
  };

  const handleMiniCardClick = (village: Village) => {
    setIsStoryExpanded(false);
    onSelectVillage?.(village);
    if (mapRef.current && typeof village.lat === 'number' && typeof village.lng === 'number') {
      const pos = new window.kakao.maps.LatLng(village.lat, village.lng);
      mapRef.current.setLevel(6, { animate: true });
      mapRef.current.panTo(pos);
    }
  };

  return (
    <Frame>
      {kakaoAppKey && (
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoAppKey}&autoload=false&libraries=services,clusterer`}
          onReady={initMap}
          onError={() => {
            setErrorMessage(
              '카카오 지도 SDK 스크립트를 불러오지 못했습니다. 카카오 개발자 센터에서 http://localhost:3000 도메인이 등록되어 있는지 확인해주세요.'
            );
          }}
        />
      )}

      {errorMessage ? (
        <MapLoadingState style={{ color: '#ef4444' }}>
          <AlertCircle size={24} strokeWidth={2} />
          <div>{errorMessage}</div>
          <ErrorSubtext>
            Kakao Developers 콘솔 → [내 애플리케이션] → [플랫폼] → [Web 사이트 도메인]에 현재 개발 도메인이 등록되어 있어야 합니다.
          </ErrorSubtext>
        </MapLoadingState>
      ) : !isLoaded ? (
        <MapLoadingState>
          <MapPin size={22} strokeWidth={2} />
          지도를 불러오는 중입니다…
        </MapLoadingState>
      ) : null}

      <MapCanvas ref={containerRef} />

      {/* ── Bottom Floating Region Bar (Flat Slim White Dock) ── */}
      <BottomRegionBar>
        {REGIONS.map((r) => {
          const isActive = selectedRegion === r;
          return (
            <RegionChip
              key={r}
              $active={isActive}
              onClick={() => handleRegionClick(r)}
            >
              {r}
            </RegionChip>
          );
        })}
      </BottomRegionBar>

      {/* ── Left Story Side Panel (Flat Light Glass Drawer) ── */}
      <AnimatePresence mode="wait">
        {isStoryExpanded ? (
          <LeftPanel
            key="expanded"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <PanelHeaderRow>
              <PanelSubHeader>한옥 이야기</PanelSubHeader>
              <CollapseBtn onClick={() => setIsStoryExpanded(false)}>
                <ChevronLeft size={16} strokeWidth={2} />
              </CollapseBtn>
            </PanelHeaderRow>

            <PanelTitle>
              {selectedRegion === '전체' ? '전국 한옥' : `${selectedRegion} 한옥`}
            </PanelTitle>
            <PanelCountBadge>{regionVillages.length}곳</PanelCountBadge>

            <PanelDesc>
              {REGION_STORIES[selectedRegion] || REGION_STORIES['전체']}
            </PanelDesc>

            <MiniCardList>
              {regionVillages.slice(0, 3).map((v) => (
                <MiniCard
                  key={v.id}
                  onClick={() => handleMiniCardClick(v)}
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.12 }}
                >
                  <MiniThumb $bg={v.hasImage ? v.image : null} />
                  <MiniInfo>
                    <MiniTitle>{v.name}</MiniTitle>
                    <MiniMeta>
                      {v.region} · {filterLabel(v.type)}
                    </MiniMeta>
                  </MiniInfo>
                </MiniCard>
              ))}
            </MiniCardList>
          </LeftPanel>
        ) : (
          <CollapsedPillBtn
            key="collapsed"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onClick={() => setIsStoryExpanded(true)}
          >
            <BookOpen size={15} strokeWidth={2} style={{ color: KOBALT_PRIMARY }} />
            <span>한옥 이야기 ({regionVillages.length}곳)</span>
            <ChevronRight size={15} strokeWidth={2} />
          </CollapsedPillBtn>
        )}
      </AnimatePresence>
    </Frame>
  );
}
