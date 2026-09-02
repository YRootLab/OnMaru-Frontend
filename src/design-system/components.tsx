/** @jsxImportSource @emotion/react */
// ============================================================
// 온마루 (On-Maru) — Emotion CSS 컴포넌트 사용 예시
// styled / css / useOnmaruTheme 세 가지 방식 모두 포함
// ============================================================

import styled       from '@emotion/styled'
import { css }      from '@emotion/react'
import { Moon, Sun } from 'lucide-react'
import { useOnmaruTheme } from './ThemeProvider'
import type { OnmaruTheme } from './tokens'


// ─────────────────────────────────────────
// A. styled 방식 — theme prop 자동 주입
// ─────────────────────────────────────────

/**
 * 🔴 CTA 버튼 — 단청 주홍
 * 온기 남기기, 체크인 등 주요 액션
 */
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
  font-weight:     ${({ theme }) => (theme as OnmaruTheme).typography.fontWeight.medium};
  border:          none;
  border-radius:   ${({ theme }) => (theme as OnmaruTheme).borderRadius.lg};
  background:      ${({ theme }) => (theme as OnmaruTheme).colors.action.primary};
  color:           #ffffff;
  cursor:          pointer;
  transition:      ${({ theme }) => (theme as OnmaruTheme).transition.spring};
  box-shadow:      ${({ theme }) => (theme as OnmaruTheme).shadow.sm};

  &:hover {
    background:  ${({ theme }) => (theme as OnmaruTheme).colors.action.primaryHover};
    box-shadow:  ${({ theme }) => (theme as OnmaruTheme).shadow.glow};
    transform:   translateY(-1px);
  }

  &:active {
    background: ${({ theme }) => (theme as OnmaruTheme).colors.action.primaryPressed};
    transform:  translateY(0);
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.45;
    cursor:  not-allowed;
    transform: none;
  }
`

/**
 * 🟢 Ghost 버튼 — 대청 청록 (지도 탐색, 링크 등)
 */
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
  border:          1.5px solid ${({ theme }) => (theme as OnmaruTheme).colors.nav.primary};
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

/**
 * 🌸 도슨트 버튼 — 연지 장미
 */
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
  border:          1.5px solid ${({ theme }) => (theme as OnmaruTheme).colors.docent.primary};
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

/**
 * 🟡 뱃지 — 황금 기와 (별점, 추천, 장터)
 */
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
  border:        1px solid ${({ theme }) => (theme as OnmaruTheme).colors.badge.star};
  border-radius: ${({ theme }) => (theme as OnmaruTheme).borderRadius.full};
  background:    ${({ theme }) => (theme as OnmaruTheme).colors.badge.starBg};
  color:         ${({ theme }) => (theme as OnmaruTheme).colors.badge.starText};
`

/**
 * 🔵 정보 태그 — 청화 코발트 (건축 데이터, 외부 링크)
 */
export const InfoTag = styled.span`
  display:       inline-flex;
  align-items:   center;
  gap:           ${({ theme }) => (theme as OnmaruTheme).spacing[1]};
  padding:       ${({ theme }) => {
    const t = theme as OnmaruTheme
    return `${t.spacing[1]} ${t.spacing[3]}`
  }};
  font-size:     ${({ theme }) => (theme as OnmaruTheme).typography.fontSize.xs};
  font-weight:   ${({ theme }) => (theme as OnmaruTheme).typography.fontWeight.medium};
  border:        1px solid ${({ theme }) => (theme as OnmaruTheme).colors.info.primarySubtle};
  border-radius: ${({ theme }) => (theme as OnmaruTheme).borderRadius.full};
  background:    ${({ theme }) => (theme as OnmaruTheme).colors.info.primaryBg};
  color:         ${({ theme }) => (theme as OnmaruTheme).colors.info.primary};
`

/**
 * 한옥 카드 컴포넌트
 */
