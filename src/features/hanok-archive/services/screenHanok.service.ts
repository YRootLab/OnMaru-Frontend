import { getScreenHanoks, toggleScreenHanokSave } from '@/features/hanok-archive/application/screenHanok';
import type { ScreenHanokItem, ScreenHanokFilterParams } from '@/features/hanok-archive/data/screenHanokFallback';

export type { ScreenHanokItem, ScreenHanokFilterParams };

export const screenHanokService = {
  getScreenHanoks,
  toggleSavePlace: toggleScreenHanokSave,
};
