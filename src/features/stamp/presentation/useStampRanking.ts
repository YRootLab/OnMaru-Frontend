'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { stampHttpRepository } from '../infrastructure/stampHttpRepository';
import {
  createStampRankingController,
  type StampRankingState,
} from './stampRankingController';

interface UseStampRankingOptions {
  enabled: boolean;
  loggedIn: boolean;
}

export function useStampRanking({ enabled, loggedIn }: UseStampRankingOptions) {
  const controllerRef = useRef<ReturnType<typeof createStampRankingController> | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = createStampRankingController(stampHttpRepository);
  }
  const controller = controllerRef.current;
  const [state, setState] = useState<StampRankingState>(controller.getState());

  useEffect(() => controller.subscribe(setState), [controller]);

  useEffect(() => {
    if (enabled) void controller.load(loggedIn);
  }, [controller, enabled, loggedIn]);

  useEffect(() => {
    if (state.retryAfterSeconds <= 0) return;
    const timer = window.setInterval(() => controller.tickRetry(), 1_000);
    return () => window.clearInterval(timer);
  }, [controller, state.retryAfterSeconds]);

  const reload = useCallback(() => controller.load(loggedIn), [controller, loggedIn]);
  const join = useCallback(() => controller.update(true), [controller]);
  const withdraw = useCallback(() => controller.update(false), [controller]);

  return { ...state, reload, join, withdraw };
}
