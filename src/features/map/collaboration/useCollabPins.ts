'use client';

import { useStorage, useMutation } from './liveblocks.config';
import type { CollabPin } from './liveblocks.config';

export function useCollabPins() {
  const pins = useStorage((root) => root.pins);

  const addPin = useMutation(({ storage }, pin: CollabPin) => {
    storage.get('pins').push(pin);
  }, []);

  const removePin = useMutation(({ storage }, placeId: string) => {
    const list = storage.get('pins');
    const idx = list.findIndex((p) => p.placeId === placeId);
    if (idx !== -1) list.delete(idx);
  }, []);

  return { pins, addPin, removePin };
}
