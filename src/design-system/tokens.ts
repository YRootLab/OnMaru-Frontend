// ============================================================
// 온마루 컬러 토큰 (공용 7대 패밀리 & 시맨틱 시스템)
// ============================================================

// ------------------------------------------------------------
// 1. 공용 7대 계열 팔레트
// ------------------------------------------------------------

export const palette = {
  // 🔴 빨강 — 단풍 레드 (에러 / 경고)
  danpung: {
    50: '#FFF1F0', 100: '#FFE4E1', 200: '#FFC1BA', 400: '#FF6B61',
    500: '#FF3B30', 700: '#D62015', 900: '#7A0C05',
  },
  // 🟠 주황 — 단청 주홍 (메인 액션)
  juhong: {
    50: '#FFF4EB', 100: '#FFE4D1', 200: '#FFBD99', 400: '#FF7830',
    500: '#FF5500', 700: '#D94000', 900: '#7A2400',
  },
  // 🟡 노랑 — 황금 기와 (별점 / 하이라이트)
  hwanggeum: {
    50: '#FFFBE5', 100: '#FFF3BD', 200: '#FFE57A', 400: '#FFD026',
    500: '#FFB800', 700: '#D99400', 900: '#704800',
  },
  // 🟢 초록 — 대청 청록 (내비게이션 / 성공)
  cheongrok: {
    50: '#E6FAF2', 100: '#BEF4DC', 200: '#82E8BD', 400: '#26D68D',
    500: '#00C471', 700: '#009454', 900: '#004D2B',
  },
  // 🔵 파랑 — 청화 코발트 (정보 안내)
  kobalt: {
    50: '#EBF2FF', 100: '#C7DAFF', 200: '#8FB5FF', 400: '#4D82FF',
    500: '#1B5BFF', 700: '#0C44D9', 900: '#052275',
  },
  // 🟣 보라 — 자하 바이올렛 (야경 / 악센트)
  jaha: {
    50: '#F6EBFF', 100: '#E5C7FF', 200: '#CA8FFF', 400: '#A647FF',
    500: '#8B1BFF', 700: '#670CD9', 900: '#360575',
  },
  // 🌸 분홍 — 연지 로즈 (문화재 / 도슨트)
  jangmi: {
    50: '#FFF0F6', 100: '#FFD4E5', 200: '#FFA3C7', 400: '#FF5C9F',
    500: '#FF2A85', 700: '#D40D63', 900: '#6E0030',
  },
} as const;

// 하위 호환 별칭
export const lightPalette = palette;
export const darkPalette  = palette;

// ------------------------------------------------------------
// 2. 먹빛 중성색 (6단계)
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
// 3. 표면 배경
// ------------------------------------------------------------
export const surface = {
  light: {
    base:     '#fafafa',  // 화선지 바탕
    surface:  '#f0f0f0',  // 한지 표면
    card:     '#FFFFFF',  // 카드 바탕
    elevated: '#FFFFFF',  // 팝업 / 모달
  },
  dark: {
    app:      '#1C1A17',  // 먹빛 마루
    surface:  '#24211D',  // 먹빛 표면
    card:     '#2D2924',  // 먹빛 카드
    elevated: '#3A352E',  // 먹빛 팝업
  },
} as const;

// 글래스 효과
export const glass = {
  light: {
    thin:    'rgba(255, 255, 255, 0.65)',
    regular: 'rgba(255, 255, 255, 0.82)',
    thick:   'rgba(255, 255, 255, 0.94)',
    border:  'rgba(25, 31, 40, 0.08)',
    glow:    '0 8px 32px 0 rgba(25, 31, 40, 0.08)',
  },
  dark: {
    thin:    'rgba(28, 26, 23, 0.65)',
    regular: 'rgba(36, 33, 29, 0.82)',
    thick:   'rgba(45, 41, 36, 0.94)',
    border:  'rgba(255, 255, 255, 0.10)',
    glow:    '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
  },
} as const;

// 그라데이션
export const gradients = {
  dancheong:      `linear-gradient(135deg, ${palette.juhong[500]} 0%, ${palette.hwanggeum[500]} 100%)`, // 주황 → 노랑
  cheongrokBlue:  `linear-gradient(135deg, ${palette.cheongrok[500]} 0%, ${palette.kobalt[500]} 100%)`,  // 초록 → 파랑
  jahaRose:       `linear-gradient(135deg, ${palette.jaha[500]} 0%, ${palette.jangmi[500]} 100%)`,       // 보라 → 분홍
  danpungJuhong:  `linear-gradient(135deg, ${palette.danpung[500]} 0%, ${palette.juhong[500]} 100%)`,   // 빨강 → 주황
  light: {
    dancheong:      `linear-gradient(135deg, ${palette.juhong[500]} 0%, ${palette.hwanggeum[500]} 100%)`,
    cheongrokBlue:  `linear-gradient(135deg, ${palette.cheongrok[500]} 0%, ${palette.kobalt[500]} 100%)`,
    jahaRose:       `linear-gradient(135deg, ${palette.jaha[500]} 0%, ${palette.jangmi[500]} 100%)`,
    danpungJuhong:  `linear-gradient(135deg, ${palette.danpung[500]} 0%, ${palette.juhong[500]} 100%)`,
  },
  dark: {
    dancheong:      `linear-gradient(135deg, ${palette.juhong[400]} 0%, ${palette.hwanggeum[400]} 100%)`,
    cheongrokBlue:  `linear-gradient(135deg, ${palette.cheongrok[400]} 0%, ${palette.kobalt[400]} 100%)`,
    jahaRose:       `linear-gradient(135deg, ${palette.jaha[400]} 0%, ${palette.jangmi[400]} 100%)`,
    danpungJuhong:  `linear-gradient(135deg, ${palette.danpung[400]} 0%, ${palette.juhong[400]} 100%)`,
  },
} as const;

