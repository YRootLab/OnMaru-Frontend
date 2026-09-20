'use client';

import { useRef } from 'react';
import styled from '@emotion/styled';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { meok } from '@/design-system/tokens';
import { KOREA_MAP_VIEWBOX, KOREA_REGION_PATHS } from '@/shared/data/koreaMapPaths';
import type { RegionCode } from '../types';
import { stampAudio } from '../utils/sound';

// GSAP 플러그인 등록
gsap.registerPlugin(useGSAP);

interface KoreaMapCanvasProps {
  selectedRegion: RegionCode;
  onSelectRegion: (region: RegionCode) => void;
  unlockedRegions: Set<string>;
}

// --- Styled Components ---

const MapWrap = styled.div`
  position: relative;
  width: 100%;
  max-width: 580px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
  visibility: hidden; /* GSAP 애니메이션 전 숨김 처리 */
`;

const SvgContainer = styled.svg`
  width: 100%;
  height: auto;
  aspect-ratio: 800 / 759;
  overflow: visible;
  filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.08));

  [data-theme='dark'] & {
    filter: drop-shadow(0 10px 40px rgba(0, 0, 0, 0.6));
  }
`;

// 활성화 시 부드러운 글로우(발광) 효과
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
  transform-origin: center;
  
  &:focus-visible path {
    stroke: #fbbf24;
    stroke-width: 3.5px;
    filter: url(#glow-active);
  }
`;

const RegionPath = styled.path<{ $active: boolean; $unlocked: boolean }>`
  stroke: ${({ $active, $unlocked }) =>
    $active
      ? '#ea580c' // 생동감 있는 단청 오렌지 (Active)
      : $unlocked
      ? '#f59e0b' // 맑고 밝은 앰버 골드 (Unlocked)
      : 'rgba(214, 211, 209, 0.6)'}; // 따뜻한 웜그레이
  
  stroke-width: ${({ $active }) => ($active ? '3px' : '1.5px')};
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
  
  fill: ${({ $active, $unlocked }) =>
    $active
      ? 'rgba(249, 115, 22, 0.45)' // 밝고 경쾌한 오렌지 필터
      : $unlocked
      ? 'rgba(251, 191, 36, 0.35)' // 화사한 노란빛 필터
      : '#fafaf9'}; // 따뜻한 한지 느낌의 베이지 (Unvisited)

  [data-theme='dark'] & {
    stroke: ${({ $active, $unlocked }) =>
      $active
        ? '#fdba74'
        : $unlocked
        ? '#fcd34d'
        : 'rgba(255, 255, 255, 0.15)'};
    fill: ${({ $active, $unlocked }) =>
      $active
        ? 'rgba(249, 115, 22, 0.6)'
        : $unlocked
        ? 'rgba(251, 191, 36, 0.3)'
        : 'rgba(255, 255, 255, 0.04)'};
  }
  
  ${({ $active }) => $active && `filter: url(#glow-active);`}
`;

const RegionText = styled.text<{ $active: boolean; $unlocked: boolean }>`
  font-family: var(--font-traditional);
  font-size: 26px;
  font-weight: 700;
  fill: ${({ $active, $unlocked }) =>
    $active 
      ? '#9a3412' // 진하고 명확한 붉은 갈색 
      : $unlocked 
      ? '#b45309' // 따뜻하고 진한 황금 갈색
      : '#a8a29e'}; // 부드러운 웜톤 텍스트
  pointer-events: none;
  text-anchor: middle;
  dominant-baseline: central;
  paint-order: stroke fill;
  
  stroke: #ffffff;
  stroke-width: 6px;
  stroke-linejoin: round;

  [data-theme='dark'] & {
    fill: ${({ $active, $unlocked }) =>
      $active ? '#ffedd5' : $unlocked ? '#fef3c7' : '#d6d3d1'};
    stroke: #1c1917;
    stroke-width: 6px;
  }
`;

const MapHint = styled.div`
  margin-top: 20px;
  padding: 10px 20px;
  background-color: rgba(245, 158, 11, 0.08);
  border-radius: 20px;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  color: #b45309; 
  letter-spacing: -0.02em;

  [data-theme='dark'] & {
    background-color: rgba(251, 191, 36, 0.08);
    color: #fcd34d;
  }
`;

// --- Helpers ---

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

// --- Main Component ---

export default function KoreaMapCanvas({
  selectedRegion,
  onSelectRegion,
  unlockedRegions,
}: KoreaMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // --- GSAP Animations ---
  
  useGSAP(() => {
    if (!containerRef.current || !svgRef.current) return;

    // 1. 입장 애니메이션 (Stagger)
    gsap.set(containerRef.current, { visibility: 'visible' });
    
    const regions = svgRef.current.querySelectorAll('.region-group');
    gsap.from(regions, {
      opacity: 0,
      scale: 0.8,
      y: 20,
      duration: 0.6,
      stagger: 0.05,
      ease: 'back.out(1.7)',
      clearProps: 'transform',
    });

    // 2. 선택된 권역의 Pulse Ring 애니메이션
    const activeRings = svgRef.current.querySelectorAll('.active-pulse-ring');
    if (activeRings.length > 0) {
      gsap.to(activeRings, {
        scale: 1.3,
        opacity: 0,
        duration: 1.5,
        repeat: -1,
        ease: 'power2.out',
      });
    }
  }, { scope: containerRef, dependencies: [selectedRegion] });

  // 3. Hover 인터랙션
  const onMouseEnterRegion = (event: React.MouseEvent<SVGGElement>) => {
    const group = event.currentTarget;
    const path = group.querySelector('path');
    
    gsap.to(group, { scale: 1.03, duration: 0.3, ease: 'power2.out' });
    
    if (path && group.getAttribute('data-active') !== 'true') {
      const isUnlocked = group.getAttribute('data-unlocked') === 'true';
      gsap.to(path, { 
        fill: isUnlocked ? 'rgba(251, 191, 36, 0.5)' : 'rgba(214, 211, 209, 0.3)',
        stroke: isUnlocked ? '#f59e0b' : '#a8a29e',
        duration: 0.3 
      });
    }
  };

  const onMouseLeaveRegion = (event: React.MouseEvent<SVGGElement>) => {
    const group = event.currentTarget;
    const path = group.querySelector('path');

    gsap.to(group, { scale: 1, duration: 0.3, ease: 'power2.inOut' });
    
    if (path && group.getAttribute('data-active') !== 'true') {
      gsap.to(path, { clearProps: 'fill,stroke', duration: 0.3 });
    }
  };

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
          
          const textYOffset = unlocked ? 18 : 0;

          return (
            <RegionGroup
              key={region.id}
              className="region-group"
              onClick={() => handleRegionClick(region.id)}
              onMouseEnter={onMouseEnterRegion}
              onMouseLeave={onMouseLeaveRegion}
              tabIndex={0}
              data-active={active}
              data-unlocked={unlocked}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleRegionClick(region.id);
                }
              }}
            >
              <title>{`${region.label} 권역: ${unlocked ? '방문 완료 (인장 보유)' : '미방문'} - 클릭하여 필터링`}</title>
              
              <RegionPath
                d={region.d}
                $active={active}$unlocked={unlocked}
                role="button"
                aria-pressed={active}
                aria-label={`${region.label} ${unlocked ? '방문 완료' : '미방문'}`}
              />

              {active && (
                <circle
                  className="active-pulse-ring"
                  cx={region.centroid.x}
                  cy={region.centroid.y + textYOffset}
                  r="38"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  style={{ transformOrigin: 'center', vectorEffect: 'non-scaling-stroke' }}
                />
              )}

              {unlocked && (
                <g transform={`translate(${region.centroid.x}, ${region.centroid.y - 16})`}>
                  <circle
                    r="15"
                    fill="#e11d48"
                    stroke="#fcd34d"
                    strokeWidth="2"
                  />
                  <text
                    y="1"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ffffff"
                    fontSize="14"
                    fontWeight="900"
                    fontFamily="serif"
                  >
                    印
                  </text>
                </g>
              )}

              <RegionText
                x={region.centroid.x}
                y={region.centroid.y + textYOffset}
                $active={active}$unlocked={unlocked}
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