import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {



    files: [
      'src/features/hanok-viewer/components/canvas/**',
      'src/features/one-long-scroll/components/canvas/**',
      'src/components/hanok/**',
    ],
    rules: {
      'react-hooks/immutability': 'off',
    },
  },

  globalIgnores([

    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/temp/**",
  ]),
]);

export default eslintConfig;
