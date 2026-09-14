'use client';

import styled from '@emotion/styled';
import { meok } from '@/design-system/tokens';
import type { RegionCode } from '../types';

interface KoreaMapCanvasProps {
  selectedRegion: RegionCode;
  onSelectRegion: (region: RegionCode) => void;
  unlockedRegions: Set<string>;
}

const MapWrap = styled.div`
  position: relative;
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
  aspect-ratio: 4 / 5;
  user-select: none;
`;

const SvgContainer = styled.svg`
  width: 100%;
  height: 100%;
  overflow: visible;
`;

const RegionPath = styled.path<{ $active: boolean; $unlocked: boolean }>`
  cursor: pointer;
  stroke: ${({ $active }) => ($active ? '#d4af37' : 'rgba(25, 31, 40, 0.15)')};
  stroke-width: ${({ $active }) => ($active ? '2px' : '1px')};
  stroke-linejoin: round;
  fill: ${({ $active, $unlocked }) =>
    $active
      ? 'rgba(212, 175, 55, 0.35)'
      : $unlocked
      ? 'rgba(212, 175, 55, 0.18)'
      : 'rgba(25, 31, 40, 0.04)'};
  transition: all 0.2s ease;

  [data-theme='dark'] & {
    stroke: ${({ $active }) => ($active ? '#f59e0b' : 'rgba(255, 255, 255, 0.12)')};
    fill: ${({ $active, $unlocked }) =>
      $active
        ? 'rgba(245, 158, 11, 0.4)'
        : $unlocked
        ? 'rgba(245, 158, 11, 0.2)'
        : 'rgba(255, 255, 255, 0.05)'};
  }

  &:hover {
    fill: ${({ $unlocked }) =>
      $unlocked ? 'rgba(212, 175, 55, 0.45)' : 'rgba(25, 31, 40, 0.1)'};
    stroke: #d4af37;
  }
`;

const RegionLabel = styled.text<{ $active: boolean; $unlocked: boolean }>`
  font-size: 9px;
  font-weight: ${({ $active }) => ($active ? '800' : '600')};
  fill: ${({ $active, $unlocked }) =>
    $active
      ? '#b45309'
      : $unlocked
      ? meok[900]
      : meok[400]};
  pointer-events: none;
  text-anchor: middle;
  dominant-baseline: central;

  [data-theme='dark'] & {
    fill: ${({ $active, $unlocked }) =>
      $active
        ? '#fbbf24'
        : $unlocked
        ? '#ffffff'
        : meok[500]};
  }
`;

// Stylized polygonal representation of Korean provinces on a 200x260 grid
const PROVINCES: {
  id: RegionCode;
  name: string;
  d: string;
  labelX: number;
  labelY: number;
}[] = [
  {
    id: 'seoul',
    name: '서울',
    d: 'M 72,56 L 82,54 L 84,66 L 74,68 Z',
    labelX: 78,
    labelY: 61,
  },
  {
    id: 'gyeonggi',
    name: '경기',
    d: 'M 54,42 L 88,40 L 98,54 L 94,84 L 62,86 L 52,70 Z',
    labelX: 62,
    labelY: 52,
  },
  {
    id: 'gangwon',
    name: '강원',
    d: 'M 92,30 L 142,38 L 158,80 L 118,92 L 96,52 Z',
    labelX: 126,
    labelY: 60,
  },
  {
    id: 'chungcheong',
    name: '충청',
    d: 'M 48,88 L 112,86 L 126,124 L 72,132 L 44,106 Z',
    labelX: 82,
    labelY: 108,
  },
  {
    id: 'gyeongsang',
    name: '경상',
    d: 'M 120,96 L 160,84 L 176,142 L 150,188 L 114,178 L 116,130 Z',
    labelX: 142,
    labelY: 140,
  },
  {
    id: 'jeolla',
    name: '전라',
    d: 'M 46,134 L 110,126 L 112,182 L 56,198 L 36,160 Z',
    labelX: 74,
    labelY: 162,
  },
  {
    id: 'jeju',
    name: '제주',
    d: 'M 52,228 Q 78,222 100,228 Q 80,244 52,228 Z',
    labelX: 76,
    labelY: 231,
  },
];

export default function KoreaMapCanvas({
  selectedRegion,
  onSelectRegion,
  unlockedRegions,
}: KoreaMapCanvasProps) {
  return (
    <MapWrap>
      <SvgContainer viewBox="20 15 170 240" aria-label="전국 한옥 지도 권역">
        {PROVINCES.map((prov) => {
          const isActive = selectedRegion === prov.id;
          const isUnlocked = unlockedRegions.has(prov.id);

          return (
            <g key={prov.id} onClick={() => onSelectRegion(isActive ? 'all' : prov.id)}>
              <RegionPath
                d={prov.d}
                $active={isActive}
                $unlocked={isUnlocked}
                role="button"
                aria-label={`${prov.name} 권역 ${isUnlocked ? '방문 완료' : '미방문'}`}
              />
              <RegionLabel
                x={prov.labelX}
                y={prov.labelY}
                $active={isActive}
                $unlocked={isUnlocked}
              >
                {prov.name}
              </RegionLabel>
            </g>
          );
        })}
      </SvgContainer>
    </MapWrap>
  );
}
