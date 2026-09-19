'use client';

// ============================================================
// 온마루 (On-Maru) — Emotion CSS Theme Provider
// React + Emotion · ThemeProvider · useTheme hook
// ============================================================

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { ThemeProvider as EmotionThemeProvider, Global, css } from '@emotion/react'
import {
  lightTheme,
  darkTheme,
  type ColorMode,
  type ThemePreference,
  type OnmaruTheme,
 fontSize, } from './tokens';
import { resolveTimeAwareSystemMode } from './timeTheme';

const STORAGE_KEY = 'onmaru-color-mode'


// ─────────────────────────────────────────
// 1. THEME CONTEXT
// ─────────────────────────────────────────

interface OnmaruThemeContextValue {
  theme:      OnmaruTheme
  /** 실제로 적용된 라이트/다크 — 'system' 선택 시 사용자 로컬 시간 기준으로 이미 풀려 있다. */
  mode:       ColorMode
  /** 사용자가 고른 값. 'system'이면 사용자 로컬 시간대에 맞춰 라이트/다크를 고른다. */
  preference: ThemePreference
  toggleMode: () => void
  setMode:    (preference: ThemePreference) => void
}

const OnmaruThemeContext = createContext<OnmaruThemeContextValue | null>(null)


// ─────────────────────────────────────────
// 2. GLOBAL STYLES
// ─────────────────────────────────────────

const createGlobalStyles = (theme: OnmaruTheme) => css`
  /* 폰트 로드는 globals.css의 Spoqa @import 한 줄이 전부다. 여기엔 두지 않는다. */

  /* ── CSS Reset + Base */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: ${fontSize.base};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  body {
    font-family:      ${theme.typography.fontFamily.sans};
    font-size:        ${theme.typography.fontSize.base};
    font-weight:      ${theme.typography.fontWeight.regular};
    line-height:      ${theme.typography.lineHeight.normal};
    color:            ${theme.colors.text.primary};
    background-color: ${theme.colors.bg.app};
    transition:
      background-color 0.30s ease,
      color            0.30s ease;
  }

  button, input, textarea, select, optgroup {
    font-family: inherit;
  }

  /* ── CSS Custom Properties (CSS Variables로도 접근 가능하도록) */
  :root {
    /* Background */
    --color-bg-app:      ${theme.colors.bg.app};
    --color-bg-surface:  ${theme.colors.bg.surface};
    --color-bg-card:     ${theme.colors.bg.card};
    --color-bg-elevated: ${theme.colors.bg.elevated};

    /* Border */
    --color-border-subtle:  ${theme.colors.border.subtle};
    --color-border-default: ${theme.colors.border.default};

    /* Text */
    --color-text-primary:   ${theme.colors.text.primary};
    --color-text-secondary: ${theme.colors.text.secondary};
    --color-text-muted:     ${theme.colors.text.muted};

    /* Action — 단청 주홍 */
    --color-action-primary:         ${theme.colors.action.primary};
    --color-action-primary-hover:   ${theme.colors.action.primaryHover};
    --color-action-primary-pressed: ${theme.colors.action.primaryPressed};
    --color-action-primary-bg:      ${theme.colors.action.primaryBg};
    --color-action-primary-subtle:  ${theme.colors.action.primarySubtle};

    /* Nav — 대청 청록 */
    --color-nav-primary:         ${theme.colors.nav.primary};
    --color-nav-primary-hover:   ${theme.colors.nav.primaryHover};
    --color-nav-primary-pressed: ${theme.colors.nav.primaryPressed};
    --color-nav-primary-bg:      ${theme.colors.nav.primaryBg};

    /* Badge — 황금 기와 */
    --color-badge-star:       ${theme.colors.badge.star};
    --color-badge-star-text:  ${theme.colors.badge.starText};
    --color-badge-star-bg:    ${theme.colors.badge.starBg};

    /* Docent — 연지 장미 */
    --color-docent-primary:        ${theme.colors.docent.primary};
    --color-docent-primary-hover:  ${theme.colors.docent.primaryHover};
    --color-docent-primary-bg:     ${theme.colors.docent.primaryBg};

    /* Info — 청화 코발트 */
    --color-info-primary:        ${theme.colors.info.primary};
    --color-info-primary-hover:  ${theme.colors.info.primaryHover};
    --color-info-primary-bg:     ${theme.colors.info.primaryBg};

    /* Metaball */
    --color-metaball-core:    ${theme.colors.metaball.core};
    --color-metaball-spread1: ${theme.colors.metaball.spread1};
    --color-metaball-spread2: ${theme.colors.metaball.spread2};
    --color-metaball-accent1: ${theme.colors.metaball.accent1};
    --color-metaball-accent2: ${theme.colors.metaball.accent2};

    /* Layout (Responsive Variables) */
    --layout-max-width: ${theme.layout.maxWidth};
    --layout-margin: ${theme.layout.margin.sm};
    --layout-padding: ${theme.layout.padding.sm};
    --layout-gutter: ${theme.layout.gutter.sm};
    --layout-columns: ${theme.layout.columns.sm};

    @media (min-width: ${theme.breakpoints.sm}) {
      --layout-margin: ${theme.layout.margin.md};
      --layout-padding: ${theme.layout.padding.md};
      --layout-gutter: ${theme.layout.gutter.md};
      --layout-columns: ${theme.layout.columns.md};
    }

    @media (min-width: ${theme.breakpoints.lg}) {
      --layout-margin: ${theme.layout.margin.lg};
      --layout-padding: ${theme.layout.padding.lg};
      --layout-gutter: ${theme.layout.gutter.lg};
      --layout-columns: ${theme.layout.columns.lg};
    }
  }

  /* ── Typography base
     클수록 가볍게. 큰 글자는 크기만으로 이미 눈에 띄므로 굵기까지 얹으면 뭉친다.
     반대로 작은 제목은 굵기가 없으면 본문에 묻힌다. */
  h1, h2, h3, h4, h5, h6 {
    font-family:  ${theme.typography.fontFamily.sans};
    line-height:  ${theme.typography.lineHeight.tight};
    color:        ${theme.colors.text.primary};
  }

  h1, h2 {
    font-weight:    ${theme.typography.fontWeight.light};
    letter-spacing: -0.02em;
  }

  h3, h4 {
    font-weight:    ${theme.typography.fontWeight.regular};
    letter-spacing: -0.015em;
  }

  h5, h6 {
    font-weight: ${theme.typography.fontWeight.medium};
  }

  a {
    color:           ${theme.colors.nav.primary};
    text-decoration: none;
    transition:      ${theme.transition.fast};

    &:hover {
      color: ${theme.colors.nav.primaryHover};
    }
  }

  code, pre, kbd {
    font-family: ${theme.typography.fontFamily.sans};
    font-size:   0.875em;
  }

  /* ── Scrollbar (Webkit) */
  ::-webkit-scrollbar        { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track  { background: transparent; }
  ::-webkit-scrollbar-thumb  {
    background:    ${theme.colors.border.default};
    border-radius: ${theme.borderRadius.full};
  }
  ::-webkit-scrollbar-thumb:hover {
    background: ${theme.colors.neutral.subtle};
  }

  /* ── Focus ring */
  :focus-visible {
    outline:        2px solid ${theme.colors.action.primary};
    outline-offset: 2px;
    border-radius:  ${theme.borderRadius.sm};
  }

  /* ── Selection */
  ::selection {
    background-color: ${theme.colors.action.primaryBg};
    color:            ${theme.colors.action.primaryPressed};
  }
`


