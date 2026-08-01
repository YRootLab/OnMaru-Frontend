import { create } from 'zustand';

/**
 * Beat이 고정 캔버스의 3D에 값을 넘기는 통로.
 *
 * 3D는 ScrollExperience의 Canvas 하나가 전부 갖고 있고 Beat은 그 위에 얹힌 DOM이라,
 * 트리를 가로질러 값을 건네려면 자리가 하나 필요하다.
 *
 * 이 자리가 비어 있던 탓에 Beat2·3·4가 저마다 3D를 들고 있다가 전부 마운트되지 못했다.
 */
export const useSceneStore = create((set) => ({
  /** Beat3 계절값 0(하지)~1(동지). null이면 평소 볕. */
  season: null,

  /** Beat4 조립 구간인지. true면 완성된 한옥 대신 조립 중인 한옥을 세운다. */
  assembling: false,

  setSeason: (season) => set({ season }),
  setAssembling: (assembling) => set({ assembling }),
}));

/**
 * Beat4 조립 진행도(0~1).
 *
 * 매 프레임 바뀌는 값이라 store에 담으면 구독자가 프레임마다 전부 다시 그린다.
 * 읽는 쪽이 useFrame 하나뿐이므로 상자에 넣어 그대로 건넨다.
 */
export const assemblyProgress = { current: 0 };
