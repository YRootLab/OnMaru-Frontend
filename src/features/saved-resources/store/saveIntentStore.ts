import type { SaveIntent } from '../api/savedResourcesContract';

const SAVE_INTENT_STORAGE_KEY = 'onmaru.pendingSaveIntent.v1';

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type SaveIntentStore = {
  savePlaceIntent(placeId: string): void;
  consume(): SaveIntent | null;
  clear(): void;
};

type Clock = {
  now(): Date;
};

function decodeIntent(raw: string | null): SaveIntent | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<SaveIntent>;
    if (
      value.resourceType === 'PLACE' &&
      typeof value.placeId === 'string' &&
      value.desiredSaved === true &&
      typeof value.createdAt === 'string'
    ) {
      return value as SaveIntent;
    }
  } catch {
    return null;
  }
  return null;
}

export function createSaveIntentStore(storage: StorageLike, clock: Clock): SaveIntentStore {
  return {
    savePlaceIntent(placeId: string): void {
      const intent: SaveIntent = {
        resourceType: 'PLACE',
        placeId,
        desiredSaved: true,
        createdAt: clock.now().toISOString(),
      };
      storage.setItem(SAVE_INTENT_STORAGE_KEY, JSON.stringify(intent));
    },
    consume(): SaveIntent | null {
      const intent = decodeIntent(storage.getItem(SAVE_INTENT_STORAGE_KEY));
      storage.removeItem(SAVE_INTENT_STORAGE_KEY);
      return intent;
    },
    clear(): void {
      storage.removeItem(SAVE_INTENT_STORAGE_KEY);
    },
  };
}

export function createBrowserSaveIntentStore(clock: Clock = { now: () => new Date() }): SaveIntentStore | null {
  if (typeof window === 'undefined') return null;
  return createSaveIntentStore(window.sessionStorage, clock);
}
