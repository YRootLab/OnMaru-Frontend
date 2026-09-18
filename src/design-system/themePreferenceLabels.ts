import type { ColorMode, ThemePreference } from './tokens';

const preferenceLabels: Record<ThemePreference, string> = {
  system: '자동',
  light: '라이트',
  dark: '다크',
};

const modeLabels: Record<ColorMode, string> = {
  light: '라이트',
  dark: '다크',
};

export function getThemePreferenceLabel(preference: ThemePreference): string {
  return preferenceLabels[preference];
}

export function getThemePreferenceSummary({
  preference,
  mode,
}: {
  preference: ThemePreference;
  mode: ColorMode;
}): string {
  if (preference === 'system') {
    return `낮/밤 자동 · 현재 ${modeLabels[mode]}`;
  }
  return preference === 'light' ? '항상 밝게 보기' : '항상 어둡게 보기';
}

export function getThemeTriggerLabel({
  preference,
  mode,
}: {
  preference: ThemePreference;
  mode: ColorMode;
}): string {
  if (preference === 'system') {
    return `화면 모드: 자동 · 현재 ${modeLabels[mode]}`;
  }
  return `화면 모드: ${preferenceLabels[preference]}`;
}
