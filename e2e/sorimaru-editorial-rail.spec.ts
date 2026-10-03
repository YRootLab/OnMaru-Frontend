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

  const lightCard = page.getByRole('button', { name: /현재 선택됨/ }).first();
  const lightCardShape = await lightCard.evaluate((node) => ({
    outerRadius: getComputedStyle(node).borderRadius,
    outerOverflow: getComputedStyle(node).overflow,
    surfaceRadius: getComputedStyle(node.children[0] as HTMLElement).borderRadius,
    surfaceOverflow: getComputedStyle(node.children[0] as HTMLElement).overflow,
    edgeMaskDisplay: getComputedStyle(node.children[1] as HTMLElement).display,
  }));
  expect(lightCardShape.outerRadius).toBe('0px');
  expect(lightCardShape.outerOverflow).toBe('visible');
  expect(lightCardShape.surfaceRadius).toBe('20px');
  expect(lightCardShape.surfaceOverflow).toBe('hidden');
  expect(lightCardShape.edgeMaskDisplay).toBe('none');
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
    const cardSurface = node.children[0] as HTMLElement;
    const surfaceStyle = getComputedStyle(cardSurface);
    const imageLayer = cardSurface.children[0] as HTMLElement;
    const imageLayerStyle = getComputedStyle(imageLayer);
    const bottomPanel = cardSurface.children[1] as HTMLElement;
    const panelStyle = getComputedStyle(bottomPanel);
    const edgeMask = node.children[1] as HTMLElement;
    const edgeMaskStyle = getComputedStyle(edgeMask);

    return {
      cardBorderWidth: cardStyle.borderWidth,
      cardBackgroundColor: cardStyle.backgroundColor,
      cardBoxShadow: cardStyle.boxShadow,
      cardBorderRadius: cardStyle.borderRadius,
      cardOverflow: cardStyle.overflow,
      surfaceBackgroundColor: surfaceStyle.backgroundColor,
      surfaceBorderRadius: surfaceStyle.borderRadius,
      surfaceOverflow: surfaceStyle.overflow,
      imageLayerBorderRadius: imageLayerStyle.borderRadius,
      imageLayerOverflow: imageLayerStyle.overflow,
      panelBackgroundColor: panelStyle.backgroundColor,
      panelBoxShadow: panelStyle.boxShadow,
      panelBorderBottomColor: panelStyle.borderBottomColor,
      panelBorderLeftColor: panelStyle.borderLeftColor,
      panelBorderRightColor: panelStyle.borderRightColor,
      panelBottomLeftRadius: panelStyle.borderBottomLeftRadius,
      panelBottomRightRadius: panelStyle.borderBottomRightRadius,
      edgeMaskDisplay: edgeMaskStyle.display,
      edgeMaskBorderColor: edgeMaskStyle.borderColor,
      edgeMaskBorderWidth: edgeMaskStyle.borderWidth,
      edgeMaskBorderRadius: edgeMaskStyle.borderRadius,
    };
  });
  const stageBackgroundColor = await page.getByRole('button', { name: '다음 이야기' }).evaluate((node) =>
    getComputedStyle(node.parentElement as HTMLElement).backgroundColor,
  );

  expect(styles.cardBorderWidth).toBe('0px');
  expect(styles.cardBackgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(styles.cardBoxShadow).toBe('none');
  expect(styles.cardBorderRadius).toBe('0px');
  expect(styles.cardOverflow).toBe('visible');
  expect(styles.surfaceBackgroundColor).not.toBe(stageBackgroundColor);
  expect(styles.surfaceBorderRadius).toBe('20px');
  expect(styles.surfaceOverflow).toBe('hidden');
  expect(styles.imageLayerBorderRadius).toBe('0px');
  expect(styles.imageLayerOverflow).toBe('visible');
  expect(styles.panelBackgroundColor).toBe(styles.surfaceBackgroundColor);
  expect(styles.panelBoxShadow).toBe('none');
  expect(styles.panelBottomLeftRadius).toBe('0px');
  expect(styles.panelBottomRightRadius).toBe('0px');
  expect(styles.edgeMaskDisplay).toBe('block');
  expect(styles.edgeMaskBorderColor).toBe(stageBackgroundColor);
  expect(styles.edgeMaskBorderWidth).toBe('3px');
  expect(styles.edgeMaskBorderRadius).toBe('21px');
});
