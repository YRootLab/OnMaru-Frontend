import { useState, useEffect } from 'react';
import type { PlaceImage } from '../../domain/types';

function extractContentId(placeId: string): string | null {
  if (!placeId.startsWith('p-tourapi-')) return null;
  const id = placeId.slice('p-tourapi-'.length);
  return /^\d+$/.test(id) ? id : null;
}

function resolveImageUrl(image: string | PlaceImage | null | undefined): string | null {
  if (!image) return null;
  const rawUrl = typeof image === 'object' && 'url' in image ? image.url : (typeof image === 'string' ? image : null);
  return rawUrl?.replace(/^http:\/\//, 'https://') ?? null;
}

export function useTourApiImage(
  placeId: string,
  existingImage: string | PlaceImage | null | undefined,
): string | null {
  const normalizedInitial = resolveImageUrl(existingImage);
  const [imageUrl, setImageUrl] = useState<string | null>(normalizedInitial);

  useEffect(() => {
    const normalized = resolveImageUrl(existingImage);
    setImageUrl(normalized);
    if (normalized) {
      return;
    }
    const contentId = extractContentId(placeId);
    if (!contentId) return;

    let cancelled = false;
    fetch(`/api/discovery/place-image?contentId=${encodeURIComponent(contentId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.imageUrl) setImageUrl(d.imageUrl);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [placeId, existingImage]);

  return imageUrl;
}
