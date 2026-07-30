'use client';

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_URL = '/anchae.glb';

/**
 * 고정된 한옥 모델.
 * 스크롤에 반응하지 않는다. 좌우/앞뒤는 중심을, 높이는 바닥을 원점에 맞춰 세워둔다.
 */
export default function HanokModel() {
  const { scene } = useGLTF(MODEL_URL);

  const { root, offset } = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });

    const bbox = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    return {
      root: cloned,
      offset: [-center.x, -bbox.min.y, -center.z],
    };
  }, [scene]);

  return (
    <group position={offset}>
      <primitive object={root} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
