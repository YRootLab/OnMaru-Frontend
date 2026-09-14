'use client';

import styled from '@emotion/styled';
import { meok } from '@/design-system/tokens';
import { KOREA_MAP_VIEWBOX, KOREA_REGION_PATHS } from '@/shared/data/koreaMapPaths';
import type { RegionCode } from '../types';

interface KoreaMapCanvasProps {
  selectedRegion: RegionCode;
  onSelectRegion: (region: RegionCode) => void;
  unlockedRegions: Set<string>;
}

const MapWrap = styled.div`
  position: relative;
  width: 100%;
  max-width: 340px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
`;

const SvgContainer = styled.svg`
  width: 100%;
  aspect-ratio: 800 / 759;
  overflow: visible;
  filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.04));

  [data-theme='dark'] & {
    filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.3));
  }
`;

const RegionGroup = styled.g`
  cursor: pointer;
  outline: none;

  &:focus-visible path {
    stroke: #d4af37;
    stroke-width: 3px;
  }
`;

const RegionPath = styled.path<{ $active: boolean; $unlocked: boolean }>`
  stroke: ${({ $active, $unlocked }) =>
    $active
      ? '#b45309'
      : $unlocked
      ? '#d4af37'
      : 'rgba(25, 31, 40, 0.16)'};
  stroke-width: ${({ $active }) => ($active ? '3.5px' : '1.8px')};
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
  fill: ${({ $active, $unlocked }) =>
    $active
      ? 'rgba(212, 175, 55, 0.48)'
      : $unlocked
      ? 'rgba(212, 175, 55, 0.24)'
      : 'rgba(25, 31, 40, 0.04)'};
  transition: all 0.22s ease;

  [data-theme='dark'] & {
    stroke: ${({ $active, $unlocked }) =>
      $active
        ? '#fbbf24'
        : $unlocked
        ? '#f59e0b'
        : 'rgba(255, 255, 255, 0.12)'};
    fill: ${({ $active, $unlocked }) =>
      $active
        ? 'rgba(245, 158, 11, 0.52)'
        : $unlocked
        ? 'rgba(245, 158, 11, 0.24)'
        : 'rgba(255, 255, 255, 0.04)'};
  }

  &:hover {
    fill: ${({ $unlocked }) =>
      $unlocked ? 'rgba(212, 175, 55, 0.55)' : 'rgba(25, 31, 40, 0.09)'};
    stroke: #d4af37;

    [data-theme='dark'] & {
      fill: ${({ $unlocked }) =>
        $unlocked ? 'rgba(245, 158, 11, 0.6)' : 'rgba(255, 255, 255, 0.1)'};
      stroke: #fbbf24;
    }
  }
`;

const RegionText = styled.text<{ $active: boolean; $unlocked: boolean }>`
  font-size: 24px;
  font-weight: ${({ $active, $unlocked }) => ($active ? '900' : $unlocked ? '800' : '700')};
  fill: ${({ $active, $unlocked }) =>
    $active ? '#92400e' : $unlocked ? meok[900] : meok[700]};
  pointer-events: none;
  text-anchor: middle;
  dominant-baseline: central;
  paint-order: stroke fill;
  stroke: #ffffff;
  stroke-width: 5px;
  stroke-linejoin: round;
  user-select: none;

  [data-theme='dark'] & {
    fill: ${({ $active, $unlocked }) =>
      $active ? '#fde68a' : $unlocked ? '#ffffff' : meok[400]};
    stroke: #181614;
    stroke-width: 5px;
  }
`;

const MapHint = styled.div`
  margin-top: 10px;
  text-align: center;
  font-size: 11.5px;
  font-weight: 500;
  color: ${meok[500]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

function getRegionCodeForPath(pathId: string): RegionCode {
  switch (pathId) {
    case 'seoul':
      return 'seoul';
    case 'gangwon':
      return 'gangwon';
    case 'chungbuk':
    case 'chungnam':
      return 'chungcheong';
    case 'jeonbuk':
    case 'jeonnam':
      return 'jeolla';
    case 'gyeongbuk':
    case 'gyeongnam':
      return 'gyeongsang';
    case 'jeju':
      return 'jeju';
    default:
      return 'all';
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
  const handleRegionClick = (pathId: string) => {
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
    <MapWrap>
      <SvgContainer
        viewBox={KOREA_MAP_VIEWBOX}
        preserveAspectRatio="xMidYMid meet"
        aria-label="전국 한옥 지도 권역"
      >
        {KOREA_REGION_PATHS.map((region) => {
          const active = isPathActive(region.id, selectedRegion);
          const unlocked = isPathUnlocked(region.id, unlockedRegions);

          return (
            <RegionGroup
              key={region.id}
              onClick={() => handleRegionClick(region.id)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleRegionClick(region.id);
                }
              }}
            >
              <title>{`${region.label}: ${unlocked ? '방문 완료 (인장 획득)' : '미방문'} — 클릭하여 필터`}</title>
              <RegionPath
                d={region.d}
                $active={active}
                $unlocked={unlocked}
                role="button"
                aria-label={`${region.label} 권역 ${unlocked ? '방문 완료' : '미방문'}`}
              />

              {/* 전통 수결(인장) 획득 배지 */}
              {unlocked && (
                <g transform={`translate(${region.centroid.x}, ${region.centroid.y - 18})`}>
                  <circle
                    r="14"
                    fill="#b91c1c"
                    stroke="#d4af37"
                    strokeWidth="2"
                  />
                  <text
                    y="1"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ffffff"
                    fontSize="13"
                    fontWeight="900"
                    fontFamily="sans-serif"
                  >
                    印
                  </text>
                </g>
              )}

              <RegionText
                x={region.centroid.x}
                y={region.centroid.y + (unlocked ? 16 : 0)}
                $active={active}
                $unlocked={unlocked}
              >
                {region.shortLabel}
              </RegionText>
            </RegionGroup>
          );
        })}
      </SvgContainer>
      <MapHint>지도를 눌러 권역별 인장을 탐색해보세요</MapHint>
    </MapWrap>
  );
}
