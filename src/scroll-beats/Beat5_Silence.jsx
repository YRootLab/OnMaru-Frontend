'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import styled from '@emotion/styled';

import { clamp01, easeOutQuad, progressIn, usePrefersReducedMotion } from './BeatFrame';

const MODEL_URL = '/anchae.glb';

const FONT = "'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, sans-serif";

const INK = '244, 239, 228'; // #F4EFE4 — alpha를 calc로 섞어야 해서 채널로 둔다

const lerp = (from, to, t) => from + (to - from) * t;

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - ((-2 * t + 2) ** 3) / 2);

// ─────────────────────────────────────────
// 구간 — 전역 progress 0.70 ~ 0.82
// ─────────────────────────────────────────

export const RANGE = [0.7, 0.82];

const [RANGE_START, RANGE_END] = RANGE;

/** 한옥이 물러나며 사라지는 창. 이후로는 캔버스 자체를 올리지 않는다. */
const EXIT = [0, 0.18];
const EXIT_SCALE = 0.96;

// 배경(어둠·중앙 글로우)과 부유 입자는 GlobalBackground로 이관했다.

// ─────────────────────────────────────────
// 글자
// ─────────────────────────────────────────

/**
 * 한 글자가 자기 등장 구간 중 몇 할을 페이드에 쓰는가.
 *
 * 나머지가 글자 사이 시차다. 스크롤 속도는 사용자가 쥐고 있어 초 단위를 그대로
 * 옮길 수 없으므로, "글자 지연 0.045초 대 페이드 0.5초"라는 비율만 가져온다.
 * 값이 작을수록 시차가 길어져 문장이 더 천천히 훑고 지나간다.
 */
const CHAR_FADE = 0.4;
const CHAR_FADE_SLOW = 0.3; // 마지막 문장 — 지연 0.07초에 해당하는 더 느린 훑기
const CHAR_FADE_OUT = 0.7; // 퇴장은 시차를 거의 두지 않는다 (0.02초)

const CHAR_RISE = 6; // px
const CHAR_BLUR = 3; // px

/** 마우스 근접 발광이 닿는 반경 */
const GLOW_RADIUS = 180;
const GLOW_RADIUS_STRONG = 220;

/** 목표값을 향해 매 프레임 다가가는 비율. 급하게 붙으면 조명이 튄다. */
const GLOW_LERP = 0.12;

// ─────────────────────────────────────────
// 텍스트 시퀀스
//
// 등장 [시작, 끝] · 퇴장 [시작, 끝]. 퇴장이 없으면 Beat6까지 남는다.
// 사이의 빈 구간이 이 Beat의 내용이다 — 0.38~0.44 와 0.70~0.78 은 화면이 비어야 한다.
// ─────────────────────────────────────────

const BLOCKS = [
  {
    id: 'limit',
    size: 'clamp(20px, 2.6vw, 34px)',
    weight: 500,
    gap: 0,
    lines: [
      {
        text: '여기까지가, 화면이 할 수 있는 전부입니다.',
        enter: [0.2, 0.26],
        exit: [0.34, 0.38],
      },
    ],
  },
  {
    id: 'senses',
    size: 'clamp(18px, 2.2vw, 28px)',
    weight: 400,
    gap: 20,
    lines: [
      { text: '마루의 온도.', enter: [0.44, 0.49], exit: [0.66, 0.7] },
      { text: '창호지를 통과한 빛.', enter: [0.53, 0.58], exit: [0.66, 0.7] },
    ],
  },
  {
    id: 'purpose',
    size: 'clamp(22px, 2.8vw, 38px)',
    weight: 700,
    gap: 0, // line-height 1.4 가 줄 사이를 잡는다
    lines: [
      { text: '계산의 목적은,', enter: [0.78, 0.85] },
      { text: '사람의 감각이었습니다.', enter: [0.85, 0.92], strong: true },
    ],
  },
];

/**
 * 글자 하나의 상태.
 *
 * 등장은 왼쪽부터 차례로, 퇴장은 거의 한꺼번에. 시차는 구간 안에서 자리를 나눠 만든다.
 * reduced 면 시차와 블러를 빼고 문장 전체가 함께 뜬다.
 */
function charCue(local, line, index, count, reduced) {
  const fadeIn = line.strong ? CHAR_FADE_SLOW : CHAR_FADE;
  const at = count > 1 ? index / (count - 1) : 0;

  const enter = progressIn(local, ...line.enter);
  const shown = reduced
    ? easeOutQuad(enter)
    : easeOutQuad(clamp01((enter - at * (1 - fadeIn)) / fadeIn));

  let gone = 0;
  if (line.exit) {
    const out = progressIn(local, ...line.exit);
    gone = reduced
      ? easeOutQuad(out)
      : easeOutQuad(clamp01((out - at * (1 - CHAR_FADE_OUT)) / CHAR_FADE_OUT));
  }

  return {
    opacity: shown * (1 - gone),
    rise: CHAR_RISE * (1 - shown) - CHAR_RISE * gone,
    blur: reduced ? 0 : CHAR_BLUR * (1 - shown),
  };
}

