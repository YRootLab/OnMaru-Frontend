'use client';

import { useRouter } from 'next/navigation';
import { Alex_Brush } from 'next/font/google';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import {
  BookOpen,
  MapPin,
  Flame,
  Headphones,
  Bookmark,
  User,
} from 'lucide-react';
import { transientProps } from '@/design-system/styled';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { lightPalette, meok } from '@/design-system/tokens';
import { RAIL_ENTER_DELAY_S, RAIL_ENTER_DURATION_S, ENTRANCE_EASE } from '@/shared/navigation/mapEntranceTiming';
import { useMapEntranceStore } from '@/shared/navigation/mapEntranceState';

export const RAIL_WIDTH = 60;
export const RAIL_INSET = 14;

/** "OnMaru" 워드마크용 고급스러운 브러시 필기체 — 박스/아이콘 없이 글자 자체로
 *  브랜드를 표현한다. */
const brandScript = Alex_Brush({ subsets: ['latin'], weight: '400' });

/** Header.tsx의 캡슐형 GNB와 같은 유리질감(블러+반투명+가느다란 보더)을 쓰는
 *  얇고 떠 있는 세로 레일 — 예전의 68px 꽉찬 화이트 사이드바 대신, 뷰포트에서
 *  14px 띄운 캡슐로 /hanok·/odii의 상단 GNB와 톤을 맞춘다. */
const RailContainer = styled(motion.aside, transientProps)`
  position: absolute;
  top: ${RAIL_INSET}px;
  bottom: ${RAIL_INSET}px;
  left: ${RAIL_INSET}px;
  width: ${RAIL_WIDTH}px;
  z-index: 25;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
  gap: 2px;
  border-radius: 22px;
  user-select: none;

  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow:
    0 12px 32px -8px rgba(0, 0, 0, 0.1),
    0 4px 12px -4px rgba(0, 0, 0, 0.04);

  @media (max-width: 1023px) {
    display: none;
  }
`;

/** 상단 온마루 브랜드 로고 영역 — 60px 폭 레일에 "OnMaru"를 가로로는 못 넣으니
 *  세로로 눕혀서(아래→위로 읽힘) 필기체 워드마크를 그대로 보여준다. 박스/아이콘
 *  없이 글자 자체가 로고다. */
const LogoArea = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 56px;
  cursor: pointer;
  transition: transform 0.15s ease;

  &:hover {
    transform: scale(1.04);
  }

  &:focus-visible {
    outline: 2px solid ${lightPalette.cheongrok[500]};
    outline-offset: 2px;
    border-radius: 8px;
  }
`;

const BrandMark = styled.span`
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 26px;
  line-height: 1;
  color: ${lightPalette.cheongrok[700]};
`;

/** 로고 영역과 메뉴 목록을 가르는 얇은 구분선 — 아래 BottomArea의 Divider와
 *  같은 스타일을 재사용해 로고 아래에 메뉴가 시작되는 지점을 명확히 한다. */
const LogoDivider = styled.div`
  width: 24px;
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
  margin: 4px 0 8px;
`;

const NavList = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 2px;
  flex: 1;
`;

/** 아이콘 전용 슬림 네비게이션 버튼 — 라벨은 title 툴팁으로 대체해 폭을 줄인다. */
const NavItemBtn = styled.button<{ $active: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  outline: none;
  border-radius: 12px;
  cursor: pointer;
  background: ${({ $active }) => ($active ? lightPalette.cheongrok[50] : 'transparent')};
  color: ${({ $active }) => ($active ? lightPalette.cheongrok[700] : meok[500])};
  transition:
    background-color 180ms cubic-bezier(0.16, 1, 0.3, 1),
    color 180ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 150ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: ${({ $active }) => ($active ? lightPalette.cheongrok[50] : 'rgba(0, 0, 0, 0.045)')};
    color: ${({ $active }) => ($active ? lightPalette.cheongrok[700] : meok[900])};
  }

  &:active {
    transform: scale(0.92);
  }
`;

const NavItemIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BottomArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 2px;
  padding-bottom: 2px;
`;

const Divider = styled.div`
  width: 24px;
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
  margin: 6px 0;
`;

