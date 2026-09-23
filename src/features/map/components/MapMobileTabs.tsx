'use client';

import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { Home, Users, MapPin, Headphones, Bookmark } from 'lucide-react';
import { lightPalette , fontSize } from '@/design-system/tokens';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { useBookmarkStore } from '@/features/map/hooks/useBookmarkStore';

const Nav = styled.nav`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: stretch;
`;

const TabButton = styled.button<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  padding: 0;
  border: none;
  background: none;
  color: ${({ $active }) => ($active ? lightPalette.hwanggeum[700] : 'rgba(33, 30, 25, 0.68)')};
  font-family: 'Spoqa Han Sans Neo', sans-serif;
  font-size: ${fontSize.micro};
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  letter-spacing: -0.02em;
  cursor: pointer;
  transition: color 180ms ease, transform 180ms ease;

  &:active {
    transform: scale(0.94);
  }
`;

const IconSlot = styled.span`
  position: relative;
  display: inline-flex;
  width: 19px;
  height: 19px;
`;

const CountBadge = styled.span`
  position: absolute;
  top: -5px;
  right: -8px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 15px;
  height: 15px;
  padding: 0 3px;
  border-radius: 9999px;
  background: ${lightPalette.hwanggeum[500]};
  color: #ffffff;
  font-size: ${fontSize.micro};
  font-weight: 700;
  line-height: 1;
`;


export default function MapMobileTabs() {
  const router = useRouter();
  const mode = useMapStore((s) => s.mode);
  const setMode = useMapStore((s) => s.setMode);
  const category = useMapStore((s) => s.category);
  const setCategory = useMapStore((s) => s.setCategory);
  const setSheetSnap = useMapStore((s) => s.setSheetSnap);
  const bookmarkCount = useBookmarkStore((s) => s.bookmarks.length);

  const isCommunityActive = mode === 'warmth';
  const isMapActive = mode === 'info' && category !== 'bookmark';
  const isBookmarkActive = category === 'bookmark';

  return (
    <Nav aria-label="지도 탐색">
      <TabButton type="button" onClick={() => router.push('/')} aria-label="홈으로 이동">
        <IconSlot>
          <Home size={19} />
        </IconSlot>
        <span>홈</span>
      </TabButton>

      <TabButton
        type="button"
        $active={isCommunityActive}
        onClick={() => {
          setMode('warmth');
          setSheetSnap('half');
        }}
        aria-label="온기 피드 둘러보기"
      >
        <IconSlot>
          <Users size={19} />
        </IconSlot>
        <span>온기피드</span>
      </TabButton>

      <TabButton
        type="button"
        $active={isMapActive}
        onClick={() => {
          setMode('info');
          if (category === 'bookmark') setCategory(null);
        }}
        aria-label="한옥 지도 탐색"
      >
        <IconSlot>
          <MapPin size={19} />
        </IconSlot>
        <span>지도</span>
      </TabButton>

      <TabButton type="button" onClick={() => router.push('/sorimaru')} aria-label="소리마루 오디오 도슨트">
        <IconSlot>
          <Headphones size={19} />
        </IconSlot>
        <span>소리마루</span>
      </TabButton>

      <TabButton
        type="button"
        $active={isBookmarkActive}
        onClick={() => {
          setMode('info');
          setCategory('bookmark');
          setSheetSnap('half');
        }}
        aria-label="마음에 담은 장소 목록"
      >
        <IconSlot>
          <Bookmark size={19} fill={isBookmarkActive ? 'currentColor' : 'none'} />
          {bookmarkCount > 0 && <CountBadge>{bookmarkCount}</CountBadge>}
        </IconSlot>
        <span>마음에담기</span>
      </TabButton>
    </Nav>
  );
}
