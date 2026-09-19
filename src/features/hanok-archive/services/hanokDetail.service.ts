import { TourApiClient } from '@/lib/tour-api/tourApiClient';
import { toHttps } from '@/features/map/utils/formatters';
import { apiGet } from '@/lib/api/client';

/** 백엔드 GET /api/v1/hanoks/{placeId} 응답. 실서버 호출로 검증한 실제 shape (2026-09-19). */
interface BackendPlaceDetail {
  placeId: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  images: { url: string; alt: string }[];
  description: string;
  highlights?: string[];
  contentTags: string[];
}

export class HanokDetailService {
  /**
   * FE #90: 백엔드(/api/v1/hanoks/{placeId})를 먼저 시도하고, 실패하거나 백엔드가
   * 설정되지 않았으면 기존 TourAPI 상세 경로로 폴백한다.
   */
  public static async getHanokDetail(
    contentId: string,
    contentTypeIdParam?: string | null,
  ) {
    if (process.env.NEXT_PUBLIC_API_URL) {
      try {
        return await this.getPlaceDetailFromBackend(contentId);
      } catch (err) {
        console.warn('[HanokDetailService] backend /hanoks failed, falling back to TourAPI:', err);
      }
    }
    return this.getHanokDetailFromTourApi(contentId, contentTypeIdParam);
  }

  private static async getPlaceDetailFromBackend(placeId: string) {
    // FE #90: 한옥 도감 상세는 범용 /places가 아니라 한옥 전용 /hanoks/{placeId}를 쓴다
    // (highlights, mapCard/odiiLinkedCard 등 한옥 특화 필드가 여기에만 있다).
    const detail = await apiGet<BackendPlaceDetail>(`/hanoks/${encodeURIComponent(placeId)}`);

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
      images: detail.images.map((img) => toHttps(img.url)).filter(Boolean) as string[],
      lat: detail.coordinates?.lat ?? null,
      lng: detail.coordinates?.lng ?? null,
      addr: detail.address || null,
      contentTags: detail.contentTags ?? [],
      item: null,
      source: 'backend' as const,
    };
  }

  private static async getHanokDetailFromTourApi(
    contentId: string,
    contentTypeIdParam?: string | null,
  ) {
    const cleanId = encodeURIComponent(contentId);
    const signal = AbortSignal.timeout(10000);

    try {
      // 1. detailCommon2 호출
      // overviewYN/addrinfoYN/mapinfoYN을 붙이면 이 키의 TourAPI 등급에서 INVALID_REQUEST_PARAMETER_ERROR가
      // 난다 — 반면 아무 YN 없이 불러도 overview/addr1/mapx/mapy는 기본 응답에 이미 포함된다.
      const commonJson = await TourApiClient.get(
        'detailCommon2',
        { contentId: cleanId },
        signal,
      );

      const rawItems = commonJson?.response?.body?.items?.item;
      const commonItem = Array.isArray(rawItems) ? rawItems[0] : rawItems;

      if (!commonItem) {
        return { overview: null, source: 'none' };
      }

      const contentTypeId = contentTypeIdParam || commonItem.contenttypeid || '';

      // 2. detailIntro2, detailInfo2, detailImage2 병렬 호출
      const [introRes, infoRes, imgRes] = await Promise.allSettled([
        contentTypeId
          ? TourApiClient.get(
              'detailIntro2',
              { contentId: cleanId, contentTypeId },
              signal,
            )
          : Promise.resolve(null),
        contentTypeId
          ? TourApiClient.get(
              'detailInfo2',
              { contentId: cleanId, contentTypeId },
              signal,
            )
          : Promise.resolve(null),
        TourApiClient.get(
          'detailImage2',
          { contentId: cleanId, imageYN: 'Y' },
          signal,
        ),
      ]);

      const introData = introRes.status === 'fulfilled' ? introRes.value : null;
      const infoData = infoRes.status === 'fulfilled' ? infoRes.value : null;
      const imgData = imgRes.status === 'fulfilled' ? imgRes.value : null;

      const rawIntroItem = introData?.response?.body?.items?.item;
      const introItem = Array.isArray(rawIntroItem) ? rawIntroItem[0] : rawIntroItem || {};

      const rawInfoItems = infoData?.response?.body?.items?.item;
      const infoList = Array.isArray(rawInfoItems) ? rawInfoItems : rawInfoItems ? [rawInfoItems] : [];

      const rawImgItems = imgData?.response?.body?.items?.item;
      const imgList = Array.isArray(rawImgItems) ? rawImgItems : rawImgItems ? [rawImgItems] : [];

      const overview = commonItem.overview ? String(commonItem.overview).trim() : null;
      const reservationurl = introItem.reservationurl ? String(introItem.reservationurl).trim() : null;
      const homepage = commonItem.homepage ? String(commonItem.homepage).trim() : reservationurl;
      const tel =
        commonItem.tel ||
        introItem.infocenter ||
        introItem.infocenterlodging ||
        introItem.reservationlodging ||
        null;
      const usetime = introItem.usetime || introItem.usetimeleports || introItem.opentimefood || null;
      const restdate = introItem.restdate || introItem.restdateculture || introItem.restdatefood || null;
      const parking = introItem.parking || introItem.parkinglodging || null;
      const expguide = introItem.expguide || null;

      const checkin = introItem.checkintime ? String(introItem.checkintime).trim() : null;
      const checkout = introItem.checkouttime ? String(introItem.checkouttime).trim() : null;
      const roomtype = introItem.roomtype ? String(introItem.roomtype).trim() : null;
      const roomcount = introItem.roomcount ? String(introItem.roomcount).trim() : null;
      const subfacility = introItem.subfacility ? String(introItem.subfacility).trim() : null;
      const barbecue = introItem.barbecue ? String(introItem.barbecue).trim() : null;
      const chkcooking = introItem.chkcooking ? String(introItem.chkcooking).trim() : null;
      const refundregulation = introItem.refundregulation ? String(introItem.refundregulation).trim() : null;

      const repeatInfo = infoList
        .map((i: any) => ({
          title: String(i.infoname || '').trim(),
          content: String(i.infotext || '').trim(),
        }))
        .filter((i: { title: string; content: string }) => i.title && i.content);

      const images: string[] = imgList
        .map((i: any) => toHttps(i.originimgurl || i.smallimageurl))
        .filter(Boolean) as string[];

      const rawLat = parseFloat(String(commonItem.mapy ?? ''));
      const rawLng = parseFloat(String(commonItem.mapx ?? ''));
      const lat = !isNaN(rawLat) && rawLat > 0 ? rawLat : null;
      const lng = !isNaN(rawLng) && rawLng > 0 ? rawLng : null;
      const addr = commonItem.addr1 ? String(commonItem.addr1).trim() : null;

      return {
        overview,
        homepage,
        tel,
        usetime,
        restdate,
        parking,
        expguide,
        checkin,
        checkout,
        roomtype,
        roomcount,
        subfacility,
        barbecue,
        chkcooking,
        refundregulation,
        repeatInfo,
        images,
        lat,
        lng,
        addr,
        item: commonItem,
        source: 'TourAPI',
      };
    } catch {
      return { overview: null, source: 'none' };
    }
  }
}
