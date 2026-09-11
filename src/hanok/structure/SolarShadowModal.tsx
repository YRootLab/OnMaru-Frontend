'use client';

/*
  절기 그림자 시뮬레이션 모달.

  스크롤이 아니라 절기 슬라이더가 이 장면의 조작축이라, 카메라는 그림자 구간 구도에
  그대로 세워두고 진행도는 상수로 건넨다. 움직이는 건 볕의 고도와 그림자뿐이다.
*/

import styled from '@emotion/styled';

import { surface } from '@/design-system/tokens';
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
  /*
    한옥이 선 자리에 볕을 모은다.

    전에는 밝은 데가 위(50% 20%)였고 바깥으로 갈수록 #ffffff로 더 밝아졌다 — 화면에서
    가장 환한 곳이 헤드라인 뒤와 모달 테두리였다는 뜻이다. 눈은 밝고 대비 큰 데로 가므로
    정작 한옥은 가장 밋밋한 자리에 서 있었다.

    가운데를 가장 밝게 두고 바깥을 아주 옅게 눌러 한옥 쪽으로 시선을 모은다.
    at 50% 48%은 카메라가 잡는 한옥의 자리에 맞춘 값이라 구도를 바꾸면 같이 옮겨야 한다.

    스톱은 밝기 순으로만 세운다. 중간에 연노랑을 끼웠더니 흰 중심과 거의 흰 바깥 사이에서
    그 색만 도드라져 한옥 둘레에 노란 띠가 생겼다. 볕의 온기는 색을 끼워 넣지 말고
    바깥을 누르는 그늘(따뜻한 갈회색)이 대신 낸다.
  */
  background: radial-gradient(
    ellipse 82% 66% at 50% 48%,
    #ffffff 0%,
    ${surface.light.base} 58%,
    rgba(58, 46, 31, 0.07) 100%
  );

  /* 먹빛 바탕에서도 같은 일을 한다 — 한옥이 선 가운데가 가장 밝고 바깥이 가라앉는다. */
  [data-theme='dark'] & {
    background: radial-gradient(
      ellipse 82% 66% at 50% 48%,
      /* elevated(#3A352E)보다 한 톤 위. 여기가 어두우면 그림자가 떨어질 자리가 없다. */
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
