import { create } from 'zustand';

/**
 * 패널이 캔버스의 3D에 값을 넘기는 통로.
 *
 * 3D는 모달의 Canvas 하나가 전부 갖고 있고 패널은 그 위에 얹힌 DOM이라,
 * 트리를 가로질러 값을 건네려면 자리가 하나 필요하다.
 */

/** 절기 사이를 걸어가는 시간. 8칸 스냅이라 한 칸이 이만큼 걸린다. */
const TWEEN_MS = 420;

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * 지금 화면에 적용 중인 볕.
 *
 *   altitude — 정오 남중고도(도). 그림자 길이가 여기서 나온다 (길이 = 높이 / tan).
 *   value    — 0(하지) ~ 1(동지). 빛 색을 고르는 데만 쓴다.
 *
 * 매 프레임 바뀌는 값이라 store state에 담지 않는다. 담으면 구독자 전원이
 * 초당 60번 다시 그린다. 읽는 쪽이 useFrame 하나뿐이므로 상자에 넣어 그대로 건넨다.
 * altitude가 null이면 그림자 모달 밖이라는 뜻이고, 주광은 평소 자리로 돌아간다.
 */
export const sunNow = { altitude: null, value: 0 };

let frame = 0;

/**
 * 목표 절기까지 고도를 이징으로 걸어간다.
 *
 * 스냅으로 한 칸 건너뛰면 그림자가 순간이동한다. 각도를 이어서 넘기면
 * 그림자가 실제로 자라거나 줄어드는 것처럼 미끄러진다.
 */
function tweenSunTo(target) {
  cancelAnimationFrame(frame);

  // 구간에 막 들어왔거나 나갈 때는 이을 값이 없다. 그대로 앉힌다.
  if (!target || sunNow.altitude === null) {
    sunNow.altitude = target ? target.altitude : null;
    sunNow.value = target ? target.value : 0;
    return;
  }

  const from = { altitude: sunNow.altitude, value: sunNow.value };
  const startedAt = performance.now();

  const step = (now) => {
    const k = easeInOutCubic(Math.min(1, (now - startedAt) / TWEEN_MS));

    sunNow.altitude = from.altitude + (target.altitude - from.altitude) * k;
    sunNow.value = from.value + (target.value - from.value) * k;

    if (k < 1) frame = requestAnimationFrame(step);
  };

  frame = requestAnimationFrame(step);
}

export const useSceneStore = create((set) => ({
  /**
   * 그림자 패널이 고른 절기 — 목표값이다. null이면 평소 주광.
   * 실제로 화면에 적용되는 값은 위 sunNow가 이징으로 따라간다.
   */
  sun: null,

  /** 조립 모달인지. true면 완성된 한옥 대신 조립 중인 한옥을 세운다. */
  assembling: false,

  setSun: (sun) => {
    tweenSunTo(sun);
    set({ sun });
  },

  setAssembling: (assembling) => set({ assembling }),
}));

/**
 * 조립 진행도(0~1).
 *
 * 위 sunNow와 같은 이유로 상자에 담는다 — 매 프레임 바뀌고, 읽는 쪽은 useFrame 하나다.
 */
export const assemblyProgress = { current: 0 };
