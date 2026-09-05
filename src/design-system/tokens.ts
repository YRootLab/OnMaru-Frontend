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

// 라이트 전용 — 맑고 생생한 한국 전통 현대화 컬러 램프
export const lightPalette = {
  // 🔴 단청 주홍 — 맑고 생동감 넘치는 비비드 주홍 / 대표 액션 컬러
  juhong: {
    50: '#FFF3EB', 100: '#FFE0D1', 200: '#FFBA99', 400: '#FF7842',
    500: '#FF5414', 700: '#D93600', 900: '#7A1A00',
  },
  // 🟢 대청 청록 — 청량하고 싱그러운 에메랄드 청록 / 내비게이션 및 지도
  cheongrok: {
    50: '#E8FAF3', 100: '#C0F3DF', 200: '#82E7C3', 400: '#26CF9A',
    500: '#00B882', 700: '#00825B', 900: '#004530',
  },
  // 🟡 황금 기와 — 찬란하고 따스하게 빛나는 골든 앰버 / 배지, 별점, 장터용
  hwanggeum: {
    50: '#FFF9E6', 100: '#FFF0B8', 200: '#FFDE70', 400: '#FFBC1A',
    500: '#FFA000', 700: '#D47F00', 900: '#704000',
  },
  // 🌸 연지 장미 — 꽃잎처럼 화사하고 맑은 코랄 로즈 / 도슨트, 오디 API용
  jangmi: {
    50: '#FFF0F4', 100: '#FFD4E1', 200: '#FFA3BF', 400: '#FF5E8E',
    500: '#FF2A6D', 700: '#D40D4E', 900: '#6E0025',
  },
  // 🔵 청화 코발트 — 청화백자처럼 청명하고 시원한 울트라 코발트 블루 / 정보 안내, 링크, 데이터용
  kobalt: {
    50: '#EFF4FF', 100: '#DBE8FE', 200: '#B8D3FD', 400: '#6099FC',
    500: '#2F68FF', 700: '#1748CF', 900: '#092270',
  },
} as const;

// 다크 전용 — 다크 서피스(#1C1A17, #191f28) 위에서 선명하고 또렷하게 빛나는 비비드 램프
export const darkPalette = {
  juhong:   { 50: '#FFF5EE', 100: '#FFE4D6', 200: '#FFBD9E', 400: '#FF7E4A', 500: '#FF5B1D', 700: '#B83508', 900: '#521400' },
  cheongrok:{ 50: '#ECFAF5', 100: '#C4F3E2', 200: '#8AE8C6', 400: '#2CD69F', 500: '#00BF88', 700: '#007D58', 900: '#003827' },
  hwanggeum:{ 50: '#FFF9E6', 100: '#FFF0B8', 200: '#FFDE73', 400: '#FFBE1F', 500: '#FFA70A', 700: '#B87200', 900: '#4D2C00' },
  jangmi:   { 50: '#FFF0F5', 100: '#FFD6E3', 200: '#FFA7C4', 400: '#FF6393', 500: '#FF3375', 700: '#BD124B', 900: '#4D001C' },
  kobalt:   { 50: '#F0F5FF', 100: '#DCE8FF', 200: '#BAD4FF', 400: '#6B9EFF', 500: '#3B77FF', 700: '#1E50C7', 900: '#08205C' },
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
    app:      '#1C1A17',  // 전통 먹빛 마루
    surface:  '#24211D',  // 먹빛 결
    card:     '#2D2924',  // 먹빛 카드
    elevated: '#3A352E',  // 먹빛 부유
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
        serif: '"SpoqaHanSansNeo", system-ui, sans-serif',
        traditional: '"ChungjuKimsaeng", "SpoqaHanSansNeo", serif',
      },
      fontSize: {
        xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem',
        xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem',
      },
      mobile: {
        d1: '56px', d2: '36px', d3: '32px',
        h1: '28px', h2: '24px', h3: '20px',
        p1: '18px', p2: '16px', p3: '14px', p4: '12px',
        headline: '18px', headlineCaps: '14px', inputField: '16px',
      },
      pc: {
        d1: '92px', d2: '64px', d3: '40px',
        h1: '28px', h2: '24px', h3: '18px',
        p1: '18px', p2: '16px', p3: '14px', p4: '12px',
        headline: '18px', headlineCaps: '14px', inputField: '16px',
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

    breakpoints: {
      sm: '768px',
      md: '1024px',
      lg: '1280px',
    },

    layout: {
      maxWidth: '1340px',
      margin: {
        sm: '16px', // Mobile (< 768px)
        md: '16px', // Tablet (768px ~ 1024px)
        lg: 'auto', // Large Desktop (>= 1280px, 당근 레이아웃: 0 auto)
      },
      padding: {
        sm: '16px',
        md: '16px',
        lg: '16px',
      },
      gutter: {
        sm: '16px',
        md: '24px',
        lg: '32px',
      },
      columns: {
        sm: 4,
        md: 8,
        lg: 12,
      },
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