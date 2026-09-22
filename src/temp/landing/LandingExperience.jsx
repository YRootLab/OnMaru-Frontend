'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import Lenis from 'lenis';

import { surface } from '@/design-system/tokens';
import { MODEL_URL, SCROLL_HEIGHT } from './scroll-core/constants';
import { frameCamera, toRad } from './scroll-core/cameraUtils';

import HanokModel from './components/HanokModel';
import GlobalBackground from './scroll-core/GlobalBackground';
import { sunNow, useSceneStore } from './scroll-core/sceneStore';
import { progressIn } from './components/LandingSectionFrame';
import LandingHero from './components/LandingHero';
import LandingSolarShadow from './components/LandingSolarShadow';
import LandingHanokAssembly, { AssemblyModel } from './components/LandingHanokAssembly';
import LandingPhilosophy from './components/LandingPhilosophy';
import LandingCallToAction from './components/LandingCallToAction';
import LandingLoader from './components/LandingLoader';


useGLTF.preload(MODEL_URL);





















const CANVAS_BASE_COLOR = surface.dark.app;
















export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let animId = 0;

    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const next = scrollable > 0 ? window.scrollY / scrollable : 0;
      const clamped = Math.min(1, Math.max(0, next));

      setProgress((prev) => (Math.abs(prev - clamped) > 0.0001 ? clamped : prev));
      animId = requestAnimationFrame(updateProgress);
    };

    animId = requestAnimationFrame(updateProgress);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return progress;
}










function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.4 });

    let frame = requestAnimationFrame(function step(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(step);
    });

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);
}





const CAMERA_FOV = 46;











const SHOTS = [
  { p: 0.0, azimuthDeg: 104, elevationDeg: 9, dolly: 6 }, // Beat1 — 멀찍이서 떠오른다
  { p: 0.12, season: true }, // Beat3 진입 — 아래 SEASON_VIEWS 구도로 붙는다
  { p: 0.38, season: true }, // Beat3 — 구간 내내 붙박이. 움직이는 건 그림자뿐이다
  { p: 0.45, azimuthDeg: 142, elevationDeg: 20, dolly: 3 }, // Beat4 — 비스듬한 3/4 아이솔메트릭 입체 구도
  { p: 0.7, azimuthDeg: 134, elevationDeg: 14, dolly: -1 }, // Beat4 완성 — 눈높이와 입체감의 최적화
  { p: 1.0, azimuthDeg: 118, elevationDeg: 12, dolly: 6 }, // Beat5~ — 다시 멀어진다
];















const SEASON_VIEWS = [

  { minWidth: 1280, dir: [14, 18, 32], target: [-2, 6.0, 0], fov: 36, fit: 0.84 },
  { minWidth: 768, dir: [14, 19, 38], target: [-2, 5.5, 0], fov: 40, fit: 0.86 },
  { minWidth: 0, dir: [10, 20, 48], target: [-1, 5.0, 0], fov: 46, fit: 0.88 },
];

const lerp = (from, to, t) => from + (to - from) * t;

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);


const BASE_SCREEN_Y = 0.12;







const ROOF_SCREEN_Y = 0.7;


const WIDTH_FILL = 0.82;







function resolveShots(model, size) {
  const view = SEASON_VIEWS.find((candidate) => size.width >= candidate.minWidth);

  return SHOTS.map((shot) => {
    if (shot.season)




















































































































































































































































      {stage.orbit && (
        <>
          <OrbitControls makeDefault enableZoom={false} enablePan={false} target={view.target} />
          <CameraProbe target={view.target} sun={sun.position} />
        </>
      )}

      <ambientLight intensity={Math.max(0.6, stage.ambientIntensity)} color="#FFFDF7" />

      <hemisphereLight skyColor="#FFF9EE" groundColor="#E8DFD0" intensity={0.4} />

      <SunDriver lightRef={keyLight} />

      <directionalLight
        ref={keyLight}
        position={KEY_POSITION}
        intensity={stage.keyIntensity}
        color={KEY_COLOR}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
        shadow-radius={4}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[
            -SHADOW_EXTENT,
            SHADOW_EXTENT,
            SHADOW_EXTENT,
            -SHADOW_EXTENT,
            0.5,
            SHADOW_FAR,
          ]}
        />
      </directionalLight>

      <directionalLight
        position={[15, 20, -15]}
        intensity={stage.rimIntensity}
        color="#FFCC77"
      />




      <group
        position={[
          devTuner?.posX ?? 0,
          stage.seasonView ? (devTuner?.posY ?? 0) : 0,
          stage.seasonView ? (devTuner?.posZ ?? -10.0) : 0,
        ]}
      >
        <group scale={model.normalizedScale * (devTuner?.scale ?? 1.35)}>
          {assembling ? <AssemblyModel /> : <HanokModel />}
        </group>


        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[120, 120]} />
          <shadowMaterial opacity={stage.shadowOpacity} transparent />
        </mesh>

        <ContactShadows
          position={[0, 0, 0]}
          opacity={stage.shadowOpacity * 0.6}
          scale={footprint * 2.5}
          blur={2.0}
          far={scale * 2}
          resolution={1024}
          color={stage.shadowColor}
        />
      </group>
    </>
  );
}


