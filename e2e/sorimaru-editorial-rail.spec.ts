import { expect, test } from '@playwright/test';

const e2eOrigin = new URL(
  process.env.PLAYWRIGHT_TEST_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? '3000'}`,
).origin;
const corsHeaders = {
  'access-control-allow-origin': e2eOrigin,
  'access-control-allow-credentials': 'true',
};

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
    headers: corsHeaders,
    body: JSON.stringify({ schemaVersion: '1.2', items: stories, totalCount: stories.length, nextCursor: null, hasMore: false }),
  }));
  await page.route('**/api/v1/odii/regions**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: corsHeaders,
    body: JSON.stringify({ groups: [] }),
  }));
  await page.route('**/api/v1/members/me', (route) => route.fulfill({
    status: 401,
    contentType: 'application/json',
    headers: corsHeaders,
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

test('dark-mode active card clips one opaque surface without a bright rounded fringe', async ({ page }) => {
  await page.route('**/api/v1/odii/stories**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: corsHeaders,
    body: JSON.stringify({ schemaVersion: '1.2', items: stories, totalCount: stories.length, nextCursor: null, hasMore: false }),
  }));
  await page.route('**/api/v1/odii/regions**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: corsHeaders,
    body: JSON.stringify({ groups: [] }),
  }));
  await page.route('**/api/v1/members/me', (route) => route.fulfill({
    status: 401,
    contentType: 'application/json',
    headers: corsHeaders,
    body: JSON.stringify({ code: 'AUTH_REQUIRED' }),
  }));

  await page.goto('/sorimaru');
  await page.getByText('라이트 모드 이야기 1').first().waitFor({ state: 'visible' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));

  const activeCard = page.getByRole('button', { name: /현재 선택됨/ }).first();
  await expect(activeCard).toBeVisible();
  const styles = await activeCard.evaluate((node) => {
    const cardStyle = getComputedStyle(node);
    const imageLayer = node.children[0] as HTMLElement;
    const imageLayerStyle = getComputedStyle(imageLayer);
    const bottomPanel = node.children[1] as HTMLElement;
    const panelStyle = getComputedStyle(bottomPanel);

    return {
      cardBorderWidth: cardStyle.borderWidth,
      cardBorderStyle: cardStyle.borderStyle,
      cardBorderColor: cardStyle.borderColor,
      cardBackgroundColor: cardStyle.backgroundColor,
      cardBoxShadow: cardStyle.boxShadow,
      cardBorderRadius: cardStyle.borderRadius,
      cardOverflow: cardStyle.overflow,
      imageLayerBorderRadius: imageLayerStyle.borderRadius,
      imageLayerOverflow: imageLayerStyle.overflow,
      panelBackgroundColor: panelStyle.backgroundColor,
      panelBoxShadow: panelStyle.boxShadow,
      panelBorderBottomColor: panelStyle.borderBottomColor,
      panelBorderLeftColor: panelStyle.borderLeftColor,
      panelBorderRightColor: panelStyle.borderRightColor,
      panelBottomLeftRadius: panelStyle.borderBottomLeftRadius,
      panelBottomRightRadius: panelStyle.borderBottomRightRadius,
    };
  });
  const stageBackgroundColor = await page.getByRole('button', { name: '다음 이야기' }).evaluate((node) =>
    getComputedStyle(node.parentElement as HTMLElement).backgroundColor,
  );

  expect(styles.cardBorderWidth).toBe('0px');
  expect(styles.cardBackgroundColor).toBe(stageBackgroundColor);
  expect(styles.cardBoxShadow).toBe('none');
  expect(styles.cardBorderRadius).toBe('0px');
  expect(styles.cardOverflow).toBe('visible');
  expect(styles.imageLayerBorderRadius).toBe('20px 20px 0px 0px');
  expect(styles.imageLayerOverflow).toBe('hidden');
  expect(styles.panelBackgroundColor).toBe(styles.cardBackgroundColor);
  expect(styles.panelBoxShadow).toBe('none');
  expect(styles.panelBorderBottomColor).toBe(stageBackgroundColor);
  expect(styles.panelBorderLeftColor).toBe(stageBackgroundColor);
  expect(styles.panelBorderRightColor).toBe(stageBackgroundColor);
  expect(styles.panelBottomLeftRadius).toBe('0px');
  expect(styles.panelBottomRightRadius).toBe('0px');
});
