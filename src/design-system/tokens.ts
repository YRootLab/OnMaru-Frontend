// ============================================================
// 온마루 컬러 토큰 — Light / Dark
//
// 구조:
//   lightPalette   — 라이트 전용 액센트 5색 (Hue별 7단계)
//   darkPalette    — 다크 전용 액센트 5색 (OKLCH 검증, 7단계)
//   meok           — 라이트/다크 공용 중성 그레이 (6단계)
//   surface        — 배경 표면 토큰 (light / dark)
//   semanticTokens — 역할별 매핑
//   createTheme    — 최종 테마 객체
// ============================================================

// ------------------------------------------------------------
// 1. 액센트 팔레트
// ------------------------------------------------------------

// 라이트 전용 — 따뜻한 한국 전통색 램프
export const lightPalette = {
  // 🔴 단청 주홍 — Hue 21° / 대표 액션 컬러
  juhong: {
    50: '#FFF0E6', 100: '#FFCBA8', 200: '#FF9A60', 400: '#F07030',
    500: '#E85A18', 700: '#A03A0A', 900: '#3A1004',
  },
  // 🟢 대청 청록 — Hue 168° / 내비게이션 및 지도
  cheongrok: {
    50: '#E6F5F0', 100: '#90D4C0', 200: '#3DB898', 400: '#249878',
    500: '#1E7A68', 700: '#0E5848', 900: '#042820',
  },
  // 🟡 황금 기와 — Hue 38° / 배지, 별점, 장터용
  hwanggeum: {
    50: '#FFF8E0', 100: '#FFE898', 200: '#FFCC40', 400: '#F5A623',
    500: '#C07808', 700: '#7A4C04', 900: '#2C1800',
  },
  // 🌸 연지 장미 — Hue 340° / 도슨트, 오디 API용
  jangmi: {
    50: '#FFF0F4', 100: '#F8A8C0', 200: '#F06090', 400: '#E03870',
    500: '#D42058', 700: '#8A1038', 900: '#300010',
  },
  // 🔵 청화 코발트 — Hue 224° / 정보 안내, 링크, 데이터용
  kobalt: {
    50: '#EEF3FF', 100: '#A8C0F8', 200: '#6088F0', 400: '#4068E8',
    500: '#2B5CE6', 700: '#1A3898', 900: '#081040',
  },
} as const;

// 다크 전용 — OKLCH 기반 재생성 (배경 #191f28 대비 명도 대비 >= 5:1 검증 완료)
export const darkPalette = {
  juhong:   { 50: '#FFF2ED', 100: '#FFCEBD', 200: '#FFA07F', 400: '#F87443', 500: '#F85700', 700: '#973100', 900: '#1E0000' },
  cheongrok:{ 50: '#ECF9F1', 100: '#A9E2C1', 200: '#6FCF9C', 400: '#5DB687', 500: '#00A76A', 700: '#2A5F44', 900: '#000E04' },
  hwanggeum:{ 50: '#FFF3E7', 100: '#FFE9D3', 200: '#FFDCB8', 400: '#FFCA91', 500: '#FAAA49', 700: '#8B5A1D', 900: '#160400' },
  jangmi:   { 50: '#FFF1F3', 100: '#FFBBC3', 200: '#FF859A', 400: '#FF5F81', 500: '#F84E76', 700: '#961F3F', 900: '#200003' },
  kobalt:   { 50: '#F0F5FF', 100: '#B9D0FF', 200: '#7FA7FF', 400: '#6090FF', 500: '#5A89F6', 700: '#2044A4', 900: '#00012E' },
} as const;

// ------------------------------------------------------------
// 2. 공용 중성색 (먹빛) — 라이트/다크 모두 참조
// ------------------------------------------------------------
export const meok = {
  100: '#fafafa',
  200: '#f0f0f0',
  400: '#b0b8c1',
  500: '#8b95a1',
  700: '#4e5968',
  900: '#191f28',
} as const;

