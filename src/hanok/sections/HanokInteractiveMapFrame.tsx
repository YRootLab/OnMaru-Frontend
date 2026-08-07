'use client';

import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import { lightPalette, meok } from '@/design-system/tokens';
import { ArrowRight } from 'lucide-react';
import type { Village } from '@/hanok/types';

const Frame = styled.div`
  position: relative;
  width: 100%;
  height: 580px;
  overflow: hidden;
  border-radius: 28px;

  .leaflet-container {
    width: 100%;
    height: 100%;
    background: #f8fafc;
    font-family: 'SpoqaHanSansNeo', sans-serif;
  }

  .leaflet-popup-content-wrapper {
    border-radius: 20px;
    padding: 0;
    box-shadow: none;
    background: rgba(238, 243, 255, 0.96);
    backdrop-filter: blur(16px);
  }

  .leaflet-popup-content {
    margin: 16px 18px;
  }

  .leaflet-popup-tip-container {
    display: none;
  }
`;

/* ── Left Story Side Panel ── */
const LeftPanel = styled(motion.div)`
  position: absolute;
  top: 20px;
  left: 20px;
  width: 320px;
  max-height: calc(100% - 40px);
  z-index: 1000;
  background: rgba(238, 243, 255, 0.96);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 900px) {
    top: auto;
    bottom: 20px;
    left: 20px;
    right: 20px;
    width: auto;
    max-height: 220px;
  }
`;

const PanelSubHeader = styled.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${lightPalette.kobalt[500]};
  margin-bottom: 6px;
`;

const PanelTitle = styled.h3`
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: ${meok[900]};
  margin: 0 0 6px;
  line-height: 1.25;
`;

const PanelCountBadge = styled.span`
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  color: ${lightPalette.kobalt[700]};
  background: ${lightPalette.kobalt[100]};
  padding: 3px 12px;
  border-radius: 9999px;
  margin-bottom: 16px;
  align-self: flex-start;
`;

const PanelDesc = styled.p`
  font-size: 13px;
  color: ${meok[500]};
  line-height: 1.55;
  margin: 0 0 16px;
`;

const MiniCardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MiniCard = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 12px;
  background: #ffffff;
  border-radius: 16px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${lightPalette.kobalt[50]};
  }
`;

const MiniThumb = styled.div<{ $bg: string | null }>`
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background-color: ${lightPalette.kobalt[100]};
  ${({ $bg }) =>
    $bg
      ? `background-image: url("${$bg}"); background-size: cover; background-position: center;`
      : `background: linear-gradient(135deg, ${lightPalette.kobalt[100]} 0%, ${lightPalette.kobalt[200]} 100%);`}
  flex-shrink: 0;
`;

const MiniInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const MiniTitle = styled.h4`
  font-size: 14px;
  font-weight: 700;
  color: ${meok[900]};
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MiniMeta = styled.div`
  font-size: 11.5px;
  color: ${meok[500]};
`;

/* ── Right Vertical Region Selector List Panel ── */
const RightPanel = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 150px;
  z-index: 1000;
  background: rgba(238, 243, 255, 0.96);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;

  @media (max-width: 900px) {
    display: none;
  }
`;

const RightHeader = styled.div`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${lightPalette.kobalt[400]};
  padding: 0 8px;
  margin-bottom: 10px;
`;

const RegionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const RegionItemBtn = styled.button<{ $active: boolean }>`
  position: relative;
  background: ${({ $active }) =>
    $active
      ? `linear-gradient(135deg, ${lightPalette.kobalt[500]} 0%, ${lightPalette.kobalt[700]} 100%)`
      : 'transparent'};
  color: ${({ $active }) => ($active ? '#ffffff' : lightPalette.kobalt[700])};
  border: none;
  border-radius: 14px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $active }) =>
      $active
        ? `linear-gradient(135deg, ${lightPalette.kobalt[500]} 0%, ${lightPalette.kobalt[700]} 100%)`
        : lightPalette.kobalt[50]};
    color: ${({ $active }) => ($active ? '#ffffff' : lightPalette.kobalt[700])};
  }
`;

/* ── Leaflet Popup Styles ── */
const PopupContent = styled.div`
  min-width: 190px;
`;

const PopupTag = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: ${lightPalette.kobalt[500]};
  background: ${lightPalette.kobalt[50]};
  padding: 2px 8px;
  border-radius: 9999px;
`;

const PopupTitle = styled.h4`
  font-size: 16px;
  font-weight: 700;
  color: ${meok[900]};
  margin: 8px 0 4px;
  line-height: 1.3;
`;

const PopupAddr = styled.p`
  font-size: 12px;
  color: ${meok[500]};
  margin: 0 0 12px;
