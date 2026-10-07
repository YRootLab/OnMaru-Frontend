import type { MapMode } from '../types';
import type { MapInfoCategory } from './infoCategory';

export function mapModeSearch(
  search: string,
  mode: MapMode,
  infoCategory: MapInfoCategory,
  infoRegionCode: string | null,
): string {
  const params = new URLSearchParams(search);
  params.set('mode', mode);

  if (mode === 'info') {
    params.set('category', infoCategory);
    if (infoRegionCode) params.set('regionCode', infoRegionCode);
    else params.delete('regionCode');
  } else {
    params.delete('category');
    params.delete('regionCode');
  }

  return params.toString();
}
