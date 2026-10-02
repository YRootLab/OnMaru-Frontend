



import { px } from 'framer-motion';





export const palette = {

  danpung: {
    50: '#FFF1EF', 100: '#FFD6D2', 200: '#FFA09A', 300: '#FF7570',
    400: '#FF4D45', 500: '#FF2D22', 600: '#E81A0E', 700: '#C21208',
    800: '#8C0D06', 900: '#620904',
  },

  juhong: {
    25:  '#FFF9F6',
    50:  '#FFF1E8',
    100: '#FFD9C0',
    200: '#FFB380',
    300: '#FF8840',
    400: '#FF6A10',
    500: '#FF5500',
    600: '#E64C00',
    700: '#CC4300',
    800: '#A33600',
    900: '#7A2800',
    950: '#4D1800',
  },

  hwanggeum: {
    50: '#FFFCE3', 100: '#FFF3A3', 200: '#FFE84D', 300: '#FFEC28',
    400: '#FEE100', 500: '#FEDC00', 600: '#E0C200', 700: '#C2A600',
    800: '#8F7C00', 900: '#665600',
  },

  cheongrok: {
    50: '#E5FBF2', 100: '#B8F7DC', 200: '#70EDBB', 300: '#28E89C',
    400: '#00D97F', 500: '#00C471', 600: '#00A962', 700: '#009452',
    800: '#00703D', 900: '#004D2A',
  },

  kobalt: {
    50: '#EBF2FF', 100: '#C2DCFF', 200: '#85B8FF', 300: '#5EA4FF',
    400: '#3D8FFF', 500: '#0A6EFF', 600: '#0060E8', 700: '#0050CC',
    800: '#003DA6', 900: '#002B80',
  },

  jaha: {
    50: '#F5EBFF', 100: '#E0BFFF', 200: '#C07FFF', 300: '#AC55FF',
    400: '#9933FF', 500: '#8000FF', 600: '#6E00E6', 700: '#5C00CC',
    800: '#470099', 900: '#2E0066',
  },

  jangmi: {
    50: '#FFF0F5', 100: '#FFD0E5', 200: '#FF94C2', 300: '#FF6AAB',
    400: '#FF3D8F', 500: '#FF0A72', 600: '#E60065', 700: '#CC0058',
    800: '#990042', 900: '#66002C',
  },

  // 남색 (藍色) — dark navy/indigo scale, dark-mode base
  nam: {
    100: '#D8E5FF',
    200: '#ADC8FF',
    300: '#78A8FF',
    400: '#4285FF',
    500: '#1562FF',
    600: '#0D4ECC',
    700: '#083BA0',
    800: '#042874',
    900: '#021648',
  },
} as const;


export const lightPalette = palette;
export const darkPalette  = palette;




export const meok = {
  100: '#fafafa',
  200: '#f0f0f0',
  300: '#d9d9d7',
  400: '#b0b8c1',
  500: '#8b95a1',
  600: '#65707c',
  700: '#4e5968',
  800: '#303842',
  900: '#191f28',
} as const;




export const surface = {
  light: {
    base:     '#fafafa',
    surface:  '#f0f0f0',
    card:     '#FFFFFF',
    elevated: '#FFFFFF',
  },
  // elevation = white overlay on #0B1220 (MD dark theme 원칙)
  dark: {
    app:      '#0B1220',  // 0dp  baseline
    surface:  '#171E2B',  // 1dp  +5%  white overlay
    card:     '#212734',  // 4dp  +9%  white overlay
    elevated: '#282E3B',  // 8dp  +12% white overlay
  },
} as const;


export const glass = {
  light: {
    thin:    'rgba(255, 255, 255, 0.65)',
    regular: 'rgba(255, 255, 255, 0.82)',
    thick:   'rgba(255, 255, 255, 0.94)',
    border:  'rgba(25, 31, 40, 0.08)',
    glow:    '0 8px 32px 0 rgba(25, 31, 40, 0.08)',
  },
  dark: {
    thin:    'rgba(11, 18, 32, 0.65)',
    regular: 'rgba(23, 30, 43, 0.82)',
    thick:   'rgba(33, 39, 52, 0.94)',
    border:  'rgba(255, 255, 255, 0.12)',
    glow:    '0 8px 32px 0 rgba(0, 0, 0, 0.60)',
  },
} as const;





