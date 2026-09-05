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
  type ReactNode,
} from 'react'
import { ThemeProvider as EmotionThemeProvider, Global, css } from '@emotion/react'
import {
  lightTheme,
  darkTheme,
  createTheme,
  type ColorMode,
  type OnmaruTheme,
} from './tokens'


// ─────────────────────────────────────────
// 1. THEME CONTEXT
// ─────────────────────────────────────────

interface OnmaruThemeContextValue {
  theme:      OnmaruTheme
  mode:       ColorMode
  toggleMode: () => void
  setMode:    (mode: ColorMode) => void
}

const OnmaruThemeContext = createContext<OnmaruThemeContextValue | null>(null)


// ─────────────────────────────────────────
// 2. GLOBAL STYLES
// ─────────────────────────────────────────

const createGlobalStyles = (theme: OnmaruTheme) => css`
  /* ── SpoqaHanSansNeo 폰트 */
  @font-face { font-family: 'SpoqaHanSansNeo'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Thin.woff') format('woff'); font-weight: 100; font-display: swap; }
  @font-face { font-family: 'SpoqaHanSansNeo'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Light.woff') format('woff'); font-weight: 300; font-display: swap; }
  @font-face { font-family: 'SpoqaHanSansNeo'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff') format('woff'); font-weight: 400; font-display: swap; }
  @font-face { font-family: 'SpoqaHanSansNeo'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Medium.woff') format('woff'); font-weight: 500; font-display: swap; }
  @font-face { font-family: 'SpoqaHanSansNeo'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Bold.woff') format('woff'); font-weight: 700; font-display: swap; }

  /* ── 충주시 김생체 전통 폰트 */
  @font-face { font-family: 'ChungjuKimsaeng'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2312-1@1.1/ChungjuKimSaengTTF.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
  @font-face { font-family: 'ChungjuKimsaeng'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2312-1@1.1/ChungjuKimSaengTTF.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: swap; }
  @font-face { font-family: 'ChungjuKimsaeng'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2312-1@1.1/ChungjuKimSaengTTF.woff2') format('woff2'); font-weight: 800; font-style: normal; font-display: swap; }

  /* ── 네이버 마루 부리 (MaruBuri) 폰트 */
  @font-face { font-family: 'MaruBuri'; src: url('https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-ExtraLight.woff2') format('woff2'); font-weight: 200; font-display: swap; }
  @font-face { font-family: 'MaruBuri'; src: url('https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-Light.woff2') format('woff2'); font-weight: 300; font-display: swap; }
  @font-face { font-family: 'MaruBuri'; src: url('https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-Regular.woff2') format('woff2'); font-weight: 400; font-display: swap; }
  @font-face { font-family: 'MaruBuri'; src: url('https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-SemiBold.woff2') format('woff2'); font-weight: 600; font-display: swap; }
  @font-face { font-family: 'MaruBuri'; src: url('https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-Bold.woff2') format('woff2'); font-weight: 700; font-display: swap; }

  /* ── CSS Reset + Base */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
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

  /* ── Typography base */
  h1, h2, h3, h4, h5, h6 {
    font-family:  ${theme.typography.fontFamily.sans};
    font-weight:  ${theme.typography.fontWeight.semibold};
    line-height:  ${theme.typography.lineHeight.tight};
    color:        ${theme.colors.text.primary};
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
  defaultMode?: ColorMode
  /** true면 시스템 다크모드 자동 감지 */
  followSystem?: boolean
}

export function OnmaruThemeProvider({
  children,
  defaultMode  = 'light',
  followSystem = true,
}: OnmaruThemeProviderProps) {

  const [mode, setModeState] = useState<ColorMode>(defaultMode)

  // 컴포넌트가 클라이언트에 마운트된 이후에 로컬 스토리지/시스템 설정 반영.
  // 서버는 localStorage와 matchMedia를 볼 수 없으므로 defaultMode로 렌더하고,
  // 실제 값은 마운트 후에 반영해야 한다. 이펙트에서 상태를 넣는 것이 유일한 방법이라
  // set-state-in-effect 규칙을 이 지점에서만 해제한다.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = localStorage.getItem('onmaru-color-mode') as ColorMode | null
    if (saved === 'light' || saved === 'dark') {
      setModeState(saved)
    } else if (followSystem) {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setModeState(isDark ? 'dark' : 'light')
    }
  }, [followSystem])
  /* eslint-enable react-hooks/set-state-in-effect */

  const theme = mode === 'dark' ? darkTheme : lightTheme

  // 시스템 다크모드 변경 감지
  useEffect(() => {
    // mounted 플래그로 막던 코드였는데, 그 플래그는 첫 이펙트에서야 true가 되고
    // 이 이펙트의 의존성에는 없어서 재실행되지 않았다. 결과적으로 리스너가 한 번도
    // 붙지 않았다. useEffect 자체가 클라이언트에서만 도니 가드는 불필요하다.
    if (!followSystem) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem('onmaru-color-mode')
      if (!saved) setModeState(e.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [followSystem])

  const setMode = useCallback((next: ColorMode) => {
    setModeState(next)
    localStorage.setItem('onmaru-color-mode', next)
    // HTML attribute로도 노출 (CSS 셀렉터 활용 가능)
    document.documentElement.setAttribute('data-theme', next)
  }, [])

  const toggleMode = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light')
  }, [mode, setMode])

  // data-theme 초기화
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
  }, [mode])

  return (
    <OnmaruThemeContext.Provider value={{ theme, mode, toggleMode, setMode }}>
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
