'use client';

/*
  절기 그림자 시뮬레이션 모달.

  스크롤이 아니라 절기 슬라이더가 이 장면의 조작축이라, 카메라는 그림자 구간 구도에
  그대로 세워두고 진행도는 상수로 건넨다. 움직이는 건 볕의 고도와 그림자뿐이다.
*/

import styled from '@emotion/styled';

import { lightPalette, surface } from '@/design-system/tokens';
import { SHADOW_RANGE } from './constants';
import StructureModal from './StructureModal';
import StructureCanvas from './StructureCanvas';
import SolarShadowPanel from './SolarShadowPanel';

/** 그림자 구간 구도에 붙박이로 세운다 (SHOTS의 season 샷 사이). */
const SHADOW_VIEW = (SHADOW_RANGE[0] + SHADOW_RANGE[1]) / 2;

const Body = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(
    ellipse 90% 70% at 50% 20%,
    ${lightPalette.hwanggeum[50]} 0%,
    ${surface.light.base} 60%,
    #ffffff 100%
  );
`;

export default function SolarShadowModal({ onClose }: { onClose: () => void }) {
  return (
    <StructureModal title="절기에 따른 처마 그림자" onClose={onClose}>
      <Body>
        <StructureCanvas progress={SHADOW_VIEW} />
        <SolarShadowPanel />
      </Body>
    </StructureModal>
  );
}
