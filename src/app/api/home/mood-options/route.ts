import { NextResponse } from 'next/server';

export async function GET() {
  const MOOD_OPTIONS = [
    {
      id: 'quiet',
      label: '조용한 산책',
      iconName: 'Cloud',
      query: '사람이 붐비지 않고 고즈넉하게 한옥 골목을 산책할 수 있는 곳',
    },
    {
      id: 'market',
      label: '정겨운 시장',
      iconName: 'ShoppingBag',
      query: '한옥의 정취와 활기찬 전통시장 먹거리를 함께 즐길 수 있는 여정',
    },
    {
      id: 'story',
      label: '이야기와 해설',
      iconName: 'Headphones',
      query: '역사적 숨결이 깊게 배어있어 해설과 함께 듣기 좋은 장소',
    },
    {
      id: 'rain',
      label: '비 오는 날',
      iconName: 'CloudRain',
      query: '처마 밑 빗소리를 들으며 차 한 잔 마시기 좋은 고택이나 찻집',
    },
    {
      id: 'nature',
      label: '자연 속 한옥',
      iconName: 'Leaf',
      query: '숲과 정원이 어우러져 피톤치드를 느낄 수 있는 전통 숙소',
    },
  ];

  return NextResponse.json({ moods: MOOD_OPTIONS });
}
