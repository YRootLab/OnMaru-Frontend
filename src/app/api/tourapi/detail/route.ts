import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contentId = searchParams.get('id');
  const contentTypeIdParam = searchParams.get('contentTypeId');
  const apiKey = process.env.NEXT_PUBLIC_TOUR_API_KEY || process.env.TOUR_API_KEY;

  if (!contentId) {
    return NextResponse.json({ error: 'Missing contentId' }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing TourAPI Key' }, { status: 500 });
  }

  const cleanId = encodeURIComponent(contentId);
  const encodedKey = encodeURIComponent(apiKey);

  try {
    // 1. detailCommon2 호출 (개요, 홈페이지, 전화, 대표이미지 등 기본정보)
    // TourAPI 4.0(KorService2)에서는 defaultYN 등 구버전 파라미터 제외 필수
    const commonUrls = [
      `https://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${encodedKey}&MobileOS=ETC&MobileApp=OnMaru&_type=json&contentId=${cleanId}`,
      `https://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${apiKey}&MobileOS=ETC&MobileApp=OnMaru&_type=json&contentId=${cleanId}`,
    ];

    let commonItem: any = null;
    for (const url of commonUrls) {
      try {
        const res = await fetch(url, { next: { revalidate: 86400 } });
        if (!res.ok) continue;
        const json = await res.json();
        const rawItems = json?.response?.body?.items?.item;
        const found = Array.isArray(rawItems) ? rawItems[0] : rawItems;
        if (found) {
          commonItem = found;
          break;
        }
      } catch (e) {
        // 다음 URL 시도
      }
    }

    if (!commonItem) {
      return NextResponse.json({ overview: null, source: 'none' }, { status: 404 });
    }

    const contentTypeId = contentTypeIdParam || commonItem.contenttypeid || '';

    // 2. detailIntro2, detailInfo2, detailImage2 병렬 비동기 호출
    const introUrl = contentTypeId
      ? `https://apis.data.go.kr/B551011/KorService2/detailIntro2?serviceKey=${encodedKey}&MobileOS=ETC&MobileApp=OnMaru&_type=json&contentId=${cleanId}&contentTypeId=${encodeURIComponent(contentTypeId)}`
      : null;
    const infoUrl = contentTypeId
      ? `https://apis.data.go.kr/B551011/KorService2/detailInfo2?serviceKey=${encodedKey}&MobileOS=ETC&MobileApp=OnMaru&_type=json&contentId=${cleanId}&contentTypeId=${encodeURIComponent(contentTypeId)}`
      : null;
    const imgUrl = `https://apis.data.go.kr/B551011/KorService2/detailImage2?serviceKey=${encodedKey}&MobileOS=ETC&MobileApp=OnMaru&_type=json&contentId=${cleanId}&imageYN=Y`;

    const [introRes, infoRes, imgRes] = await Promise.allSettled([
      introUrl ? fetch(introUrl, { next: { revalidate: 86400 } }).then((r) => r.json()) : Promise.resolve(null),
      infoUrl ? fetch(infoUrl, { next: { revalidate: 86400 } }).then((r) => r.json()) : Promise.resolve(null),
      fetch(imgUrl, { next: { revalidate: 86400 } }).then((r) => r.json()),
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

    // 개요 및 상세 필드 파싱
    const overview = commonItem.overview ? String(commonItem.overview).trim() : null;
    const homepage = commonItem.homepage ? String(commonItem.homepage).trim() : null;
    const tel = commonItem.tel || introItem.infocenter || introItem.infocenterlodging || null;
    const usetime = introItem.usetime || introItem.usetimeleports || introItem.opentimefood || null;
    const restdate = introItem.restdate || introItem.restdateculture || introItem.restdatefood || null;
    const parking = introItem.parking || introItem.parkinglodging || null;
    const expguide = introItem.expguide || null;

    // 반복 상세 정보 (입장료, 관람안내 등)
    const repeatInfo = infoList
      .map((i: any) => ({
        title: String(i.infoname || '').trim(),
        content: String(i.infotext || '').trim(),
      }))
      .filter((i: { title: string; content: string }) => i.title && i.content);

    // 고화질 이미지 URL 리스트
    const images: string[] = imgList
      .map((i: any) => i.originimgurl || i.smallimageurl)
      .filter(Boolean)
      .map((url: string) => (url.startsWith('http://') ? `https://${url.slice(7)}` : url));

    return NextResponse.json({
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
    });
  } catch (error: any) {
    console.error('[TourAPI Detail Route Error]', error);
    return NextResponse.json({ overview: null, source: 'none', error: error?.message }, { status: 500 });
  }
}
