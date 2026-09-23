'use client';









import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import { MODEL_URL, SHADOW_RANGE, ASSEMBLY_RANGE } from './constants';
import { frameCamera, toRad } from './cameraUtils';
import { progressIn, easeInOutCubic } from './motion';
import { sunNow, useSceneStore } from './sceneStore';
import HanokModel from './HanokModel';
import { AssemblyModel } from './HanokAssemblyPanel';

useGLTF.preload(MODEL_URL);

const CAMERA_FOV = 46;







const SHOTS = [
  { p: 0.0, azimuthDeg: 104, elevationDeg: 9, dolly: 6 },
  { p: SHADOW_RANGE[0] + 0.04, season: true },
  { p: SHADOW_RANGE[1], season: true },
  { p: ASSEMBLY_RANGE[0] + 0.04, azimuthDeg: 142, elevationDeg: 20, dolly: 3 },
  { p: ASSEMBLY_RANGE[1], azimuthDeg: 134, elevationDeg: 14, dolly: -1 },
  { p: 1.0, azimuthDeg: 118, elevationDeg: 12, dolly: 6 },
];









const SEASON_VIEWS = [
  { minWidth: 1280, dir: [14, 18, 32], target: [-2, 6.0, 0], fov: 36, fit: 0.84 },
  { minWidth: 768, dir: [14, 19, 38], target: [-2, 5.5, 0], fov: 40, fit: 0.86 },
  { minWidth: 0, dir: [10, 20, 48], target: [-1, 5.0, 0], fov: 46, fit: 0.88 },
];












const CONTROL_BAND = 0.22;

const lerp = (from, to, t) => from + (to - from) * t;













const SCREEN_BANDS = [


  { minWidth: 1100, base: 0.44, roof: 0.94, widthFill: 0.5, offsetX: -13 },
  { minWidth: 769, base: 0.44, roof: 0.94, widthFill: 0.55, offsetX: -8 },
  { minWidth: 0, base: 0.5, roof: 0.97, widthFill: 0.76, offsetX: 0 },
];







function resolveShots(model, size) {
  const view = SEASON_VIEWS.find((candidate) => size.width >= candidate.minWidth);
  const band = SCREEN_BANDS.find((candidate) => size.width >= candidate.minWidth);

  return SHOTS.map((shot) => {
    if (shot.season) {




      const center = [0, model.height / 2, 0];
      const gap = Math.hypot(...center.map((v, i) => v - view.target[i]));

      const spread = Math.hypot(model.radius, model.height / 2) + gap;
      const halfTan = Math.tan(toRad(view.fov) / 2);
      const aspect = Math.max(size.width / size.height, 0.1);


      const fit = view.fit * (1 - CONTROL_BAND);


      const distance = Math.max(
        spread / Math.sin(Math.atan(halfTan) * fit),
        spread / Math.sin(Math.atan(halfTan * aspect) * fit),
      );






      const visibleHeight = 2 * distance * halfTan;
      const target = [
        view.target[0],
        view.target[1] - visibleHeight * (CONTROL_BAND / 2),
        view.target[2],
      ];

      const length = Math.hypot(...view.dir);
      const position = target.map((v, i) => v + (view.dir[i] / length) * distance);

      return {
        p: shot.p,
        position,
        target,
        fov: view.fov,
        near: Math.max(0.01, distance / 200),
        far: distance * 6,
      };
    }

    const framed = frameCamera(model, size.width / size.height, {
      fov: CAMERA_FOV,
      baseScreenY: band.base,
      roofScreenY: band.roof,
      widthFill: band.widthFill,
      offsetX: band.offsetX,
      azimuthDeg: shot.azimuthDeg,
      elevationDeg: shot.elevationDeg,
      dolly: shot.dolly,
    });

    return { p: shot.p, fov: CAMERA_FOV, ...framed };
  });
}


function cameraAt(shots, p) {
  let a = shots[0];
  let b = shots[shots.length - 1];

  for (let i = 0; i < shots.length - 1; i += 1) {
    if (p >= shots[i].p && p <= shots[i + 1].p) {
      a = shots[i];
      b = shots[i + 1];
      break;
    }
  }

  const k = easeInOutCubic(progressIn(p, a.p, b.p));

  return {
    position: a.position.map((v, i) => lerp(v, b.position[i], k)),
    target: a.target.map((v, i) => lerp(v, b.target[i], k)),
    fov: lerp(a.fov, b.fov, k),
    near: lerp(a.near, b.near, k),
    far: lerp(a.far, b.far, k),
  };
}







