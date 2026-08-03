'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Html, useProgress, ContactShadows, OrbitControls } from '@react-three/drei';
import type { MotionValue } from 'framer-motion';
import * as THREE from 'three';
import { STAGES } from './hanok.data';
import { surface, darkPalette } from '@/design-system/tokens';

type OrbitControlsRef = React.ComponentRef<typeof OrbitControls>;

const MODEL_URL = '/anchae.glb';

/* ------------------------------------------------------------------ *
 * easing
 * ------------------------------------------------------------------ */

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

/* ------------------------------------------------------------------ *
 * 모델 준비
 * ------------------------------------------------------------------ */

interface Part {
  mesh: THREE.Mesh;
  materials: THREE.Material[];
  origin: THREE.Vector3;
  from: THREE.Vector3;
  stage: number;
  /** 같은 단계 안에서의 등장 순서 0~1. 부재가 한 덩어리로 움직이지 않도록 스태거를 준다. */
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

      const matchedBy = stage !== -1 ? 'keyword' : 'height-fallback';

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

/* ------------------------------------------------------------------ *
 * 조립 애니메이션
 * ------------------------------------------------------------------ */

function partProgress(part: Part, p: number, span: number): number {
  const start = part.stage === 0 ? -span : part.stage * span;
  const local = clamp01((p - start) / (span * 0.75));
  const delay = part.stagger * 0.3;
  return clamp01((local - delay) / (1 - delay));
}

interface AnchaeModelProps {
  progress: MotionValue<number>;
}

function AnchaeModel({ progress }: AnchaeModelProps) {
  const { root, parts, offset } = usePreparedModel();
  const introRef = useRef(0);

  useFrame((_, delta) => {
    const p = progress.get();
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

/* ------------------------------------------------------------------ *
 * 카메라 연출
 * ------------------------------------------------------------------ */

const STAGE_POS = STAGES.map((s) => new THREE.Vector3(...s.cameraPos));
const STAGE_TARGET = STAGES.map((s) => new THREE.Vector3(...s.cameraTarget));
const STAGE_FOV = STAGES.map((s) => s.fov);

interface CameraRigProps {
  progress: MotionValue<number>;
  isOrbitEnabled?: boolean;
  customTarget?: [number, number, number] | null;
  controlsRef?: React.RefObject<OrbitControlsRef | null>;
  onCameraUpdate?: (pos: [number, number, number], target: [number, number, number], fov: number) => void;
}

function CameraRig({ progress, isOrbitEnabled, customTarget, controlsRef, onCameraUpdate }: CameraRigProps) {
  const { camera, size } = useThree();

  const desiredPos = useRef(new THREE.Vector3().copy(STAGE_POS[0]));
  const desiredTarget = useRef(new THREE.Vector3().copy(STAGE_TARGET[0]));
  const smoothTarget = useRef(new THREE.Vector3().copy(STAGE_TARGET[0]));
  const desiredFov = useRef(STAGE_FOV[0]);
  const introRef = useRef(0);

  useFrame((_, delta) => {
    const pCam = camera as THREE.PerspectiveCamera;

    if (isOrbitEnabled) {
      const pos: [number, number, number] = [camera.position.x, camera.position.y, camera.position.z];
      const targetVec = controlsRef?.current?.target ?? smoothTarget.current;
      const target: [number, number, number] = [targetVec.x, targetVec.y, targetVec.z];
      onCameraUpdate?.(pos, target, pCam.fov);
      return;
    }

    const p = progress.get();
    const last = STAGES.length - 1;

    const f = p * last;
    const i = Math.min(last - 1, Math.floor(f));
    const k = easeInOutCubic(clamp01(f - i));

    const aspect = size.width / size.height;
    const isMobile = aspect < 1.2;

    const targetA = isMobile && STAGES[i].mobileCameraTarget
      ? new THREE.Vector3(...STAGES[i].mobileCameraTarget!)
      : STAGE_TARGET[i];

    const targetB = isMobile && STAGES[i + 1]?.mobileCameraTarget
      ? new THREE.Vector3(...STAGES[i + 1].mobileCameraTarget!)
      : STAGE_TARGET[i + 1] ?? STAGE_TARGET[i];

    desiredPos.current.lerpVectors(STAGE_POS[i], STAGE_POS[i + 1], k);
    if (customTarget) {
      desiredTarget.current.set(...customTarget);
    } else {
      desiredTarget.current.lerpVectors(targetA, targetB, k);
    }
    desiredFov.current = THREE.MathUtils.lerp(STAGE_FOV[i], STAGE_FOV[i + 1], k);

    const azimuth = p * Math.PI * 0.45;
    const cos = Math.cos(azimuth);
    const sin = Math.sin(azimuth);
    const { x, z } = desiredPos.current;
    desiredPos.current.x = x * cos - z * sin;
    desiredPos.current.z = x * sin + z * cos;

    introRef.current = Math.min(1, introRef.current + delta / 2.0);
    const intro = easeOutCubic(introRef.current);
    desiredPos.current.multiplyScalar(1 + 0.42 * (1 - intro));

    const a = 1 - Math.exp(-6 * delta);
    camera.position.lerp(desiredPos.current, a);
    if (customTarget) {
      smoothTarget.current.set(...customTarget);
    } else {
      smoothTarget.current.lerp(desiredTarget.current, a);
    }
    camera.lookAt(smoothTarget.current);

    // 반응형 FOV 보정: 모바일/태블릿 등 세로 화면(aspect < 1.2)에서 모델이 꽉 차 보이지 않도록 줌아웃하여 여백 확보
    const responsiveFovMult = aspect < 1.2 ? Math.min(1.58, 1.40 / Math.max(0.48, aspect)) : 1.0;
    const targetFov = desiredFov.current * responsiveFovMult;

    if (Math.abs(pCam.fov - targetFov) > 0.01) {
      pCam.fov = THREE.MathUtils.lerp(pCam.fov, targetFov, a);
      pCam.updateProjectionMatrix();
    }

    onCameraUpdate?.(
      [camera.position.x, camera.position.y, camera.position.z],
      [smoothTarget.current.x, smoothTarget.current.y, smoothTarget.current.z],
      pCam.fov
    );
  });

  return null;
}

function FramingOffset({ ratio = 0.16, mobileYRatio = 0.06 }: { ratio?: number; mobileYRatio?: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  useEffect(() => {
    const wide = size.width / size.height > 1.2;
    if (wide) {
      // 데스크톱: 모델을 화면 우측 55% 영역 중앙으로 이동
      camera.setViewOffset(
        size.width,
        size.height,
        -size.width * ratio,
        0,
        size.width,
        size.height
      );
    } else {
      // 📱 모바일/세로 화면: 적절한 중앙 높이로 배치 (6% 오프셋)
      camera.setViewOffset(
        size.width,
        size.height,
        0,
        size.height * mobileYRatio,
        size.width,
        size.height
      );
    }
    camera.updateProjectionMatrix();

    return () => {
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
    };
  }, [camera, size, ratio, mobileYRatio]);

  return null;
}

/* ------------------------------------------------------------------ *
 * 로더
 * ------------------------------------------------------------------ */

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div
        style={{
          color: 'rgba(255,255,255,0.9)',
          fontFamily: 'sans-serif',
          fontSize: '13px',
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '160px',
            height: '2px',
            background: 'rgba(255,255,255,0.14)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: '#d4af37',
              transition: 'width 0.2s ease-out',
            }}
          />
        </div>
        안채를 불러오는 중 {progress.toFixed(0)}%
      </div>
    </Html>
  );
}

/* ------------------------------------------------------------------ *
 * Canvas
 * ------------------------------------------------------------------ */

interface AnchaeViewerCanvasProps {
  progress: MotionValue<number>;
  isOrbitEnabled?: boolean;
  customTarget?: [number, number, number] | null;
  onCameraUpdate?: (pos: [number, number, number], target: [number, number, number], fov: number) => void;
}

export default function AnchaeViewerCanvas({
  progress,
  isOrbitEnabled = false,
  customTarget,
  onCameraUpdate,
}: AnchaeViewerCanvasProps) {
  const controlsRef = useRef<OrbitControlsRef | null>(null);

  return (
    <Canvas
      camera={{ position: STAGES[0].cameraPos, fov: STAGES[0].fov, near: 0.1, far: 200 }}
      dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: isOrbitEnabled ? 'auto' : 'none',
      }}
    >
      <color attach="background" args={[surface.dark.app]} />
      <fog attach="fog" args={[surface.dark.app, 38, 88]} />

      <hemisphereLight args={['#e8f2ff', '#1f1b16', 1.6]} />
      <ambientLight intensity={0.85} />

      <directionalLight position={[15, 25, 15]} intensity={2.6} castShadow />

      <directionalLight position={[0, 40, 10]} intensity={3.2} color="#e0eeff" />
      <directionalLight position={[0, 30, -20]} intensity={2.4} color={darkPalette.kobalt[200]} />
      <directionalLight position={[-15, 10, -10]} intensity={1.2} color={darkPalette.kobalt[100]} />

      <React.Suspense fallback={<Loader />}>
        <AnchaeModel progress={progress} />
        <ContactShadows
          position={[0, 0.01, 0]}
          scale={34}
          resolution={1024}
          blur={2.6}
          opacity={0.5}
          far={14}
        />
      </React.Suspense>

      {isOrbitEnabled && <OrbitControls ref={controlsRef} makeDefault />}

      <CameraRig
        progress={progress}
        isOrbitEnabled={isOrbitEnabled}
        customTarget={customTarget}
        controlsRef={controlsRef}
        onCameraUpdate={onCameraUpdate}
      />
      <FramingOffset />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);


useGLTF.preload(MODEL_URL);
