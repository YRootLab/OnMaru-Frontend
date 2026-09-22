import { defineConfig, devices } from '@playwright/test';

const e2ePort = process.env.E2E_PORT ?? '3000';




export default defineConfig({
  testDir: './e2e',

  testMatch: '**/*.spec.ts',

  fullyParallel: true,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 1 : undefined,

  reporter: 'html',

  use: {

    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL ?? `http://localhost:${e2ePort}`,

    trace: 'on-first-retry',
  },


  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
