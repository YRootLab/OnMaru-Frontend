import { useState, useEffect } from 'react';
import {
  screenHanokService,
  type ScreenHanokItem,
  type ScreenHanokMediaType,
} from '@/features/hanok-archive/services/screenHanok.service';
import { toast } from 'sonner';
import { hasAuthenticatedUser } from '@/features/auth/privateState';

export interface UseScreenHanokOptions {
  mediaType?: ScreenHanokMediaType;
  region?: string;
}






export function useKCultureThemes(options?: UseScreenHanokOptions) {
  const [items, setItems] = useState<ScreenHanokItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const isFirstLoad = items.length === 0;

  const mediaType = options?.mediaType;
  const region = options?.region;

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setIsError(false);


    screenHanokService
      .getScreenHanoks({ mediaType, region })
      .then((data) => {
        if (!ignore) {
          setItems(data);
        }
      })
      .catch(() => {
        if (!ignore) {
          setIsError(true);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [mediaType, region]);

  const toggleSave = async (placeId: string) => {
    if (!hasAuthenticatedUser()) {
      toast.info('로그인해주세요.');
      return;
    }

    const target = items.find((it) => it.placeId === placeId);
    if (!target) return;

    const previousSaved = target.savedByMe;

    setItems((prev) =>
      prev.map((it) => (it.placeId === placeId ? { ...it, savedByMe: !previousSaved } : it))
    );

    try {
      const nextSaved = await screenHanokService.toggleSavePlace(placeId, previousSaved);
      setItems((prev) =>
        prev.map((it) => (it.placeId === placeId ? { ...it, savedByMe: nextSaved } : it))
      );
    } catch {

      setItems((prev) =>
        prev.map((it) => (it.placeId === placeId ? { ...it, savedByMe: previousSaved } : it))
      );
    }
  };

  return { items, isLoading, isFirstLoad, isError, toggleSave };
}
