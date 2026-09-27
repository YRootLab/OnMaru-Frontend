import { useState, useEffect } from 'react';
import type { SorimaruStorySummary } from '@/features/sorimaru-audio/domain/sorimaruStory';

const FALLBACK_IMAGES = [
  '/images/hanok/hanok-main.png',
  '/images/hanok/hanok-exterior.png',
  '/images/hanok/hanok-interior.png',
  '/images/hanok/hanok-porch.png',
  '/images/hanok/giwa-detail.png',
];

export function getSorimaruFallbackImage(story: Pick<SorimaruStorySummary, 'storyId' | 'title'> | null, index: number = 0): string {
  const seed = Array.from(`${story?.storyId ?? ''}${story?.title ?? ''}`).reduce((sum, char) => sum + char.charCodeAt(0), index);
  return FALLBACK_IMAGES[seed % FALLBACK_IMAGES.length];
}

export function useSorimaruImage(story: SorimaruStorySummary | null, index: number = 0): string {
  const fallback = getSorimaruFallbackImage(story, index);
  const [imgSrc, setImgSrc] = useState<string>(story?.imageUrl || fallback);

  useEffect(() => {

    if (!story) {
      setImgSrc(fallback);
      return;
    }
    if (story.imageUrl) {
      setImgSrc(story.imageUrl);
      return;
    }

    let isMounted = true;


    fetch(`/api/sorimaru/image?keyword=${encodeURIComponent(story.title)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.imageUrl) {
          setImgSrc(data.imageUrl);
        }
      })
      .catch(() => {

      });

    return () => {
      isMounted = false;
    };
  }, [fallback, story]);

  return imgSrc;
}
