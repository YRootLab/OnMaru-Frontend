'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { STAGES } from '../../data/hanok.data';
import { useHanokViewerStore } from '../../store/useHanokViewerStore';

const MODEL_URL = '/anchae.glb';

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

interface Part {
  mesh: THREE.Mesh;
  materials: THREE.Material[];
  origin: THREE.Vector3;
  from: THREE.Vector3;
  stage: number;
  stagger: number;
}

interface PreparedModel {
  root: THREE.Object3D;
  parts: Part[];
  offset: [number, number, number];
}

function toTransparent(source: THREE.Material): THREE.Material {
  const m = source.clone();
  m.transparent = true;
  m.opacity = 0;
  m.depthWrite = true;

  // 재질 스페큘러 반사 환경맵 세기 설정
  const std = m as THREE.MeshStandardMaterial;
  if (std.isMeshStandardMaterial) {
    std.envMapIntensity = 0.9;
  }

  return m;
}

function usePreparedModel(): PreparedModel {
  const { scene } = useGLTF(MODEL_URL);

  return useMemo(() => {
    const root = scene.clone(true);

    const meshes: THREE.Mesh[] = [];
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const mesh = o as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        meshes.push(mesh);
      }
    });

    const bbox = new THREE.Box3().setFromObject(root);
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    const yMin = bbox.min.y;
    const ySpan = Math.max(0.001, bbox.max.y - yMin);

    const offset: [number, number, number] = [-center.x, -yMin, -center.z];

    const n = STAGES.length;
    const perStageCount = new Array<number>(n).fill(0);
    const stageOf = new Map<THREE.Mesh, number>();

    meshes.forEach((mesh) => {
      const name = `${mesh.name} ${mesh.parent?.name ?? ''}`.toLowerCase();

      let stage = STAGES.findIndex((s) =>
        s.meshKeywords.some((kw) => name.includes(kw.toLowerCase()))
      );

      if (stage === -1) {
        const box = new THREE.Box3().setFromObject(mesh);
        const c = new THREE.Vector3();
        box.getCenter(c);
        stage = Math.min(n - 1, Math.max(0, Math.floor(((c.y - yMin) / ySpan) * n)));
      }

      stageOf.set(mesh, stage);
      perStageCount[stage]++;
    });

    const seen = new Array<number>(n).fill(0);

    const parts: Part[] = meshes.map((mesh) => {
      const stage = stageOf.get(mesh) ?? 0;
      const order = seen[stage]++;
      const total = Math.max(1, perStageCount[stage]);

      const materials = Array.isArray(mesh.material)
        ? mesh.material.map(toTransparent)
        : [toTransparent(mesh.material)];
      mesh.material = materials.length === 1 ? materials[0] : materials;

      // 기와는 구운 점토라 실제로 은은한 광택이 있다. GLB 기본 roughness가 너무 높아
      // 검은 기와가 무광 회색 판처럼 보이므로, 지붕 부재만 반사를 살려 능선을 드러낸다.
      if (STAGES[stage]?.id === 'stage-7') {
        for (const mat of materials) {
          const std = mat as THREE.MeshStandardMaterial;
          if (std.isMeshStandardMaterial) {
            std.roughness = Math.min(std.roughness, 0.52);
            std.envMapIntensity = 1.4;
          }
        }
      }

      return {
        mesh,
        materials,
        origin: mesh.position.clone(),
        from: new THREE.Vector3(...STAGES[stage].from),
        stage,
        stagger: total > 1 ? order / (total - 1) : 0,
      };
    });

    return { root, parts, offset };
  }, [scene]);
}

function partProgress(part: Part, p: number, span: number): number {
  const start = part.stage === 0 ? -span : part.stage * span;
  const local = clamp01((p - start) / (span * 0.75));
  const delay = part.stagger * 0.3;
  return clamp01((local - delay) / (1 - delay));
}

export default function HanokModel() {
  const { root, parts, offset } = usePreparedModel();
  const setIsLoaded = useHanokViewerStore((s) => s.setIsLoaded);
  const modelFadeRef = useRef(0);

  useEffect(() => {
    setIsLoaded(true);
  }, [setIsLoaded]);

  const groupRef = useRef<THREE.Group>(null);


  useFrame((_, delta) => {
    modelFadeRef.current = Math.min(1, modelFadeRef.current + delta / 1.2);
    const fade = easeOutCubic(modelFadeRef.current);

    const { activeSectionId, stageProgress, heroProgress, isReducedMotion } =
      useHanokViewerStore.getState();

    // 0.55 ~ 1.00: 느린 자동 회전 시작 (10초당 8도 = 0.8도/초)
    if (activeSectionId === 'hero' && heroProgress >= 0.55 && !isReducedMotion) {
      if (groupRef.current) {
        const rotSpeed = (8 * (Math.PI / 180)) / 10;
        groupRef.current.rotation.y += delta * rotSpeed;
      }
    } else if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.08);
    }

    if (activeSectionId !== 'assembly') {
      // 히어로 및 브랜드 소개 섹션: 완공된 상태 유지
      for (const part of parts) {
        part.mesh.position.copy(part.origin);
        const opacity = fade;
        const visible = opacity > 0.004;
        part.mesh.visible = visible;

        if (visible) {
          for (const mat of part.materials) {
            mat.opacity = opacity;
            mat.transparent = opacity < 0.995;
          }
        }
      }
    } else {
      // 7단계 부재별 분해 및 조립 위치 보간
      const pAss = clamp01(stageProgress);
      const span = 1 / STAGES.length;

      for (const part of parts) {
        const t = partProgress(part, pAss, span);
        const e = easeOutCubic(t);

        const targetX = part.origin.x + part.from.x * (1 - e);
        const targetY = part.origin.y + part.from.y * (1 - e);
        const targetZ = part.origin.z + part.from.z * (1 - e);
        const opacity = smoothstep(0, 0.4, t) * fade;

        part.mesh.position.set(targetX, targetY, targetZ);

        const visible = opacity > 0.004;
        part.mesh.visible = visible;

        if (visible) {
          for (const mat of part.materials) {
            mat.opacity = opacity;
            mat.transparent = opacity < 0.995;
          }
        }
      }
    }
  });

  return (
    <group ref={groupRef} position={offset}>
      <primitive object={root} />
    </group>
  );
}


useGLTF.preload(MODEL_URL);
