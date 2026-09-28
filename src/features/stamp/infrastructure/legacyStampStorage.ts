import type { LegacyStampStorage } from '../application/ports';

export const LEGACY_STAMP_KEY = 'onmaru_hanok_stamps_v1';

export const browserLegacyStampStorage: LegacyStampStorage = {
  removeLegacyStampData(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LEGACY_STAMP_KEY);
    }
  },
};
