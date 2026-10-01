'use client';

import { useSyncExternalStore } from 'react';

/**
 * Pure function to detect if the environment is an Apple device or Safari browser.
 * Safari on iOS/macOS has a known engine bug where WebM VP9 alpha channels are rendered as solid black.
 */
export function isAppleOrSafari(ua?: string, maxTouchPoints?: number): boolean {
  if (typeof window === 'undefined' && ua === undefined) {
    return false;
  }

  const userAgent = ua ?? (typeof window !== 'undefined' ? window.navigator.userAgent : '');
  const touchPoints = maxTouchPoints ?? (typeof window !== 'undefined' ? window.navigator.maxTouchPoints : 0);

  // iOS (iPhone, iPod, iPad)
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);

  // iPadOS reporting as MacIntel
  const isIPadOS = /Macintosh|MacIntel/.test(userAgent) && touchPoints > 1;

  // Safari (macOS / iOS Safari) excluding Chrome (CriOS), Edge (EdgiOS), Firefox (FxiOS), Android
  const isSafari =
    /Safari/i.test(userAgent) &&
    !/Chrome|CriOS|Edg|OPR|Android/i.test(userAgent);

  return isIOS || isIPadOS || isSafari;
}

const emptySubscribe = () => () => {};

/**
 * Hook to detect whether the user is on an Apple device (iOS / Safari).
 * SSR-safe with zero hydration mismatch via useSyncExternalStore.
 */
export function useIsAppleDevice(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => isAppleOrSafari(),
    () => false
  );
}
