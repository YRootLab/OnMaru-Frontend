import type { VillageDetailResponse } from '@/features/hanok-archive/types';
import { fetchBackendHanokDetail } from '@/features/hanok-archive/infrastructure/backendHanokDetailSource';

export async function getHanokDetail(placeId: string): Promise<VillageDetailResponse> {
  const detail = await fetchBackendHanokDetail(placeId);

  return {
    overview: detail.description || null,
    homepage: null,
    tel: null,
    usetime: null,
    restdate: null,
    parking: null,
    expguide: null,
    checkin: null,
    checkout: null,
    roomtype: null,
    roomcount: null,
    subfacility: null,
    barbecue: null,
    chkcooking: null,
    refundregulation: null,
    repeatInfo: [],
    images: detail.images.map((img) => img.url).filter((url): url is string => Boolean(url)),
    lat: detail.coordinates?.lat ?? null,
    lng: detail.coordinates?.lng ?? null,
    addr: detail.address || null,
    contentTags: detail.contentTags ?? [],
    item: null,
    source: 'backend',
  };
}
