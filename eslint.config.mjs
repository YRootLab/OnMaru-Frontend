import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // React Compiler rules — hints for future compiler compat, not actual bugs
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/refs': 'off',
      // Style / preference rules
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/exhaustive-deps': 'off',
      // Next.js perf hints — not blocking for competition
      '@next/next/no-img-element': 'off',
      '@next/next/no-location-assign-relative-destination': 'off',
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
    "myDesignSkill/**",
  ]),
]);

export default eslintConfig;
