/** @jsxImportSource @emotion/react */





import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { Moon, Sparkles, Sun } from 'lucide-react'
import { useOnmaruTheme } from './ThemeProvider'
import type { OnmaruTheme, ThemePreference } from './tokens'
import { getThemePreferenceLabel } from './themePreferenceLabels'
import { fontSize } from './tokens'










export const CTAButton = styled.button<{ size?: 'sm' | 'md' | 'lg' }>`
  display:         inline-flex;
  align-items:     center;
  justify-content: center;
  gap:             ${({ theme }) => (theme as OnmaruTheme).spacing[2]};
  padding:         ${({ theme, size = 'md' }) => {
    const t = theme as OnmaruTheme
    return size === 'sm' ? `${t.spacing[2]} ${t.spacing[4]}`
         : size === 'lg' ? `${t.spacing[4]} ${t.spacing[8]}`
         :                 `${t.spacing[3]} ${t.spacing[6]}`
  }};
  font-family:     ${({ theme }) => (theme as OnmaruTheme).typography.fontFamily.sans};
  font-size:       ${({ theme, size = 'md' }) => {
    const t = theme as OnmaruTheme
    return size === 'sm' ? t.typography.fontSize.sm : t.typography.fontSize.base
  }};

  font-weight:     ${({ theme }) => (theme as OnmaruTheme).typography.fontWeight.bold};
  border-radius:   ${({ theme }) => (theme as OnmaruTheme).borderRadius.lg};
  background:      ${({ theme }) => (theme as OnmaruTheme).colors.action.primary};
  color:           #ffffff;
  cursor:          pointer;
  transition:      ${({ theme }) => (theme as OnmaruTheme).transition.spring};
  &:hover {
    background:  ${({ theme }) => (theme as OnmaruTheme).colors.action.primaryHover};
    transform:   translateY(-1px);
  }

  &:active {
    background: ${({ theme }) => (theme as OnmaruTheme).colors.action.primaryPressed};
    transform:  translateY(0);
  }

  &:disabled {
    opacity: 0.45;
    cursor:  not-allowed;
    transform: none;
  }
`




export const NavButton = styled.button`
  display:         inline-flex;
  align-items:     center;
  gap:             ${({ theme }) => (theme as OnmaruTheme).spacing[2]};
  padding:         ${({ theme }) => {
    const t = theme as OnmaruTheme
    return `${t.spacing[2]} ${t.spacing[5]}`
  }};
  font-family:     ${({ theme }) => (theme as OnmaruTheme).typography.fontFamily.sans};
  font-size:       ${({ theme }) => (theme as OnmaruTheme).typography.fontSize.sm};
  font-weight:     ${({ theme }) => (theme as OnmaruTheme).typography.fontWeight.medium};
  border-radius:   ${({ theme }) => (theme as OnmaruTheme).borderRadius.lg};
  background:      transparent;
  color:           ${({ theme }) => (theme as OnmaruTheme).colors.nav.primary};
  cursor:          pointer;
  transition:      ${({ theme }) => (theme as OnmaruTheme).transition.normal};

  &:hover {
    background: ${({ theme }) => (theme as OnmaruTheme).colors.nav.primaryBg};
    color:      ${({ theme }) => (theme as OnmaruTheme).colors.nav.primaryHover};
  }

  &:active {
    border-color: ${({ theme }) => (theme as OnmaruTheme).colors.nav.primaryPressed};
    color:        ${({ theme }) => (theme as OnmaruTheme).colors.nav.primaryPressed};
  }
`




