'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import {
  MapPin,
  BookOpen,
  Headphones,
  Flame,
  Bookmark,
  Compass,
  User,
  ChevronDown,
  Map as MapIcon,
} from 'lucide-react';
import { useMapStore } from '@/map/hooks/useMapStore';
import { lightPalette, meok } from '@/design-system/tokens';

const RAIL_WIDTH = 68;

const RailContainer = styled.aside`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: ${RAIL_WIDTH}px;
  background: #ffffff;
  border-right: 1px solid #e5e8eb;
  z-index: 25;
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
  box-shadow: 1px 0 8px rgba(0, 0, 0, 0.04);

  @media (max-width: 1023px) {
    display: none;
  }
`;

/** 상단 온마루 브랜드 로고 영역 */
const LogoArea = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 64px;
  cursor: pointer;
  transition: transform 0.15s ease;

  &:hover {
    transform: scale(1.06);
  }
`;

const BrandIconBadge = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, ${lightPalette.cheongrok[500]} 0%, #166052 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.5px;
  box-shadow: 0 2px 8px rgba(30, 122, 104, 0.32);
`;

const NavList = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
`;

/** 온마루 내비게이션 아이템 버튼 (온마루 대청 청록 액센트) */
const NavItemBtn = styled.button<{ $active: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 66px;
  padding: 0;
  border: none;
  outline: none;
  cursor: pointer;
  background: ${({ $active }) => ($active ? lightPalette.cheongrok[500] : 'transparent')};
  color: ${({ $active }) => ($active ? '#FFFFFF' : '#4E5968')};
  transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: ${({ $active }) => ($active ? lightPalette.cheongrok[500] : '#F2F4F6')};
    color: ${({ $active }) => ($active ? '#FFFFFF' : '#191F28')};
  }

  &:active {
    transform: scale(0.96);
  }
`;

