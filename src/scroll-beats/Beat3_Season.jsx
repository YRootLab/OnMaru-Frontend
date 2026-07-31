'use client';

import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

import { lightPalette, meok } from '@/design-system/tokens';
import { MODEL_URL, BEAT_RANGES } from '@/scroll-core/constants';
import { clamp01, lerpHex } from './BeatFrame';

const FONT = "'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, sans-serif";

const lerp = (from, to, t) => from + (to - from) * t;

// ─────────────────────────────────────────
// 계절 — 0 하지(여름·태양 높음) ~ 1 동지(겨울·태양 낮음)
// ─────────────────────────────────────────

const DRAG_SPAN = 0.5;

// 태양 고도. y가 낮아지고 z가 멀어지면서 그림자가 마루 안쪽으로 길어진다.
const SUN_SUMMER = [10, 18, 6];
const SUN_WINTER = [10, 6, 16];

const SUN_COLOR = ['#FFF9E8', '#FFD9A8']; // 희고 강한 볕 → 낮고 따뜻한 볕
const SUN_INTENSITY = [1.8, 1.2];

/** 하늘이 돌려주는 반사광. 여름 → 겨울. HDRI가 맡던 자리다. */
const AMBIENT_INTENSITY = [1.5, 1.0];
const SKY_LIGHT = ['#EAF0F5', '#DCE2E8']; // 맑고 높은 하늘 → 낮고 흐린 하늘

const headlineFor = (season) => {
  if (season <= 0.25) return '하지(여름). 볕이 마루를 비끼어 갑니다.';
  if (season >= 0.75) return '동지(겨울). 방 안 깊숙이 따스한 볕이 듭니다.';
  return '처마는, 계절별 태양의 고도를 계산했습니다.';
};

const detailFor = (season) => {
  if (season <= 0.25) {
    return {
      angle: '여름 태양 고도 76° (높음)',
      desc: '높게 뜬 여름 볕은 처마가 길게 막아내어 마루와 안방을 시원하게 유지합니다.',
    };
  }
  if (season >= 0.75) {
    return {
      angle: '겨울 태양 고도 29° (낮음)',
      desc: '낮게 기운 겨울 볕은 처마 밑을 깊숙이 통과하여 방 안 구석까지 따스한 온기를 전달합니다.',
    };
  }
  return {
    angle: '처마의 계절별 자연 조율 원리',
    desc: '여름의 뜨거운 볕은 차단하고, 겨울의 따스한 온기는 깊이 들이는 한옥의 친환경 건축 지혜입니다.',
  };
};

// ─────────────────────────────────────────
// 구도 — bbox에서 카메라를 역산한다
// ─────────────────────────────────────────

const FOV = 45;
const AZIMUTH_DEG = 315;
const ELEVATION_DEG = 22;

const FILL_H = 0.67;
const FILL_V = 0.48;
const LIFT = 0.06;

const toRad = (deg) => (deg * Math.PI) / 180;

function frameCamera(extent, aspect) {
  const azimuth = toRad(AZIMUTH_DEG);
  const halfWidth = (extent.x * Math.cos(azimuth) + extent.z * Math.sin(azimuth)) / 2;

  const halfV = Math.max(
    extent.y / (2 * FILL_V),
    halfWidth / (FILL_H * Math.max(aspect, 0.1)),
  );
  const distance = halfV / Math.tan(toRad(FOV) / 2);

  const elevation = toRad(ELEVATION_DEG);
  const targetY = extent.y / 2 + LIFT * 2 * halfV;
  const ground = distance * Math.cos(elevation);

  const position = [
    Math.sin(azimuth) * ground,
    targetY + distance * Math.sin(elevation),
    Math.cos(azimuth) * ground,
  ];

  const offsetX = extent.x * 0.08;

  const dummy = new THREE.PerspectiveCamera();
  dummy.position.set(...position);
  dummy.lookAt(-offsetX, targetY, 0);

  return {
    position,
    rotation: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z],
    near: Math.max(0.01, distance / 200),
    far: distance * 6,
  };
}

const materialsOf = (material) => (Array.isArray(material) ? material : [material]);

// ─────────────────────────────────────────
// 3D
// ─────────────────────────────────────────

