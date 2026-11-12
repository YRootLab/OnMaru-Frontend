'use client';

import { useCollab } from './MapCollabProvider';

export function useCollabPins() {
  const ctx = useCollab();
  if (!ctx) return { pins: null, addPin: () => {}, removePin: () => {} };
  return {
    pins: ctx.pins,
    addPin: (placeId: string) => ctx.addPin(placeId),
    removePin: (_placeId: string, pinId: string) => ctx.removePin(pinId),
  };
}
