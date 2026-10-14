import { useState, useCallback, useEffect } from 'react';
import { togglePlaceSave } from '../../application/useCases';

export interface UsePlaceSaveOptions {
  placeId: string;
  saveAvailable: boolean;
  initialSavedByMe: boolean | null;
}

export interface UsePlaceSaveResult {
  savedByMe: boolean | null;
  isSaving: boolean;
  toggle: () => void;
}

export function usePlaceSave({
  placeId,
  saveAvailable,
  initialSavedByMe,
}: UsePlaceSaveOptions): UsePlaceSaveResult {
  const [savedByMe, setSavedByMe] = useState<boolean | null>(initialSavedByMe);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isSaving) setSavedByMe(initialSavedByMe);
  }, [placeId, initialSavedByMe]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(() => {
    if (!saveAvailable || isSaving || savedByMe === null) return;

    const next = !savedByMe;
    setSavedByMe(next); // optimistic
    setIsSaving(true);

    togglePlaceSave(placeId, savedByMe)
      .catch(() => {
        setSavedByMe(savedByMe); // rollback
      })
      .finally(() => setIsSaving(false));
  }, [placeId, saveAvailable, savedByMe, isSaving]);

  return { savedByMe, isSaving, toggle };
}
