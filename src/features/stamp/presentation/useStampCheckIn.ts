'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { isOnmaruApiError } from '@/lib/api/errors';
import { runHanokCheckIn } from '../application/checkInHanok';
import { resolveAwardStamps, stampErrorMessage } from '../domain/stampRules';
import type { StampErrorLike } from '../domain/models';
import { browserPositionProvider, GeolocationClientError } from '../infrastructure/browserGeolocation';
import { stampHttpRepository } from '../infrastructure/stampHttpRepository';
import { useStampSession } from './useStampSession';
import { useStampStore } from './useStampStore';
import { executeStampCheckIn } from './stampCheckInController';

function toStampError(error: unknown): StampErrorLike {
  if (isOnmaruApiError(error)) return error;
  if (error instanceof GeolocationClientError) return error;
  return { code: 'SERVICE_UNAVAILABLE', requestId: null };
}

export function useStampCheckIn() {
  const { isLoading: authLoading, isLoggedIn, loginWithKakao } = useAuth();
  const { refreshBook, refreshCatalog } = useStampSession({
    authLoading,
    loggedIn: isLoggedIn,
  });
  const [checkingIn, setCheckingIn] = useState(false);
  const [unavailablePlaceId, setUnavailablePlaceId] = useState<string | null>(null);

  const checkIn = useCallback(async (placeId: string) => {
    if (checkingIn || authLoading) return;
    setCheckingIn(true);
    try {
      if (isLoggedIn && !useStampStore.getState().catalog) {
        await refreshCatalog();
      }
      const outcome = await executeStampCheckIn({
        loggedIn: isLoggedIn,
        placeId,
        runCheckIn: (targetPlaceId) => runHanokCheckIn(targetPlaceId, {
          repository: stampHttpRepository,
          positionProvider: browserPositionProvider,
          createId: () => crypto.randomUUID(),
        }),
        recordSuccess: (targetPlaceId, summary) => (
          useStampStore.getState().recordSuccessfulCheckIn(targetPlaceId, summary)
        ),
        refreshBook,
        resolveAwards: (response) => {
          const catalog = useStampStore.getState().catalog;
          return catalog ? resolveAwardStamps(catalog, response.newAwards) : [];
        },
        enqueueAwards: (awards) => useStampStore.getState().enqueueAwards(awards),
      });

      if (outcome.kind === 'login-required') {
        toast.info('로그인 후 현장에서 방문 도장을 남길 수 있어요.');
        loginWithKakao();
      } else if (outcome.kind === 'duplicate') {
        toast.success('이미 이번 방문이 기록되었어요.');
      } else if (outcome.kind === 'awarded') {
        toast.success(`새로운 수결 ${outcome.awardCount}개를 획득했어요.`);
      } else {
        toast.success('방문이 수결첩에 기록되었어요.');
      }
    } catch (error) {
      const stampError = toStampError(error);
      if (stampError.code === 'NOT_FOUND') setUnavailablePlaceId(placeId);
      toast.error(stampErrorMessage(stampError));
    } finally {
      setCheckingIn(false);
    }
  }, [authLoading, checkingIn, isLoggedIn, loginWithKakao, refreshBook, refreshCatalog]);

  return {
    checkIn,
    checkingIn,
    isUnavailable: (placeId: string) => unavailablePlaceId === placeId,
  };
}
