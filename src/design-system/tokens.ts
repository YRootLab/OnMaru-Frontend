



import { px } from 'framer-motion';





export const palette = {

  danpung: {
    50: '#FFF1F0', 100: '#FFE4E1', 200: '#FFC1BA', 400: '#FF6B61',
    500: '#FF3B30', 700: '#D62015', 900: '#7A0C05',
  },

  juhong: {
    25:  '#FFF8F5',
    50:  '#FFF4EB',
    100: '#FFE4D1',
    200: '#FFCBA8',
    300: '#FFA36B',
    400: '#FF7830',
    500: '#FF5500',
    600: '#E64700',
    700: '#D94000',
    800: '#A82E00',
    900: '#7A2400',
    950: '#471200',
  },

  hwanggeum: {
    50: '#FFFBE5', 100: '#FFF3BD', 200: '#FFE57A', 400: '#FFD026',
    500: '#FFB800', 700: '#D99400', 900: '#704800',
  },

  cheongrok: {
    50: '#E6FAF2', 100: '#BEF4DC', 200: '#82E8BD', 400: '#26D68D',
    500: '#00C471', 700: '#009454', 900: '#004D2B',
  },

  kobalt: {
    50: '#EBF1FF', 100: '#CCE0FF', 200: '#99C0FF', 400: '#5C9AFF',
    500: '#2B7FFF', 700: '#1058CC', 900: '#003A80',
  },

  jaha: {
    50: '#F6EBFF', 100: '#E5C7FF', 200: '#CA8FFF', 400: '#A647FF',
    500: '#8B1BFF', 700: '#670CD9', 900: '#360575',
  },

  jangmi: {
    50: '#FFF0F6', 100: '#FFD4E5', 200: '#FFA3C7', 400: '#FF5C9F',
    500: '#FF2A85', 700: '#D40D63', 900: '#6E0030',
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
  dark: {
    app:      '#1C1A17',
    surface:  '#24211D',
    card:     '#2D2924',
    elevated: '#3A352E',
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
    thin:    'rgba(28, 26, 23, 0.65)',
    regular: 'rgba(36, 33, 29, 0.82)',
    thick:   'rgba(45, 41, 36, 0.94)',
    border:  'rgba(255, 255, 255, 0.10)',
    glow:    '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
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

    mapPanel: '0 12px 32px -8px rgba(0, 0, 0, 0.6), 0 4px 12px -4px rgba(0, 0, 0, 0.4)',
    mapChip:  '0 4px 14px rgba(0, 0, 0, 0.4)',
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
    mapChip:  '0 4px 14px rgba(0, 0, 0, 0.55)',
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
      fontFamily: {
        sans: '"Spoqa Han Sans Neo", system-ui, sans-serif',
        serif: '"Spoqa Han Sans Neo", system-ui, sans-serif',
        traditionalTitle: '"Spoqa Han Sans Neo", sans-serif',
        traditionalBody: '"Spoqa Han Sans Neo", sans-serif',
        traditional: '"Spoqa Han Sans Neo", sans-serif',
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

    } : {
      sm:   '0 1px 4px rgba(25, 31, 40, 0.18)',
      md:   '0 4px 12px rgba(25, 31, 40, 0.24)',
      lg:   '0 8px 24px rgba(25, 31, 40, 0.30)',
      xl:   '0 16px 48px rgba(25, 31, 40, 0.36)',
      glow: '0 0 20px rgba(248, 87, 0, 0.24)',
      ring: ringShadow.dark,
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
