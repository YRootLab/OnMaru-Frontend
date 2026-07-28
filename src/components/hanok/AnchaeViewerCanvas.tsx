'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Html, useProgress, ContactShadows } from '@react-three/drei';
import type { MotionValue } from 'framer-motion';
import * as THREE from 'three';
import { STAGES } from './hanok.data';
import { surface, darkPalette } from '@/design-system/tokens';

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
    // useGLTF는 URL 단위로 씬을 캐싱한다. 캐시된 원본을 직접 mutate 하면
    // StrictMode 이중 실행 · HMR · 리마운트마다 변형이 누적된다.
    // (실제로 이것 때문에 2회차 실행이 "흩어진 상태"의 bbox를 재서 모델이 화면 밖으로 날아갔다)
    // 항상 복제본 위에서만 작업한다.
    const root = scene.clone(true);

    const meshes: THREE.Mesh[] = [];
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
    });

    // 아직 아무것도 옮기지 않은 상태 = 원본 배치. 정렬 기준은 반드시 여기서 잡는다.
    const bbox = new THREE.Box3().setFromObject(root);
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    const yMin = bbox.min.y;
    const ySpan = Math.max(0.001, bbox.max.y - yMin);

    // x/z는 중앙 정렬, y는 바닥(y=0)에 세운다. STAGES.cameraTarget이 y 1~4.5인
    // 좌표계를 전제로 쓰여 있으므로 건물이 y=0에서 시작해야 의미가 맞는다.
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
        // 이름으로 못 잡으면 높이로 추정 (낮은 부재부터 조립)
        const box = new THREE.Box3().setFromObject(mesh);
        const c = new THREE.Vector3();
        box.getCenter(c);
        stage = Math.min(n - 1, Math.max(0, Math.floor(((c.y - yMin) / ySpan) * n)));
      }

      console.log(
        `[MeshMap] "${mesh.name}" (parent: "${mesh.parent?.name}") → Stage ${stage} (${STAGES[stage]?.nameKo}) [${matchedBy}]`
      );

      stageOf.set(mesh, stage);
      perStageCount[stage]++;
    });

    console.log('[MeshMap] Per-stage count:', perStageCount.map((c, i) => `${STAGES[i]?.nameKo}: ${c}`).join(', '));

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

