'use client';









import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';

import { useOnmaruTheme } from '@/design-system/ThemeProvider';


const HanokStructureScene = dynamic(() => import('./HanokStructureScene'), { ssr: false });





const Layer = styled.div<{ $interactive: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: ${({ $interactive }) => ($interactive ? 'auto' : 'none')};
`;

interface StructureCanvasProps {
  progress: number;

  onSelectMesh?: (meshName: string) => void;
  highlightStage?: number;
}

export default function StructureCanvas({
  progress,
  onSelectMesh,
  highlightStage = -1,
}: StructureCanvasProps) {







  const { mode } = useOnmaruTheme();

  return (
    <Layer aria-hidden="true" $interactive={Boolean(onSelectMesh)}>
      <Canvas
        dpr={[1, 2]}

        shadows={{ type: THREE.PCFShadowMap }}
        gl={{ alpha: true, antialias: true }}
        style={{ position: 'absolute', inset: 0, background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <HanokStructureScene
            progress={progress}
            dark={mode === 'dark'}
            onSelectMesh={onSelectMesh}
            highlightStage={highlightStage}
          />
        </Suspense>
      </Canvas>
    </Layer>
  );
}