// ------------------------------------------------------------
// 3. 표면 및 배경 (Surface)
// ------------------------------------------------------------
export const surface = {
  light: {
    base:     '#fafafa',  // 화선지 오프화이트
    surface:  '#f0f0f0',  // 한지 면
    card:     '#FFFFFF',  // 카드 배경
    elevated: '#FFFFFF',  // 팝업/모달 배경
  },
  dark: {
    app:      '#0E0B07',  // 먹빛 마루
    surface:  '#1A1510',  // 먹빛 결
    card:     '#252018',  // 먹빛 카드
    elevated: '#342C22',  // 먹빛 부유
  },
} as const;

// ------------------------------------------------------------
// 4. 시맨틱 역할별 토큰 매핑
// ------------------------------------------------------------

export type ColorMode = 'light' | 'dark';

export const semanticTokens = {
  light: {
    bg: {
      app:      surface.light.base,
      surface:  surface.light.surface,
      card:     surface.light.card,
      elevated: surface.light.elevated,
    },
    border: {
      subtle:  meok[200],
      default: meok[400],
    },
    text: {
      primary:   meok[900],
      secondary: meok[700],
      muted:     meok[500],
      inverse:   '#FFFFFF',
    },
    action: {
      primary:        lightPalette.juhong[500],
      primaryHover:   lightPalette.juhong[400],
      primaryPressed: lightPalette.juhong[700],
      primaryBg:      lightPalette.juhong[50],
      primarySubtle:  lightPalette.juhong[100],
    },
    nav: {
      primary:        lightPalette.cheongrok[500],
      primaryHover:   lightPalette.cheongrok[400],
      primaryPressed: lightPalette.cheongrok[700],
      primaryBg:      lightPalette.cheongrok[50],
      primarySubtle:  lightPalette.cheongrok[100],
    },
    badge: {
      star:        lightPalette.hwanggeum[400],
      starText:    lightPalette.hwanggeum[500],
      starPressed: lightPalette.hwanggeum[700],
      starBg:      lightPalette.hwanggeum[50],
      starSubtle:  lightPalette.hwanggeum[100],
    },
    docent: {
      primary:        lightPalette.jangmi[500],
      primaryHover:   lightPalette.jangmi[400],
      primaryPressed: lightPalette.jangmi[700],
      primaryBg:      lightPalette.jangmi[50],
      primarySubtle:  lightPalette.jangmi[100],
    },
    info: {
      primary:        lightPalette.kobalt[500],
      primaryHover:   lightPalette.kobalt[400],
      primaryPressed: lightPalette.kobalt[700],
      primaryBg:      lightPalette.kobalt[50],
      primarySubtle:  lightPalette.kobalt[100],
    },
    neutral: {
      primary:  meok[700],
      subtle:   meok[500],
      muted:    meok[400],
      light:    meok[200],
      lightest: meok[100],
    },
  },

  dark: {
    bg: {
      app:      surface.dark.app,
      surface:  surface.dark.surface,
      card:     surface.dark.card,
      elevated: surface.dark.elevated,
    },
    border: {
      subtle:  meok[700],
      default: meok[900],
    },
    text: {
      primary:   meok[100],
      secondary: meok[400],
      muted:     meok[500],
      inverse:   surface.dark.app,
    },
    action: {
      primary:        darkPalette.juhong[500],
      primaryHover:   darkPalette.juhong[200],
      primaryPressed: darkPalette.juhong[700],
      primaryBg:      darkPalette.juhong[900],
      primarySubtle:  darkPalette.juhong[700],
    },
    nav: {
      primary:        darkPalette.cheongrok[500],
      primaryHover:   darkPalette.cheongrok[200],
      primaryPressed: darkPalette.cheongrok[700],
      primaryBg:      darkPalette.cheongrok[900],
      primarySubtle:  darkPalette.cheongrok[700],
    },
    badge: {
      star:        darkPalette.hwanggeum[500],
      starText:    darkPalette.hwanggeum[200],
      starPressed: darkPalette.hwanggeum[700],
      starBg:      darkPalette.hwanggeum[900],
      starSubtle:  darkPalette.hwanggeum[700],
    },
    docent: {
      primary:        darkPalette.jangmi[500],
      primaryHover:   darkPalette.jangmi[200],
      primaryPressed: darkPalette.jangmi[700],
      primaryBg:      darkPalette.jangmi[900],
      primarySubtle:  darkPalette.jangmi[700],
    },
    info: {
      primary:        darkPalette.kobalt[500],
      primaryHover:   darkPalette.kobalt[200],
      primaryPressed: darkPalette.kobalt[700],
      primaryBg:      darkPalette.kobalt[900],
      primarySubtle:  darkPalette.kobalt[700],
    },
    neutral: {
      primary:  meok[200],
      subtle:   meok[400],
      muted:    meok[500],
      light:    meok[700],
      lightest: meok[900],
    },
  },
} as const;

