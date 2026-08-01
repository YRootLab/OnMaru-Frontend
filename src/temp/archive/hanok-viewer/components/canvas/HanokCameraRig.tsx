'use client';

import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { STAGES } from '../../data/hanok.data';
import { useHanokViewerStore } from '../../store/useHanokViewerStore';

const STAGE_POS = STAGES.map((s) => new THREE.Vector3(...s.cameraPos));
const STAGE_TARGET = STAGES.map((s) => new THREE.Vector3(...s.cameraTarget));
const STAGE_FOV = STAGES.map((s) => s.fov);

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

// 히어로 전경 구도 카메라 파라미터 설정(확정 앙각). 01 시퀀스 전 구간 이 구도를 유지한다.
const HERO_FULL_POS = new THREE.Vector3(-11.2, 2.5, 9.8);
const HERO_FULL_TARGET = new THREE.Vector3(-0.8, 3.0, 0.0);
const HERO_FOV = 46;

// [3D 등장 시퀀스] 0.55 이후 아주 느린 자동 회전 시작 (10초당 8도)
const HERO_ROTATE_START = 0.55;
const HERO_ROTATE_DEG_PER_SEC = 8 / 10;

// 대제목이 상단 40%를 차지하므로 모델을 화면 하단 60%로 내리는 비율.
// 값을 키우면 모델이 더 내려가고 기단이 잘리기 시작한다.
const HERO_MODEL_DROP_RATIO = 0.15;

// drei의 OrbitControls 인스턴스 타입. any를 쓰면 controlsRef.current.target 같은
// 접근이 전부 타입 검사에서 빠져나간다.
export type OrbitControlsRef = React.ComponentRef<typeof OrbitControls>;

interface HanokCameraRigProps {
  controlsRef?: React.RefObject<OrbitControlsRef | null>;
}

