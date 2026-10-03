import { expect, test } from '@playwright/test';

const stories = Array.from({ length: 3 }, (_, index) => ({
  storyId: `visual-story-${index + 1}`,
  title: `라이트 모드 이야기 ${index + 1}`,
  audioTitle: `고요한 한옥의 소리 ${index + 1}`,
  category: '한옥',
  region: {
    regionCode: `visual-region-${index + 1}`,
    name: '서울특별시',
    level: 'PROVINCE',
    parentRegionCode: null,
  },
  coordinates: null,
  durationSeconds: 180,
  imageUrl: '/images/hanok/hanok-main.png',
  linkedPlaceId: null,
  contentTags: ['한옥'],
  savedByMe: false,
}));

test('light-mode rail arrows change only icon color on hover', async ({ page }) => {
  await page.route('**/api/v1/odii/stories**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ items: stories, totalCount: stories.length, nextCursor: null, hasMore: false }),
  }));
  await page.route('**/api/v1/odii/regions**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ groups: [] }),
  }));
  await page.route('**/api/v1/members/me', (route) => route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ code: 'AUTH_REQUIRED' }),
  }));

  await page.goto('/sorimaru');
  await page.getByText('라이트 모드 이야기 1').first().waitFor({ state: 'visible' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await page.waitForTimeout(350);

  const nextButton = page.getByRole('button', { name: '다음 이야기' });
  const iconBox = nextButton.locator('.icon-box');
  const before = await iconBox.evaluate((node) => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      color: style.color,
      backgroundColor: style.backgroundColor,
      navBackground: getComputedStyle(node.parentElement as HTMLElement).backgroundImage,
      stageBackground: getComputedStyle(node.parentElement?.parentElement as HTMLElement).backgroundColor,
    };
  });

  await nextButton.hover();
  await page.waitForTimeout(350);

  const after = await iconBox.evaluate((node) => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      color: style.color,
      backgroundColor: style.backgroundColor,
    };
  });

  expect(before.navBackground).toBe('none');
  expect(before.stageBackground).toBe('rgba(0, 0, 0, 0)');
  expect(after.width).toBeCloseTo(before.width, 1);
  expect(after.height).toBeCloseTo(before.height, 1);
  expect(after.backgroundColor).toBe(before.backgroundColor);
  expect(after.color).not.toBe(before.color);
});
