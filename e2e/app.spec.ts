import { test, expect } from '@playwright/test';

test('homepage has title and main elements', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/온마루/);
});
