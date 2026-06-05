// ============================================================
// 온마루 (On-Maru) — Design Token System
// Emotion CSS Ready · Light / Dark Mode
// v1.0 Final · 2026
// ============================================================

// ─────────────────────────────────────────
// 1. PRIMITIVE COLORS (Raw Color Ramps)
// ─────────────────────────────────────────

export const primitive = {
  // 🔴 단청 주홍 — Hue 21° / Primary · Action
  juhong: {
    50:  '#FFF0E6',
    100: '#FFCBA8',
    200: '#FF9A60',
    400: '#F07030',
    500: '#E85A18',  // ★ Light CTA base
    700: '#A03A0A',
    900: '#3A1004',
  },

  // 🟢 대청 청록 — Hue 168° / Navigation · Map
  cheongrok: {
    50:  '#E6F5F0',
    100: '#90D4C0',
    200: '#3DB898',
    400: '#249878',
    500: '#1E7A68',  // ★ Light Nav base
    700: '#0E5848',
    900: '#042820',
  },

  // 🟡 황금 기와 — Hue 38° / Badge · Star · 장터
  hwanggeum: {
    50:  '#FFF8E0',
    100: '#FFE898',
    200: '#FFCC40',
    400: '#F5A623',  // ★ Light Badge base
    500: '#C07808',
    700: '#7A4C04',
    900: '#2C1800',
  },

  // 🌸 연지 장미 — Hue 340° / Docent · Odii API
  // ⚠️ 오디(Odii) 보라(Hue ~260°)와 80° 이격 — 충돌 없음
  jangmi: {
    50:  '#FFF0F4',
    100: '#F8A8C0',
    200: '#F06090',
    400: '#E03870',
    500: '#D42058',  // ★ Light Docent base
    700: '#8A1038',
    900: '#300010',
  },

  // 🔵 청화 코발트 — Hue 224° / Info · Link · 건축 데이터
  kobalt: {
    50:  '#EEF3FF',
    100: '#A8C0F8',
    200: '#6088F0',
    400: '#4068E8',
    500: '#2B5CE6',  // ★ Light Info base
    700: '#1A3898',
    900: '#081040',
  },

  // ⬛ 먹빛 중성 — Hue 35° (Warm Neutral)
  meok: {
    50:  '#F5F3EE',
    100: '#D8D0C0',
    200: '#A89880',
    400: '#706050',
    500: '#4A3820',  // ★ Text base
    700: '#2A2010',
    900: '#100C06',
  },

  // ☀️ 라이트 배경 레이어
  lightSurface: {
    base:     '#FAF6F0',  // App Background — 화선지 백
    surface:  '#F5EFE6',  // Surface — 한지 면
    card:     '#FFFFFF',  // Card
    elevated: '#FFFFFF',  // Elevated
  },

  // 🌙 다크 배경 레이어
  darkSurface: {
    base:     '#080604',  // Base BG — 먹 심연
    app:      '#0E0B07',  // App BG — 먹 마루
    surface:  '#1A1510',  // Surface — 먹 결
    card:     '#252018',  // Card — 먹 카드
    elevated: '#342C22',  // Elevated — 먹 부유
  },
} as const


// ─────────────────────────────────────────
// 2. SEMANTIC TOKENS
// ─────────────────────────────────────────

export type ColorMode = 'light' | 'dark'