function FramedCamera({ position, target, fov, near, far }) {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    if (camera && position && target) {
      camera.position.set(...position);
      camera.lookAt(target[0], target[1], target[2]);
      // eslint-disable-next-line react-hooks/immutability
      camera.near = near;
      camera.far = far;
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, position, target, fov, near, far]);

  return <PerspectiveCamera makeDefault position={position} fov={fov} near={near} far={far} />;
}







const SHADOW_EXTENT = 45;
const SHADOW_FAR = 120;


const KEY_POSITION = [-15, 25, 20];
const KEY_COLOR = '#FFF4DC';








const SUN_AZIMUTH = [0.894, 0.447];
const SUN_DISTANCE = 40;


const REST_TINT = new THREE.Color(KEY_COLOR);
const SUMMER_TINT = new THREE.Color('#FFF9E8');
const WINTER_TINT = new THREE.Color('#FFD9A8');

function sunPositionAt(altitude) {
  const radians = toRad(altitude);
  const ground = Math.cos(radians) * SUN_DISTANCE;

  return [SUN_AZIMUTH[0] * ground, Math.sin(radians) * SUN_DISTANCE, SUN_AZIMUTH[1] * ground];
}







function SunDriver({ lightRef }) {
  useFrame(() => {
    const light = lightRef.current;
    if (!light) return;


    if (sunNow.altitude === null) {
      light.position.set(...KEY_POSITION);
      light.color.copy(REST_TINT);
      return;
    }

    light.position.set(...sunPositionAt(sunNow.altitude));
    light.color.copy(SUMMER_TINT).lerp(WINTER_TINT, sunNow.value);
  });

  return null;
}






const REST_LIGHT = { key: 2.5, rim: 1.5, ambient: 1.2 };
const ASSEMBLY_LIGHT = { key: 3.4, rim: 1.6, ambient: 1.6 };





const MODEL_SCALE = 1.35;








const SHADOW_OPACITY = 0.5;
const SHADOW_COLOR = '#3A2E1F';









const SHADOW_OPACITY_DARK = 0.62;
const SHADOW_COLOR_DARK = '#000000';





export default function HanokStructureScene({ progress, dark = false, onSelectMesh, highlightStage = -1 }) {
  const { scene } = useGLTF(MODEL_URL);
  const size = useThree((s) => s.size);

  const assembling = useSceneStore((s) => s.assembling);


  const keyLight = useRef(null);

  const model = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const extent = new THREE.Vector3();
    box.getSize(extent);


    const rawHeight = Math.max(extent.y, 0.001);
    const normalizedScale = 10 / rawHeight;








    const worldScale = normalizedScale * MODEL_SCALE;

    return {
      height: 10 * MODEL_SCALE,
      radius: (Math.hypot(extent.x, extent.z) / 2) * worldScale,
      footprint: Math.max(extent.x, extent.z) * worldScale,
      normalizedScale,
    };
  }, [scene]);


  const shots = useMemo(() => resolveShots(model, size), [model, size]);
  const view = cameraAt(shots, progress);

  const light = assembling ? ASSEMBLY_LIGHT : REST_LIGHT;

  return (
    <>
      <FramedCamera
        position={view.position}
        target={view.target}
        fov={view.fov}
        near={view.near}
        far={view.far}
      />

      <ambientLight intensity={light.ambient} color="#FFFDF7" />

      <hemisphereLight skyColor="#FFF9EE" groundColor="#E8DFD0" intensity={0.4} />

      <SunDriver lightRef={keyLight} />

      <directionalLight
        ref={keyLight}
        position={KEY_POSITION}
        intensity={light.key}
        color={KEY_COLOR}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
        shadow-radius={4}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-SHADOW_EXTENT, SHADOW_EXTENT, SHADOW_EXTENT, -SHADOW_EXTENT, 0.5, SHADOW_FAR]}
        />
      </directionalLight>

      <directionalLight position={[15, 20, -15]} intensity={light.rim} color="#FFCC77" />

      {



}
      <group>
        <group scale={model.normalizedScale * MODEL_SCALE}>
          {assembling ? (
            <AssemblyModel />
          ) : (
            <HanokModel onSelectMesh={onSelectMesh} highlightStage={highlightStage} />
          )}
        </group>

        {}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[120, 120]} />
          <shadowMaterial
            color={dark ? SHADOW_COLOR_DARK : SHADOW_COLOR}
            opacity={dark ? SHADOW_OPACITY_DARK : SHADOW_OPACITY}
            transparent
          />
        </mesh>

        <ContactShadows
          position={[0, 0, 0]}
          opacity={(dark ? SHADOW_OPACITY_DARK : SHADOW_OPACITY) * 0.6}
          scale={model.footprint * 2.5}
          blur={2.0}
          far={model.height * 2}
          resolution={1024}
          color={dark ? SHADOW_COLOR_DARK : SHADOW_COLOR}
        />
      </group>
    </>
  );
}