const BEAT5_START = 0.7;
const BEAT5_EXIT_END = 0.7216; // 0.70 + (0.82 - 0.70) × 0.18







const REST_LIGHT = { key: 2.5, rim: 1.5, ambient: 1.2 };
const ASSEMBLY_LIGHT = { key: 3.4, rim: 1.6, ambient: 1.6 };







function getStage(progress, assembling, orbit) {

  const enter = progressIn(progress, CANVAS_FADE_IN[0], CANVAS_FADE_IN[1]);

  const exit = easeInOutCubic(progressIn(progress, BEAT5_START, BEAT5_EXIT_END));

  const light = assembling ? ASSEMBLY_LIGHT : REST_LIGHT;
  const lit = 1 - exit;

  return {
    progress,
    orbit,
    keyIntensity: light.key * lit,
    rimIntensity: light.rim * lit,
    ambientIntensity: light.ambient * lit,

    shadowOpacity: 0.42 * lit,
    shadowColor: '#3A2E1F',

    canvasOpacity: enter * (1 - exit),
  };
}









const cameraReadout = { position: [0, 0, 0], target: [0, 0, 0], fov: 0, sun: [0, 0, 0] };

function useOrbitFlag() {
  return useMemo(() => {
    if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('orbit') === '1';
  }, []);
}

function CameraHud() {
  const solar = useSceneStore((s) => s.sun);
  const [, tick] = useState(0);


  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 200);
    return () => clearInterval(timer);
  }, []);

  const round = (values) => `[${values.map((v) => v.toFixed(1)).join(', ')}]`;

  return (
    <pre
      style={{
        position: 'fixed',
        top: 12,
        right: 12,
        zIndex: 99,
        margin: 0,
        padding: '10px 12px',
        borderRadius: 8,
        background: 'rgba(16, 14, 12, 0.82)',
        color: '#F5A623',
        font: '11px/1.6 'Spoqa Han Sans Neo', sans-serif',
        pointerEvents: 'none',
      }}
    >
      {`position ${round(cameraReadout.position)}
target   ${round(cameraReadout.target)}
fov      ${cameraReadout.fov.toFixed(1)}
고도     ${solar ? `${solar.altitude.toFixed(1)}° · 그림자 ${(1 / Math.tan(toRad(solar.altitude))).toFixed(2)}배` : '—'}
sun      ${round(cameraReadout.sun)}`}
    </pre>
  );
}


function CameraProbe({ target, sun }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);

  useFrame(() => {
    cameraReadout.position = camera.position.toArray();
    cameraReadout.target = controls?.target ? controls.target.toArray() : target;
    cameraReadout.fov = camera.fov;
    cameraReadout.sun = sun;
  });

  return null;
}


function Fallback3DWireframe() {
  return (
    <group position={[-0.7, 0.3, 0]}>
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[4.5, 0.45, 3.5]} />
        <meshStandardMaterial color="#D4AF37" wireframe />
      </mesh>

      {[-1.8, 1.8].map((x) =>
        [-1.3, 1.3].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.9, z]}>
            <cylinderGeometry args={[0.13, 0.13, 2.5, 8]} />
            <meshStandardMaterial color="#D4AF37" wireframe />
          </mesh>
        )),
      )}

      <mesh position={[0, 2.6, 0]}>
        <coneGeometry args={[3.6, 1.5, 4]} />
        <meshStandardMaterial color="#C1502E" wireframe />
      </mesh>
    </group>
  );
}














function FixedStage({ progress }) {
  const assembling = useSceneStore((s) => s.assembling);
  const orbit = useOrbitFlag();

  const stage = getStage(progress, assembling, orbit);
  const canvasOpacity = stage.canvasOpacity;

  return (
    <>


      {orbit && <CameraHud />}

      {SHOW_HANOK && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1,
            pointerEvents: 'none',
            opacity: canvasOpacity,
            visibility: canvasOpacity > 0.001 ? 'visible' : 'hidden',
            transition: 'opacity 0.2s ease-out',
          }}
        >
          <Canvas
            dpr={[1, 2]}

            shadows={{ type: THREE.PCFShadowMap }}
            gl={{ alpha: true, antialias: true }}
            style={{ position: 'absolute', inset: 0, background: 'transparent' }}
          >





            <Suspense fallback={<Fallback3DWireframe />}>
              <HanokScene stage={stage} />
            </Suspense>
          </Canvas>
        </div>
      )}
    </>
  );
}





export default function LandingExperience() {
  useSmoothScroll();
  const progress = useScrollProgress();



  return (
    <main style={{ position: 'relative', width: '100%', background: CANVAS_BASE_COLOR }}>

      <LandingLoader />


      <GlobalBackground progress={progress} />


      <div style={{ height: SCROLL_HEIGHT }} />

      <FixedStage progress={progress} />


      <div style={{ position: 'relative', zIndex: 2 }}>
        <LandingHero progress={progress} />
        <LandingSolarShadow progress={progress} />
        <LandingHanokAssembly progress={progress} />
        <LandingPhilosophy progress={progress} />
        <LandingCallToAction progress={progress} />
      </div>
    </main>
  );
}