export const DocentButton = styled.button`
  display:         inline-flex;
  align-items:     center;
  gap:             ${({ theme }) => (theme as OnmaruTheme).spacing[2]};
  padding:         ${({ theme }) => {
    const t = theme as OnmaruTheme
    return `${t.spacing[2]} ${t.spacing[5]}`
  }};
  font-family:     ${({ theme }) => (theme as OnmaruTheme).typography.fontFamily.sans};
  font-size:       ${({ theme }) => (theme as OnmaruTheme).typography.fontSize.sm};
  font-weight:     ${({ theme }) => (theme as OnmaruTheme).typography.fontWeight.medium};
  border-radius:   ${({ theme }) => (theme as OnmaruTheme).borderRadius.lg};
  background:      ${({ theme }) => (theme as OnmaruTheme).colors.docent.primaryBg};
  color:           ${({ theme }) => (theme as OnmaruTheme).colors.docent.primary};
  cursor:          pointer;
  transition:      ${({ theme }) => (theme as OnmaruTheme).transition.normal};

  &:hover {
    background: ${({ theme }) => (theme as OnmaruTheme).colors.docent.primarySubtle};
    border-color: ${({ theme }) => (theme as OnmaruTheme).colors.docent.primaryHover};
    color:        ${({ theme }) => (theme as OnmaruTheme).colors.docent.primaryHover};
  }
`




export const StarBadge = styled.span`
  display:       inline-flex;
  align-items:   center;
  gap:           ${({ theme }) => (theme as OnmaruTheme).spacing[1]};
  padding:       ${({ theme }) => {
    const t = theme as OnmaruTheme
    return `${t.spacing[1]} ${t.spacing[3]}`
  }};
  font-size:     ${({ theme }) => (theme as OnmaruTheme).typography.fontSize.xs};
  font-weight:   ${({ theme }) => (theme as OnmaruTheme).typography.fontWeight.medium};
  border-radius: ${({ theme }) => (theme as OnmaruTheme).borderRadius.full};
  background:    ${({ theme }) => (theme as OnmaruTheme).colors.badge.starBg};
  color:         ${({ theme }) => (theme as OnmaruTheme).colors.badge.starText};
`




export const InfoTag = styled.span`
  display:       inline-flex;
  align-items:   center;
  gap:           ${({ theme }) => (theme as OnmaruTheme).spacing[1]};
  padding:       ${({ theme }) => {
    const t = theme as OnmaruTheme
    return `${t.spacing[1]} ${t.spacing[3]}`
  }};
  font-size:     ${({ theme }) => (theme as OnmaruTheme).typography.fontSize.xs};

  font-weight:   ${({ theme }) => (theme as OnmaruTheme).typography.fontWeight.regular};
  border-radius: ${({ theme }) => (theme as OnmaruTheme).borderRadius.full};
  background:    ${({ theme }) => (theme as OnmaruTheme).colors.info.primaryBg};
  color:         ${({ theme }) => (theme as OnmaruTheme).colors.info.primary};
`




export const HanokCard = styled.article`
  background:    ${({ theme }) => (theme as OnmaruTheme).colors.bg.card};
  border-radius: ${({ theme }) => (theme as OnmaruTheme).borderRadius.xl};
  padding:       ${({ theme }) => (theme as OnmaruTheme).spacing[5]};
  transition:    ${({ theme }) => (theme as OnmaruTheme).transition.normal};
  cursor:        pointer;

  &:hover {
    border-color: ${({ theme }) => (theme as OnmaruTheme).colors.action.primarySubtle};
    transform:    translateY(-2px);
  }
`




export const SearchInput = styled.input`
  width:         100%;
  padding:       ${({ theme }) => {
    const t = theme as OnmaruTheme
    return `${t.spacing[3]} ${t.spacing[4]}`
  }};
  font-family:   ${({ theme }) => (theme as OnmaruTheme).typography.fontFamily.sans};
  font-size:     ${({ theme }) => (theme as OnmaruTheme).typography.fontSize.sm};
  color:         ${({ theme }) => (theme as OnmaruTheme).colors.text.primary};
  background:    ${({ theme }) => (theme as OnmaruTheme).colors.bg.surface};
  border-radius: ${({ theme }) => (theme as OnmaruTheme).borderRadius.lg};
  outline:       none;
  transition:    ${({ theme }) => (theme as OnmaruTheme).transition.fast};

  &::placeholder {
    color: ${({ theme }) => (theme as OnmaruTheme).colors.text.muted};
  }

  &:focus {
    border-color: ${({ theme }) => (theme as OnmaruTheme).colors.action.primary};
  }
`




