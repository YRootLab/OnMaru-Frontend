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

// 히어로 전경 구도 카메라 파라미터 설정
const HERO_EAVES_POS = new THREE.Vector3(-1.8, 3.2, 4.5);
const HERO_EAVES_TARGET = new THREE.Vector3(-0.8, 3.0, 0.0);

const HERO_FULL_POS = new THREE.Vector3(-11.2, 2.5, 9.8);
const HERO_FULL_TARGET = new THREE.Vector3(-0.8, 3.0, 0.0);
const HERO_FOV = 46;

const HERO_SPLIT = 0.12;

// drei의 OrbitControls 인스턴스 타입. any를 쓰면 controlsRef.current.target 같은
// 접근이 전부 타입 검사에서 빠져나간다.
export type OrbitControlsRef = React.ComponentRef<typeof OrbitControls>;

interface HanokCameraRigProps {
  controlsRef?: React.RefObject<OrbitControlsRef | null>;
}

export default function HanokCameraRig({ controlsRef }: HanokCameraRigProps) {
  const { camera, size } = useThree();

  // 매 프레임 바뀌는 값(scrollProgress, heroTime)을 구독하면 이 컴포넌트가 60fps로
  // 리렌더되고 useFrame 콜백도 매 프레임 새로 만들어진다. 액션만 구독해 참조를 고정하고,
  // 나머지는 루프 안에서 getState()로 최신값을 직접 읽는다.
  const setHeroTime = useHanokViewerStore((s) => s.setHeroTime);
  const setCameraInfo = useHanokViewerStore((s) => s.setCameraInfo);

  const desiredPos = useRef(new THREE.Vector3().copy(HERO_EAVES_POS));
  const desiredTarget = useRef(new THREE.Vector3().copy(HERO_EAVES_TARGET));
  const smoothTarget = useRef(new THREE.Vector3().copy(HERO_EAVES_TARGET));
  const desiredFov = useRef(HERO_FOV);

  useFrame((_, delta) => {
    const pCam = camera as THREE.PerspectiveCamera;
    const { scrollProgress, isOrbitEnabled, customTarget, isLoaded, isReducedMotion, heroTime } =
      useHanokViewerStore.getState();

    if (isOrbitEnabled) {
      const pos: [number, number, number] = [camera.position.x, camera.position.y, camera.position.z];
      const targetVec = controlsRef?.current?.target ?? smoothTarget.current;
      const target: [number, number, number] = [targetVec.x, targetVec.y, targetVec.z];
      setCameraInfo(pos, target, pCam.fov);
      return;
    }

    const aspect = size.width / size.height;
    const p = scrollProgress;

    // 히어로 시퀀스 재생 시간 갱신
    if (isLoaded && p < 0.05) {
      if (isReducedMotion) {
        setHeroTime(3.5);
      } else if (heroTime < 4.0) {
        setHeroTime(heroTime + delta);
      }
    }

    // 히어로 카메라 위치 및 시선 타겟 계산
    const currentHeroTime = isReducedMotion ? 3.5 : heroTime;
    const heroPos = new THREE.Vector3();
    const heroTarget = new THREE.Vector3();

    if (currentHeroTime <= 1.5) {
      heroPos.copy(HERO_EAVES_POS);
      heroTarget.copy(HERO_EAVES_TARGET);
    } else if (currentHeroTime <= 3.5) {
      const t = clamp01((currentHeroTime - 1.5) / 2.0);
      const k = easeInOutCubic(t);
      heroPos.lerpVectors(HERO_EAVES_POS, HERO_FULL_POS, k);
      heroTarget.lerpVectors(HERO_EAVES_TARGET, HERO_FULL_TARGET, k);
    } else {
      // 3.5초 이후 자동 궤도 회전 연출
      const rotAngle = (currentHeroTime - 3.5) * ((8 * Math.PI) / 180) / 10.0;
      const relX = HERO_FULL_POS.x - HERO_FULL_TARGET.x;
      const relZ = HERO_FULL_POS.z - HERO_FULL_TARGET.z;
      const cos = Math.cos(rotAngle);
      const sin = Math.sin(rotAngle);

      heroPos.set(
        HERO_FULL_TARGET.x + (relX * cos - relZ * sin),
        HERO_FULL_POS.y,
        HERO_FULL_TARGET.z + (relX * sin + relZ * cos)
      );
      heroTarget.copy(HERO_FULL_TARGET);
    }

    // 스크롤 진행률에 따른 카메라 보간 수행
    if (p < HERO_SPLIT) {
      const wHero = clamp01(1 - p / HERO_SPLIT);
      const stage1Pos = STAGE_POS[0];
      const stage1Target = STAGE_TARGET[0];

      desiredPos.current.lerpVectors(stage1Pos, heroPos, wHero);
      desiredTarget.current.lerpVectors(stage1Target, heroTarget, wHero);
      desiredFov.current = THREE.MathUtils.lerp(STAGE_FOV[0], HERO_FOV, wHero);
    } else {
      const pAss = clamp01((p - HERO_SPLIT) / (1 - HERO_SPLIT));
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
  // 이 이펙트에 필요한 건 히어로 구간인지 여부뿐이다. scrollProgress를 그대로 의존성에
  // 두면 스크롤 프레임마다 setViewOffset과 updateProjectionMatrix가 다시 호출된다.
  const isHero = useHanokViewerStore((s) => s.scrollProgress < HERO_SPLIT);

  useEffect(() => {
    const wide = size.width / size.height > 1.2;

    if (isHero) {
      // 히어로 섹션 전용 뷰 오프셋 해제 처리
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
      return;
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
  }, [camera, size, ratio, mobileYRatio, isHero]);

  return null;
}
