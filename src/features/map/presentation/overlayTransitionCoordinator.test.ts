// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cancelActiveAnimations, fadeInEl, fadeOutEl, retireOverlays, scaleFrom, CROSSFADE_MS } from './overlayTransitionCoordinator';

// Each call produces an independent animation object with controllable onfinish/oncancel.
function makeAnimObj() {
  let onfinish: (() => void) | null = null;
  let oncancel: (() => void) | null = null;
  return {
    get onfinish() { return onfinish; },
    set onfinish(fn) { onfinish = fn; },
    get oncancel() { return oncancel; },
    set oncancel(fn) { oncancel = fn; },
    finish() { onfinish?.(); },
    cancel() { oncancel?.(); },
  };
}

function makeEl() {
  const animObjs: ReturnType<typeof makeAnimObj>[] = [];
  const keyframeLog: { kf: Keyframe[]; opts: KeyframeAnimationOptions }[] = [];
  const animateFn = vi.fn((kf: Keyframe[], opts: KeyframeAnimationOptions) => {
    const obj = makeAnimObj();
    animObjs.push(obj);
    keyframeLog.push({ kf, opts });
    return obj;
  });
  const style: Record<string, string> = {};
  const el = {
    get style() { return style; },
    animate: animateFn,
    _animObjs: animObjs,
    _keyframes: keyframeLog,
  } as unknown as HTMLElement & {
    _animObjs: ReturnType<typeof makeAnimObj>[];
    _keyframes: typeof keyframeLog;
  };
  return el;
}

// Polyfill WAAPI on HTMLElement.prototype so canCrossfade() returns true in jsdom
let _origAnimate: typeof HTMLElement.prototype.animate;
beforeEach(() => {
  _origAnimate = HTMLElement.prototype.animate;
  // stub — the real calls go through makeEl()'s per-instance mock
  HTMLElement.prototype.animate = vi.fn(() => ({ onfinish: null, oncancel: null })) as any;
});
afterEach(() => {
  HTMLElement.prototype.animate = _origAnimate;
});

describe('scaleFrom', () => {
  it('returns 0.97 for zoom-in', () => expect(scaleFrom('in')).toBe(0.97));
  it('returns 1.03 for zoom-out', () => expect(scaleFrom('out')).toBe(1.03));
  it('returns 0.99 for none', () => expect(scaleFrom('none')).toBe(0.99));
});

describe('fadeInEl', () => {
  it('calls animate with opacity 0→1 and correct scale for zoom-in', () => {
    const el = makeEl();
    fadeInEl(el, 'in');
    expect(el.animate).toHaveBeenCalledOnce();
    const { kf } = (el as any)._keyframes[0];
    expect(kf[0].opacity).toBe('0');
    expect(String(kf[0].transform)).toContain('0.97');
    expect(kf[1].opacity).toBe('1');
  });

  it('uses shorter duration when degraded=true', () => {
    const el = makeEl();
    fadeInEl(el, 'none', true);
    const { opts } = (el as any)._keyframes[0];
    expect((opts as any).duration).toBeLessThan(CROSSFADE_MS);
  });

  it('sets opacity directly when animate is not a function', () => {
    const el = makeEl();
    (el as any).animate = undefined;
    // canCrossfade checks HTMLElement.prototype.animate which is stubbed,
    // but per-instance animate is undefined — skip by overriding prototype temporarily
    const saved = HTMLElement.prototype.animate;
    delete (HTMLElement.prototype as any).animate;
    fadeInEl(el, 'in');
    (HTMLElement.prototype as any).animate = saved;
    expect((el as any).style.opacity).toBe('1');
  });
});

describe('fadeOutEl', () => {
  it('sets pointer-events:none and defers onDone until animation finishes', () => {
    const el = makeEl();
    const done = vi.fn();
    fadeOutEl(el, done);
    expect((el as any).style.pointerEvents).toBe('none');
    expect(done).not.toHaveBeenCalled();
    // Trigger the animation's onfinish
    (el as any)._animObjs[0].finish();
    expect(done).toHaveBeenCalledOnce();
  });

  it('calls onDone immediately when animate is absent', () => {
    const el = makeEl();
    const saved = HTMLElement.prototype.animate;
    delete (HTMLElement.prototype as any).animate;
    const done = vi.fn();
    fadeOutEl(el, done);
    (HTMLElement.prototype as any).animate = saved;
    expect(done).toHaveBeenCalledOnce();
  });
});

describe('fadeInEl return value', () => {
  it('returns an Animation object when WAAPI available', () => {
    const el = makeEl();
    const anim = fadeInEl(el, 'in');
    expect(anim).not.toBeNull();
  });

  it('returns null when WAAPI absent', () => {
    const saved = HTMLElement.prototype.animate;
    delete (HTMLElement.prototype as any).animate;
    const el = makeEl();
    (el as any).animate = undefined;
    const anim = fadeInEl(el, 'in');
    (HTMLElement.prototype as any).animate = saved;
    expect(anim).toBeNull();
  });

  it('oncancel snaps element to full opacity', () => {
    const el = makeEl();
    const anim = fadeInEl(el, 'out')!;
    (anim as any).cancel?.();
    (el as any)._animObjs[0].cancel();
    expect((el as any).style.opacity).toBe('1');
  });
});

describe('retireOverlays', () => {
  it('defers setMap(null) until animation completes', () => {
    const el = makeEl();
    const setMap = vi.fn();
    const anims = retireOverlays([{ overlay: { setMap }, el }]);
    expect(anims).toHaveLength(1);
    expect(setMap).not.toHaveBeenCalled();
    (el as any)._animObjs[0].finish();
    expect(setMap).toHaveBeenCalledWith(null);
  });

  it('handles two records independently — each waits for its own animation', () => {
    const r0 = { overlay: { setMap: vi.fn() }, el: makeEl() };
    const r1 = { overlay: { setMap: vi.fn() }, el: makeEl() };
    const anims = retireOverlays([r0, r1]);
    expect(anims).toHaveLength(2);

    expect(r0.overlay.setMap).not.toHaveBeenCalled();
    expect(r1.overlay.setMap).not.toHaveBeenCalled();

    (r0.el as any)._animObjs[0].finish();
    expect(r0.overlay.setMap).toHaveBeenCalledWith(null);
    expect(r1.overlay.setMap).not.toHaveBeenCalled();

    (r1.el as any)._animObjs[0].finish();
    expect(r1.overlay.setMap).toHaveBeenCalledWith(null);
  });
});

describe('cancelActiveAnimations', () => {
  it('cancels all animations and clears the array', () => {
    const el0 = makeEl();
    const el1 = makeEl();
    const setMap0 = vi.fn();
    const setMap1 = vi.fn();
    // fade-out animations: oncancel → setMap(null)
    const anims = retireOverlays([
      { overlay: { setMap: setMap0 }, el: el0 },
      { overlay: { setMap: setMap1 }, el: el1 },
    ]);

    // Before cancellation, setMap not called
    expect(setMap0).not.toHaveBeenCalled();

    cancelActiveAnimations(anims);

    // cancel() fires oncancel → onDone → setMap(null) immediately
    expect(setMap0).toHaveBeenCalledWith(null);
    expect(setMap1).toHaveBeenCalledWith(null);
    expect(anims).toHaveLength(0); // array cleared
  });

  it('is safe to call on an empty array', () => {
    expect(() => cancelActiveAnimations([])).not.toThrow();
  });
});
