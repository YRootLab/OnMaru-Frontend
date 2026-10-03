import { expect, test } from '@playwright/test';

test('hanok stays use bounded pages and a dynamic filter count', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('onmaru-color-mode', 'light'));
  await page.goto('/hanok', { waitUntil: 'domcontentloaded' });

  const section = page.locator('#hanok-stays');
  const heading = section.getByRole('heading', { name: '지역별 한옥 스테이' });
  await expect(section.getByRole('status')).toContainText(/전국 \d+곳/);
  await expect(async () => {
    await heading.scrollIntoViewIfNeeded();
  }).toPass();

  const previous = section.getByRole('button', { name: '이전 스테이 페이지' });
  const next = section.getByRole('button', { name: '다음 스테이 페이지' });
  const counter = section.getByTestId('stay-page-counter');

  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  await expect(counter).toContainText(/^1 \/ \d+$/);

  await next.click();
  await expect(counter).toContainText(/^2 \/ \d+$/);
  await expect(previous).toBeEnabled();

  await section.getByRole('button', { name: /^서울 \d+곳$/ }).click();
  await expect(section.getByRole('status')).toContainText(/서울 \d+곳/);
  await expect(counter).toContainText(/^1 \/ \d+$/);
  await expect(previous).toBeDisabled();

  await section.getByRole('button', { name: /^전체 \d+곳$/ }).click();
  await expect(section.getByRole('status')).toContainText(/전국 \d+곳/);
  await expect(counter).toContainText(/^1 \/ \d+$/);
});

test('booking action keeps fully opaque white content on hover', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('onmaru-color-mode', 'light'));
  await page.goto('/hanok', { waitUntil: 'domcontentloaded' });

  const booking = page.locator('#hanok-stays').getByRole('link', { name: /예약 정보 확인하기/ }).first();
  await expect(booking).toBeVisible();

  await expect(booking).toHaveCSS('color', 'rgb(255, 255, 255)');
  await booking.hover();
  await expect(booking).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(booking).toHaveCSS('opacity', '1');
});
