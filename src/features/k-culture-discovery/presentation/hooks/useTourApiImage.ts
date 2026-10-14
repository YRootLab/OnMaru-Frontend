import { useState, useEffect } from 'react';

function extractContentId(placeId: string): string | null {
  if (!placeId.startsWith('p-tourapi-')) return null;
  const id = placeId.slice('p-tourapi-'.length);
  return /^\d+$/.test(id) ? id : null;
}

export function useTourApiImage(placeId: string, existingImage: string | null): string | null {
  const [imageUrl, setImageUrl] = useState<string | null>(existingImage);

  useEffect(() => {
    if (existingImage) {
      setImageUrl(existingImage);
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
