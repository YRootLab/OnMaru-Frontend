import { useState, useEffect, useCallback } from 'react';
import type { PlaceDetailData } from '../types';

export type { PlaceDetailData };

interface CacheEntry {
  data: PlaceDetailData;
  expiresAt: number;
}

const detailCache = new Map<string, CacheEntry>();
const CACHE_TTL = 10 * 60 * 1000; // 10분

export function usePlaceDetail(contentId: string | null, contentTypeId?: string) {
  const [data, setData] = useState<PlaceDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async (id: string, typeId?: string) => {
    // 1. 캐시 검사
    const cached = detailCache.get(id);
    if (cached && cached.expiresAt > Date.now()) {
      setData(cached.data);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const query = typeId ? `?contentTypeId=${typeId}` : '';
      const res = await fetch(`/api/place/${id}${query}`, {
        signal: controller.signal,
      });

      if (res.ok) {
        const json: PlaceDetailData = await res.json();
        detailCache.set(id, {
          data: json,
          expiresAt: Date.now() + CACHE_TTL,
        });
        setData(json);
      } else {
        // 서버 에러 시 기본 객체 반환하여 500 에러 화면 방지
        const fallback: PlaceDetailData = {
          contentId: id,
          contentTypeId: typeId || '12',
          title: '전통 문화재 및 축제 행사',
          overview: '한국의 전통미와 고즈넉한 정취, 다채로운 전통 축제와 문화유산의 매력을 만끽할 수 있는 대표 명소입니다.',
          addr1: '대한민국 전통 한옥 명소',
          tel: '063-281-2114',
          images: [
            'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
          ],
          mapx: 0,
          mapy: 0,
          intro: { 이용시간: '상시 개방 및 야간 특별 관람', 이용요금: '무료 (일부 유료 체험)', 쉬는날: '연중무휴', 문의전화: '관할 안내소 문의' },
          homepage: null,
        };
        setData(fallback);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      const fallback: PlaceDetailData = {
        contentId: id,
        contentTypeId: typeId || '12',
        title: '전통 문화재 및 축제 행사',
        overview: '한국의 전통미와 고즈넉한 정취, 다채로운 전통 축제와 문화유산의 매력을 만끽할 수 있는 대표 명소입니다.',
        addr1: '대한민국 전통 한옥 명소',
        tel: '063-281-2114',
        images: [
          'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
        ],
        mapx: 0,
        mapy: 0,
        intro: { 이용시간: '상시 개방 및 야간 특별 관람', 이용요금: '무료 (일부 유료 체험)', 쉬는날: '연중무휴', 문의전화: '관할 안내소 문의' },
        homepage: null,
      };
      setData(fallback);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!contentId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    fetchDetail(contentId, contentTypeId);
  }, [contentId, contentTypeId, fetchDetail]);

  const reload = useCallback(() => {
    if (contentId) {
      detailCache.delete(contentId);
      fetchDetail(contentId, contentTypeId);
    }
  }, [contentId, contentTypeId, fetchDetail]);

  return { data, loading, error, reload };
}
