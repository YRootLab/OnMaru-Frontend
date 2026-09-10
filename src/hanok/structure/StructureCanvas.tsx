'use client';

/*
  모달 안에 서는 3D 캔버스.

  씬(HanokStructureScene)은 랜딩에서 쓰던 진행도 기반 카메라를 그대로 물려받았다.
  모달은 스크롤이 없으므로 각자 자기 장면에 해당하는 진행도를 상수로 또는
  단계 진행도에서 환산해 건넨다.
*/

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';

import { useOnmaruTheme } from '@/design-system/ThemeProvider';

// 3D는 도감 본문보다 무겁다. 모달을 열 때 비로소 받아온다.
const HanokStructureScene = dynamic(() => import('./HanokStructureScene'), { ssr: false });

const Layer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
`;

export default function StructureCanvas({ progress }: { progress: number }) {
  /*
    씬 안에서는 테마를 읽을 수 없다.

    react-three-fiber는 자체 리컨실러로 그리므로 바깥 React 트리의 컨텍스트가 <Canvas>
    안까지 따라 들어가지 않는다. 그림자 농도는 바탕색에 따라 달라져야 하니, 컨텍스트가
    살아 있는 여기서 읽어 값으로 건넨다.
  */
  const { mode } = useOnmaruTheme();

  return (
    <Layer aria-hidden="true">
      <Canvas
        dpr={[1, 2]}
        /* 그림자 맵이 이 연출의 전부다. 이 플래그 없이는 벽이 비어 있다. */
        shadows={{ type: THREE.PCFShadowMap }}
        gl={{ alpha: true, antialias: true }}
        style={{ position: 'absolute', inset: 0, background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <HanokStructureScene progress={progress} dark={mode === 'dark'} />
        </Suspense>
      </Canvas>
    </Layer>
  );
}
