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
      fontFamily: {
        maruburi: ['MaruBuri', 'serif'],
        'odii-sans': ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Apple SD Gothic Neo', 'Noto Sans KR', 'sans-serif'],
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
