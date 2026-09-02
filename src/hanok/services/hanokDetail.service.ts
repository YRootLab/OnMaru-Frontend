import { TourApiClient } from '@/lib/tour-api/tourApiClient';
import { toHttps } from '@/map/utils/formatters';

export class HanokDetailService {
  /**
   * 한옥 아카이브 항목의 상세 정보 (기본 정보, 소개 정보, 반복 정보, 이미지 목록)를 조회합니다.
   */
  public static async getHanokDetail(
    contentId: string,
    contentTypeIdParam?: string | null,
  ) {
    const cleanId = encodeURIComponent(contentId);
    const signal = AbortSignal.timeout(10000);

    try {
      // 1. detailCommon2 호출
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
      const homepage = commonItem.homepage ? String(commonItem.homepage).trim() : null;
      const tel = commonItem.tel || introItem.infocenter || introItem.infocenterlodging || null;
      const usetime = introItem.usetime || introItem.usetimeleports || introItem.opentimefood || null;
      const restdate = introItem.restdate || introItem.restdateculture || introItem.restdatefood || null;
      const parking = introItem.parking || introItem.parkinglodging || null;
      const expguide = introItem.expguide || null;

      const repeatInfo = infoList
        .map((i: any) => ({
          title: String(i.infoname || '').trim(),
          content: String(i.infotext || '').trim(),
        }))
        .filter((i: { title: string; content: string }) => i.title && i.content);

      const images: string[] = imgList
        .map((i: any) => toHttps(i.originimgurl || i.smallimageurl))
        .filter(Boolean) as string[];

      return {
        overview,
        homepage,
        tel,
        usetime,
        restdate,
        parking,
        expguide,
        repeatInfo,
        images,
        item: commonItem,
        source: 'TourAPI',
      };
    } catch {
      return { overview: null, source: 'none' };
    }
  }
}
