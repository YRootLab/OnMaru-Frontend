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
          title: '한옥 명소 상세',
          overview: '한국 전통의 아름다움을 간직한 명소입니다.',
          addr1: '전통 한옥 마을 일대',
          tel: null,
          images: [],
          mapx: 0,
          mapy: 0,
          intro: { 이용시간: '상시 개방', 문의전화: '안내소 문의' },
          homepage: null,
        };
        setData(fallback);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      const fallback: PlaceDetailData = {
        contentId: id,
        contentTypeId: typeId || '12',
        title: '한옥 명소 상세',
        overview: '한국 전통의 아름다움을 간직한 명소입니다.',
        addr1: '전통 한옥 마을 일대',
        tel: null,
        images: [],
        mapx: 0,
        mapy: 0,
        intro: { 이용시간: '상시 개방', 문의전화: '안내소 문의' },
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
