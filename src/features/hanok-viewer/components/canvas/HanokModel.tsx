'use client';

import React, { useMemo, useRef } from 'react';
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
  return m;
}

function usePreparedModel(): PreparedModel {
  const { scene } = useGLTF(MODEL_URL);

  return useMemo(() => {
    const root = scene.clone(true);

    const meshes: THREE.Mesh[] = [];
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
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
  const { scrollProgress } = useHanokViewerStore();
  const introRef = useRef(0);

  useFrame((_, delta) => {
    const p = scrollProgress;
    const span = 1 / STAGES.length;

    introRef.current = Math.min(1, introRef.current + delta / 2.0);
    const introRaw = introRef.current;

    for (const part of parts) {
      const t = partProgress(part, p, span);
      const e = easeOutCubic(t);

      let targetX = part.origin.x + part.from.x * (1 - e);
      let targetY = part.origin.y + part.from.y * (1 - e);
      let targetZ = part.origin.z + part.from.z * (1 - e);
      let opacity = smoothstep(0, 0.4, t);

      if (introRaw < 1.0 && part.stage === 0 && p < 0.05) {
        const partIntroTime = clamp01((introRaw - part.stagger * 0.52) / 0.48);
        const partIntroEase = easeOutCubic(partIntroTime);

        const angle = Math.atan2(part.origin.z, part.origin.x || 0.001);
        const spreadDist = 9.0 + (part.stagger - 0.5) * 8.0;

        targetX = part.origin.x + Math.cos(angle) * spreadDist * (1 - partIntroEase);
        targetY = part.origin.y - 18.0 * (1 - partIntroEase);
        targetZ = part.origin.z + Math.sin(angle) * spreadDist * (1 - partIntroEase);

        opacity = smoothstep(0, 0.25, partIntroTime);
      }

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
  });

  return (
    <group position={offset}>
      <primitive object={root} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