export const BottomSheet = styled.div<{ expanded?: boolean }>`
  position:      fixed;
  bottom:        0;
  left:          0;
  right:         0;
  background:    ${({ theme }) => (theme as OnmaruTheme).colors.bg.elevated};
  border-radius: ${({ theme }) => (theme as OnmaruTheme).borderRadius['2xl']}
                 ${({ theme }) => (theme as OnmaruTheme).borderRadius['2xl']}
                 0 0;
  border-top:    0.5px solid ${({ theme }) => (theme as OnmaruTheme).colors.border.subtle};
  padding:       ${({ theme }) => (theme as OnmaruTheme).spacing[5]};
  z-index:       ${({ theme }) => (theme as OnmaruTheme).zIndex.modal};
  transform:     translateY(${({ expanded }) => expanded ? '0' : '70%'});
  transition:    transform 0.40s cubic-bezier(0.32, 0.72, 0, 1);
  max-height:    90vh;
  overflow-y:    auto;
`




export const TabBar = styled.nav`
  position:        fixed;
  bottom:          0;
  left:            0;
  right:           0;
  display:         flex;
  justify-content: space-around;
  align-items:     center;
  height:          64px;
  background:      ${({ theme }) => (theme as OnmaruTheme).colors.bg.elevated};
  border-top:      0.5px solid ${({ theme }) => (theme as OnmaruTheme).colors.border.subtle};
  z-index:         ${({ theme }) => (theme as OnmaruTheme).zIndex.overlay};
  padding-bottom:  env(safe-area-inset-bottom);
`

export const TabItem = styled.button<{ active?: boolean }>`
  display:         flex;
  flex-direction:  column;
  align-items:     center;
  gap:             4px;
  padding:         8px 16px;
  background:      none;
  cursor:          pointer;
  font-family:     ${({ theme }) => (theme as OnmaruTheme).typography.fontFamily.sans};
  font-size:       ${fontSize.micro};

  font-weight:     ${({ active, theme }) =>
    active
      ? (theme as OnmaruTheme).typography.fontWeight.bold
      : (theme as OnmaruTheme).typography.fontWeight.regular
  };
  color: ${({ active, theme }) => {
    const t = theme as OnmaruTheme
    return active ? t.colors.action.primary : t.colors.text.muted
  }};
  transition: ${({ theme }) => (theme as OnmaruTheme).transition.fast};

  svg {
    width:  22px;
    height: 22px;
  }
`










export const metaballContainerCss = (theme: OnmaruTheme) => css`
  position: relative;
  width:    100%;
  height:   100%;
  overflow: hidden;


  .metaball-blob {
    border-radius: 50%;
    position:      absolute;
    pointer-events:none;
    mix-blend-mode: ${theme.mode === 'dark' ? 'screen' : 'multiply'};
    transition:    ${theme.transition.slow};
    will-change:   transform, opacity;
  }


  .metaball-core {
    background: ${theme.colors.metaball.core};
    opacity:    ${theme.mode === 'dark' ? '0.58' : '0.28'};
  }


  .metaball-spread-1 {
    background: ${theme.colors.metaball.spread1};
    opacity:    ${theme.mode === 'dark' ? '0.42' : '0.32'};
  }


  .metaball-spread-2 {
    background: ${theme.colors.metaball.spread2};
    opacity:    ${theme.mode === 'dark' ? '0.38' : '0.30'};
  }


  .metaball-accent-1 {
    background: ${theme.colors.metaball.accent1};
    opacity:    ${theme.mode === 'dark' ? '0.44' : '0.25'};
  }


  .metaball-accent-2 {
    background: ${theme.colors.metaball.accent2};
    opacity:    ${theme.mode === 'dark' ? '0.38' : '0.28'};
  }
`