const REST_LIGHT = '0px 0px 3px rgba(0, 0, 0, 0.12)';
const HOVER_LIGHT = '0px 0px 3px rgba(0, 0, 0, 0.14)';
const REST_DARK = '0px 0px 3px rgba(255, 255, 255, 0.12)';
const HOVER_DARK = '0px 0px 3px rgba(255, 255, 255, 0.14)';

export const ringShadow = {
  light: {

    card: REST_LIGHT,
    button: REST_LIGHT,
    input: REST_LIGHT,

    cardHoverGlow: HOVER_LIGHT,
    buttonHover: HOVER_LIGHT,
    buttonHoverGlow: HOVER_LIGHT,

    focusJuhong: '0 0 0 1px rgba(255, 85, 0, 0.35), 0 0 0 4px rgba(255, 85, 0, 0.08), 0 4px 12px rgba(255, 85, 0, 0.08)',

    mapPanel: '0 8px 28px -4px rgba(0, 0, 0, 0.12), 0 2px 8px -2px rgba(0, 0, 0, 0.07)',
    mapChip:  REST_LIGHT,
  },
  dark: {
    card: REST_DARK,
    button: REST_DARK,
    input: REST_DARK,
    cardHoverGlow: HOVER_DARK,
    buttonHover: HOVER_DARK,
    buttonHoverGlow: HOVER_DARK,
    focusJuhong: '0 0 0 1px rgba(255, 110, 30, 0.45), 0 0 0 4px rgba(255, 110, 30, 0.15), 0 4px 16px rgba(255, 110, 30, 0.15)',

    mapPanel: '0 12px 32px -8px rgba(0, 0, 0, 0.72), 0 4px 12px -4px rgba(0, 0, 0, 0.55)',
    mapChip:  REST_DARK,
  },
} as const;


