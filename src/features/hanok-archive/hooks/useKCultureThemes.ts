import { useState, useEffect } from 'react';
import type { KCultureThemeItem } from '@/features/hanok-archive/data/kcultureThemes';

/** TourAPI에서 "스크린 속 한옥" 후보를 읽어온다. 컴포넌트는 이 훅의 반환값만 받아 그린다. */
export function useKCultureThemes() {
  const [items, setItems] = useState<KCultureThemeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function fetchScreenHanok() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/tourapi/kculture?category=kdrama');
        if (!res.ok) throw new Error('API failed');
        const data = await res.json();
        if (!ignore && data?.items && Array.isArray(data.items) && data.items.length > 0) {
          const mapped: KCultureThemeItem[] = data.items.map((it: any) => ({
            id: `tour-${it.id}`,
            category: 'kdrama',
            categoryLabel: it.categoryLabel || '스크린 속 한옥',
            categoryIcon: it.categoryIcon || '🎬',
            mediaType: it.mediaType || 'drama',
            eyebrow: it.drama || 'K-콘텐츠 & 사극 속 전통 한옥 문화유산',
            title: it.title,
            subtitle: it.subtitle || `${it.region}의 역사와 정취가 깃든 전통 한옥 명소입니다.`,
            contentId: it.id,
            villageName: it.title,
            region: it.region,
            addr: it.addr,
            image: it.image || 'https://tong.visitkorea.or.kr/cms/resource/80/3095780_image2_1.jpg',
            tags: it.tags || ['#드라마촬영지', '#전통한옥', '#문화유산', '#TourAPI'],
            coursePreview: it.coursePreview || {
              day1: ['14:00 촬영 명소 산책', '16:30 인근 고택 체크인', '18:30 향토 미식', '20:30 야경 산책'],
              day2: ['08:30 아침 산책 & 다도', '11:00 로컬 명소 탐방'],
            },
          }));
          setItems(mapped);
        }
      } catch {
        // 목데이터를 쓰지 않고 빈 배열 유지 (사용자 명시적 요청)
        if (!ignore) setItems([]);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    fetchScreenHanok();
    return () => {
      ignore = true;
    };
  }, []);

  return { items, isLoading };
}
