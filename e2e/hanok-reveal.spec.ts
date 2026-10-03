import { expect, test } from '@playwright/test';

test('hanok card reveal remains visible in light mode and scales down in dark mode', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('onmaru-color-mode', 'light'));
  await page.goto('/hanok', { waitUntil: 'domcontentloaded' });

  const spotlight = page.getByTestId('village-card-spotlight').first();
  const glassLens = page.getByTestId('village-card-glass-lens').first();
  await expect(spotlight).toBeAttached();
  await expect(glassLens).toBeAttached();

  await page.evaluate(() => {
    localStorage.setItem('onmaru-color-mode', 'light');
    document.documentElement.dataset.theme = 'light';
  });
  await expect.poll(
    () => spotlight.evaluate((element) => getComputedStyle(element).backgroundImage),
  ).toContain('150px');
  await expect.poll(
    () => spotlight.evaluate((element) => getComputedStyle(element).backgroundImage),
  ).toContain('radial-gradient');
  await expect.poll(
    () => spotlight.evaluate((element) => getComputedStyle(element).backgroundImage),
  ).toContain('340px');
  await expect.poll(
    () => glassLens.evaluate((element) => getComputedStyle(element).backdropFilter),
  ).toBe('none');
  await expect.poll(
    () => glassLens.evaluate((element) => getComputedStyle(element).maskImage),
  ).toContain('140px');

  await page.evaluate(() => {
    localStorage.setItem('onmaru-color-mode', 'dark');
    document.documentElement.dataset.theme = 'dark';
  });
  await expect.poll(
    () => spotlight.evaluate((element) => getComputedStyle(element).backgroundImage),
  ).toContain('216px');
  await expect.poll(
    () => glassLens.evaluate((element) => getComputedStyle(element).display),
  ).toBe('none');
});

test('the archive explanation button stays still when its card is hovered', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('onmaru-color-mode', 'light'));
  await page.goto('/hanok', { waitUntil: 'domcontentloaded' });

  const card = page.locator('[data-reveal-card]').first();
  const button = card.getByText('도감 해설 보기');
  await expect(async () => {
    await card.scrollIntoViewIfNeeded();
  }).toPass();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(700);

  const beforeCard = await card.boundingBox();
  const before = await button.boundingBox();
  await card.hover();
  await page.waitForTimeout(250);
  const afterCard = await card.boundingBox();
  const after = await button.boundingBox();

  expect(beforeCard).not.toBeNull();
  expect(afterCard).not.toBeNull();
  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  expect((after?.y ?? 0) - (afterCard?.y ?? 0)).toBeCloseTo(
    (before?.y ?? 0) - (beforeCard?.y ?? 0),
    1,
  );
});
