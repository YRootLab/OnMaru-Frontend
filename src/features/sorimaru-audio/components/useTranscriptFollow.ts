'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { shouldFollowTranscript } from './playerTranscriptModel';

interface UseTranscriptFollowOptions {
  activeLineId: number | undefined;
  onSeek: (timeSec: number) => void;
}

export function useTranscriptFollow({ activeLineId, onSeek }: UseTranscriptFollowOptions) {
  const activeLineRef = useRef<HTMLButtonElement | null>(null);
  const isUserScrollingRef = useRef(false);
  const scrollPauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousLineIdRef = useRef<number | undefined>(undefined);
  const reducedMotion = usePrefersReducedMotion();

  const centerActiveLine = useCallback((requestedSeek: boolean) => {
    const activeLineChanged = previousLineIdRef.current !== activeLineId;
    if (shouldFollowTranscript({
      isUserScrolling: isUserScrollingRef.current,
      activeLineChanged,
      requestedSeek,
    })) {
      activeLineRef.current?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'center',
      });
    }
    previousLineIdRef.current = activeLineId;
  }, [activeLineId, reducedMotion]);

  useEffect(() => {
    centerActiveLine(false);
  }, [centerActiveLine]);

  useEffect(() => () => {
    if (scrollPauseTimerRef.current) clearTimeout(scrollPauseTimerRef.current);
  }, []);

  const onTranscriptScroll = useCallback(() => {
    isUserScrollingRef.current = true;
    if (scrollPauseTimerRef.current) clearTimeout(scrollPauseTimerRef.current);
    scrollPauseTimerRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 1200);
  }, []);

  const requestSeek = useCallback((timeSec: number) => {
    onSeek(timeSec);
    centerActiveLine(true);
  }, [centerActiveLine, onSeek]);

  return { activeLineRef, onTranscriptScroll, requestSeek };
}
