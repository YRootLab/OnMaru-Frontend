import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // React Three Fiber는 three.js 객체(mesh.position, material.opacity, camera.fov 등)를
    // useFrame 안에서 직접 변경하는 것이 정상적인 사용법이다. React Compiler의
    // immutability 규칙은 이 패턴을 훅 반환값 변경으로 오탐하므로 3D 레이어에서만 끈다.
    files: [
      'src/features/hanok-viewer/components/canvas/**',
      'src/features/one-long-scroll/components/canvas/**',
      'src/components/hanok/**',
    ],
    rules: {
      'react-hooks/immutability': 'off',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
