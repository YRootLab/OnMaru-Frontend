import { create } from 'zustand';









const TWEEN_MS = 420;

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);











export const sunNow = { altitude: null, value: 0 };

let frame = 0;







function tweenSunTo(target) {
  cancelAnimationFrame(frame);


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




  sun: null,


  assembling: false,

  setSun: (sun) => {
    tweenSunTo(sun);
    set({ sun });
  },

  setAssembling: (assembling) => set({ assembling }),
}));






export const assemblyProgress = { current: 0 };