/** 각 단계가 차지하는 스크롤 구간 안에서, 부재 하나의 진행도(0~1)를 구한다. */
function partProgress(part: Part, p: number, span: number): number {
  // stage 0은 페이지 진입 시점에 이미 조립된 상태여야 한다.
  // (Apple 제품 페이지도 도착하자마자 제품이 놓여 있고, 스크롤은 그 다음부터다)
  const start = part.stage === 0 ? -span : part.stage * span;

  // 구간의 75%에서 조립을 끝내고 나머지는 머무른다 → 다음 단계로 넘어가기 전 여백
  const local = clamp01((p - start) / (span * 0.75));

  // 같은 단계 안에서 부재마다 최대 30% 지연
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

    // 로드 직후 2.0초 동안 사방에서 웅장하게 모여드는 영화 같은 조립 등장 연출 (Cinematic Assembly Converge)
    introRef.current = Math.min(1, introRef.current + delta / 2.0);
    const introRaw = introRef.current;

    for (const part of parts) {
      const t = partProgress(part, p, span);
      const e = easeOutCubic(t);

      // 1) 스크롤에 연동된 표준 위치 계산
      let targetX = part.origin.x + part.from.x * (1 - e);
      let targetY = part.origin.y + part.from.y * (1 - e);
      let targetZ = part.origin.z + part.from.z * (1 - e);
      let opacity = smoothstep(0, 0.4, t);

      // 2) 초기 진입 시(p < 0.05) 기단 석조 부재들이 사방 3D 공간에서 센터로 회전 수렴 조립
      if (introRaw < 1.0 && part.stage === 0 && p < 0.05) {
        const partIntroTime = clamp01((introRaw - part.stagger * 0.52) / 0.48);
        const partIntroEase = easeOutCubic(partIntroTime);

        // 각 부재의 원점 기반 방위각 계산 (사방 3D 분산 수렴)
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

function CameraRig({ progress }: { progress: MotionValue<number> }) {
  const { camera } = useThree();

  const desiredPos = useRef(new THREE.Vector3().copy(STAGE_POS[0]));
  const desiredTarget = useRef(new THREE.Vector3().copy(STAGE_TARGET[0]));
  const smoothTarget = useRef(new THREE.Vector3().copy(STAGE_TARGET[0]));
  const introRef = useRef(0);

  useFrame((_, delta) => {
    const p = progress.get();
    const last = STAGES.length - 1;

    // 단계 사이를 끊김 없이 보간한다. 단계마다 스냅시키면 3D가 UI를 따라 "튀어" 보인다.
    const f = p * last;
    const i = Math.min(last - 1, Math.floor(f));
    const k = easeInOutCubic(clamp01(f - i));

    desiredPos.current.lerpVectors(STAGE_POS[i], STAGE_POS[i + 1], k);
    desiredTarget.current.lerpVectors(STAGE_TARGET[i], STAGE_TARGET[i + 1], k);

    // 스크롤 전체에 걸쳐 천천히 도는 궤도. 조립을 여러 각도에서 보여준다.
    const azimuth = p * Math.PI * 0.45;
    const cos = Math.cos(azimuth);
    const sin = Math.sin(azimuth);
    const { x, z } = desiredPos.current;
    desiredPos.current.x = x * cos - z * sin;
    desiredPos.current.z = x * sin + z * cos;

    // 진입 연출: 2.0초 동안 카메라가 상공 높은 각도에서 시원하게 줌인하며 내려온다
    introRef.current = Math.min(1, introRef.current + delta / 2.0);
    const intro = easeOutCubic(introRef.current);
    desiredPos.current.multiplyScalar(1 + 0.42 * (1 - intro));

    // Lenis가 스크롤을 이미 부드럽게 만들어 주므로 카메라는 약하게만 damp 한다.
    const a = 1 - Math.exp(-6 * delta);
    camera.position.lerp(desiredPos.current, a);
    smoothTarget.current.lerp(desiredTarget.current, a);
    camera.lookAt(smoothTarget.current);
  });

  return null;
}

/**
 * 좌측 텍스트 컬럼을 비워두기 위해 피사체를 화면 오른쪽으로 민다.
 *
 * camera.position을 옮기면 안 된다. CameraRig가 매 프레임 position을 lerp로 되돌리는데
 * 오프셋은 매 프레임 새로 더해지므로 둘이 싸우면서 카메라가 계속 밀려난다.
 * 투영 프러스텀 자체를 옮기면 위치 계산과 완전히 분리된다.
 */
function FramingOffset({ ratio = 0.16 }: { ratio?: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  useEffect(() => {
    const wide = size.width / size.height > 1.2;
    if (wide) {
      camera.fov = 40;
      camera.setViewOffset(
        size.width,
        size.height,
        -size.width * ratio,
        0,
        size.width,
        size.height
      );
    } else {
      // 좁은 화면에서는 FOV를 넓혀 한옥 전체가 잘리지 않고 보이게 한다
      camera.fov = 54;
      camera.clearViewOffset();
    }
    camera.updateProjectionMatrix();

    return () => {
      camera.clearViewOffset();
      camera.fov = 40;
      camera.updateProjectionMatrix();
    };
  }, [camera, size, ratio]);

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
}

export default function AnchaeViewerCanvas({ progress }: AnchaeViewerCanvasProps) {
  return (
    <Canvas
      camera={{ position: STAGES[0].cameraPos, fov: 40, near: 0.1, far: 200 }}
      dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {/* 1. 배경을 디자인 시스템 먹빛 마루(surface.dark.app) 베이스 차콜 심야 톤으로 배치해 기와 윤곽선이 뚜렷하게 대비되게 함 */}
      <color attach="background" args={[surface.dark.app]} />
      <fog attach="fog" args={[surface.dark.app, 38, 88]} />

      {/* 2. 상공 반구광 (Hemisphere Light): 하늘 반사광으로 기와 지붕 윗면에 부드러운 림라이트 입힘 */}
      <hemisphereLight args={['#e8f2ff', '#1f1b16', 1.6]} />
      <ambientLight intensity={0.85} />

      {/* 3. 메인 주광원 (태양광) */}
      <directionalLight position={[15, 25, 15]} intensity={2.6} castShadow />

      {/* 4. 지붕 및 기와 윤곽선 전용 직사 림라이트 (Giwa Top Highlight Light) */}
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

      <CameraRig progress={progress} />
      <FramingOffset />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
