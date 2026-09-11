import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // src/design-system/tokens.ts의 typography.fontSize와 값을 맞춘다 — 거기 없는
      // 유일한 단계가 micro(10px, 배지·타임스탬프)라서 여기서만 확장해 준다.
      fontSize: {
        micro: '0.625rem',
      },
      fontFamily: {
        maruburi: ['MaruBuri', 'serif'],
        'odii-sans': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Apple SD Gothic Neo', 'Inter', 'sans-serif'],
      },
      colors: {
        jangmi: {
          50: '#FFF0F4',
          100: '#F8A8C0',
          200: '#F06090',
          400: '#E03870',
          500: '#D42058',
          700: '#8A1038',
          900: '#300010',
        },
      },
    },
  },
  plugins: [],
};
export default config;
