'use client';






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






interface OnmaruThemeContextValue {
  theme:      OnmaruTheme

  mode:       ColorMode

  preference: ThemePreference
  toggleMode: () => void
  setMode:    (preference: ThemePreference) => void
}

const OnmaruThemeContext = createContext<OnmaruThemeContextValue | null>(null)






const createGlobalStyles = (theme: OnmaruTheme) => css`



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


  :root {

    --color-bg-app:      ${theme.colors.bg.app};
    --color-bg-surface:  ${theme.colors.bg.surface};
    --color-bg-card:     ${theme.colors.bg.card};
    --color-bg-elevated: ${theme.colors.bg.elevated};


    --color-border-subtle:  ${theme.colors.border.subtle};
    --color-border-default: ${theme.colors.border.default};


    --color-text-primary:   ${theme.colors.text.primary};
    --color-text-secondary: ${theme.colors.text.secondary};
    --color-text-muted:     ${theme.colors.text.muted};


    --color-action-primary:         ${theme.colors.action.primary};
    --color-action-primary-hover:   ${theme.colors.action.primaryHover};
    --color-action-primary-pressed: ${theme.colors.action.primaryPressed};
    --color-action-primary-bg:      ${theme.colors.action.primaryBg};
    --color-action-primary-subtle:  ${theme.colors.action.primarySubtle};


    --color-nav-primary:         ${theme.colors.nav.primary};
    --color-nav-primary-hover:   ${theme.colors.nav.primaryHover};
    --color-nav-primary-pressed: ${theme.colors.nav.primaryPressed};
    --color-nav-primary-bg:      ${theme.colors.nav.primaryBg};


    --color-badge-star:       ${theme.colors.badge.star};
    --color-badge-star-text:  ${theme.colors.badge.starText};
    --color-badge-star-bg:    ${theme.colors.badge.starBg};


    --color-docent-primary:        ${theme.colors.docent.primary};
    --color-docent-primary-hover:  ${theme.colors.docent.primaryHover};
    --color-docent-primary-bg:     ${theme.colors.docent.primaryBg};


    --color-info-primary:        ${theme.colors.info.primary};
    --color-info-primary-hover:  ${theme.colors.info.primaryHover};
    --color-info-primary-bg:     ${theme.colors.info.primaryBg};


    --color-metaball-core:    ${theme.colors.metaball.core};
    --color-metaball-spread1: ${theme.colors.metaball.spread1};
    --color-metaball-spread2: ${theme.colors.metaball.spread2};
    --color-metaball-accent1: ${theme.colors.metaball.accent1};
    --color-metaball-accent2: ${theme.colors.metaball.accent2};


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
    color:           ${theme.colors.action.primary};
    text-decoration: none;
    transition:      ${theme.transition.fast};

    &:hover {
      color: ${theme.colors.action.primaryHover};
    }
  }

  code, pre, kbd {
    font-family: ${theme.typography.fontFamily.sans};
    font-size:   0.875em;
  }


  ::-webkit-scrollbar        { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track  { background: transparent; }
  ::-webkit-scrollbar-thumb  {
    background:    ${theme.colors.border.default};
    border-radius: ${theme.borderRadius.full};
  }
  ::-webkit-scrollbar-thumb:hover {
    background: ${theme.colors.neutral.subtle};
  }


  :focus-visible {
    outline:        2px solid ${theme.colors.action.primary};
    outline-offset: 2px;
    border-radius:  ${theme.borderRadius.sm};
  }


  ::selection {
    background-color: ${theme.colors.action.primaryBg};
    color:            ${theme.colors.action.primaryPressed};
  }
`






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




  const [preference, setPreferenceState] = useState<ThemePreference>(defaultMode)
  const [isSystemDark, setIsSystemDark] = useState(false)
  const [hour, setHour] = useState(12)
  const hasResolvedClientTheme = useRef(false)



  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      hasResolvedClientTheme.current = true
      setPreferenceState(readStoredPreference(defaultMode))
      setIsSystemDark(systemPrefersDark())
      setHour(localHour())
    })
    return () => window.cancelAnimationFrame(frameId)
  }, [defaultMode])


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


  const toggleMode = useCallback(() => {
    const order: ThemePreference[] = ['light', 'dark', 'system']
    const next = order[(order.indexOf(preference) + 1) % order.length]
    setMode(next)
  }, [preference, setMode])


  useEffect(() => {


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






export function useOnmaruTheme() {
  const ctx = useContext(OnmaruThemeContext)
  if (!ctx) {
    throw new Error('useOnmaruTheme must be used inside <OnmaruThemeProvider>')
  }
  return ctx
}


export { useTheme } from '@emotion/react'
