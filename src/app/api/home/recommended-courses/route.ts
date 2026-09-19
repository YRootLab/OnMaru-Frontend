import { NextResponse } from 'next/server';

export async function GET() {
  const title = '이번 주 추천 한옥 코스';
  const description = '정취와 소리가 머무는 특별한 여행지예요.';
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

  try {
    const res = await fetch(`${API_URL}/hanoks?limit=3`, {
      // 1시간 캐시
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({
        title,
        description,
        courses: [],
      });
    }

    const data = await res.json();
    const mappedCourses = (data.items || [])
      .filter((item: any) => !!item.thumbnailUrl)
      .map((item: any) => ({
        id: item.placeId,
        badge: item.regionName,
        title: item.name,
        description: item.summary,
        image: item.thumbnailUrl,
        query: `${item.regionName} ${item.name}`,
        tags: (item.tags || []).map((t: string) => `#${t}`),
      }));

    return NextResponse.json({
      title,
      description,
      courses: mappedCourses,
    });
  } catch (error) {
    console.error('[recommended-courses] error:', error);
    return NextResponse.json({
      title,
      description,
      courses: [],
    });
  }
}
