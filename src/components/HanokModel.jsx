'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import { usePrefersReducedMotion } from '@/scroll-beats/BeatFrame';
import { onEarthquake, runQuake, runReveal } from '@/scroll-beats/Beat3a_Earthquake';

export const MODEL_URL = '/anchae.glb';

const WIRE_OPACITY = 0.85;
const GLOW_OPACITY = 0.25;
const GLOW_SCALE = 1.002;
const TILT_MAX = 0.26; // ±15°
const TILT_LERP = 0.05;

const createWireframeMaterials = () => ({
  line: new THREE.MeshBasicMaterial({
    color: '#F5A623',
    wireframe: true,
    transparent: true,
    opacity: WIRE_OPACITY,
  }),
  glow: new THREE.MeshBasicMaterial({
    color: '#FFCC40',
    wireframe: true,
    transparent: true,
    opacity: GLOW_OPACITY,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
});

/** mesh 하나가 재질을 여러 장 가질 수 있다. 늘 배열로 펴서 다룬다. */
const materialsOf = (material) => (Array.isArray(material) ? material : [material]);

/**
 * 골격 재질 두 장.
 *
 * 스크롤이 매 프레임 opacity를 밀어 올리는 값이라 훅이 쥐고 있으면 안 된다
 * (렌더 결과를 나중에 고치는 셈이 된다). 한옥은 화면에 하나뿐이므로
 * 모듈 수준에 한 벌 두고 두 클론이 나눠 쓴다.
 */
const wire = createWireframeMaterials();

/**
 * 고정된 한옥 모델.
 * 좌우/앞뒤는 중심을, 높이는 바닥을 원점에 맞춰 세워둔다.
 *
 * 두 가지 얼굴이 있다.
 *   골격 — Beat2. 원본 재질을 걷어내고 황금빛 wireframe으로 갈아끼운다.
 *   실체 — Beat3a 진입 이후. 백업해둔 원본 재질 그대로.
 *
 * 언제·얼마나 보이는지는 Beat2가 정하고(getBeat2Scene), 여기서는 mesh에 먹이기만 한다.
 * 흔들리는 것은 Beat3a의 버튼이 신호를 보낼 때뿐이다.
 */
export default function HanokModel({ wireframe = { on: false, drawn: 1, scale: 1 } }) {
  const { scene } = useGLTF(MODEL_URL);
  const reduced = usePrefersReducedMotion();

  const shakeRef = useRef(null);
  const tiltRef = useRef(null);
  const pointer = useRef(new THREE.Vector2());

  const { root, glow, offset, states } = useMemo(() => {
    const cloned = scene.clone(true);
    const collected = [];

    cloned.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;

        collected.push({
          mesh: o,
          // 원본 재질 백업. 실체로 돌아갈 때 이것 그대로 되돌린다.
          original: o.material,
          // 크로스페이드가 건드리는 값들도 함께 적어둔다.
          states: materialsOf(o.material).map((material) => ({
            material,
            transparent: material.transparent,
            opacity: material.opacity,
          })),
        });
      }
    });

    /*
      글로우용 껍질 한 겹.

      선 한 겹만 그리면 wireframe이 얇고 죽은 격자로 보인다.
      아주 조금 큰 클론을 가산 합성으로 겹쳐 선 주변을 번지게 한다.
      본체와 같은 오프셋 그룹 안에 들어가므로 정렬은 따로 맞출 것이 없다.
    */
    const shell = cloned.clone(true);
    shell.traverse((o) => {
      if (o.isMesh) {
        o.material = wire.glow;
        o.castShadow = false;
        o.receiveShadow = false;
      }
    });

    const bbox = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    return {
      root: cloned,
      glow: shell,
      offset: [-center.x, -bbox.min.y, -center.z],
      states: collected,
    };
  }, [scene]);

  /*
    골격 ↔ 실체.

    재질 참조만 바꿔치기하므로 원본은 배열에 그대로 남아 있고,
    되돌리는 것도 그 참조를 다시 꽂는 것으로 끝난다.
  */
  useEffect(() => {
    /**
     * 실체가 드러난 정도를 value(0~1)로 채운다.
     * 다 차면 적어둔 값 그대로 되돌려 놓아 흔적을 남기지 않는다.
     */
    const apply = (value) => {
      const fading = value < 1;

      states.forEach((entry) => entry.states.forEach((state) => {
        const transparent = fading || state.transparent;

        // transparent를 바꾸면 셰이더를 다시 짜야 한다. 바뀔 때만 알린다.
        if (state.material.transparent !== transparent) {
          state.material.transparent = transparent;
          state.material.needsUpdate = true;
        }

        state.material.opacity = fading ? state.opacity * value : state.opacity;
      }));
    };

    if (wireframe.on) {
      // 되감아 들어왔다면 크로스페이드가 남긴 반투명을 먼저 지운다
      apply(1);

      states.forEach((entry) => {
        entry.mesh.material = wire.line;
      });

      return undefined;
    }

    states.forEach((entry) => {
      entry.mesh.material = entry.original;
    });

    const tween = runReveal(apply);

    return () => {
      if (tween) tween.kill();
      apply(1);
    };
  }, [wireframe.on, states]);

  /*
    마우스 틸팅.

    캔버스 레이어는 pointer-events가 끊겨 있어 R3F의 포인터가 갱신되지 않는다.
    화면 전체를 기준으로 직접 정규화해서 읽는다 (-1 ~ 1).
  */
  useEffect(() => {
    if (!wireframe.on || reduced) return undefined;

    const read = (event) => {
      pointer.current.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -((event.clientY / window.innerHeight) * 2 - 1),
      );
    };

    window.addEventListener('pointermove', read, { passive: true });
    return () => window.removeEventListener('pointermove', read);
  }, [wireframe.on, reduced]);

  /*
    카메라는 고정이고 모델만 돈다. 카메라를 돌리면 구도 역산이 어긋나
    한옥이 화면에서 제자리를 잃는다.
  */
  useFrame(() => {
    /*
      선이 그려지는 등장.

      스크롤이 매 프레임 값을 바꾸므로 재질을 다시 만들지 않고 opacity만 밀어 올린다.
      골격이 꺼진 뒤에는 글로우 그룹 자체가 빠지므로 손대지 않는다.
    */
    if (wireframe.on) {
      wire.line.opacity = WIRE_OPACITY * wireframe.drawn;
      wire.glow.opacity = GLOW_OPACITY * wireframe.drawn;
    }

    const group = tiltRef.current;
    if (!group) return;

    const active = wireframe.on && !reduced;
    const targetY = active ? pointer.current.x * TILT_MAX : 0;
    const targetX = active ? -pointer.current.y * TILT_MAX : 0;

    group.rotation.y += (targetY - group.rotation.y) * TILT_LERP;
    group.rotation.x += (targetX - group.rotation.x) * TILT_LERP;
  });

  useEffect(() => onEarthquake(() => runQuake(shakeRef.current)), []);

  /*
    그룹을 층으로 나눠 세운다.

    shake — Beat3a의 진동. 원점이 지면이라 기둥 밑동을 축으로 건물이 기우뚱한다.
    tilt  — 마우스 각도. 진동과 같은 rotation을 다투지 않게 따로 둔다.
    offset— 모델 정렬. 진동의 position과 같은 값을 다투지 않게 따로 둔다.
  */
  return (
    <group ref={shakeRef}>
      <group ref={tiltRef}>
        <group position={offset} scale={wireframe.on ? wireframe.scale : 1}>
          <primitive object={root} />

          {wireframe.on && <primitive object={glow} scale={GLOW_SCALE} />}
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(MODEL_URL);