const NavItemIcon = styled.div<{ $active: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
  color: ${({ $active }) => ($active ? '#FFFFFF' : '#333D4B')};
`;

const NavItemLabel = styled.span<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 11.5px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  letter-spacing: -0.3px;
  line-height: 1.2;
  white-space: nowrap;
`;

const BottomArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding-bottom: 14px;
`;

const Divider = styled.div`
  width: 44px;
  height: 1px;
  background: #e5e8eb;
  margin: 8px 0;
`;

/** 지도 하위 모드(정보지도 / 온기지도) 드롭다운 팝오버 */
const MapSubmenuPopover = styled.div`
  position: absolute;
  left: 74px;
  top: 70px;
  width: 180px;
  background: #ffffff;
  border-radius: 16px;
  padding: 8px;
  box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #eef0f2;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 4px;
  animation: popover-in 0.18s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes popover-in {
    from {
      opacity: 0;
      transform: translateX(-8px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }
`;

const SubmenuItemBtn = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: none;
  background: ${({ $active }) => ($active ? lightPalette.cheongrok[50] : 'transparent')};
  color: ${({ $active }) => ($active ? lightPalette.cheongrok[500] : meok[900])};
  font-family: inherit;
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  cursor: pointer;
  transition: all 0.14s ease;

  &:hover {
    background: ${({ $active }) => ($active ? lightPalette.cheongrok[50] : '#F4F6F8')};
    color: ${({ $active }) => ($active ? lightPalette.cheongrok[500] : '#191F28')};
  }
`;

const SubmenuLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ActiveDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${lightPalette.cheongrok[500]};
`;

export default function MapNavRail() {
  const router = useRouter();
  const mode = useMapStore((s) => s.mode);
  const setMode = useMapStore((s) => s.setMode);
  const setCategory = useMapStore((s) => s.setCategory);
  const panelOpen = useMapStore((s) => s.panelOpen);
  const setPanelOpen = useMapStore((s) => s.setPanelOpen);

  const [mapMenuOpen, setMapMenuOpen] = useState(false);
  const mapMenuRef = useRef<HTMLDivElement>(null);

  // 지도 드롭다운 서브메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (mapMenuRef.current && !mapMenuRef.current.contains(e.target as Node)) {
        setMapMenuOpen(false);
      }
    };
    if (mapMenuOpen) {
      document.addEventListener('mousedown', handleDocClick);
    }
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [mapMenuOpen]);

  const handleSelectInfoMap = () => {
    setMapMenuOpen(false);
    setMode('info');
    setCategory(null);
    if (!panelOpen) setPanelOpen(true);
  };

  const handleSelectWarmthMap = () => {
    setMapMenuOpen(false);
    setMode('warmth');
    if (!panelOpen) setPanelOpen(true);
  };

  const handleToggleMapMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMapMenuOpen((prev) => !prev);
  };

  // 온마루 자체 카테고리 활성 판별
  const isMapActive = true; // 현재 /map 페이지
  const isWarmthActive = mode === 'warmth';

  return (
    <RailContainer role="navigation" aria-label="온마루 메인 카테고리 네비게이션">
      {/* 1. 상단 온마루 브랜드 로고 */}
      <LogoArea onClick={() => router.push('/')} title="온마루 메인 홈으로 이동">
        <BrandIconBadge>온</BrandIconBadge>
      </LogoArea>

      {/* 2. 온마루 자체 카테고리 목록 (한옥도감, 지도 ⌵, 소리마루, 온기이야기, 저장) */}
      <NavList>
        {/* 온마루 카테고리 1: 한옥도감 */}
        <NavItemBtn
          type="button"
          $active={false}
          onClick={() => router.push('/hanok')}
          aria-label="한옥도감"
          title="디지털 한옥도감 & 문화유산 아카이브"
        >
          <NavItemIcon $active={false}>
            <BookOpen size={21} />
          </NavItemIcon>
          <NavItemLabel $active={false}>한옥도감</NavItemLabel>
        </NavItemBtn>

        {/* 온마루 카테고리 2: 지도 ⌵ (드롭다운: 정보지도 / 온기지도) */}
        <div ref={mapMenuRef} style={{ width: '100%' }}>
          <NavItemBtn
            type="button"
            $active={isMapActive}
            onClick={handleToggleMapMenu}
            aria-label="지도 서비스"
            title="온마루 지도 (클릭하여 정보지도/온기지도 선택)"
          >
            <NavItemIcon $active={isMapActive}>
              <MapPin size={21} fill={isMapActive ? '#FFFFFF' : 'none'} />
            </NavItemIcon>
            <NavItemLabel $active={isMapActive}>
              <span>지도</span>
              <ChevronDown size={11} style={{ transform: mapMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </NavItemLabel>
          </NavItemBtn>

          {/* 지도 서브메뉴 팝오버: 정보지도 / 온기지도 */}
          {mapMenuOpen && (
            <MapSubmenuPopover>
              <SubmenuItemBtn
                type="button"
                $active={mode === 'info'}
                onClick={handleSelectInfoMap}
              >
                <SubmenuLeft>
                  <MapIcon size={16} />
                  <span>정보지도</span>
                </SubmenuLeft>
                {mode === 'info' && <ActiveDot />}
              </SubmenuItemBtn>

              <SubmenuItemBtn
                type="button"
                $active={mode === 'warmth'}
                onClick={handleSelectWarmthMap}
              >
                <SubmenuLeft>
                  <Flame size={16} />
                  <span>온기지도</span>
                </SubmenuLeft>
                {mode === 'warmth' && <ActiveDot />}
              </SubmenuItemBtn>
            </MapSubmenuPopover>
          )}
        </div>

        {/* 온마루 카테고리 3: 소리마루 (오디 도슨트) */}
        <NavItemBtn
          type="button"
          $active={false}
          onClick={() => router.push('/odii')}
          aria-label="소리마루"
          title="공간 오디오 가이드 도슨트 소리마루"
        >
          <NavItemIcon $active={false}>
            <Headphones size={21} />
          </NavItemIcon>
          <NavItemLabel $active={false}>소리마루</NavItemLabel>
        </NavItemBtn>

        {/* 온마루 카테고리 4: 온기이야기 (지도 내 온기 후기 & 온도 모드 바로가기) */}
        <NavItemBtn
          type="button"
          $active={isWarmthActive}
          onClick={handleSelectWarmthMap}
          aria-label="온기이야기"
          title="실시간 여행자 온기 후기 및 훈기 레이어"
        >
          <NavItemIcon $active={isWarmthActive}>
            <Flame size={20} fill={isWarmthActive ? '#FFFFFF' : 'none'} />
          </NavItemIcon>
          <NavItemLabel $active={isWarmthActive}>온기이야기</NavItemLabel>
        </NavItemBtn>

        {/* 온마루 카테고리 5: 저장한 장소 */}
        <NavItemBtn
          type="button"
          $active={mode === 'info' && useMapStore.getState().category === 'bookmark'}
          onClick={() => {
            setMode('info');
            setCategory('bookmark');
            if (!panelOpen) setPanelOpen(true);
          }}
          aria-label="마음에 담은 장소"
          title="마음에 담은 장소 보관함"
        >
          <NavItemIcon $active={mode === 'info' && useMapStore.getState().category === 'bookmark'}>
            <Bookmark size={20} />
          </NavItemIcon>
          <NavItemLabel $active={mode === 'info' && useMapStore.getState().category === 'bookmark'}>
            저장
          </NavItemLabel>
        </NavItemBtn>
      </NavList>

      {/* 3. 하단 유틸리티 메뉴 (온마루 홈, 마이/로그인) */}
      <BottomArea>
        <Divider />
        <NavItemBtn
          type="button"
          $active={false}
          onClick={() => router.push('/')}
          aria-label="온마루 3D 홈으로 이동"
          title="온마루 인터랙티브 3D 한옥 메인 홈으로 이동"
        >
          <NavItemIcon $active={false}>
            <Compass size={20} />
          </NavItemIcon>
          <NavItemLabel $active={false}>온마루 홈</NavItemLabel>
        </NavItemBtn>

        <NavItemBtn
          type="button"
          $active={false}
          onClick={() => router.push('/auth/login')}
          aria-label="마이 / 로그인"
          title="로그인 및 마이페이지"
        >
          <NavItemIcon $active={false}>
            <User size={20} />
          </NavItemIcon>
          <NavItemLabel $active={false}>로그인</NavItemLabel>
        </NavItemBtn>
      </BottomArea>
    </RailContainer>
  );
}
