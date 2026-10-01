import { describe, it, expect } from 'vitest';
import { isAppleOrSafari } from './useIsAppleDevice';

describe('isAppleOrSafari', () => {
  it('detects iPhone UserAgent', () => {
    const iphoneUa = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';
    expect(isAppleOrSafari(iphoneUa)).toBe(true);
  });

  it('detects iPad UserAgent', () => {
    const ipadUa = 'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';
    expect(isAppleOrSafari(ipadUa)).toBe(true);
  });

  it('detects iPadOS with desktop Mac UA and touch points', () => {
    const macUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15';
    expect(isAppleOrSafari(macUa, 5)).toBe(true);
  });

  it('detects macOS Safari', () => {
    const macSafariUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15';
    expect(isAppleOrSafari(macSafariUa, 0)).toBe(true);
  });

  it('returns false for Windows Chrome', () => {
    const winChromeUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    expect(isAppleOrSafari(winChromeUa, 0)).toBe(false);
  });

  it('returns false for Android Chrome', () => {
    const androidUa = 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36';
    expect(isAppleOrSafari(androidUa, 5)).toBe(false);
  });
});
