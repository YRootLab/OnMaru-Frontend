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

export function tweenAltitude(targetAltitude, targetValue, duration = TWEEN_MS) {
  cancelAnimationFrame(frame);

  if (targetAltitude === null || sunNow.altitude === null) {
    sunNow.altitude = targetAltitude;
    sunNow.value = targetValue ?? 0;
    return;
  }

  const fromAltitude = sunNow.altitude;
  const fromValue = sunNow.value;
  const startedAt = performance.now();

  const step = (now) => {
    const elapsed = Math.min(1, (now - startedAt) / duration);
    const k = easeInOutCubic(elapsed);

    sunNow.altitude = fromAltitude + (targetAltitude - fromAltitude) * k;
    sunNow.value = fromValue + ((targetValue ?? 0) - fromValue) * k;

    if (elapsed < 1) {
      frame = requestAnimationFrame(step);
    }
  };

  frame = requestAnimationFrame(step);
}

export const useSceneStore = create((set) => ({




  sun: null,


  assembling: false,


  devTuner: {
    enabled: true,
    posX: 0,
    posY: 0,
    posZ: -16.0,
    scale: 1.35,
    targetY: 6.0,
  },

  setSun: (sun) => {
    tweenSunTo(sun);
    set({ sun });
  },

  setSunAltitudeTween: (altitude, value, duration) => {
    tweenAltitude(altitude, value, duration);
    set({ sun: altitude !== null ? { altitude, value } : null });
  },

  setAssembling: (assembling) => set({ assembling }),

  setDevTuner: (patch) =>
    set((state) => ({
      devTuner: typeof patch === 'function' ? patch(state.devTuner) : { ...state.devTuner, ...patch },
    })),
}));






export const assemblyProgress = { current: 0 };
