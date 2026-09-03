'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { Home, Users, MapPin, Headphones, Bookmark } from 'lucide-react';
import { lightPalette, meok } from '@/design-system/tokens';
import { useMapStore } from '@/map/hooks/useMapStore';
import { useBookmarkStore } from '@/map/hooks/useBookmarkStore';

const NavContainer = styled.nav`
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 45;
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 4px;
  width: calc(100% - 28px);
  max-width: 420px;
  height: 60px;
  padding: 4px 8px;

  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 10px 36px -4px rgba(25, 31, 40, 0.18), 0 2px 8px rgba(25, 31, 40, 0.06);

  user-select: none;

  @media (min-width: 1024px) {
    display: none;
  }
`;

const NavItem = styled.button<{ $active?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  padding: 4px 0;
  border-radius: 9999px;
  border: none;
  background: ${({ $active }) => ($active ? 'rgba(25, 31, 40, 0.08)' : 'transparent')};
  color: ${({ $active }) => ($active ? meok[900] : meok[500])};
  cursor: pointer;
  outline: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    color: ${meok[900]};
  }

  &:active {
    transform: scale(0.92);
  }
`;

const IconWrap = styled.div<{ $active?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
  color: ${({ $active }) => ($active ? lightPalette.cheongrok[700] : 'inherit')};
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);

  ${NavItem}:hover & {
    transform: translateY(-1px);
  }
`;

const Label = styled.span<{ $active?: boolean }>`
  font-size: 11px;
  font-weight: ${({ $active }) => ($active ? '700' : '500')};
  letter-spacing: -0.2px;
  line-height: 1;
  color: ${({ $active }) => ($active ? meok[900] : meok[700])};
`;

const CountBadge = styled.span`
  position: absolute;
  top: -4px;
  right: -8px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 9999px;
  background: ${lightPalette.juhong[500]};
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
  box-shadow: 0 1px 4px rgba(232, 90, 24, 0.35);
`;

export default function MobileBottomNav() {
  const router = useRouter();
  const mode = useMapStore((s) => s.mode);
  const setMode = useMapStore((s) => s.setMode);
  const category = useMapStore((s) => s.category);
  const setCategory = useMapStore((s) => s.setCategory);
  const setSheetSnap = useMapStore((s) => s.setSheetSnap);
  const bookmarks = useBookmarkStore((s) => s.bookmarks);

  const bookmarkCount = bookmarks.length;

  const isHomeActive = false;
  const isCommunityActive = mode === 'warmth';
  const isMapActive = mode === 'info' && category !== 'bookmark';
  const isBookmarkActive = category === 'bookmark';

  const handleGoHome = () => {
    router.push('/');
  };

  const handleOpenCommunity = () => {
    setMode('warmth');
    setSheetSnap('half');
  };

  const handleOpenMap = () => {
    setMode('info');
    if (category === 'bookmark') {
      setCategory(null);
    }
  };

  const handleOpenOdii = () => {
    router.push('/odii');
  };

  const handleOpenBookmarks = () => {
    setMode('info');
    setCategory('bookmark');
    setSheetSnap('half');
  };

  return (
    <NavContainer aria-label="모바일 하단 내비게이션">
      {/* 1. 홈 (온마루 3D 메인) */}
      <NavItem
        type="button"
        $active={isHomeActive}
        onClick={handleGoHome}
        aria-label="온마루 메인 홈으로 이동"
      >
        <IconWrap $active={isHomeActive}>
          <Home size={20} />
        </IconWrap>
        <Label $active={isHomeActive}>홈</Label>
      </NavItem>

      {/* 2. 온기피드 (커뮤니티) */}
      <NavItem
        type="button"
        $active={isCommunityActive}
        onClick={handleOpenCommunity}
        aria-label="온기 커뮤니티 피드"
      >
        <IconWrap $active={isCommunityActive}>
          <Users size={20} />
        </IconWrap>
        <Label $active={isCommunityActive}>온기피드</Label>
      </NavItem>

      {/* 3. 한옥지도 (동네지도 스타일 액티브 캡슐) */}
      <NavItem
        type="button"
        $active={isMapActive}
        onClick={handleOpenMap}
        aria-label="한옥 지도 탐색"
      >
        <IconWrap $active={isMapActive}>
          <MapPin size={20} />
        </IconWrap>
        <Label $active={isMapActive}>한옥지도</Label>
      </NavItem>

      {/* 4. 소리마루 (오디 도슨트 해설) */}
      <NavItem
        type="button"
        onClick={handleOpenOdii}
        aria-label="소리마루 오디오 도슨트"
      >
        <IconWrap>
          <Headphones size={20} />
          <CountBadge style={{ background: lightPalette.jangmi[500] }}>N</CountBadge>
        </IconWrap>
        <Label>소리마루</Label>
      </NavItem>

      {/* 5. 마음에 담기 (나의 마루 / 북마크) */}
      <NavItem
        type="button"
        $active={isBookmarkActive}
        onClick={handleOpenBookmarks}
        aria-label="마음에 담은 장소 목록"
      >
        <IconWrap $active={isBookmarkActive}>
          <Bookmark size={20} fill={isBookmarkActive ? 'currentColor' : 'none'} />
          {bookmarkCount > 0 && <CountBadge>{bookmarkCount}</CountBadge>}
        </IconWrap>
        <Label $active={isBookmarkActive}>마음에담기</Label>
      </NavItem>
    </NavContainer>
  );
}
