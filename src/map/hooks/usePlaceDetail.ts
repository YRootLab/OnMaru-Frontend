import { useState, useEffect, useCallback } from 'react';
import type { PlaceDetailData } from '@/map/types';

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
        setError('장소 상세 정보를 불러오지 못했습니다.');
        setData(null);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setError('네트워크 연결이 원활하지 않습니다.');
      setData(null);
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
