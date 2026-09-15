import { NextResponse } from 'next/server';
import { TourApiClient } from '@/lib/tour-api/tourApiClient';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword');
  
  if (!keyword) {
    return NextResponse.json({ imageUrl: null });
  }

  // 검색 정확도를 높이기 위해 불필요한 괄호 및 지역명 일부 제거
  const cleanKeyword = keyword
    .replace(/\[.*?\]|\(.*?\)/g, '')
    .split('-')[0]
    .replace(/^(서울|경기|강원|충북|충남|전북|전남|경북|경남|제주|부산|대구|인천|광주|대전|울산|세종)\s+/, '')
    .trim();

  try {
    // 1. TourAPI searchKeyword1을 통해 연관 관광지 검색
    const res = await TourApiClient.get('searchKeyword1', {
      keyword: cleanKeyword,
      numOfRows: 1,
      arrange: 'Q', // 이미지 있는 것 우선 (Q는 대표이미지순 정렬)
      contentTypeId: '12', // 관광지
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

  // 2. TourAPI에 이미지가 없다면 카카오 이미지 검색 활용 (유저 요청)
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
          // 카카오 이미지 검색은 image_url과 thumbnail_url을 반환함
          return NextResponse.json({ imageUrl: firstDoc.image_url.replace(/^http:\/\//i, 'https://') });
        }
      }
    } catch (error) {
      console.warn('[Sorimaru Image Resolver] Failed to fetch Kakao Image Search:', error);
    }
  }

  return NextResponse.json({ imageUrl: null });
}
