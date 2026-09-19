import { useState, useEffect } from 'react';
import {
  screenHanokService,
  type ScreenHanokItem,
  type ScreenHanokMediaType,
} from '@/features/hanok-archive/services/screenHanok.service';

export interface UseScreenHanokOptions {
  mediaType?: ScreenHanokMediaType;
  region?: string;
}

/**
 * ## useKCultureThemes (useScreenHanok)
 * Issue #103: 스크린 속 한옥(K-콘텐츠 연계) 전용 리액트 훅.
 * 컴포넌트는 이 훅의 { items, isLoading, isError, toggleSave }만 받아 순수 UI로 렌더링한다.
 */
export function useKCultureThemes(options?: UseScreenHanokOptions) {
  const [items, setItems] = useState<ScreenHanokItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

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
    const target = items.find((it) => it.placeId === placeId);
    if (!target) return;

    const previousSaved = target.savedByMe;
    // 낙관적 업데이트 (Optimistic UI)
    setItems((prev) =>
      prev.map((it) => (it.placeId === placeId ? { ...it, savedByMe: !previousSaved } : it))
    );

    try {
      const nextSaved = await screenHanokService.toggleSavePlace(placeId, previousSaved);
      setItems((prev) =>
        prev.map((it) => (it.placeId === placeId ? { ...it, savedByMe: nextSaved } : it))
      );
    } catch {
      // 실패 시 원상복구
      setItems((prev) =>
        prev.map((it) => (it.placeId === placeId ? { ...it, savedByMe: previousSaved } : it))
      );
    }
  };

  return { items, isLoading, isError, toggleSave };
}
