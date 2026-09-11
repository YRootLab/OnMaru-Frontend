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

export function useHanokOdii(
  name?: string,
  lat?: number | null,
  lng?: number | null,
  isStay?: boolean
) {
  const [stories, setStories] = useState<OdiiStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 한옥 스테이(숙박 전용 시설)이거나 이름이 없으면 오디 문화재 도슨트 조회를 수행하지 않음
    if (isStay || !name) {
      setStories([]);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    async function fetchOdii() {
      setLoading(true);
      setError(null);

      try {
        // 1. 이름 정제 및 핵심 고유명사 키워드 추출
        // 예: '안동 하회마을 [유네스코 세계유산]' -> '안동 하회마을' -> 핵심: '하회마을' (키워드: '하회')
        const rawClean = (name || '')
          .replace(/\[.*?\]|\(.*?\)/g, '')
          .replace(/(안채|사랑채|행랑채|별채|일원|보존회)/g, '')
          .trim();

        // 광역/시/군 지역 접두어 목록
        const REGION_PREFIX_REGEX = /^(서울|경기|강원|충북|충남|전북|전남|경북|경남|제주|부산|대구|인천|광주|대전|울산|세종|안동|강릉|경주|전주|남원|공주|담양|구례|밀양|영주|봉화|함양|순천|나주|보성|영암)\s+/;
        
        let coreName = rawClean.replace(REGION_PREFIX_REGEX, '').trim();
        if (!coreName || coreName.length < 2) {
          coreName = rawClean;
        }

        // 관련도 검증에 사용할 핵심 검색어 (최소 2글자)
        const matchKeyword = coreName
          .replace(/(고택|종택|가옥|생가|마을|한옥|서원|향교|궁|터)$/g, '')
          .trim() || coreName;

        // 2. 1차 시도: 핵심 고유명사 기반 검색 (예: '선교장', '하회마을', '운조루', '임청각', '경복궁', '소쇄원')
        let res = await fetch(
          `/api/odii?type=stories&keyword=${encodeURIComponent(coreName)}&numOfRows=10`,
          { signal: controller.signal }
        );

        let json = await res.json();
        let items = json?.response?.body?.items?.item;
        let list = Array.isArray(items) ? items : items ? [items] : [];

        // 3. 만약 결과가 없고 coreName과 rawClean이 다르면 rawClean으로 2차 검색
        if (list.length === 0 && coreName !== rawClean) {
          res = await fetch(
            `/api/odii?type=stories&keyword=${encodeURIComponent(rawClean)}&numOfRows=10`,
            { signal: controller.signal }
          );
          json = await res.json();
          items = json?.response?.body?.items?.item;
          list = Array.isArray(items) ? items : items ? [items] : [];
        }

        // 4. 엄격한 관련도 검증 (Strict Relevance Filter):
        // 검색된 오디오 가이드 제목/설명에 해당 한옥의 핵심 키워드가 반드시 포함되어야 함.
        // 엉뚱한 도시 내 타 관광지(예: 공주한옥마을에 무령왕릉 오디오가 뜨는 현상 등)를 철저히 차단.
        const validKeyword = matchKeyword.length >= 2 ? matchKeyword : coreName;
        const filteredList = list.filter((it: any) => {
          if (!it || !it.audioUrl) return false;
          const aTitle = String(it.audioTitle || '');
          const sTitle = String(it.title || '');
          const script = String(it.script || '');

          // 건축물 핵심 키워드가 제목이나 스크립트에 분명히 존재하는지 검증
          return (
            aTitle.includes(validKeyword) ||
            sTitle.includes(validKeyword) ||
            aTitle.includes(coreName) ||
            sTitle.includes(coreName) ||
            script.includes(coreName)
          );
        });

        if (isMounted) {
          const parsedStories: OdiiStory[] = filteredList.map((it: any) => ({
            stid: Number(it.stid || it.stlid || Math.random()),
            stlid: Number(it.stlid || 0),
            title: String(it.title || name || ''),
            audioTitle: String(it.audioTitle || it.title || `${name} 해설`),
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
  }, [name, lat, lng, isStay]);

  return { stories, loading, error };
}
