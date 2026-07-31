'use client';

import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_URL = '/anchae.glb';

/**
 * 완전 고정된 한옥 모델.
 * 스크롤에도, 조명 시퀀스에도 반응하지 않는다. 원점 기준으로 중심만 맞춰 세워둔다.
 */
export default function HanokStaticModel() {
  const { scene } = useGLTF(MODEL_URL);

  const { root, offset } = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    // 좌우/앞뒤는 중심을, 높이는 바닥(yMin)을 원점에 맞춘다.
    const bbox = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    return {
      root: cloned,
      offset: [-center.x, -bbox.min.y, -center.z] as [number, number, number],
    };
  }, [scene]);

  return (
    <group position={offset}>
      <primitive object={root} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