export const semanticTokens = {
  light: {
    // ── Background
    bg: {
      app:      primitive.lightSurface.base,     // #FAF6F0
      surface:  primitive.lightSurface.surface,  // #F5EFE6
      card:     primitive.lightSurface.card,     // #FFFFFF
      elevated: primitive.lightSurface.elevated, // #FFFFFF
    },

    // ── Border
    border: {
      subtle:  '#EAE0D0',
      default: '#D8C8B0',
    },

    // ── Text
    text: {
      primary:   '#2A1A0A',
      secondary: primitive.meok[400],  // #706050
      muted:     primitive.meok[200],  // #A89880
      inverse:   '#FFFFFF',
    },

    // ── Action (단청 주홍)
    action: {
      primary:        primitive.juhong[500],  // #E85A18
      primaryHover:   primitive.juhong[400],  // #F07030
      primaryPressed: primitive.juhong[700],  // #A03A0A
      primaryBg:      primitive.juhong[50],   // #FFF0E6
      primarySubtle:  primitive.juhong[100],  // #FFCBA8
    },

    // ── Navigation (대청 청록)
    nav: {
      primary:        primitive.cheongrok[500],  // #1E7A68
      primaryHover:   primitive.cheongrok[400],  // #249878
      primaryPressed: primitive.cheongrok[700],  // #0E5848
      primaryBg:      primitive.cheongrok[50],   // #E6F5F0
      primarySubtle:  primitive.cheongrok[100],  // #90D4C0
    },

    // ── Badge / Star (황금 기와)
    badge: {
      star:        primitive.hwanggeum[400],  // #F5A623
      starText:    primitive.hwanggeum[500],  // #C07808
      starPressed: primitive.hwanggeum[700],  // #7A4C04
      starBg:      primitive.hwanggeum[50],   // #FFF8E0
      starSubtle:  primitive.hwanggeum[100],  // #FFE898
    },

    // ── Docent / Odii (연지 장미)
    docent: {
      primary:        primitive.jangmi[500],  // #D42058
      primaryHover:   primitive.jangmi[400],  // #E03870
      primaryPressed: primitive.jangmi[700],  // #8A1038
      primaryBg:      primitive.jangmi[50],   // #FFF0F4
      primarySubtle:  primitive.jangmi[100],  // #F8A8C0
    },

    // ── Info / Data (청화 코발트)
    info: {
      primary:        primitive.kobalt[500],  // #2B5CE6
      primaryHover:   primitive.kobalt[400],  // #4068E8
      primaryPressed: primitive.kobalt[700],  // #1A3898
      primaryBg:      primitive.kobalt[50],   // #EEF3FF
      primarySubtle:  primitive.kobalt[100],  // #A8C0F8
    },

    // ── Neutral (먹빛)
    neutral: {
      primary:  primitive.meok[500],  // #4A3820
      subtle:   primitive.meok[400],  // #706050
      muted:    primitive.meok[200],  // #A89880
      light:    primitive.meok[100],  // #D8D0C0
      lightest: primitive.meok[50],   // #F5F3EE
    },
  },

  dark: {
    // ── Background
    bg: {
      app:      primitive.darkSurface.app,      // #0E0B07
      surface:  primitive.darkSurface.surface,  // #1A1510
      card:     primitive.darkSurface.card,     // #252018
      elevated: primitive.darkSurface.elevated, // #342C22
    },

    // ── Border
    border: {
      subtle:  '#2A2418',
      default: '#3A3028',
    },

    // ── Text
    text: {
      primary:   '#E8D8B8',
      secondary: '#786050',
      muted:     '#504030',
      inverse:   primitive.darkSurface.app,
    },

    // ── Action (단청 주홍 — 다크: 400↑)
    action: {
      primary:        primitive.juhong[400],  // #F07030  ← 한 단계 ↑
      primaryHover:   primitive.juhong[200],  // #FF9A60
      primaryPressed: primitive.juhong[500],  // #E85A18
      primaryBg:      primitive.juhong[900],  // #3A1004
      primarySubtle:  primitive.juhong[700],  // #A03A0A
    },

    // ── Navigation (대청 청록 — 다크: 200↑↑)
    nav: {
      primary:        primitive.cheongrok[200],  // #3DB898  ← 두 단계 ↑
      primaryHover:   primitive.cheongrok[100],  // #90D4C0
      primaryPressed: primitive.cheongrok[400],  // #249878
      primaryBg:      primitive.cheongrok[900],  // #042820
      primarySubtle:  primitive.cheongrok[700],  // #0E5848
    },

    // ── Badge / Star (황금 기와 — 다크: 200↑↑)
    badge: {
      star:        primitive.hwanggeum[200],  // #FFCC40  ← 두 단계 ↑
      starText:    primitive.hwanggeum[100],  // #FFE898
      starPressed: primitive.hwanggeum[400],  // #F5A623
      starBg:      primitive.hwanggeum[900],  // #2C1800
      starSubtle:  primitive.hwanggeum[700],  // #7A4C04
    },

    // ── Docent / Odii (연지 장미 — 다크: 200↑↑)
    docent: {
      primary:        primitive.jangmi[200],  // #F06090  ← 두 단계 ↑
      primaryHover:   primitive.jangmi[100],  // #F8A8C0
      primaryPressed: primitive.jangmi[400],  // #E03870
      primaryBg:      primitive.jangmi[900],  // #300010
      primarySubtle:  primitive.jangmi[700],  // #8A1038
    },

    // ── Info / Data (청화 코발트 — 다크: 200↑↑)
    info: {
      primary:        primitive.kobalt[200],  // #6088F0  ← 두 단계 ↑
      primaryHover:   primitive.kobalt[100],  // #A8C0F8
      primaryPressed: primitive.kobalt[400],  // #4068E8
      primaryBg:      primitive.kobalt[900],  // #081040
      primarySubtle:  primitive.kobalt[700],  // #1A3898
    },

    // ── Neutral (먹빛 — 반전)
    neutral: {
      primary:  '#E8D8B8',
      subtle:   '#A89880',
      muted:    '#706050',
      light:    '#3A3028',
      lightest: '#252018',
    },
  },
} as const