function Scene({ season }) {
  const { scene } = useGLTF(MODEL_URL);
  const size = useThree((s) => s.size);

  const { model, extent, ground } = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((child) => {
      if (!child.isMesh) return;

      child.castShadow = true;
      child.receiveShadow = true;

      child.material = materialsOf(child.material).map((source) => {
        const material = source.clone();
        material.wireframe = false;
        material.transparent = false;
        material.opacity = 1;
        return material;
      });

      if (child.material.length === 1) [child.material] = child.material;
    });

    const box = new THREE.Box3().setFromObject(cloned);
    const measured = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    cloned.position.set(-center.x, -box.min.y, -center.z);

    return {
      model: cloned,
      extent: measured,
      ground: Math.max(measured.x, measured.z) * 1.8,
    };
  }, [scene]);

  const view = useMemo(
    () => frameCamera(extent, size.width / size.height),
    [extent, size.width, size.height],
  );

  const sunPosition = SUN_SUMMER.map((v, i) => lerp(v, SUN_WINTER[i], season));

  return (
    <>
      {/*
        하늘빛 환경광.

        전에는 22MB HDRI가 이 자리를 맡았는데, 배경으로 쓰지 않고 빛만 뽑아 쓰는 터라
        화면에 남는 차이가 거의 없었다. 단색 환경광이면 첫 로딩에서 그 무게가 통째로 빠진다.
        겨울로 갈수록 하늘이 낮고 흐려져 반사광도 함께 줄어든다.
      */}
      <ambientLight
        intensity={lerp(AMBIENT_INTENSITY[0], AMBIENT_INTENSITY[1], season)}
        color={lerpHex(SKY_LIGHT[0], SKY_LIGHT[1], season)}
      />

      <PerspectiveCamera
        makeDefault
        position={view.position}
        rotation={view.rotation}
        fov={FOV}
        near={view.near}
        far={view.far}
      />

      <directionalLight
        position={sunPosition}
        intensity={lerp(SUN_INTENSITY[0], SUN_INTENSITY[1], season)}
        color={lerpHex(SUN_COLOR[0], SUN_COLOR[1], season)}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0005}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[ground, ground]} />
        <shadowMaterial opacity={0.4} />
      </mesh>

      <primitive object={model} />
    </>
  );
}

// ─────────────────────────────────────────
// 스타일 & 애니메이션
// ─────────────────────────────────────────

const pingpong = keyframes`
  0%, 100% { transform: translateX(-10px); }
  50%      { transform: translateX(10px); }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 12px rgba(232, 90, 24, 0.6), 0 0 24px rgba(245, 166, 35, 0.4); }
  50%      { box-shadow: 0 0 20px rgba(232, 90, 24, 0.9), 0 0 36px rgba(245, 166, 35, 0.8); }
`;

const Stage = styled.section`
  position: fixed;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  font-family: ${FONT};
`;

const Copy = styled.div`
  position: absolute;
  top: clamp(5vh, 7vh, 9vh);
  left: 0;
  right: 0;
  z-index: 1;
  padding: 0 24px;
  text-align: center;
  pointer-events: none;
`;

const Headline = styled.h2`
  margin: 0;
  font-size: clamp(24px, 3.4vw, 42px);
  font-weight: 700;
  letter-spacing: -0.03em;
  word-break: keep-all;
  color: #f4efe4;
  text-shadow: 0 4px 18px rgba(0, 0, 0, 0.7);
  transition: opacity 0.4s ease-out;
`;

const Subtitle = styled.p`
  margin: 8px auto 0;
  max-width: 600px;
  font-size: clamp(13px, 1.3vw, 15px);
  font-weight: 400;
  color: ${meok[200]};
  line-height: 1.5;
  word-break: keep-all;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
`;

/* 눈에 띄는 컨트롤러 패널 */
const ControllerContainer = styled.div`
  position: absolute;
  bottom: 6vh;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  width: min(92vw, 480px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  pointer-events: auto;
`;

const DetailCard = styled.div`
  width: 100%;
  background: rgba(28, 26, 23, 0.88);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(212, 175, 55, 0.35);
  border-radius: 16px;
  padding: 12px 18px;
  text-align: center;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease-out;
`;

const AngleTag = styled.span`
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  color: ${lightPalette.hwanggeum[400]};
  background: rgba(212, 175, 55, 0.12);
  padding: 3px 10px;
  border-radius: 12px;
  margin-bottom: 6px;
`;

const DetailDesc = styled.p`
  margin: 0;
  font-size: clamp(12px, 1.2vw, 14px);
  font-weight: 400;
  color: ${meok[100]};
  line-height: 1.45;
  word-break: keep-all;
`;

