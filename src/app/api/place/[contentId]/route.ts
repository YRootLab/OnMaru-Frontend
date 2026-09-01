import { NextResponse } from 'next/server';

const BASE = 'https://apis.data.go.kr/B551011/KorService2';
const TIMEOUT_MS = 10000;

function toHttps(url?: string | null): string | null {
  const s = String(url ?? '').trim();
  if (!s) return null;
  return s.startsWith('http://') ? `https://${s.slice(7)}` : s;
}

/** HTML 태그 제거 및 텍스트 정리 */
function sanitizeHtml(raw?: string | null): string {
  if (!raw) return '';
  return raw
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/** TourAPI 단일 엔드포인트 안전 호출 */
async function fetchTourApiEndpoint(
  endpoint: string,
  params: Record<string, string>,
  apiKey: string,
  signal: AbortSignal,
): Promise<any> {
  const query = new URLSearchParams({
    MobileOS: 'ETC',
    MobileApp: 'OnMaru',
    _type: 'json',
    ...params,
  }).toString();

  const urls = [
    `${BASE}/${endpoint}?serviceKey=${encodeURIComponent(apiKey)}&${query}`,
    `${BASE}/${endpoint}?serviceKey=${apiKey}&${query}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { signal, next: { revalidate: 3600 } });
      if (!res.ok) continue;

      const text = await res.text();
      if (!text.trim().startsWith('{')) continue;

      const json = JSON.parse(text);
      const raw = json?.response?.body?.items?.item;
      if (Array.isArray(raw)) return raw[0] ?? null;
      if (raw) return raw;
      return null;
    } catch {
      continue;
    }
  }
  return null;
}

/** TourAPI 이미지 목록 조회 */
async function fetchTourApiImages(
  contentId: string,
  apiKey: string,
  signal: AbortSignal,
): Promise<string[]> {
  const query = new URLSearchParams({
    MobileOS: 'ETC',
    MobileApp: 'OnMaru',
    _type: 'json',
    contentId,
    imageYN: 'Y',
    subImageYN: 'Y',
    numOfRows: '10',
  }).toString();

  const urls = [
    `${BASE}/detailImage2?serviceKey=${encodeURIComponent(apiKey)}&${query}`,
    `${BASE}/detailImage2?serviceKey=${apiKey}&${query}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { signal, next: { revalidate: 3600 } });
      if (!res.ok) continue;

      const text = await res.text();
      if (!text.trim().startsWith('{')) continue;

      const json = JSON.parse(text);
      const raw = json?.response?.body?.items?.item;
      const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
      return list
        .map((img: any) => toHttps(img.originimgurl || img.smallimageurl))
        .filter(Boolean) as string[];
    } catch {
      continue;
    }
  }
  return [];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ contentId: string }> },
) {
  const { contentId } = await params;
  const { searchParams } = new URL(request.url);
  const contentTypeId = searchParams.get('contentTypeId') || '12';

  const apiKey =
    process.env.TOUR_API_KEY ||
    process.env.TOUR_API_CONGESTION_KEY ||
    process.env.NEXT_PUBLIC_TOUR_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      contentId,
      contentTypeId,
      title: '한옥 명소 상세',
      overview: '전통의 멋과 정취가 살아 숨 쉬는 한옥 공간입니다.',
      addr1: '전통 한옥 마을 일대',
      addr2: '',
      tel: null,
      images: [],
      mapx: 0,
      mapy: 0,
      intro: { 이용시간: '상시 개방', 문의전화: '안내소 문의' },
      homepage: null,
    });
  }

  const signal = AbortSignal.timeout(TIMEOUT_MS);

  try {
    // 3종 병렬 호출 (detailCommon2, detailIntro2, detailImage2)
    const [commonResult, introResult, imagesResult] = await Promise.allSettled([
      fetchTourApiEndpoint(
        'detailCommon2',
        { contentId, defaultYN: 'Y', firstImageYN: 'Y', addrinfoYN: 'Y', mapinfoYN: 'Y', overviewYN: 'Y' },
        apiKey,
        signal,
      ),
      fetchTourApiEndpoint(
        'detailIntro2',
        { contentId, contentTypeId },
        apiKey,
        signal,
      ),
      fetchTourApiImages(contentId, apiKey, signal),
    ]);

    const common = commonResult.status === 'fulfilled' ? commonResult.value : null;
    const introRaw = introResult.status === 'fulfilled' ? introResult.value : null;
    const extraImages = imagesResult.status === 'fulfilled' ? imagesResult.value : [];

    // 이미지 배열 구성 (대표 이미지 우선 + 갤러리 이미지)
    const images: string[] = [];
    const mainImg = toHttps(common?.firstimage || common?.firstimage2);
    if (mainImg) images.push(mainImg);
    for (const img of extraImages) {
      if (!images.includes(img)) images.push(img);
    }

    // contentTypeId별 주요 시설 정보 정제
    const intro: Record<string, string> = {};
    if (introRaw) {
      // 공통 및 관광지(12)/문화시설(14)
      if (introRaw.usetime) intro['이용시간'] = sanitizeHtml(introRaw.usetime);
      if (introRaw.usetimeculture) intro['이용시간'] = sanitizeHtml(introRaw.usetimeculture);
      if (introRaw.restdate) intro['쉬는날'] = sanitizeHtml(introRaw.restdate);
      if (introRaw.restdateculture) intro['쉬는날'] = sanitizeHtml(introRaw.restdateculture);
      if (introRaw.parking) intro['주차시설'] = sanitizeHtml(introRaw.parking);
      if (introRaw.parkingculture) intro['주차시설'] = sanitizeHtml(introRaw.parkingculture);
      if (introRaw.usefee) intro['이용요금'] = sanitizeHtml(introRaw.usefee);
      if (introRaw.infocenter) intro['문의전화'] = sanitizeHtml(introRaw.infocenter);
      if (introRaw.infocenterculture) intro['문의전화'] = sanitizeHtml(introRaw.infocenterculture);

      // 숙박(32)
      if (introRaw.checkintime) intro['체크인'] = sanitizeHtml(introRaw.checkintime);
      if (introRaw.checkouttime) intro['체크아웃'] = sanitizeHtml(introRaw.checkouttime);
      if (introRaw.roomcount) intro['객실수'] = sanitizeHtml(introRaw.roomcount);
      if (introRaw.chkcooking) intro['취사여부'] = sanitizeHtml(introRaw.chkcooking);
      if (introRaw.parkingspace) intro['주차시설'] = sanitizeHtml(introRaw.parkingspace);
      if (introRaw.infocenterlodging) intro['문의전화'] = sanitizeHtml(introRaw.infocenterlodging);

      // 음식점(39)
      if (introRaw.opentimefood) intro['영업시간'] = sanitizeHtml(introRaw.opentimefood);
      if (introRaw.restdatefood) intro['쉬는날'] = sanitizeHtml(introRaw.restdatefood);
      if (introRaw.firstmenu) intro['대표메뉴'] = sanitizeHtml(introRaw.firstmenu);
      if (introRaw.treatmenu) intro['취급메뉴'] = sanitizeHtml(introRaw.treatmenu);
      if (introRaw.parkingfood) intro['주차시설'] = sanitizeHtml(introRaw.parkingfood);
      if (introRaw.infocenterfood) intro['문의전화'] = sanitizeHtml(introRaw.infocenterfood);

      // 쇼핑(38)
      if (introRaw.opentime) intro['영업시간'] = sanitizeHtml(introRaw.opentime);
      if (introRaw.restdateshopping) intro['쉬는날'] = sanitizeHtml(introRaw.restdateshopping);
      if (introRaw.parkingshopping) intro['주차시설'] = sanitizeHtml(introRaw.parkingshopping);
      if (introRaw.saleitem) intro['판매품목'] = sanitizeHtml(introRaw.saleitem);
      if (introRaw.infocentershopping) intro['문의전화'] = sanitizeHtml(introRaw.infocentershopping);
    }

    const payload = {
      contentId,
      contentTypeId,
      title: common?.title ? sanitizeHtml(common.title) : '장소 상세',
      overview: common?.overview ? sanitizeHtml(common.overview) : '',
      addr1: common?.addr1 ? sanitizeHtml(common.addr1) : '',
      addr2: common?.addr2 ? sanitizeHtml(common.addr2) : '',
      tel: common?.tel ? sanitizeHtml(common.tel) : (intro['문의전화'] || null),
      images,
      mapx: Number(common?.mapx) || 0,
      mapy: Number(common?.mapy) || 0,
      intro,
      homepage: common?.homepage ? sanitizeHtml(common.homepage) : null,
    };

    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json({
      contentId,
      contentTypeId,
      title: '한옥 명소 상세',
      overview: '한국의 전통미와 고즈넉한 정취를 품은 한옥 명소입니다.',
      addr1: '대한민국 전통 한옥 명소',
      addr2: '',
      tel: null,
      images: [],
      mapx: 0,
      mapy: 0,
      intro: { 이용시간: '상시 개방', 문의전화: '안내소 문의' },
      homepage: null,
    });
  }
}
