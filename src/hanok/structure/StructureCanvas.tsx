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

// 3D는 도감 본문보다 무겁다. 모달을 열 때 비로소 받아온다.
const HanokStructureScene = dynamic(() => import('./HanokStructureScene'), { ssr: false });

const Layer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
`;

export default function StructureCanvas({ progress }: { progress: number }) {
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
          <HanokStructureScene progress={progress} />
        </Suspense>
      </Canvas>
    </Layer>
  );
}
