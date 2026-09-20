import { NextResponse } from 'next/server';

export async function GET() {
  const POPULAR_REGIONS = [
    { name: '서울', sub: '북촌 · 서촌 · 익선동', query: '서울 고즈넉한 한옥길' },
    { name: '안동', sub: '하회마을 · 도산서원', query: '안동 하회마을 고택 쉼' },
    { name: '전주', sub: '한옥마을 · 경기전', query: '전주 한옥마을 맛과 멋' },
    { name: '경주', sub: '교촌마을 · 양동마을', query: '경주 교촌마을과 고분 산책' },
    { name: '강릉', sub: '선교장 · 오죽헌', query: '강릉 선교장 정원 힐링' },
    { name: '제주', sub: '성읍민속마을 · 돌담집', query: '제주 돌담 한옥과 쉼' },
  ];

  return NextResponse.json({ 
    title: '지역별 한옥 둘러보기',
    description: '가보고 싶은 지역의 추천 일정을 확인해 보세요.',
    regions: POPULAR_REGIONS 
  });
}
