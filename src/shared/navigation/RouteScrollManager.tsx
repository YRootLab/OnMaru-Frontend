'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const STORAGE_PREFIX = 'onmaru:scroll:';
const SCROLL_SETTLE_MS = 150;
const MAX_RESTORE_FRAMES = 120;

function managesWindowScroll(pathname: string): boolean {
  return !pathname.startsWith('/admin')
    && !pathname.startsWith('/auth')
    && !pathname.startsWith('/map');
}

function storageKey(pathname: string): string {
  return `${STORAGE_PREFIX}${pathname}`;
}

function readSavedPosition(key: string): number {
  try {
    const savedValue = window.sessionStorage.getItem(key);
    return savedValue === null ? 0 : Number(savedValue);
  } catch {
    return 0;
  }
}

function writeSavedPosition(key: string, position: number): void {
  try {
    window.sessionStorage.setItem(key, String(position));
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

export default function RouteScrollManager() {
  const pathname = usePathname();

  useEffect(() => {
    if (!managesWindowScroll(pathname)) return undefined;

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    const key = storageKey(pathname);
    const savedPosition = readSavedPosition(key);
    let frame = 0;
    let attempts = 0;
    let settleTimer: number | undefined;

    const savePosition = () => {
      writeSavedPosition(key, window.scrollY);
    };

    const scheduleSave = () => {
      if (settleTimer !== undefined) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(savePosition, SCROLL_SETTLE_MS);
    };

    const restorePosition = () => {
      if (window.location.hash) return;

      if (!Number.isFinite(savedPosition) || savedPosition <= 0) {
        window.scrollTo({ top: 0, behavior: 'auto' });
        return;
      }

      attempts += 1;
      const pageCanReachPosition = document.documentElement.scrollHeight >= savedPosition + window.innerHeight;
      if (pageCanReachPosition || attempts >= MAX_RESTORE_FRAMES) {
        window.scrollTo({ top: savedPosition, behavior: 'auto' });
        return;
      }
      frame = window.requestAnimationFrame(restorePosition);
    };

    frame = window.requestAnimationFrame(restorePosition);
    window.addEventListener('scroll', scheduleSave, { passive: true });
    window.addEventListener('scrollend', savePosition);

    return () => {
      savePosition();
      window.cancelAnimationFrame(frame);
      if (settleTimer !== undefined) window.clearTimeout(settleTimer);
      window.removeEventListener('scroll', scheduleSave);
      window.removeEventListener('scrollend', savePosition);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, [pathname]);

  return null;
}
