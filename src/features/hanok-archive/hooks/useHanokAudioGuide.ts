import { useEffect, useState } from 'react';
import { sorimaruApiAdapter } from '@/features/sorimaru-audio/api/sorimaruApi';

export interface AudioGuideStory {
  storyId: string;
  title: string;
  audioTitle: string;
  durationSeconds: number;
  imageUrl: string | null;
  audioUrl?: string;
  script?: string;
}

export function useHanokAudioGuide(name?: string, _lat?: number | null, _lng?: number | null, isStay?: boolean) {
  const [stories, setStories] = useState<AudioGuideStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isStay || !name) {
      setStories([]);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    const rawClean = name.replace(/\[.*?\]|\(.*?\)/g, '').replace(/(안채|사랑채|행랑채|별채|일원|보존회)/g, '').trim();
    const coreName = rawClean.replace(/^(서울|경기|강원|충북|충남|전북|전남|경북|경남|제주|부산|대구|인천|광주|대전|울산|세종|안동|강릉|경주|전주|남원|공주|담양|구례|밀양|영주|봉화|함양|순천|나주|보성|영암)\s+/, '').trim() || rawClean;
    const keyword = coreName.replace(/(고택|종택|가옥|생가|마을|한옥|서원|향교|궁|터)$/g, '').trim() || coreName;
    void sorimaruApiAdapter.listStories({ language: 'ko-KR', limit: 20 })
      .then((page) => {
        if (!active) return;
        setStories(page.items
          .filter((story) => [story.title, story.audioTitle].some((value) => value.includes(keyword) || value.includes(coreName)))
          .map((story) => ({ storyId: story.storyId, title: story.title, audioTitle: story.audioTitle, durationSeconds: story.durationSeconds, imageUrl: story.imageUrl })));
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : '오디오 가이드 조회 실패');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [isStay, name]);

  return { stories, loading, error };
}

export const useHanokSorimaru = useHanokAudioGuide;
export type SorimaruStory = AudioGuideStory;