export default function HanokCameraRig({ controlsRef }: HanokCameraRigProps) {
  const { camera, size } = useThree();

  // 매 프레임 바뀌는 값(scrollProgress, heroProgress)을 구독하면 이 컴포넌트가 60fps로
  // 리렌더되고 useFrame 콜백도 매 프레임 새로 만들어진다. 액션만 구독해 참조를 고정하고,
  // 나머지는 루프 안에서 getState()로 최신값을 직접 읽는다.
  const setCameraInfo = useHanokViewerStore((s) => s.setCameraInfo);

  const desiredPos = useRef(new THREE.Vector3().copy(HERO_FULL_POS));
  const desiredTarget = useRef(new THREE.Vector3().copy(HERO_FULL_TARGET));
  const smoothTarget = useRef(new THREE.Vector3().copy(HERO_FULL_TARGET));
  const desiredFov = useRef(HERO_FOV);

  // 자동 회전 경과 시간. 스토어에 두면 매 프레임 set이 일어나 구독자가 흔들리므로
  // 이 컴포넌트 안에서만 누적한다.
  const rotElapsed = useRef(0);

  useFrame((_, delta) => {
    const pCam = camera as THREE.PerspectiveCamera;
    const { activeSectionId, stageProgress, heroProgress, isOrbitEnabled, customTarget, isReducedMotion } =
      useHanokViewerStore.getState();

    if (isOrbitEnabled) {
      const pos: [number, number, number] = [camera.position.x, camera.position.y, camera.position.z];
      const targetVec = controlsRef?.current?.target ?? smoothTarget.current;
      const target: [number, number, number] = [targetVec.x, targetVec.y, targetVec.z];
      setCameraInfo(pos, target, pCam.fov);
      return;
    }

    const aspect = size.width / size.height;

    // 00 인트로 / 01 히어로 / 브랜드 소개 섹션 카메라 처리.
    // 세 구간 모두 확정 앙각(HERO_FULL) 구도를 그대로 쓴다. 01에서 화면을 만드는 것은
    // 카메라 이동이 아니라 조명이므로, 여기서 구도가 흔들리면 연출 의도가 무너진다.
    if (activeSectionId === 'intro' || activeSectionId === 'hero' || activeSectionId === 'about') {
      // [0.55 ~ 1.00] 아주 느린 자동 회전. 그 전 구간(0.00~0.55)은 완전 고정.
      const isRotating =
        !isReducedMotion && activeSectionId === 'hero' && heroProgress >= HERO_ROTATE_START;

      if (isRotating) {
        rotElapsed.current += delta;
      } else if (activeSectionId !== 'hero' || heroProgress < HERO_ROTATE_START) {
        // 되감아 올라오면 회전을 처음 상태로 되돌려 재진입 시 구도가 튀지 않게 한다.
        rotElapsed.current = 0;
      }

      const rotAngle = (rotElapsed.current * HERO_ROTATE_DEG_PER_SEC * Math.PI) / 180;
      const relX = HERO_FULL_POS.x - HERO_FULL_TARGET.x;
      const relZ = HERO_FULL_POS.z - HERO_FULL_TARGET.z;
      const cos = Math.cos(rotAngle);
      const sin = Math.sin(rotAngle);

      desiredPos.current.set(
        HERO_FULL_TARGET.x + (relX * cos - relZ * sin),
        HERO_FULL_POS.y,
        HERO_FULL_TARGET.z + (relX * sin + relZ * cos)
      );
      desiredTarget.current.copy(HERO_FULL_TARGET);
      desiredFov.current = HERO_FOV;
    } else {
      const pAss = clamp01(stageProgress);
      const last = STAGES.length - 1;
      const f = pAss * last;
      const i = Math.min(last - 1, Math.floor(f));
      const k = easeInOutCubic(clamp01(f - i));

      const targetA = aspect < 1.2 && STAGES[i].mobileCameraTarget
        ? new THREE.Vector3(...STAGES[i].mobileCameraTarget!)
        : STAGE_TARGET[i];

      const targetB = aspect < 1.2 && STAGES[i + 1]?.mobileCameraTarget
        ? new THREE.Vector3(...STAGES[i + 1].mobileCameraTarget!)
        : STAGE_TARGET[i + 1] ?? STAGE_TARGET[i];

      desiredPos.current.lerpVectors(STAGE_POS[i], STAGE_POS[i + 1], k);
      desiredTarget.current.lerpVectors(targetA, targetB, k);
      desiredFov.current = THREE.MathUtils.lerp(STAGE_FOV[i], STAGE_FOV[i + 1], k);

      // 단계 내부에서만 도는 미세 드리프트(±3도). 화면이 정지 사진처럼 굳는 걸 막되
      // hanok.data.ts에 정해둔 단계별 cameraPos는 그대로 존중한다.
      // 기존의 누적 azimuth(pAss * 72도)는 마지막 기와 단계의 앵글을 통째로 밀어내
      // 7단계 조립의 클라이맥스인 지붕을 프레임 밖으로 보내고 있었다.
      const drift = (k - 0.5) * ((6 * Math.PI) / 180);
      const cos = Math.cos(drift);
      const sin = Math.sin(drift);
      const { x, z } = desiredPos.current;
      desiredPos.current.x = x * cos - z * sin;
      desiredPos.current.z = x * sin + z * cos;
    }

    if (customTarget) {
      desiredTarget.current.set(...customTarget);
    }

    // 프레임 스무딩 계산 수행
    const a = 1 - Math.exp(-6 * delta);
    camera.position.lerp(desiredPos.current, a);
    if (customTarget) {
      smoothTarget.current.set(...customTarget);
    } else {
      smoothTarget.current.lerp(desiredTarget.current, a);
    }
    camera.lookAt(smoothTarget.current);

    // 모바일(세로 화면)에서 모델이 좌우로 잘리지 않도록 FOV 멀티플라이어를 상향 조정
    const responsiveFovMult = aspect < 1.2 ? Math.min(1.75, 1.5 / Math.max(0.45, aspect)) : 1.0;
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

export function FramingOffset({ ratio = 0.14, mobileYRatio = 0.06 }: { ratio?: number; mobileYRatio?: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  // 섹션 id만 구독한다. scrollProgress를 기준으로 삼으면 섹션이 하나 늘어날 때마다
  // 임계값(0.12)이 가리키는 구간이 통째로 밀려 히어로를 더 이상 못 짚는다.
  const activeSectionId = useHanokViewerStore((s) => s.activeSectionId);
  const isHeroLike = activeSectionId === 'intro' || activeSectionId === 'hero';

  useEffect(() => {
    const wide = size.width / size.height > 1.2;

    if (isHeroLike) {
      // [레이아웃] 좌우 여백은 균등하게 두고 모델만 화면 하단 60%로 내린다.
      // y가 음수면 프러스텀이 위로 올라가 피사체가 화면 아래쪽에 놓인다.
      camera.setViewOffset(
        size.width,
        size.height,
        0,
        -size.height * HERO_MODEL_DROP_RATIO,
        size.width,
        size.height
      );
      camera.updateProjectionMatrix();

      return () => {
        camera.clearViewOffset();
        camera.updateProjectionMatrix();
      };
    }

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
  }, [camera, size, ratio, mobileYRatio, isHeroLike]);

  return null;
}