export type SemanticToken = keyof typeof semanticTokens.light;

// ------------------------------------------------------------
// 5. 최종 테마 객체 (Emotion CSS용)
// ------------------------------------------------------------

export const createTheme = (mode: ColorMode) => {
  const s = semanticTokens[mode];

  return {
    mode,
    colors: {
      ...s,
      metaball: {
        core:        lightPalette.juhong[500],
        spread1:     lightPalette.juhong[200],
        spread2:     lightPalette.hwanggeum[400],
        accent1:     lightPalette.jangmi[500],
        accent2:     lightPalette.cheongrok[500],
        darkCore:    darkPalette.juhong[500],     // 불투명도 .58
        darkSpread1: darkPalette.juhong[400],     // 불투명도 .42
        darkSpread2: darkPalette.hwanggeum[400],  // 불투명도 .38
        darkAccent1: darkPalette.jangmi[400],     // 불투명도 .44
        darkAccent2: darkPalette.cheongrok[400],  // 불투명도 .38
      },
    },

    typography: {
      fontFamily: {
        sans: '"SpoqaHanSansNeo", system-ui, sans-serif',
      },
      fontSize: {
        xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem',
        xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem',
      },
      fontWeight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
      lineHeight:  { tight: 1.25, normal: 1.6, loose: 1.8 },
    },

    spacing: {
      0: '0',       1: '0.25rem', 2: '0.5rem',  3: '0.75rem',
      4: '1rem',    5: '1.25rem', 6: '1.5rem',  8: '2rem',
      10: '2.5rem', 12: '3rem',  16: '4rem',   20: '5rem', 24: '6rem',
    },

    borderRadius: {
      sm: '6px', md: '10px', lg: '14px', xl: '18px', '2xl': '24px', full: '9999px',
    },

    // 라이트 그림자 — meok[900] 기반, 채도 있는 부드러운 그림자
    shadow: mode === 'light' ? {
      sm:   '0 1px 3px rgba(25, 31, 40, 0.05)',
      md:   '0 4px 12px rgba(25, 31, 40, 0.07)',
      lg:   '0 8px 24px rgba(25, 31, 40, 0.09)',
      xl:   '0 16px 48px rgba(25, 31, 40, 0.11)',
      glow: '0 0 20px rgba(232, 90, 24, 0.18)',
    // 다크 그림자 — 순수 검정 대신 meok[900] 기반, 낮은 불투명도
    } : {
      sm:   '0 1px 4px rgba(25, 31, 40, 0.18)',
      md:   '0 4px 12px rgba(25, 31, 40, 0.24)',
      lg:   '0 8px 24px rgba(25, 31, 40, 0.30)',
      xl:   '0 16px 48px rgba(25, 31, 40, 0.36)',
      glow: '0 0 20px rgba(248, 87, 0, 0.24)',
    },

    transition: {
      fast:   'all 0.15s ease',
      normal: 'all 0.25s ease',
      slow:   'all 0.40s ease',
      spring: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
    },

    zIndex: { base: 0, raised: 10, overlay: 100, modal: 200, toast: 300, tooltip: 400 },
  } as const;
};

export type OnmaruTheme = ReturnType<typeof createTheme>;

export const lightTheme = createTheme('light');
export const darkTheme  = createTheme('dark');