'use client';

import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { STAGES } from '../../data/hanok.data';
import { useHanokViewerStore } from '../../store/useHanokViewerStore';

const STAGE_POS = STAGES.map((s) => new THREE.Vector3(...s.cameraPos));
const STAGE_TARGET = STAGES.map((s) => new THREE.Vector3(...s.cameraTarget));
const STAGE_FOV = STAGES.map((s) => s.fov);

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

interface HanokCameraRigProps {
  controlsRef?: React.RefObject<any>;
}

export default function HanokCameraRig({ controlsRef }: HanokCameraRigProps) {
  const { camera, size } = useThree();
  const {
    scrollProgress,
    isOrbitEnabled,
    customTarget,
    setCameraInfo,
  } = useHanokViewerStore();

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
      setCameraInfo(pos, target, pCam.fov);
      return;
    }

    const p = scrollProgress;
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

    const responsiveFovMult = aspect < 1.2 ? Math.min(1.58, 1.40 / Math.max(0.48, aspect)) : 1.0;
    const targetFov = desiredFov.current * responsiveFovMult;

    if (Math.abs(pCam.fov - targetFov) > 0.01) {
      pCam.fov = THREE.MathUtils.lerp(pCam.fov, targetFov, a);
      pCam.updateProjectionMatrix();
    }

    setCameraInfo(
      [camera.position.x, camera.position.y, camera.position.z],
      [smoothTarget.current.x, smoothTarget.current.y, smoothTarget.current.z],
      pCam.fov
    );
  });

  return null;
}

export function FramingOffset({ ratio = 0.16, mobileYRatio = 0.06 }: { ratio?: number; mobileYRatio?: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  useEffect(() => {
    const wide = size.width / size.height > 1.2;
    if (wide) {
      camera.setViewOffset(
        size.width,
        size.height,
        -size.width * ratio,
        0,
        size.width,
        size.height
      );
    } else {
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
