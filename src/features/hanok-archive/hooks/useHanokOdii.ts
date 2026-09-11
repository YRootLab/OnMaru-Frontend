import { useState, useEffect } from 'react';

export interface OdiiStory {
  stid: number;
  stlid: number;
  title: string;
  audioTitle: string;
  script: string;
  playTime: number; // in seconds
  audioUrl: string;
  imageUrl?: string;
}

export function useHanokOdii(name?: string, lat?: number | null, lng?: number | null) {
  const [stories, setStories] = useState<OdiiStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name && (!lat || !lng)) {
      setStories([]);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    async function fetchOdii() {
      setLoading(true);
      setError(null);

      try {
        // 1. 이름 기반 우선 검색 (예: '경복궁', '선교장', '운조루', '하회마을' 등)
        // 불필요한 수식어('안동 하회마을 [유네스코 세계유산]' -> '하회마을') 정제
        const cleanName = (name || '')
          .replace(/\[.*?\]|\(.*?\)/g, '')
          .replace(/(안채|사랑채|행랑채|별채|일원|보존회)/g, '')
          .trim()
          .split(' ')[0] || name || '';

        let res = await fetch(
          `/api/odii?type=stories&keyword=${encodeURIComponent(cleanName)}&numOfRows=5`,
          { signal: controller.signal }
        );

        let json = await res.json();
        let items = json?.response?.body?.items?.item;
        let list = Array.isArray(items) ? items : items ? [items] : [];

        // 2. 검색 결과가 없고 좌표가 있으면 반경 1.5km 위치 기반 검색 시도
        if (list.length === 0 && Number.isFinite(lat) && Number.isFinite(lng)) {
          res = await fetch(
            `/api/odii?type=nearby&xCoord=${lng}&yCoord=${lat}&radius=1500&numOfRows=5`,
            { signal: controller.signal }
          );
          json = await res.json();
          items = json?.response?.body?.items?.item;
          list = Array.isArray(items) ? items : items ? [items] : [];
        }

        if (isMounted) {
          const parsedStories: OdiiStory[] = list
            .filter((it: any) => it && it.audioUrl)
            .map((it: any) => ({
              stid: Number(it.stid || it.stlid || Math.random()),
              stlid: Number(it.stlid || 0),
              title: String(it.title || name || ''),
              audioTitle: String(it.audioTitle || it.title || '전통 공간 오디오 가이드'),
              script: String(it.script || '').trim(),
              playTime: Number(it.playTime || 0),
              audioUrl: String(it.audioUrl || '').replace(/^http:\/\//i, 'https://'),
              imageUrl: it.imageUrl ? String(it.imageUrl).replace(/^http:\/\//i, 'https://') : undefined,
            }));

          setStories(parsedStories);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && isMounted) {
          setError(err.message || '오디오 가이드 조회 실패');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchOdii();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [name, lat, lng]);

  return { stories, loading, error };
}
