import { expect, test } from '@playwright/test';

test('home, Hanokmaru, and Sorimaru share the same section heading treatment', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('onmaru-color-mode', 'light'));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(
    page.getByRole('heading', { name: '이번 주 추천 코스' }).locator('xpath=..').locator('xpath=..'),
  ).toHaveAttribute('data-section-heading', 'true');

  await page.goto('/hanok', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
  });
  const archiveHeading = page.getByRole('heading', { name: '전국 한옥 도감' });
  await expect(archiveHeading.locator('xpath=..').locator('xpath=..')).toHaveAttribute(
    'data-section-heading',
    'true',
  );

  const introHeading = page.getByRole('heading', {
    level: 1,
    name: '지금 한옥은 어디에 남아 있을까?',
  });
  const introAccent = page.getByText('지금 한옥', { exact: true });
  const introKicker = page.getByText(/사라지기 전에 기록한다 · 전국 \d+곳/);
  const [introStyle, archiveStyle] = await Promise.all([
    introHeading.evaluate((element) => {
      const style = getComputedStyle(element);
      return { fontSize: style.fontSize, backgroundImage: style.backgroundImage };
    }),
    archiveHeading.evaluate((element) => ({ fontSize: getComputedStyle(element).fontSize })),
  ]);

  expect(introStyle.fontSize).toBe(archiveStyle.fontSize);
  expect(introStyle.backgroundImage).toContain('linear-gradient');
  await expect(introAccent).toHaveCSS('color', 'rgb(255, 85, 0)');
  await expect(introKicker).toHaveCSS('color', 'rgb(139, 149, 161)');

  await page.goto('/sorimaru', { waitUntil: 'domcontentloaded' });
  await expect(
    page.getByRole('heading', { name: '장면을 따라 걷는 소리' }).locator('xpath=..').locator('xpath=..'),
  ).toHaveAttribute('data-section-heading', 'true');
});
