import type { VillageDetailResponse } from '@/features/hanok-archive/types';
import { fetchBackendHanokDetail } from '@/features/hanok-archive/infrastructure/backendHanokDetailSource';
import { PlaceService } from '@/features/map/services/place.service';

export async function getHanokDetail(
  placeId: string,
  contentTypeId?: string | null,
): Promise<VillageDetailResponse> {
  if (process.env.NEXT_PUBLIC_API_URL) {
    try {
      const detail = await fetchBackendHanokDetail(placeId);
      if (detail && (detail.description || detail.images?.length > 0)) {
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
    } catch {
      // Fall through to TourAPI fallback
    }
  }

  try {
    const placeDetail = await PlaceService.getPlaceDetail(placeId, contentTypeId || '12');
    const hasData = Boolean(
      placeDetail && (
        placeDetail.overview ||
        (placeDetail.images && placeDetail.images.length > 0) ||
        (placeDetail.intro && Object.keys(placeDetail.intro).length > 0)
      ),
    );
    if (!hasData) {
      return { overview: null, images: [], contentTags: [], source: 'none' };
    }
    return {
      overview: placeDetail.overview || null,
      homepage: placeDetail.homepage || null,
      tel: placeDetail.tel || placeDetail.intro['문의전화'] || null,
      usetime: placeDetail.intro['이용시간'] || placeDetail.intro['영업시간'] || null,
      restdate: placeDetail.intro['쉬는날'] || null,
      parking: placeDetail.intro['주차시설'] || null,
      expguide: placeDetail.intro['체험안내'] || placeDetail.intro['이용요금'] || null,
      checkin: placeDetail.intro['체크인'] || null,
      checkout: placeDetail.intro['체크아웃'] || null,
      roomtype: placeDetail.intro['객실유형'] || null,
      roomcount: placeDetail.intro['객실수'] || null,
      subfacility: placeDetail.intro['부대시설'] || null,
      barbecue: placeDetail.intro['바비큐'] || null,
      chkcooking: placeDetail.intro['취사여부'] || null,
      refundregulation: placeDetail.intro['환불규정'] || null,
      repeatInfo: [],
      images: placeDetail.images || [],
      lat: placeDetail.mapy || null,
      lng: placeDetail.mapx || null,
      addr: placeDetail.addr1 ? `${placeDetail.addr1} ${placeDetail.addr2 || ''}`.trim() : null,
      contentTags: [],
      item: null,
      source: 'TourAPI',
    };
  } catch (err) {
    console.warn('[getHanokDetail] TourAPI fallback failed:', err);
    return { overview: null, images: [], contentTags: [], source: 'none' };
  }
}