// ─────────────────────────────────────────
// 마우스 근접 발광
//
// 글자마다 리스너를 달지 않는다. 좌표는 한 번 재서 캐시하고(고정 레이어라 스크롤에
// 흔들리지 않는다) 프레임당 한 번 전부 갱신한다. 값은 CSS 변수로 넘겨 React가 쥔
// opacity·translateY 와 서로 덮어쓰지 않게 한다.
// ─────────────────────────────────────────

function useProximityGlow(rootRef, visibleKey, reduced) {
  useEffect(() => {
    if (reduced || !rootRef.current) return undefined;

    const chars = Array.from(rootRef.current.querySelectorAll('[data-char]'));
    if (chars.length === 0) return undefined;

    let targets = [];

    const measure = () => {
      targets = chars.map((el) => {
        const box = el.getBoundingClientRect();
        return {
          el,
          x: box.left + box.width / 2,
          y: box.top + box.height / 2,
          radius: Number(el.dataset.radius),
          glow: 0,
        };
      });
    };

    measure();

    // 화면 밖에서 시작해야 마우스를 올리기 전에는 아무것도 빛나지 않는다
    const pointer = { x: -9999, y: -9999 };
    const track = (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };

    let frame = 0;
    const step = () => {
      for (const target of targets) {
        const distance = Math.hypot(pointer.x - target.x, pointer.y - target.y);
        const influence = Math.max(0, 1 - distance / target.radius);

        target.glow += (influence - target.glow) * GLOW_LERP;

        target.el.style.setProperty('--glow', target.glow.toFixed(3));
        target.el.style.setProperty('--scale', (1 + target.glow * 0.04).toFixed(4));
      }
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    window.addEventListener('pointermove', track, { passive: true });
    window.addEventListener('resize', measure);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', track);
      window.removeEventListener('resize', measure);
    };
  }, [rootRef, visibleKey, reduced]);
}

// ─────────────────────────────────────────
// 3D — Beat4가 남기고 간 한옥
//
// Beat4는 0.70에서 언마운트하며 공유 scene을 조립 완료 상태(제자리·원본 재질)로
// 되돌린다. 그래서 여기서는 재질을 건드리지 않고 그대로 세우기만 한다.
// 사라짐은 재질 opacity가 아니라 캔버스 레이어의 opacity가 맡는다 —
// 공유 scene을 또 만지면 되감아 Beat4로 돌아갈 때 조립 상태가 깨진다.
//
// 카메라·조명은 Beat4 우측 장면과 같은 값이다. 한쪽만 바꾸면 0.70 경계에서 한옥이 튄다.
// ─────────────────────────────────────────

const CAMERA = { position: [-16.94, 8.5, 20.91], fov: 45 };
const LOOK_AT = [0, 4, 0];

function Hanok({ scale }) {
  const { scene } = useGLTF(MODEL_URL);

  // 밑동을 y=0에, 좌우·앞뒤 중심을 원점에 둔다 (Beat4의 offset과 같은 계산)
  const offset = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    return [-center.x, -box.min.y, -center.z];
  }, [scene]);

  return (
    <group scale={scale}>
      <group position={offset}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

function Scene({ scale }) {
  return (
    <>
      {/* 빛만 담당하는 HDRI. 검은 기와가 반사로 살아나는 근거다. */}
      <Suspense fallback={null}>
        <Environment files="/hdri/sunset_meadow_path_4k.exr" environmentIntensity={0.7} />
      </Suspense>

      <ambientLight intensity={3.0} />

      <directionalLight
        position={[-9, 16, 14]}
        intensity={2.4}
        color="#FFF4DC"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0005}
      />

      {/* 림라이트 — 어두운 배경에서 윤곽을 떠올린다 */}
      <directionalLight position={[-6, 8, -10]} intensity={1.6} color="#F5A623" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial opacity={0.5} />
      </mesh>

      <Suspense fallback={null}>
        <Hanok scale={scale} />
      </Suspense>
    </>
  );
}

// ─────────────────────────────────────────
// 스타일
// ─────────────────────────────────────────

const Stage = styled.section`
  position: fixed;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  font-family: ${FONT};
`;

/** Beat4의 3D가 서 있던 자리. 같은 분할이라야 한옥이 그 자리에서 사라진다. */
const Frame = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 40%;
  right: 0;
  z-index: 1;

  @media (max-width: 768px) {
    left: 0;
    bottom: 40%;
  }