`;

const ViewBtn = styled.button`
  width: 100%;
  background: ${meok[900]};
  color: #ffffff;
  border: none;
  padding: 8px 12px;
  border-radius: 9999px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${lightPalette.kobalt[500]};
  }
`;

interface HanokInteractiveMapFrameProps {
  villages: Village[];
  onSelectVillage?: (v: Village) => void;
}

const REGIONS = ['전체', '서울', '경북', '전북', '경남', '충남', '강원', '경기', '전남'];

const REGION_COORDS: Record<string, [number, number, number]> = {
  전체: [36.2, 127.8, 7],
  서울: [37.5665, 126.978, 11],
  경북: [36.5684, 128.7297, 8],
  전북: [35.8242, 127.148, 9],
  경남: [35.2383, 128.6924, 8],
  충남: [36.5184, 126.8, 9],
  강원: [37.8228, 128.1555, 8],
  경기: [37.4138, 127.5183, 9],
  전남: [34.816, 126.463, 8],
};

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

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

const MapContainerComp = MapContainer as any;
const TileLayerComp = TileLayer as any;
const CircleMarkerComp = CircleMarker as any;

export default function HanokInteractiveMapFrame({
  villages,
  onSelectVillage,
}: HanokInteractiveMapFrameProps) {
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [mapState, setMapState] = useState<{ center: [number, number]; zoom: number }>({
    center: [36.2, 127.8],
    zoom: 7,
  });

  const validVillages = villages.filter(
    (v) => typeof v.lat === 'number' && typeof v.lng === 'number'
  );

  const regionVillages = useMemo(() => {
    if (selectedRegion === '전체') return validVillages;
    return validVillages.filter((v) => v.region.includes(selectedRegion));
  }, [validVillages, selectedRegion]);

  const handleRegionClick = (region: string) => {
    setSelectedRegion(region);
    const coords = REGION_COORDS[region] || REGION_COORDS['전체'];
    setMapState({ center: [coords[0], coords[1]], zoom: coords[2] });
  };

  return (
    <Frame>
      {/* ── Left Story Side Panel ── */}
      <AnimatePresence mode="wait">
        <LeftPanel
          key={selectedRegion}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <PanelSubHeader>Heritage Stories</PanelSubHeader>
          <PanelTitle>
            {selectedRegion === '전체'
              ? '전국 한옥'
              : `${selectedRegion} 한옥`}
          </PanelTitle>
          <PanelCountBadge>
            {regionVillages.length}곳
          </PanelCountBadge>

          <PanelDesc>
            {REGION_STORIES[selectedRegion] || REGION_STORIES['전체']}
          </PanelDesc>

          <MiniCardList>
            {regionVillages.slice(0, 3).map((v) => (
              <MiniCard
                key={v.id}
                onClick={() => onSelectVillage?.(v)}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.15 }}
              >
                <MiniThumb $bg={v.hasImage ? v.image : null} />
                <MiniInfo>
                  <MiniTitle>{v.name}</MiniTitle>
                  <MiniMeta>
                    {v.region} · {v.type}
                  </MiniMeta>
                </MiniInfo>
              </MiniCard>
            ))}
          </MiniCardList>
        </LeftPanel>
      </AnimatePresence>

      {/* ── Right Vertical Region Selector Panel ── */}
      <RightPanel>
        <RightHeader>Choose Zone</RightHeader>
        <RegionList>
          {REGIONS.map((r) => {
            const isActive = selectedRegion === r;
            return (
              <RegionItemBtn
                key={r}
                $active={isActive}
                onClick={() => handleRegionClick(r)}
              >
                {r}
              </RegionItemBtn>
            );
          })}
        </RegionList>
      </RightPanel>

      {/* ── Leaflet CartoDB Map ── */}
      <MapContainerComp
        center={mapState.center}
        zoom={mapState.zoom}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }}
      >
        <MapController center={mapState.center} zoom={mapState.zoom} />

        <TileLayerComp
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {regionVillages.map((v) => (
          <CircleMarkerComp
            key={v.id}
            center={[v.lat!, v.lng!]}
            radius={9}
            pathOptions={{
              color: '#ffffff',
              fillColor: lightPalette.kobalt[500],
              fillOpacity: 0.95,
              weight: 2.5,
            }}
          >
            <Popup>
              <PopupContent>
                <PopupTag>
                  {v.region} · {v.type}
                </PopupTag>
                <PopupTitle>{v.name}</PopupTitle>
                <PopupAddr>{v.addr}</PopupAddr>
                {onSelectVillage && (
                  <ViewBtn onClick={() => onSelectVillage(v)}>
                    자세히 보기 <ArrowRight size={13} style={{ marginLeft: 4 }} />
                  </ViewBtn>
                )}
              </PopupContent>
            </Popup>
          </CircleMarkerComp>
        ))}
      </MapContainerComp>
    </Frame>
  );
}
