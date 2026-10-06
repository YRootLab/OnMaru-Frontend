/**
 * Shared crossfade utilities for Kakao CustomOverlay layer transitions.
 *
 * Only fires at renderMode boundaries (PLACE↔CLUSTER↔DISTRICT↔REGION).
 * Same-mode pan/refresh: no animation.
 * Zoom direction: in = scale(0.97→1), out = scale(1.03→1).
 * Degraded path (DOM budget exceeded): old layer removed immediately, new layer 80ms fade-in only.
 * Fallbacks: reduced-motion → instant swap; WAAPI unsupported → instant swap.
 *
 * All animation functions return Animation | null so callers can push them into
 * an activeAnimsRef and call cancelActiveAnimations() on the next boundary — this
 * prevents stale fade-in/fade-out animations from running across rapid zoom sequences.
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
 * Cancel all in-progress transition animations and clear the array.
 * Called at the start of each new mode boundary transition so stale
 * fade-in/fade-out animations from the previous zoom don't linger.
 * Cancelling a fade-out triggers oncancel → setMap(null) (immediate removal).
 * Cancelling a fade-in triggers oncancel → opacity snap to 1 (stays visible
 * until the next retire cycle removes it).
 */
export function cancelActiveAnimations(anims: Animation[]): void {
  anims.forEach((a) => {
    try { a.cancel(); } catch { /* already finished — safe to ignore */ }
  });
  anims.length = 0;
}

/**
 * Fade a visual wrapper element in. Returns the Animation so the caller can
 * track and cancel it on the next boundary. Returns null when no animation runs.
 */
export function fadeInEl(el: HTMLElement, dir: ZoomDir, degraded = false): Animation | null {
  if (!canCrossfade()) {
    el.style.opacity = '1';
    return null;
  }
  const dur = degraded ? DEGRADED_MS : CROSSFADE_MS;
  const from = scaleFrom(dir);
  const anim = el.animate(
    [
      { opacity: '0', transform: `scale(${from})` },
      { opacity: '1', transform: 'scale(1)' },
    ],
    { duration: dur, easing: 'ease-out', fill: 'forwards' },
  );
  // On cancel: snap to final state so the overlay remains visible
  // (it will be retired by the next boundary's retireOverlays call).
  anim.oncancel = () => {
    el.style.opacity = '1';
    el.style.transform = 'scale(1)';
  };
  return anim;
}

/**
 * Fade an element out, calling onDone when finished or cancelled.
 * Sets pointer-events:none so it can't be clicked during fade.
 * Returns the Animation for tracking.
 */
export function fadeOutEl(el: HTMLElement, onDone: () => void): Animation | null {
  el.style.pointerEvents = 'none';
  if (!canCrossfade()) {
    onDone();
    return null;
  }
  const anim = el.animate([{ opacity: '1' }, { opacity: '0' }], {
    duration: CROSSFADE_MS,
    easing: 'ease-in',
    fill: 'forwards',
  });
  anim.onfinish = onDone;
  anim.oncancel = onDone; // cancel also triggers removal — instant cleanup
  return anim;
}

/**
 * Retire a batch of overlay records with fade-out then setMap(null).
 * Returns the animations so callers can track and cancel them on the next boundary.
 */
export function retireOverlays(
  records: Array<{ overlay: { setMap: (m: null) => void }; el: HTMLElement }>,
): Animation[] {
  return records
    .map(({ overlay, el }) => fadeOutEl(el, () => overlay.setMap(null)))
    .filter((a): a is Animation => a !== null);
}
