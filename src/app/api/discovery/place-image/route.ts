import { NextResponse } from 'next/server';

// ponytail: 백엔드가 placeImage: null 반환하는 동안 TourAPI에서 직접 가져오는 임시 브릿지
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contentId = searchParams.get('contentId');

  if (!contentId || !/^\d+$/.test(contentId)) {
    return NextResponse.json({ imageUrl: null });
  }

  const apiKey = process.env.TOUR_API_KEY;
  if (!apiKey) return NextResponse.json({ imageUrl: null });

  try {
    const qs = new URLSearchParams({
      serviceKey: apiKey,
      contentId,
      defaultYN: 'N',
      firstImageYN: 'Y',
      areacodeYN: 'N',
      catcodeYN: 'N',
      addrinfoYN: 'N',
      mapinfoYN: 'N',
      overviewYN: 'N',
      numOfRows: '1',
      pageNo: '1',
      MobileOS: 'ETC',
      MobileApp: 'OnMaru',
      _type: 'json',
    });

    const res = await fetch(
      `https://apis.data.go.kr/B551011/KorService2/detailCommon2?${qs}`,
      { signal: AbortSignal.timeout(5000) },
    );

    if (!res.ok) return NextResponse.json({ imageUrl: null });

    const data = await res.json();
    const raw = data?.response?.body?.items?.item;
    const item = Array.isArray(raw) ? raw[0] : raw;
    const imageUrl = item?.firstimage || item?.firstimage2 || null;

    return NextResponse.json(
      { imageUrl: imageUrl ? imageUrl.replace(/^http:\/\//i, 'https://') : null },
      { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600' } },
    );
  } catch {
    return NextResponse.json({ imageUrl: null });
  }
}