export const gradients = {
  dancheong:      `linear-gradient(135deg, ${palette.juhong[500]} 0%, ${palette.hwanggeum[500]} 100%)`,
  cheongrokBlue:  `linear-gradient(135deg, ${palette.cheongrok[500]} 0%, ${palette.kobalt[500]} 100%)`,
  jahaRose:       `linear-gradient(135deg, ${palette.jaha[500]} 0%, ${palette.jangmi[500]} 100%)`,
  danpungJuhong:  `linear-gradient(135deg, ${palette.danpung[500]} 0%, ${palette.juhong[500]} 100%)`,
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





export type ColorMode = 'light' | 'dark';

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
      primary:     meok[900],
      secondary:   meok[700],
      muted:       meok[500],
      inverse:     '#FFFFFF',
      hanokAccent: palette.juhong[500],
    },
    map: {
      stay:      palette.jangmi[600],
      food:      palette.cheongrok[700],
      learn:     palette.kobalt[600],
      play:      palette.jaha[500],
      etc:       meok[600],
      hanokMark: palette.juhong[500],
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
      emphasis: {
        bg: palette.juhong[500],
        fg: '#FFFFFF',
      },
    },
    docent: {
      primary:        palette.jangmi[500],
      primaryHover:   palette.jangmi[400],
      primaryPressed: palette.jangmi[700],
      primaryBg:      palette.jangmi[50],
      primarySubtle:  palette.jangmi[100],
    },
    info: {
      primary:        palette.cheongrok[500],
      primaryHover:   palette.cheongrok[400],
      primaryPressed: palette.cheongrok[700],
      primaryBg:      palette.cheongrok[50],
      primarySubtle:  palette.cheongrok[100],
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
      subtle:  'rgba(255, 255, 255, 0.12)',
      default: 'rgba(255, 255, 255, 0.22)',
    },
    text: {
      primary:     'rgba(255, 255, 255, 0.87)',
      secondary:   'rgba(255, 255, 255, 0.60)',
      muted:       'rgba(255, 255, 255, 0.38)',
      inverse:     surface.dark.app,
      hanokAccent: palette.juhong[400],
    },
    map: {
      stay:      palette.jangmi[500],
      food:      palette.cheongrok[600],
      learn:     palette.kobalt[500],
      play:      palette.jaha[400],
      etc:       meok[500],
      hanokMark: palette.juhong[500],
    },
    action: {
      primary:        palette.kobalt[200],   // 200-tone 탈채도, 링크·아이콘·포커스
      primaryHover:   palette.kobalt[100],
      primaryPressed: palette.kobalt[300],
      primaryBg:      'rgba(133, 184, 255, 0.12)',
      primarySubtle:  'rgba(133, 184, 255, 0.08)',
    },
    nav: {
      primary:        palette.cheongrok[200],
      primaryHover:   palette.cheongrok[100],
      primaryPressed: palette.cheongrok[300],
      primaryBg:      'rgba(112, 237, 187, 0.10)',
      primarySubtle:  'rgba(112, 237, 187, 0.07)',
    },
    badge: {
      star:        palette.hwanggeum[400],
      starText:    palette.hwanggeum[200],
      starPressed: palette.hwanggeum[700],
      starBg:      palette.hwanggeum[900],
      starSubtle:  palette.hwanggeum[700],
      emphasis: {
        bg: palette.juhong[500],
        fg: '#FFFFFF',
      },
    },
    docent: {
      primary:        palette.jangmi[500],
      primaryHover:   palette.jangmi[400],
      primaryPressed: palette.jangmi[700],
      primaryBg:      palette.jangmi[900],
      primarySubtle:  palette.jangmi[700],
    },
    info: {
      primary:        palette.cheongrok[500],
      primaryHover:   palette.cheongrok[400],
      primaryPressed: palette.cheongrok[700],
      primaryBg:      palette.cheongrok[900],
      primarySubtle:  palette.cheongrok[700],
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








export const fontSize = {
  micro: '0.625rem',
  xs:    '0.75rem',
  sm:    '0.875rem',
  base:  '1rem',
  lg:    '1.125rem',
  xl:    '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
  '6xl': '3.75rem',
} as const;



export const fluidHeading = {
  display: 'clamp(2rem, 5vw, 3.5rem)',
  hero:    'clamp(1.75rem, 4vw, 2.625rem)',
  feature: 'clamp(1.5rem, 3.2vw, 2.25rem)',
  section: 'clamp(1.3125rem, 2.4vw, 1.75rem)',
  card:    'clamp(1.1875rem, 2.2vw, 1.5rem)',
  label:   'clamp(1rem, 1.7vw, 1.3125rem)',
} as const;





export const fontFaces = {
  dohyun: `@font-face {
  font-family: 'Dohyun';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_one@1.0/BMDOHYEON.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
} as const;

export const fontFamily = {
  sans: '"Spoqa Han Sans Neo", system-ui, sans-serif',
  serif: '"Spoqa Han Sans Neo", system-ui, sans-serif',
  traditionalTitle: '"Spoqa Han Sans Neo", sans-serif',
  traditionalBody: '"Spoqa Han Sans Neo", sans-serif',
  traditional: '"Spoqa Han Sans Neo", sans-serif',
  dohyun: "'Dohyun', sans-serif",
} as const;

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
        darkCore:    palette.juhong[500],
        darkSpread1: palette.juhong[400],
        darkSpread2: palette.hwanggeum[400],
        darkAccent1: palette.jangmi[400],
        darkAccent2: palette.cheongrok[400],
      },
    },

    typography: {
      fontFaces,
      fontFamily,
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
      maxWidth: '1140px',
      margin: {
        sm: '16px',
        md: '16px',
        lg: 'auto',
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


    shadow: mode === 'light' ? {
      sm:   '0 1px 3px rgba(25, 31, 40, 0.05)',
      md:   '0 4px 12px rgba(25, 31, 40, 0.07)',
      lg:   '0 8px 24px rgba(25, 31, 40, 0.09)',
      xl:   '0 16px 48px rgba(25, 31, 40, 0.11)',
      glow: '0 0 20px rgba(232, 90, 24, 0.18)',
      ring: ringShadow.light,
      inset: 'none',

    } : {
      sm:   '0 1px 3px rgba(0, 0, 0, 0.36)',
      md:   '0 4px 12px rgba(0, 0, 0, 0.44)',
      lg:   '0 8px 24px rgba(0, 0, 0, 0.52)',
      xl:   '0 16px 48px rgba(0, 0, 0, 0.62)',
      glow: '0 4px 16px rgba(0, 0, 0, 0.48)',
      ring: ringShadow.dark,
      inset: 'inset 1px 1px 4px rgba(0,0,0,0.48), inset -1px -1px 2px rgba(255,255,255,0.04)',
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
