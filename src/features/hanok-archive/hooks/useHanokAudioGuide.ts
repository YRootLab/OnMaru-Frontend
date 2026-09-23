import { useState, useEffect } from 'react';
import { sorimaruApiAdapter } from '@/features/sorimaru-audio/api/sorimaruApi';

export interface AudioGuideStory {
  stid: number;
  stlid: number;
  title: string;
  audioTitle: string;
  script: string;
  playTime: number;
  audioUrl: string;
  imageUrl?: string;
}





export function useHanokAudioGuide(
  name?: string,
  lat?: number | null,
  lng?: number | null,
  isStay?: boolean
) {
  const [stories, setStories] = useState<AudioGuideStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isStay || !name) {
      setTimeout(() => setStories([]), 0);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    async function fetchAudioGuide() {
      setLoading(true);
      setError(null);

      try {


        const rawClean = (name || '')
          .replace(/\[.*?\]|\(.*?\)/g, '')
          .replace(/(안채|사랑채|행랑채|별채|일원|보존회)/g, '')
          .trim();


        const REGION_PREFIX_REGEX = /^(서울|경기|강원|충북|충남|전북|전남|경북|경남|제주|부산|대구|인천|광주|대전|울산|세종|안동|강릉|경주|전주|남원|공주|담양|구례|밀양|영주|봉화|함양|순천|나주|보성|영암)\s+/;

        let coreName = rawClean.replace(REGION_PREFIX_REGEX, '').trim();
        if (!coreName || coreName.length < 2) {
          coreName = rawClean;
        }


        const matchKeyword = coreName
          .replace(/(고택|종택|가옥|생가|마을|한옥|서원|향교|궁|터)$/g, '')
          .trim() || coreName;


        let list = await sorimaruApiAdapter.getStoryList(undefined, coreName);


        if (list.length === 0 && coreName !== rawClean) {
          list = await sorimaruApiAdapter.getStoryList(undefined, rawClean);
        }



        const validKeyword = matchKeyword.length >= 2 ? matchKeyword : coreName;
        const filteredList = list.filter((it) => {
          if (!it || !it.audioUrl) return false;
          const aTitle = String(it.audioTitle || '');
          const sTitle = String(it.title || '');
          const script = String(it.script || '');

          return (
            aTitle.includes(validKeyword) ||
            sTitle.includes(validKeyword) ||
            aTitle.includes(coreName) ||
            sTitle.includes(coreName) ||
            script.includes(coreName)
          );
        });

        if (isMounted) {
          const parsedStories: AudioGuideStory[] = filteredList.map((it) => ({
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
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError' && isMounted) {
          setError(err.message || '오디오 가이드 조회 실패');
        } else if (isMounted && !(err instanceof Error)) {
          setError('오디오 가이드 조회 실패');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAudioGuide();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [name, lat, lng, isStay]);

  return { stories, loading, error };
}


export const useHanokSorimaru = useHanokAudioGuide;
export type SorimaruStory = AudioGuideStory;
