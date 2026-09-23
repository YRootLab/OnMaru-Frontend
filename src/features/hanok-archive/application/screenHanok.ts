import { getFallbackScreenHanoks, type ScreenHanokItem, type ScreenHanokFilterParams } from '@/features/hanok-archive/data/screenHanokFallback';
import {
  fetchBackendScreenHanoks,
  saveScreenHanokPlace,
  unsaveScreenHanokPlace,
} from '@/features/hanok-archive/infrastructure/screenHanokSource';

export async function getScreenHanoks(params?: ScreenHanokFilterParams): Promise<ScreenHanokItem[]> {
  try {
    const items = await fetchBackendScreenHanoks(params);
    return items.length > 0 ? items : getFallbackScreenHanoks(params);
  } catch {
    return getFallbackScreenHanoks(params);
  }
}

export async function toggleScreenHanokSave(placeId: string, currentSaved: boolean): Promise<boolean> {
  if (currentSaved) {
    await unsaveScreenHanokPlace(placeId);
    return false;
  }
  await saveScreenHanokPlace(placeId);
  return true;
}