`;

/**
 * 문장 블록 하나. 세 블록이 같은 자리에 겹쳐 있고 서로 만나는 시점이 없다.
 *
 * 블록 안의 줄은 흐름대로 쌓는다. 아직 뜨지 않은 줄도 자리를 차지해야
 * 뒷줄이 붙을 때 앞줄이 밀려 올라가지 않는다 ("그대로 두고 아래에 추가").
 */
const Block = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  text-align: center;
`;

const Line = styled.p`
  margin: 0;
  line-height: 1.4;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

/**
 * 글자 한 장.
 *
 * React는 스크롤이 미는 값(opacity·--rise·blur)만, rAF는 마우스가 미는 값(--glow·--scale)만
 * 쓴다. 둘을 같은 CSS 속성에 담으면 프레임마다 서로를 지운다.
 */
const Char = styled.span`
  --rise: 0px;
  --glow: 0;
  --scale: 1;

  display: inline-block;
  white-space: pre;
  transform: translateY(var(--rise)) scale(var(--scale));
  color: rgba(${INK}, calc(0.85 + var(--glow) * 0.15));
  text-shadow:
    0 0 calc(32px + var(--glow) * 12px) rgba(${INK}, calc(0.18 + var(--glow) * 0.35)),
    0 0 80px rgba(${INK}, 0.08);

  &[data-strong='true'] {
    text-shadow:
      0 0 calc(40px + var(--glow) * 12px) rgba(${INK}, calc(0.28 + var(--glow) * 0.35)),
      0 0 100px rgba(${INK}, 0.12);
  }
`;

/** 글자로 쪼갠 문장은 보조기기가 읽기 어렵다. 원문을 따로 한 벌 남긴다. */
const SrOnly = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

// ─────────────────────────────────────────
// Beat5_Silence
// ─────────────────────────────────────────

export default function Beat5_Silence({ progress }) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef(null);

  const active = progress >= RANGE_START && progress < RANGE_END;
  const local = active ? (progress - RANGE_START) / (RANGE_END - RANGE_START) : 0;

  const exit = easeInOutCubic(progressIn(local, ...EXIT));

  // 지금 화면에 글자가 떠 있는 블록. 이게 바뀔 때만 좌표를 다시 잰다.
  const visible = BLOCKS.filter((block) =>
    block.lines.some((line) => charCue(local, line, 0, 1, true).opacity > 0.001),
  );
  const visibleKey = visible.map((block) => block.id).join('|');

  useProximityGlow(rootRef, active ? visibleKey : '', reduced);

  if (!active) return null;

  return (
    <Stage ref={rootRef}>
      {/* 배경(어둠·중앙 글로우)은 GlobalBackground가 전담한다. */}

      {/* z 1 — 한옥. 레이어째 옅어지며 살짝 물러난다. */}
      {exit < 1 && (
        <Frame aria-hidden="true" style={{ opacity: 1 - exit }}>
          <Canvas
            shadows
            camera={CAMERA}
            gl={{ alpha: true, antialias: true }}
            onCreated={({ camera }) => camera.lookAt(...LOOK_AT)}
            style={{ position: 'absolute', inset: 0, background: 'transparent' }}
          >
            <Scene scale={lerp(1, EXIT_SCALE, exit)} />
          </Canvas>
        </Frame>
      )}

      {/* 부유 입자는 GlobalBackground로 이관했다. */}

      {/* z 2 — 문장. 침묵 구간에서는 블록 자체가 그려지지 않아 화면에 아무것도 남지 않는다. */}
      {visible.map((block) => (
        <Block key={block.id} style={{ gap: block.gap }}>
          {block.lines.map((line) => {
            const chars = line.text.split('');
            const radius = line.strong ? GLOW_RADIUS_STRONG : GLOW_RADIUS;

            return (
              <Line
                key={line.text}
                style={{ fontSize: block.size, fontWeight: block.weight }}
              >
                <SrOnly>{line.text}</SrOnly>

                <span aria-hidden="true">
                  {chars.map((char, index) => {
                    const cue = charCue(local, line, index, chars.length, reduced);

                    return (
                      <Char
                        // 글자는 문장 안의 자리로만 구분된다 (같은 글자가 여러 번 온다)
                        key={index}
                        data-char
                        data-radius={radius}
                        data-strong={Boolean(line.strong)}
                        style={{
                          opacity: cue.opacity,
                          filter: cue.blur > 0.01 ? `blur(${cue.blur.toFixed(2)}px)` : 'none',
                          '--rise': `${cue.rise.toFixed(2)}px`,
                        }}
                      >
                        {char}
                      </Char>
                    );
                  })}
                </span>
              </Line>
            );
          })}
        </Block>
      ))}
    </Stage>
  );
}

useGLTF.preload(MODEL_URL);