const DragGuideHint = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: ${lightPalette.hwanggeum[400]};
  background: rgba(28, 26, 23, 0.92);
  border: 1px solid rgba(212, 175, 55, 0.3);
  backdrop-filter: blur(8px);
  padding: 4px 14px;
  border-radius: 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
  animation: ${pingpong} 1.8s ease-in-out infinite;
  transition: opacity 0.5s ease-out;
  pointer-events: none;
`;

const TrackWrapper = styled.div`
  width: 100%;
  position: relative;
  height: 46px;
  background: rgba(28, 26, 23, 0.88);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(212, 175, 55, 0.35);
  border-radius: 23px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  cursor: ew-resize;

  &:focus-visible {
    outline: 2px solid ${lightPalette.hwanggeum[400]};
    outline-offset: 2px;
  }
`;

const TrackLine = styled.div`
  position: absolute;
  left: 44px;
  right: 44px;
  height: 4px;
  background: linear-gradient(90deg, #f5a623 0%, #e85a18 100%);
  border-radius: 2px;
  opacity: 0.6;
`;

const TrackLabel = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: ${meok[200]};
  z-index: 1;
  user-select: none;
`;

const SunKnob = styled.div`
  position: absolute;
  top: 50%;
  width: 28px;
  height: 28px;
  margin: -14px 0 0 -14px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #fff 0%, #f5a623 60%, #e85a18 100%);
  cursor: grab;
  z-index: 2;
  animation: ${pulseGlow} 2s infinite ease-in-out;
  transition: transform 0.1s ease-out;

  &:active {
    cursor: grabbing;
    transform: scale(1.18);
  }
`;

// ─────────────────────────────────────────
// Beat3_Season
// ─────────────────────────────────────────

export default function Beat3_Season({ progress }) {
  const [userSeason, setUserSeason] = useState(null);
  const [interacted, setInteracted] = useState(false);
  const drag = useRef(null);

  if (progress < 0.2 || progress >= 0.45) return null;

  const scrollSeason = clamp01((progress - 0.2) / (0.45 - 0.2));
  const season = userSeason !== null ? userSeason : scrollSeason;

  const start = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, season };
    setInteracted(true);
  };

  const move = (event) => {
    if (!drag.current) return;
    const delta = (event.clientX - drag.current.x) / (window.innerWidth * DRAG_SPAN);
    setUserSeason(clamp01(drag.current.season + delta));
  };

  const end = () => {
    drag.current = null;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setUserSeason(clamp01(season - 0.05));
      setInteracted(true);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setUserSeason(clamp01(season + 0.05));
      setInteracted(true);
    }
  };

  const headline = headlineFor(season);
  const detail = detailFor(season);

  const knobLeftPercent = season * 100;

  return (
    <Stage aria-label="계절 — 하지에서 동지까지">
      <Copy>
        <Headline key={headline}>{headline}</Headline>
        <Subtitle>
          여름의 뜨거운 볕은 튕겨내고, 겨울의 온기는 방 안 깊이 들이는 한옥 처마의 자연 조율 지혜입니다.
        </Subtitle>
      </Copy>

      <ControllerContainer>
        <DetailCard>
          <AngleTag>{detail.angle}</AngleTag>
          <DetailDesc>{detail.desc}</DetailDesc>
        </DetailCard>

        <DragGuideHint style={{ opacity: interacted ? 0 : 1 }}>
          <span>←</span> ☀️ 드래그나 방향키로 태양의 고도와 처마 그림자를 확인해보세요 <span>→</span>
        </DragGuideHint>

        <TrackWrapper
          tabIndex={0}
          role="slider"
          aria-label="태양 고도 조절 슬라이더"
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={Number(season.toFixed(2))}
          aria-valuetext={`${detail.angle} - ${detail.desc}`}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onKeyDown={handleKeyDown}
        >
          <TrackLabel>☀️ 하지(여름)</TrackLabel>
          <TrackLine />
          <SunKnob
            style={{
              left: `calc(44px + (${knobLeftPercent}% * (100% - 88px) / 100))`,
            }}
          />
          <TrackLabel>❄️ 동지(겨울)</TrackLabel>
        </TrackWrapper>
      </ControllerContainer>
    </Stage>
  );
}

useGLTF.preload(MODEL_URL);