export const sectionHeaderCss = (theme: OnmaruTheme) => css`
  font-family: ${theme.typography.fontFamily.sans};
  font-size:   ${theme.typography.fontSize['2xl']};

  font-weight: ${theme.typography.fontWeight.light};
  letter-spacing: -0.02em;
  color:       ${theme.colors.text.primary};
  line-height: ${theme.typography.lineHeight.tight};
  letter-spacing: -0.02em;
`









export function ThemeToggleButton() {
  const { mode, toggleMode, theme } = useOnmaruTheme()

  return (
    <button
      onClick={toggleMode}
      css={css`
        display:         inline-flex;
        align-items:     center;
        gap:             ${theme.spacing[2]};
        padding:         ${theme.spacing[2]} ${theme.spacing[4]};
        background:      ${theme.colors.bg.surface};
        border-radius:   ${theme.borderRadius.full};
        color:           ${theme.colors.text.secondary};
        font-family:     ${theme.typography.fontFamily.sans};
        font-size:       ${theme.typography.fontSize.sm};
        cursor:          pointer;
        transition:      ${theme.transition.normal};

        &:hover {
          background:   ${theme.colors.bg.card};
          border-color: ${theme.colors.border.default};
          color:        ${theme.colors.text.primary};
        }
      `}
    >
      {mode === 'light' ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Moon size={14} strokeWidth={2} /> 야간 모드
        </span>
      ) : (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Sun size={14} strokeWidth={2} /> 주간 모드
        </span>
      )}
    </button>
  )
}





export function ThemeModeSwitch() {
  const { preference, setMode, theme } = useOnmaruTheme()

  const options: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
    { value: 'system', label: getThemePreferenceLabel('system'), Icon: Sparkles },
    { value: 'light', label: getThemePreferenceLabel('light'), Icon: Sun },
    { value: 'dark', label: getThemePreferenceLabel('dark'), Icon: Moon },
  ]

  return (
    <div
      role="radiogroup"
      aria-label="화면 모드"
      css={css`
        display: inline-flex;
        padding: 3px;
        gap: 2px;
        background: ${theme.colors.bg.surface};
        border-radius: ${theme.borderRadius.full};
      `}
    >
      {options.map(({ value, label, Icon }) => {
        const active = preference === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setMode(value)}
            css={css`
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 6px 12px;
              border: none;
              border-radius: ${theme.borderRadius.full};
              background: ${active ? theme.colors.bg.card : 'transparent'};
              color: ${active ? theme.colors.text.primary : theme.colors.text.muted};
              font-family: ${theme.typography.fontFamily.sans};
              font-size: ${theme.typography.fontSize.xs};
              font-weight: ${active ? theme.typography.fontWeight.bold : theme.typography.fontWeight.regular};
              box-shadow: ${active ? theme.shadow.sm : 'none'};
              cursor: pointer;
              transition: ${theme.transition.fast};
            `}
          >
            <Icon size={13} strokeWidth={2} />
            {label}
          </button>
        )
      })}
    </div>
  )
}








export const responsiveSidePaddingCss = (theme: OnmaruTheme) => css`
  max-width: ${theme.layout.maxWidth};
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;
  padding-left: ${theme.layout.padding.lg};
  padding-right: ${theme.layout.padding.lg};

  @media (max-width: 1279px) {
    padding-left: ${theme.layout.padding.md};
    padding-right: ${theme.layout.padding.md};
  }
`;

export const PageContainer = styled.div`
  width: 100%;
  max-width: ${({ theme }) => (theme as OnmaruTheme).layout.maxWidth};
  margin: 0 auto;
  box-sizing: border-box;
  padding-top: 49px;
  padding-left: ${({ theme }) => (theme as OnmaruTheme).layout.padding.lg};
  padding-right: ${({ theme }) => (theme as OnmaruTheme).layout.padding.lg};

  @media (max-width: 1279px) {
    padding-left: ${({ theme }) => (theme as OnmaruTheme).layout.padding.md};
    padding-right: ${({ theme }) => (theme as OnmaruTheme).layout.padding.md};
  }
`;
