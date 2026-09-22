import { NextResponse } from 'next/server';
import { TourApiClient } from '@/lib/tour-api/tourApiClient';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword');

  if (!keyword) {
    return NextResponse.json({ imageUrl: null });
  }


  const cleanKeyword = keyword
    .replace(/\[.*?\]|\(.*?\)/g, '')
    .split('-')[0]
    .replace(/^(서울|경기|강원|충북|충남|전북|전남|경북|경남|제주|부산|대구|인천|광주|대전|울산|세종)\s+/, '')
    .trim();

  try {

    const res = await TourApiClient.get('searchKeyword1', {
      keyword: cleanKeyword,
      numOfRows: 1,
      arrange: 'Q',
      contentTypeId: '12',
    });

    const items = res?.items?.item;
    const itemList = Array.isArray(items) ? items : items ? [items] : [];

    if (itemList.length > 0) {
      const match = itemList[0];
      const imageUrl = match.firstimage || match.firstimage2 || null;
      if (imageUrl) {
        return NextResponse.json({ imageUrl: imageUrl.replace(/^http:\/\//i, 'https://') });
      }
    }
  } catch (error) {
    console.warn('[Sorimaru Image Resolver] Failed to fetch TourAPI:', error);
  }


  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || process.env.KAKAO_MAP_KEY;
  if (kakaoKey) {
    try {
      const kakaoRes = await fetch(`https://dapi.kakao.com/v2/search/image?query=${encodeURIComponent(cleanKeyword + ' 한옥')}&size=1`, {
        headers: { Authorization: `KakaoAK ${kakaoKey}` },
        signal: AbortSignal.timeout(4000),
      });
      if (kakaoRes.ok) {
        const kakaoJson = await kakaoRes.json();
        const firstDoc = kakaoJson.documents?.[0];
        if (firstDoc && firstDoc.image_url) {

          return NextResponse.json({ imageUrl: firstDoc.image_url.replace(/^http:\/\//i, 'https://') });
        }
      }
    } catch (error) {
      console.warn('[Sorimaru Image Resolver] Failed to fetch Kakao Image Search:', error);
    }
  }

  return NextResponse.json({ imageUrl: null });
}
