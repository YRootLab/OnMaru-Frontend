import { expect, test, type Page } from '@playwright/test';

const horizontalTravel = async (page: Page, selector: string) => {
  return test.step(`measure ${selector} horizontal travel`, async () => {
    const transforms = await page.locator(selector).evaluate((element) => {
        const animation = element.getAnimations()[0];
        const effect = animation?.effect as KeyframeEffect | null;

        return effect?.getKeyframes().map((frame) => String(frame.transform)) ?? [];
    });

    const xPositions = transforms.map((transform) => {
      const match = transform.match(/translate3d\((-?[\d.]+)%/);
      return match ? Number(match[1]) : 0;
    });

    return Math.max(...xPositions) - Math.min(...xPositions);
  });
};

test('home brand colors drift far enough to feel like slow-moving clouds', async ({ page }) => {
  await page.goto('/');

  const primaryTravel = await horizontalTravel(page, '[data-aurora-layer="primary"]');
  const warmthTravel = await horizontalTravel(page, '[data-aurora-layer="warmth"]');

  expect(primaryTravel).toBeGreaterThanOrEqual(8);
  expect(warmthTravel).toBeGreaterThanOrEqual(8);
});

test('recommendation content returns to white without a surface seam', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('onmaru-color-mode', 'light');
  });
  await page.goto('/');

  const surfaceColor = await page.getByRole('heading', { name: '이번 주 추천 코스' }).evaluate((heading) => {
    let element: Element | null = heading;

    while (element) {
      const backgroundColor = getComputedStyle(element).backgroundColor;
      if (backgroundColor !== 'rgba(0, 0, 0, 0)') return backgroundColor;
      element = element.parentElement;
    }

    return 'transparent';
  });

  const homeCanvasColor = await page.locator('main').evaluate((main) => getComputedStyle(main).backgroundColor);

  expect(surfaceColor).toBe('rgb(255, 255, 255)');
  expect(homeCanvasColor).toBe(surfaceColor);
});
