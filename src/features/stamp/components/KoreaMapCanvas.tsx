'use client';

import { useRef } from 'react';
import styled from '@emotion/styled';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { meok } from '@/design-system/tokens';
import { KOREA_MAP_VIEWBOX, KOREA_REGION_PATHS } from '@/shared/data/koreaMapPaths';
import type { RegionCode } from '../types';
import { stampAudio } from '../utils/sound';


gsap.registerPlugin(useGSAP);

interface KoreaMapCanvasProps {
  selectedRegion: RegionCode;
  onSelectRegion: (region: RegionCode) => void;
  unlockedRegions: Set<string>;
}



const MapWrap = styled.div`
  position: relative;
  width: 100%;
  max-width: 580px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
  visibility: hidden;
  overflow: visible;
`;

const SvgContainer = styled.svg`
  width: 100%;
  height: auto;
  aspect-ratio: 800 / 759;
  overflow: visible;
  filter: drop-shadow(0 6px 20px rgba(0, 0, 0, 0.06));

  [data-theme='dark'] & {
    filter: drop-shadow(0 8px 32px rgba(0, 0, 0, 0.5));
  }
`;


const SvgDefs = () => (
  <defs>
    <filter id="glow-active" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

const RegionGroup = styled.g`
  cursor: pointer;
  outline: none;

  &:focus-visible path {
    stroke: #D9281C;
    stroke-width: 3px;
  }
`;

const RegionPath = styled.path<{ $active: boolean; $unlocked: boolean }>`
  stroke: ${({ $active, $unlocked }) =>
    $active ? '#C9221A' : $unlocked ? '#9A6010' : 'rgba(255,255,255,0.1)'};

  stroke-width: ${({ $active }) => ($active ? '2px' : '0.8px')};
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;

  fill: ${({ $active, $unlocked }) =>
    $active ? 'rgba(201,34,26,0.22)' : $unlocked ? 'rgba(160,96,0,0.2)' : 'rgba(255,255,255,0.05)'};

  transition: filter 0.18s ease;

  ${RegionGroup}:hover & {
    filter: ${({ $active }) => ($active ? 'none' : 'brightness(1.5)')};
  }
`;

const RegionText = styled.text<{ $active: boolean; $unlocked: boolean }>`
  font-family: var(--font-traditional);
  font-size: 26px;
  font-weight: 700;
  fill: ${({ $active, $unlocked }) =>
    $active ? '#ff8a80' : $unlocked ? '#cc9040' : 'rgba(232,223,200,0.35)'};
  pointer-events: none;
  text-anchor: middle;
  dominant-baseline: central;
  paint-order: stroke fill;

  stroke: #0B0D13;
  stroke-width: 5px;
  stroke-linejoin: round;
`;

const MapHint = styled.div`
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: rgba(232, 223, 200, 0.28);
  letter-spacing: -0.01em;
`;



function getRegionCodeForPath(pathId: string): RegionCode {
  switch (pathId) {
    case 'seoul': return 'seoul';
    case 'gangwon': return 'gangwon';
    case 'chungbuk':
    case 'chungnam': return 'chungcheong';
    case 'jeonbuk':
    case 'jeonnam': return 'jeolla';
    case 'gyeongbuk':
    case 'gyeongnam': return 'gyeongsang';
    case 'jeju': return 'jeju';
    default: return 'all';
  }
}

function isPathUnlocked(pathId: string, unlockedRegions: Set<string>): boolean {
  if (pathId === 'seoul') {
    return unlockedRegions.has('seoul') || unlockedRegions.has('gyeonggi');
  }
  const code = getRegionCodeForPath(pathId);
  return unlockedRegions.has(code);
}

function isPathActive(pathId: string, selectedRegion: RegionCode): boolean {
  if (selectedRegion === 'all') return false;
  if (pathId === 'seoul') {
    return selectedRegion === 'seoul' || selectedRegion === 'gyeonggi';
  }
  return getRegionCodeForPath(pathId) === selectedRegion;
}



export default function KoreaMapCanvas({
  selectedRegion,
  onSelectRegion,
  unlockedRegions,
}: KoreaMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);



  useGSAP(() => {
    if (!containerRef.current || !svgRef.current) return;
    gsap.set(containerRef.current, { visibility: 'visible' });
    gsap.from(svgRef.current, { opacity: 0, duration: 0.5, ease: 'power2.out' });
  }, { scope: containerRef, dependencies: [] });

  const handleRegionClick = (pathId: string) => {
    stampAudio.playMapClickSound();
    const targetCode = getRegionCodeForPath(pathId);

    if (pathId === 'seoul') {
      if (selectedRegion === 'seoul' || selectedRegion === 'gyeonggi') {
        onSelectRegion('all');
      } else {
        onSelectRegion('seoul');
      }
      return;
    }

    if (selectedRegion === targetCode) {
      onSelectRegion('all');
    } else {
      onSelectRegion(targetCode);
    }
  };

  return (
    <MapWrap ref={containerRef}>
      <SvgContainer
        ref={svgRef}
        viewBox={KOREA_MAP_VIEWBOX}
        preserveAspectRatio="xMidYMid meet"
        aria-label="한옥 스테이 권역별 지도. 클릭하여 해당 지역의 숙소를 필터링하세요."
      >
        <SvgDefs />

        {KOREA_REGION_PATHS.map((region) => {
          const active = isPathActive(region.id, selectedRegion);
          const unlocked = isPathUnlocked(region.id, unlockedRegions);

          return (
            <RegionGroup
              key={region.id}
              className="region-group"
              onClick={() => handleRegionClick(region.id)}
              tabIndex={0}
              data-active={active}
              data-unlocked={unlocked}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleRegionClick(region.id);
                }
              }}
              aria-label={`${region.label} ${unlocked ? '방문 완료' : '미방문'} — 클릭하여 필터링`}
              aria-pressed={active}
            >
              <RegionPath
                d={region.d}
                $active={active}
                $unlocked={unlocked}
              />
              <RegionText
                x={region.centroid.x}
                y={region.centroid.y}
                $active={active}
                $unlocked={unlocked}
              >
                {region.shortLabel}
              </RegionText>
            </RegionGroup>
          );
        })}
      </SvgContainer>

      <MapHint>지도의 인장을 눌러 당신의 한옥 여정을 탐색해보세요</MapHint>
    </MapWrap>
  );
}