export const HanokCard = styled.article`
  background:    ${({ theme }) => (theme as OnmaruTheme).colors.bg.card};
  border:        0.5px solid ${({ theme }) => (theme as OnmaruTheme).colors.border.subtle};
  border-radius: ${({ theme }) => (theme as OnmaruTheme).borderRadius.xl};
  padding:       ${({ theme }) => (theme as OnmaruTheme).spacing[5]};
  box-shadow:    ${({ theme }) => (theme as OnmaruTheme).shadow.sm};
  transition:    ${({ theme }) => (theme as OnmaruTheme).transition.normal};
  cursor:        pointer;

  &:hover {
    border-color: ${({ theme }) => (theme as OnmaruTheme).colors.action.primarySubtle};
    box-shadow:   ${({ theme }) => (theme as OnmaruTheme).shadow.md};
    transform:    translateY(-2px);
  }
`

/**
 * 검색 인풋
 */
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
  border:        1px solid ${({ theme }) => (theme as OnmaruTheme).colors.border.subtle};
  border-radius: ${({ theme }) => (theme as OnmaruTheme).borderRadius.lg};
  outline:       none;
  transition:    ${({ theme }) => (theme as OnmaruTheme).transition.fast};

  &::placeholder {
    color: ${({ theme }) => (theme as OnmaruTheme).colors.text.muted};
  }

  &:focus {
    border-color: ${({ theme }) => (theme as OnmaruTheme).colors.action.primary};
    box-shadow:   0 0 0 3px ${({ theme }) => (theme as OnmaruTheme).colors.action.primaryBg};
  }
`

/**
 * 바텀 시트 — 한옥 상세 정보
 */
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
  box-shadow:    ${({ theme }) => (theme as OnmaruTheme).shadow.xl};
  padding:       ${({ theme }) => (theme as OnmaruTheme).spacing[5]};
  z-index:       ${({ theme }) => (theme as OnmaruTheme).zIndex.modal};
  transform:     translateY(${({ expanded }) => expanded ? '0' : '70%'});
  transition:    transform 0.40s cubic-bezier(0.32, 0.72, 0, 1);
  max-height:    90vh;
  overflow-y:    auto;
`

/**
 * 하단 탭 바
 */
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
  border:          none;
  cursor:          pointer;
  font-family:     ${({ theme }) => (theme as OnmaruTheme).typography.fontFamily.sans};
  font-size:       10px;
  font-weight:     ${({ active, theme }) =>
    active
      ? (theme as OnmaruTheme).typography.fontWeight.medium
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


// ─────────────────────────────────────────
// B. css 함수 방식 — 조건부/동적 스타일
// ─────────────────────────────────────────

/**
 * 온기 맵 메타볼 컨테이너
 * Uber H3 + Metaballs 효과 래퍼
 */
export const metaballContainerCss = (theme: OnmaruTheme) => css`
  position: relative;
  width:    100%;
  height:   100%;
  overflow: hidden;

  /* 메타볼 블롭 기본 스타일 */
  .metaball-blob {
    border-radius: 50%;
    position:      absolute;
    pointer-events:none;
    mix-blend-mode: ${theme.mode === 'dark' ? 'screen' : 'multiply'};
    transition:    ${theme.transition.slow};
    will-change:   transform, opacity;
  }

  /* 온기 핵심 블롭 — 단청 주홍 */
  .metaball-core {
    background: ${theme.colors.metaball.core};
    opacity:    ${theme.mode === 'dark' ? '0.58' : '0.28'};
  }

  /* 1차 확산 — 주홍 200 */
  .metaball-spread-1 {
    background: ${theme.colors.metaball.spread1};
    opacity:    ${theme.mode === 'dark' ? '0.42' : '0.32'};
  }

  /* 2차 확산 — 황금 기와 */
  .metaball-spread-2 {
    background: ${theme.colors.metaball.spread2};
    opacity:    ${theme.mode === 'dark' ? '0.38' : '0.30'};
  }

  /* 포인트 블롭 — 연지 장미 */
  .metaball-accent-1 {
    background: ${theme.colors.metaball.accent1};
    opacity:    ${theme.mode === 'dark' ? '0.44' : '0.25'};
  }

  /* 외곽 블롭 — 대청 청록 */
  .metaball-accent-2 {
    background: ${theme.colors.metaball.accent2};
    opacity:    ${theme.mode === 'dark' ? '0.38' : '0.28'};
  }
`

/**
 * 섹션 헤더 — 서체 강조
 */
export const sectionHeaderCss = (theme: OnmaruTheme) => css`
  font-family: ${theme.typography.fontFamily.sans};
  font-size:   ${theme.typography.fontSize['2xl']};
  font-weight: ${theme.typography.fontWeight.medium};
  color:       ${theme.colors.text.primary};
  line-height: ${theme.typography.lineHeight.tight};
  letter-spacing: -0.02em;
`


// ─────────────────────────────────────────
// C. useOnmaruTheme 훅 방식 — 인라인 스타일 / 동적 처리
// ─────────────────────────────────────────

/**
 * 다크모드 토글 버튼 예시 컴포넌트
 */
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
        border:          1px solid ${theme.colors.border.default};
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
          <Moon size={14} /> 야간 모드
        </span>
      ) : (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Sun size={14} /> 주간 모드
        </span>
      )}
    </button>
  )
}

