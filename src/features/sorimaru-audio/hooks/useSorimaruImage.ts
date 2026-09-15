import { useState, useEffect } from 'react';
import type { SorimaruStoryItem } from '@/features/sorimaru-audio/types/sorimaru.types';

const FALLBACK_IMAGES = [
  '/images/hanok/hanok-main.png',
  '/images/hanok/hanok-exterior.png',
  '/images/hanok/hanok-interior.png',
  '/images/hanok/hanok-porch.png',
  '/images/hanok/giwa-detail.png',
];

export function getSorimaruFallbackImage(story: SorimaruStoryItem, index: number = 0): string {
  const seed = Array.from(`${story.stid}${story.title}`).reduce((sum, char) => sum + char.charCodeAt(0), index);
  return FALLBACK_IMAGES[seed % FALLBACK_IMAGES.length];
}

export function useSorimaruImage(story: SorimaruStoryItem, index: number = 0): string {
  const fallback = getSorimaruFallbackImage(story, index);
  const [imgSrc, setImgSrc] = useState<string>(story.imageUrl || fallback);

  useEffect(() => {
    // 이미 API에 이미지가 있으면 그대로 사용
    if (story.imageUrl) {
      setImgSrc(story.imageUrl);
      return;
    }

    let isMounted = true;
    
    // 이미지가 없는 경우 TourAPI를 통해 연관 이미지 조회
    fetch(`/api/sorimaru/image?keyword=${encodeURIComponent(story.title)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.imageUrl) {
          setImgSrc(data.imageUrl);
        }
      })
      .catch(() => {
        // 실패 시 fallback 유지
      });

    return () => {
      isMounted = false;
    };
  }, [story.title, story.imageUrl]);

  return imgSrc;
}
