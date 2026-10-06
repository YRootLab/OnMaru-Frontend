/**
 * Shared crossfade utilities for Kakao CustomOverlay layer transitions.
 *
 * Only fires at renderMode boundaries (PLACE↔CLUSTER↔DISTRICT↔REGION).
 * Same-mode pan/refresh: no animation.
 * Zoom direction: in = scale(0.97→1), out = scale(1.03→1).
 * Degraded path (DOM budget exceeded): old layer removed immediately, new layer 80ms fade-in only.
 * Fallbacks: reduced-motion → instant swap; WAAPI unsupported → instant swap.
 */

export const CROSSFADE_MS = 140;
const DEGRADED_MS = 90;

let _reducedMotion: boolean | null = null;
function reducedMotion(): boolean {
  if (_reducedMotion === null) {
    _reducedMotion =
      typeof window !== 'undefined'
      && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  }
  return _reducedMotion;
}

function waapiSupported(): boolean {
  return (
    typeof document !== 'undefined'
    && typeof document.createElement('div').animate === 'function'
  );
}

export function canCrossfade(): boolean {
  return !reducedMotion() && waapiSupported();
}

export type ZoomDir = 'in' | 'out' | 'none';

export function scaleFrom(dir: ZoomDir): number {
  if (dir === 'in') return 0.97;
  if (dir === 'out') return 1.03;
  return 0.99;
}

/**
 * Fade a visual wrapper element in. Safe to call even when WAAPI is unavailable.
 * `degraded` = DOM budget was exceeded so we skip the crossfade and just fade in.
 */
export function fadeInEl(el: HTMLElement, dir: ZoomDir, degraded = false): void {
  if (!canCrossfade()) {
    el.style.opacity = '1';
    return;
  }
  const dur = degraded ? DEGRADED_MS : CROSSFADE_MS;
  const from = scaleFrom(dir);
  el.animate(
    [
      { opacity: '0', transform: `scale(${from})` },
      { opacity: '1', transform: 'scale(1)' },
    ],
    { duration: dur, easing: 'ease-out', fill: 'forwards' },
  );
}

/**
 * Fade an element out, calling onDone when finished (or immediately if no animation).
 * Sets pointer-events:none so it can't be clicked during fade.
 */
export function fadeOutEl(el: HTMLElement, onDone: () => void): void {
  el.style.pointerEvents = 'none';
  if (!canCrossfade()) {
    onDone();
    return;
  }
  const anim = el.animate([{ opacity: '1' }, { opacity: '0' }], {
    duration: CROSSFADE_MS,
    easing: 'ease-in',
    fill: 'forwards',
  });
  anim.onfinish = onDone;
  anim.oncancel = onDone;
}

/**
 * Retire a batch of overlay records with fade-out then setMap(null).
 * Returns true if animated (false = instant, budget guard already cleared them).
 */
export function retireOverlays(
  records: Array<{ overlay: { setMap: (m: null) => void }; el: HTMLElement }>,
): void {
  records.forEach(({ overlay, el }) => {
    fadeOutEl(el, () => overlay.setMap(null));
  });
}
