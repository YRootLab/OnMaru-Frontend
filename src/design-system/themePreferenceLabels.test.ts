import { describe, expect, it } from 'vitest';
import {
  getThemePreferenceLabel,
  getThemePreferenceSummary,
  getThemeTriggerLabel,
} from './themePreferenceLabels';

describe('theme preference labels', () => {
  it('labels system preference as auto for users', () => {
    expect(getThemePreferenceLabel('system')).toBe('자동');
  });

  it('summarizes automatic mode with the currently applied mode', () => {
    expect(getThemePreferenceSummary({ preference: 'system', mode: 'light' })).toBe(
      '낮/밤 자동 · 현재 라이트',
    );
  });

  it('describes the header trigger for automatic dark mode', () => {
    expect(getThemeTriggerLabel({ preference: 'system', mode: 'dark' })).toBe(
      '화면 모드: 자동 · 현재 다크',
    );
  });
});