export default function MapNavRail() {
  const router = useRouter();
  const mode = useMapStore((s) => s.mode);
  const setMode = useMapStore((s) => s.setMode);
  const setCategory = useMapStore((s) => s.setCategory);
  const panelOpen = useMapStore((s) => s.panelOpen);
  const setPanelOpen = useMapStore((s) => s.setPanelOpen);

  const handleSelectInfoMap = () => {
    setMode('info');
    setCategory(null);
    if (!panelOpen) setPanelOpen(true);
  };

  const handleSelectWarmthMap = () => {
    setMode('warmth');
    if (!panelOpen) setPanelOpen(true);
  };

  // 온마루 자체 카테고리 활성 판별
  const isMapActive = true; // 현재 /map 페이지
  const isWarmthActive = mode === 'warmth';
  const isRouteEntrance = useMapEntranceStore((s) => s.isRouteEntrance);

  return (
    <RailContainer
      role="navigation"
      aria-label="온마루 메인 카테고리 네비게이션"
      initial={isRouteEntrance ? { x: '-100%', opacity: 0 } : false}
      animate={{ x: 0, opacity: 1 }}
      transition={
        isRouteEntrance
          ? { duration: RAIL_ENTER_DURATION_S, delay: RAIL_ENTER_DELAY_S, ease: ENTRANCE_EASE }
          : { duration: 0 }
      }
    >
      {/* 1. 상단 온마루 브랜드 로고 — 워드마크가 장식용 텍스트라 aria-hidden 처리하고,
          div 자체에 버튼 접근성(role/tabIndex/키보드)을 직접 부여한다. */}
      <LogoArea
        role="button"
        tabIndex={0}
        onClick={() => router.push('/')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            router.push('/');
          }
        }}
        aria-label="온마루 메인 홈으로 이동"
        title="온마루 메인 홈으로 이동"
      >
        <BrandMark className={brandScript.className} aria-hidden="true">OnMaru</BrandMark>
      </LogoArea>

      <LogoDivider />

      {/* 2. 온마루 자체 카테고리 목록 (한옥 마루, 지도, 소리마루, 온기이야기, 저장) — 라벨은 title 툴팁으로 대체 */}
      <NavList>
        {/* 온마루 카테고리 1: 한옥 마루 */}
        <NavItemBtn
          type="button"
          $active={false}
          onClick={() => router.push('/hanok')}
          aria-label="한옥 마루"
          title="한옥 마루"
        >
          <NavItemIcon>
            <BookOpen size={19} strokeWidth={2} />
          </NavItemIcon>
        </NavItemBtn>

        {/* 온마루 카테고리 2: 지도 (정보지도) — 온기지도 전환은 아래 '온기이야기' 항목과 패널 내 ModeToggle이 담당한다 */}
        <NavItemBtn
          type="button"
          $active={isMapActive}
          onClick={handleSelectInfoMap}
          aria-label="정보지도"
          title="정보지도"
        >
          <NavItemIcon>
            <MapPin size={19} strokeWidth={2} />
          </NavItemIcon>
        </NavItemBtn>

        {/* 온마루 카테고리 3: 소리마루 (오디 도슨트) */}
        <NavItemBtn
          type="button"
          $active={false}
          onClick={() => router.push('/odii')}
          aria-label="소리마루"
          title="소리마루"
        >
          <NavItemIcon>
            <Headphones size={19} strokeWidth={2} />
          </NavItemIcon>
        </NavItemBtn>

        {/* 온마루 카테고리 4: 온기이야기 (지도 내 온기 후기 & 온도 모드 바로가기) */}
        <NavItemBtn
          type="button"
          $active={isWarmthActive}
          onClick={handleSelectWarmthMap}
          aria-label="온기이야기"
          title="온기이야기"
        >
          <NavItemIcon>
            <Flame size={19} strokeWidth={2} />
          </NavItemIcon>
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
          title="마음에 담은 장소"
        >
          <NavItemIcon>
            <Bookmark size={19} strokeWidth={2} />
          </NavItemIcon>
        </NavItemBtn>
      </NavList>

      {/* 3. 하단 유틸리티 메뉴 (마이/로그인) — 홈 이동은 위 브랜드 로고가 이미
          담당하므로 별도의 "온마루 홈" 항목을 중복으로 두지 않는다. */}
      <BottomArea>
        <Divider />
        <NavItemBtn
          type="button"
          $active={false}
          onClick={() => router.push('/auth/login')}
          aria-label="마이 / 로그인"
          title="로그인"
        >
          <NavItemIcon>
            <User size={19} strokeWidth={2} />
          </NavItemIcon>
        </NavItemBtn>
      </BottomArea>
    </RailContainer>
  );
}