// ─────────────────────────────────────────
// 3. EMOTION CSS THEME OBJECT
// ─────────────────────────────────────────

export const createTheme = (mode: ColorMode) => {
  const s = semanticTokens[mode]

  return {
    mode,
    colors: {
      ...s,

      // ── 온기 맵 메타볼 전용 컬러
      metaball: {
        core:    primitive.juhong[500],       // #E85A18 — 중심 블롭
        spread1: primitive.juhong[200],       // #FF9A60 — 1차 확산
        spread2: primitive.hwanggeum[400],    // #F5A623 — 2차 확산
        accent1: primitive.jangmi[500],       // #D42058 — 포인트
        accent2: primitive.cheongrok[500],    // #1E7A68 — 외곽
        // 다크 전용 강조
        darkCore:    primitive.juhong[500],   // #E85A18 opacity .58
        darkSpread1: primitive.juhong[400],   // #F07030 opacity .42
        darkSpread2: primitive.hwanggeum[200],// #FFCC40 opacity .38
        darkAccent1: primitive.jangmi[200],   // #F06090 opacity .44
        darkAccent2: primitive.cheongrok[200],// #3DB898 opacity .38
      },
    },

    // ── 타이포그래피 스케일
    typography: {
      fontFamily: {
        display: '"Noto Serif KR", "Hahmlet", Georgia, serif',
        body:    '"Pretendard", "Noto Sans KR", system-ui, sans-serif',
        mono:    '"JetBrains Mono", "Fira Code", monospace',
      },
      fontSize: {
        xs:   '0.75rem',   // 12px
        sm:   '0.875rem',  // 14px
        base: '1rem',      // 16px
        lg:   '1.125rem',  // 18px
        xl:   '1.25rem',   // 20px
        '2xl':'1.5rem',    // 24px
        '3xl':'1.875rem',  // 30px
        '4xl':'2.25rem',   // 36px
      },
      fontWeight: {
        regular: 400,
        medium:  500,
        semibold:600,
        bold:    700,
      },
      lineHeight: {
        tight:  1.25,
        normal: 1.6,
        loose:  1.8,
      },
    },

    // ── 스페이싱 스케일
    spacing: {
      0:    '0',
      1:    '0.25rem',   // 4px
      2:    '0.5rem',    // 8px
      3:    '0.75rem',   // 12px
      4:    '1rem',      // 16px
      5:    '1.25rem',   // 20px
      6:    '1.5rem',    // 24px
      8:    '2rem',      // 32px
      10:   '2.5rem',    // 40px
      12:   '3rem',      // 48px
      16:   '4rem',      // 64px
      20:   '5rem',      // 80px
      24:   '6rem',      // 96px
    },

    // ── 보더 반경
    borderRadius: {
      sm:   '6px',
      md:   '10px',
      lg:   '14px',
      xl:   '18px',
      '2xl':'24px',
      full: '9999px',
    },

    // ── 그림자 (라이트/다크 분기)
    shadow: mode === 'light' ? {
      sm:  '0 1px 3px rgba(42, 26, 10, 0.08)',
      md:  '0 4px 12px rgba(42, 26, 10, 0.10)',
      lg:  '0 8px 24px rgba(42, 26, 10, 0.12)',
      xl:  '0 16px 48px rgba(42, 26, 10, 0.14)',
      glow:'0 0 24px rgba(232, 90, 24, 0.30)',  // 주홍 글로우
    } : {
      sm:  '0 1px 3px rgba(0, 0, 0, 0.30)',
      md:  '0 4px 12px rgba(0, 0, 0, 0.40)',
      lg:  '0 8px 24px rgba(0, 0, 0, 0.50)',
      xl:  '0 16px 48px rgba(0, 0, 0, 0.60)',
      glow:'0 0 32px rgba(240, 112, 48, 0.40)',  // 다크 주홍 글로우
    },

    // ── 트랜지션
    transition: {
      fast:   'all 0.15s ease',
      normal: 'all 0.25s ease',
      slow:   'all 0.40s ease',
      spring: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
    },

    // ── z-index 스케일
    zIndex: {
      base:    0,
      raised:  10,
      overlay: 100,
      modal:   200,
      toast:   300,
      tooltip: 400,
    },
  } as const
}

export type OnmaruTheme = ReturnType<typeof createTheme>

// 기본 인스턴스
export const lightTheme = createTheme('light')
export const darkTheme  = createTheme('dark')
