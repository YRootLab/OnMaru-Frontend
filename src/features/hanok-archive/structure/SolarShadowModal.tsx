'use client';








import styled from '@emotion/styled';

import { surface } from '@/design-system/tokens';
import { SHADOW_RANGE } from './constants';
import StructureModal from './StructureModal';
import StructureCanvas from './StructureCanvas';
import SolarShadowPanel from './SolarShadowPanel';


const SHADOW_VIEW = (SHADOW_RANGE[0] + SHADOW_RANGE[1]) / 2;

const Body = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;














  background: radial-gradient(
    ellipse 82% 66% at 50% 48%,
    #ffffff 0%,
    ${surface.light.base} 58%,
    rgba(58, 46, 31, 0.07) 100%
  );


  [data-theme='dark'] & {
    background: radial-gradient(
      ellipse 82% 66% at 50% 48%,

      #463F35 0%,
      ${surface.dark.surface} 58%,
      ${surface.dark.app} 100%
    );
  }
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
