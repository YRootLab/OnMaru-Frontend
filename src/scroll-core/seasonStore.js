import { create } from 'zustand';

/**
 * Beat3의 슬라이더가 고정 캔버스의 볕을 움직이는 통로.
 *
 * 3D는 ScrollExperience의 Canvas 하나가 전부 갖고 있고 Beat은 그 위에 얹힌 DOM이라,
 * 계절값을 넘기려면 트리를 가로지르는 자리가 하나 필요하다.
 *
 * null = Beat3 밖. 조명이 평소 위치를 쓴다.
 */
export const useSeasonStore = create((set) => ({
  season: null,
  setSeason: (season) => set({ season }),
}));