// ------------------------------------------------------------
// 4. 시맨틱 역할 토큰
// ------------------------------------------------------------

export type ColorMode = 'light' | 'dark';
/** 사용자가 고르는 값 — 'system'은 OS 설정을 그대로 따라간다. */
export type ThemePreference = ColorMode | 'system';

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
      primary:        palette.juhong[500],
      primaryHover:   palette.juhong[400],
      primaryPressed: palette.juhong[700],
      primaryBg:      palette.juhong[50],
      primarySubtle:  palette.juhong[100],
    },
    nav: {
      primary:        palette.cheongrok[500],
      primaryHover:   palette.cheongrok[400],
      primaryPressed: palette.cheongrok[700],
      primaryBg:      palette.cheongrok[50],
      primarySubtle:  palette.cheongrok[100],
    },
    badge: {
      star:        palette.hwanggeum[400],
      starText:    palette.hwanggeum[700],
      starPressed: palette.hwanggeum[700],
      starBg:      palette.hwanggeum[50],
      starSubtle:  palette.hwanggeum[100],
    },
    docent: {
      primary:        palette.jangmi[500],
      primaryHover:   palette.jangmi[400],
      primaryPressed: palette.jangmi[700],
      primaryBg:      palette.jangmi[50],
      primarySubtle:  palette.jangmi[100],
    },
    info: {
      primary:        palette.kobalt[500],
      primaryHover:   palette.kobalt[400],
      primaryPressed: palette.kobalt[700],
      primaryBg:      palette.kobalt[50],
      primarySubtle:  palette.kobalt[100],
    },
    success: {
      primary:        palette.cheongrok[500],
      primaryHover:   palette.cheongrok[400],
      primaryPressed: palette.cheongrok[700],
      primaryBg:      palette.cheongrok[50],
      primarySubtle:  palette.cheongrok[100],
    },
    warning: {
      primary:        palette.hwanggeum[500],
      primaryHover:   palette.hwanggeum[400],
      primaryPressed: palette.hwanggeum[700],
      primaryBg:      palette.hwanggeum[50],
      primarySubtle:  palette.hwanggeum[100],
    },
    error: {
      primary:        palette.danpung[500],
      primaryHover:   palette.danpung[400],
      primaryPressed: palette.danpung[700],
      primaryBg:      palette.danpung[50],
      primarySubtle:  palette.danpung[100],
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
      primary:        palette.juhong[500],
      primaryHover:   palette.juhong[400],
      primaryPressed: palette.juhong[700],
      primaryBg:      palette.juhong[900],
      primarySubtle:  palette.juhong[700],
    },
    nav: {
      primary:        palette.cheongrok[500],
      primaryHover:   palette.cheongrok[400],
      primaryPressed: palette.cheongrok[700],
      primaryBg:      palette.cheongrok[900],
      primarySubtle:  palette.cheongrok[700],
    },
    badge: {
      star:        palette.hwanggeum[400],
      starText:    palette.hwanggeum[200],
      starPressed: palette.hwanggeum[700],
      starBg:      palette.hwanggeum[900],
      starSubtle:  palette.hwanggeum[700],
    },
    docent: {
      primary:        palette.jangmi[500],
      primaryHover:   palette.jangmi[400],
      primaryPressed: palette.jangmi[700],
      primaryBg:      palette.jangmi[900],
      primarySubtle:  palette.jangmi[700],
    },
    info: {
      primary:        palette.kobalt[500],
      primaryHover:   palette.kobalt[400],
      primaryPressed: palette.kobalt[700],
      primaryBg:      palette.kobalt[900],
      primarySubtle:  palette.kobalt[700],
    },
    success: {
      primary:        palette.cheongrok[500],
      primaryHover:   palette.cheongrok[400],
      primaryPressed: palette.cheongrok[700],
      primaryBg:      palette.cheongrok[900],
      primarySubtle:  palette.cheongrok[700],
    },
    warning: {
      primary:        palette.hwanggeum[500],
      primaryHover:   palette.hwanggeum[400],
      primaryPressed: palette.hwanggeum[700],
      primaryBg:      palette.hwanggeum[900],
      primarySubtle:  palette.hwanggeum[700],
    },
    error: {
      primary:        palette.danpung[500],
      primaryHover:   palette.danpung[400],
      primaryPressed: palette.danpung[700],
      primaryBg:      palette.danpung[900],
      primarySubtle:  palette.danpung[700],
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
// 5. 타이포그래피 스케일 (라이트/다크 공통 — 글자 크기는 모드를 안 탄다)
// ------------------------------------------------------------

// 역할별 글자 크기 — 페이지가 달라도 "제목은 제목끼리, 본문은 본문끼리" 같은 값을 쓰기 위한
// 유일한 기준 스케일이다. 여기 없는 임의의 px 값을 새로 만들지 말고 이 중에서 고른다.
// styled-component에서는 theme prop 없이도 `import { fontSize } from './tokens'`로 바로 쓸 수 있다.
export const fontSize = {
  micro: '0.625rem',  // 10px — 배지 · 타임스탬프 · 초소형 라벨
  xs:    '0.75rem',   // 12px — 캡션 · 보조/메타 텍스트
  sm:    '0.875rem',  // 14px — 본문(작게) · 카드/리스트 제목
  base:  '1rem',      // 16px — 본문
  lg:    '1.125rem',  // 18px — 강조 본문 · 소제목
  xl:    '1.25rem',   // 20px — 카드 섹션 제목
  '2xl': '1.5rem',    // 24px — 섹션 제목
  '3xl': '1.875rem',  // 30px — 페이지 제목
  '4xl': '2.25rem',   // 36px — 히어로 제목(모바일)
  '5xl': '3rem',      // 48px — 히어로 제목(PC)
  '6xl': '3.75rem',   // 60px — 랜딩 초대형 타이틀
} as const;

// 뷰포트에 따라 흐르는 제목용 프리셋 — 페이지마다 clamp() 범위를 따로 만들지 않고 여기서 고른다.
// (예: HanokHero의 히어로 제목과 HanokMonthly의 히어로 제목이 예전엔 각자 다른 clamp 값을 썼다.)
export const fluidHeading = {
  display: 'clamp(2rem, 5vw, 3.5rem)',         // 32px → 56px — 최상위 페이지 타이틀
  hero:    'clamp(1.75rem, 4vw, 2.625rem)',    // 28px → 42px — 섹션 히어로 대제목
  feature: 'clamp(1.5rem, 3.2vw, 2.25rem)',    // 24px → 36px — 강조 카드 · 모달 제목
  section: 'clamp(1.3125rem, 2.4vw, 1.75rem)', // 21px → 28px — 리스트형 섹션 헤더
  card:    'clamp(1.1875rem, 2.2vw, 1.5rem)',  // 19px → 24px — 카드 · 패널 제목
  label:   'clamp(1rem, 1.7vw, 1.3125rem)',    // 16px → 21px — 소형 카드 이름표 · 라벨형 제목
} as const;

// ------------------------------------------------------------
// 6. 테마 생성 함수
// ------------------------------------------------------------

export const createTheme = (mode: ColorMode) => {
  const s = semanticTokens[mode];

  return {
    mode,
    colors: {
      ...s,
      palette,
      glass: glass[mode],
      gradients: gradients[mode],
      metaball: {
        core:        palette.juhong[500],
        spread1:     palette.juhong[200],
        spread2:     palette.hwanggeum[400],
        accent1:     palette.jangmi[500],
        accent2:     palette.cheongrok[500],
        darkCore:    palette.juhong[500],     // 코어
        darkSpread1: palette.juhong[400],     // 퍼짐 1
        darkSpread2: palette.hwanggeum[400],  // 퍼짐 2
        darkAccent1: palette.jangmi[400],     // 악센트 1
        darkAccent2: palette.cheongrok[400],  // 악센트 2
      },
    },

    typography: {
      fontFamily: {
        sans: '"Spoqa Han Sans Neo", system-ui, sans-serif',
        serif: '"GyeongbokgungSumunjangTitle", serif',
        traditional: '"GyeongbokgungSumunjangTitle", "Spoqa Han Sans Neo", serif',
      },
      fontSize,
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
      // Spoqa Han Sans Neo가 실제로 가진 굵기는 100/300/400/500/700뿐이다.
      // 600(semibold)은 없어서 CSS 폰트 매칭이 700으로 올려 잡으므로 넣지 않는다.
      fontWeight: { thin: 100, light: 300, regular: 400, medium: 500, bold: 700 },
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
        sm: '16px', // 모바일
        md: '16px', // 태블릿
        lg: 'auto', // 데스크톱
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

    // 라이트 그림자
    shadow: mode === 'light' ? {
      sm:   '0 1px 3px rgba(25, 31, 40, 0.05)',
      md:   '0 4px 12px rgba(25, 31, 40, 0.07)',
      lg:   '0 8px 24px rgba(25, 31, 40, 0.09)',
      xl:   '0 16px 48px rgba(25, 31, 40, 0.11)',
      glow: '0 0 20px rgba(232, 90, 24, 0.18)',
    // 다크 그림자
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