// ─────────────────────────────────────────
// 3. THEME PROVIDER COMPONENT
// ─────────────────────────────────────────

interface OnmaruThemeProviderProps {
  children:     ReactNode
  defaultMode?: ThemePreference
}

function readStoredPreference(fallback: ThemePreference): ThemePreference {
  if (typeof window === 'undefined') return fallback
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  return fallback
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function localHour(): number {
  if (typeof window === 'undefined') return 12
  return new Date().getHours()
}

export function OnmaruThemeProvider({
  children,
  defaultMode = 'system',
}: OnmaruThemeProviderProps) {

  // 사용자가 고른 값('system' 포함) — 실제 렌더에 쓰는 mode는 아래에서 이 값을 풀어낸다.
  // 서버와 첫 클라이언트 렌더는 같은 값으로 시작해야 한다. 저장값과 브라우저
  // 환경은 hydration이 끝난 다음 프레임에 반영한다.
  const [preference, setPreferenceState] = useState<ThemePreference>(defaultMode)
  const [isSystemDark, setIsSystemDark] = useState(false)
  const [hour, setHour] = useState(12)
  const hasResolvedClientTheme = useRef(false)

  // beforeInteractive 스크립트가 실제 data-theme를 먼저 적용하므로 화면 깜빡임은
  // 막고, React 상태만 hydration 뒤에 안전하게 동기화한다.
  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      hasResolvedClientTheme.current = true
      setPreferenceState(readStoredPreference(defaultMode))
      setIsSystemDark(systemPrefersDark())
      setHour(localHour())
    })
    return () => window.cancelAnimationFrame(frameId)
  }, [defaultMode])

  // 시스템 다크모드 변경 감지 — preference가 'system'일 때만 화면에 반영된다.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setIsSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setHour(localHour()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const mode: ColorMode =
    preference === 'system'
      ? resolveTimeAwareSystemMode({ hour, prefersDark: isSystemDark })
      : preference
  const theme = mode === 'dark' ? darkTheme : lightTheme

  const setMode = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [])

  // 라이트 → 다크 → 시스템 순으로 순환한다.
  const toggleMode = useCallback(() => {
    const order: ThemePreference[] = ['light', 'dark', 'system']
    const next = order[(order.indexOf(preference) + 1) % order.length]
    setMode(next)
  }, [preference, setMode])

  // data-theme는 항상 "실제 적용된" mode를 반영한다 — [data-theme='dark'] CSS가 이 값을 본다.
  useEffect(() => {
    // 첫 effect에서 beforeInteractive가 적용한 실제 테마를 SSR 기본값으로
    // 덮어쓰지 않는다. 클라이언트 환경을 읽은 뒤부터 React가 관리한다.
    if (!hasResolvedClientTheme.current) return
    document.documentElement.setAttribute('data-theme', mode)
  }, [mode])

  return (
    <OnmaruThemeContext.Provider value={{ theme, mode, preference, toggleMode, setMode }}>
      <EmotionThemeProvider theme={theme}>
        <Global styles={createGlobalStyles(theme)} />
        {children}
      </EmotionThemeProvider>
    </OnmaruThemeContext.Provider>
  )
}


// ─────────────────────────────────────────
// 4. useTheme HOOK
// ─────────────────────────────────────────

export function useOnmaruTheme() {
  const ctx = useContext(OnmaruThemeContext)
  if (!ctx) {
    throw new Error('useOnmaruTheme must be used inside <OnmaruThemeProvider>')
  }
  return ctx
}

// Emotion의 useTheme과 병행 사용 가능하도록
export { useTheme } from '@emotion/react'