// ─────────────────────────────────────────
// C-1. 공통 반응형 레이아웃 마진 믹스인 & 컨테이너
// - Large Screen (>= 1280px): 75px
// - Medium / Small Screen (< 1280px): 16px
// ─────────────────────────────────────────

export const responsiveSidePaddingCss = (theme: OnmaruTheme) => css`
  padding-left: ${theme.layout.margin.lg};
  padding-right: ${theme.layout.margin.lg};

  @media (max-width: 1279px) {
    padding-left: ${theme.layout.margin.md};
    padding-right: ${theme.layout.margin.md};
  }
`;

export const PageContainer = styled.div`
  width: 100%;
  padding-top: 49px; /* 고정 헤더(49px) 상단 여백 확보 */
  padding-left: ${({ theme }) => (theme as OnmaruTheme).layout.margin.lg};
  padding-right: ${({ theme }) => (theme as OnmaruTheme).layout.margin.lg};

  @media (max-width: 1279px) {
    padding-left: ${({ theme }) => (theme as OnmaruTheme).layout.margin.md};
    padding-right: ${({ theme }) => (theme as OnmaruTheme).layout.margin.md};
  }
`;


// ─────────────────────────────────────────
// D. 실제 사용 예시 (App.tsx 참고용)
// ─────────────────────────────────────────

/*

// App.tsx
import { OnmaruThemeProvider } from './OnmaruThemeProvider'
import {
  CTAButton,
  NavButton,
  DocentButton,
  StarBadge,
  InfoTag,
  HanokCard,
  SearchInput,
  TabBar,
  TabItem,
  ThemeToggleButton,
} from './onmaru-components'

export default function App() {
  return (
    <OnmaruThemeProvider defaultMode="light" followSystem>

      <SearchInput placeholder="한옥 이름 또는 장소 검색..." />

      <HanokCard>
        <h3>북촌 가회동 한옥</h3>
        <p>서울 종로구 · 조선 후기</p>
        <StarBadge>★ 4.9</StarBadge>
        <InfoTag>건축 데이터</InfoTag>
        <CTAButton>온기 남기기</CTAButton>
        <NavButton>지도 보기</NavButton>
        <DocentButton>▶ 도슨트 듣기</DocentButton>
      </HanokCard>

      <ThemeToggleButton />

      <TabBar>
        <TabItem active>지도</TabItem>
        <TabItem>발자취</TabItem>
        <TabItem>내 온기</TabItem>
      </TabBar>

    </OnmaruThemeProvider>
  )
}

*/
