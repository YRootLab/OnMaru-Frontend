import { expect, test } from '@playwright/test';

test('desktop navigation keeps enlarged icons and labels on one visual center', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('onmaru-color-mode', 'dark'));
  await page.goto('/sorimaru');

  const navigationLink = page.getByRole('link', { name: '소리마루' }).first();
  await expect(navigationLink).toBeVisible();

  const navigationMetrics = await navigationLink.evaluate((node) => {
    const icon = node.querySelector('svg') as SVGElement;
    const label = node.querySelector('span > span') as HTMLElement;
    const iconRect = icon.getBoundingClientRect();
    const labelRect = label.getBoundingClientRect();
    return {
      fontSize: getComputedStyle(node).fontSize,
      iconWidth: iconRect.width,
      iconCenterOffset:
        iconRect.top + iconRect.height / 2 - (labelRect.top + labelRect.height / 2),
    };
  });

  expect(navigationMetrics.fontSize).toBe('14px');
  expect(navigationMetrics.iconWidth).toBeGreaterThanOrEqual(15);
  expect(navigationMetrics.iconCenterOffset).toBeCloseTo(-2, 1);

  const loginButton = page.getByRole('link', { name: '로그인' });
  const loginMetrics = await loginButton.evaluate((node) => {
    const label = node.querySelector('span') as HTMLElement;
    const icon = node.querySelector('svg') as SVGElement;
    const iconPath = icon.querySelector('path') as SVGGraphicsElement;
    const buttonRect = node.getBoundingClientRect();
    const labelRect = label.getBoundingClientRect();
    const iconRect = icon.getBoundingClientRect();
    const pathBox = iconPath.getBBox();
    const pathMatrix = iconPath.getScreenCTM();
    const pathTopLeft = new DOMPoint(pathBox.x, pathBox.y).matrixTransform(pathMatrix!);
    const pathBottomRight = new DOMPoint(
      pathBox.x + pathBox.width,
      pathBox.y + pathBox.height,
    ).matrixTransform(pathMatrix!);
    const style = getComputedStyle(node);
    return {
      height: buttonRect.height,
      paddingTop: style.paddingTop,
      paddingBottom: style.paddingBottom,
      arrowWidth: iconRect.width,
      leadingSpacing: labelRect.left - buttonRect.left,
      topSpacing: Math.min(labelRect.top, pathTopLeft.y) - buttonRect.top,
      trailingSpacing: buttonRect.right - pathBottomRight.x,
      labelCenterDifference: Math.abs(
        buttonRect.top + buttonRect.height / 2 - (labelRect.top + labelRect.height / 2),
      ),
      iconCenterOffset:
        iconRect.top + iconRect.height / 2 - (buttonRect.top + buttonRect.height / 2),
    };
  });

  expect(loginMetrics.height).toBe(32);
  expect(loginMetrics.paddingTop).toBe(loginMetrics.paddingBottom);
  expect(loginMetrics.arrowWidth).toBeGreaterThanOrEqual(16);
  expect(loginMetrics.leadingSpacing).toBeGreaterThanOrEqual(15);
  expect(Math.abs(loginMetrics.leadingSpacing - loginMetrics.trailingSpacing)).toBeLessThanOrEqual(1.5);
  expect(loginMetrics.labelCenterDifference).toBeLessThanOrEqual(1);
  expect(loginMetrics.iconCenterOffset).toBeCloseTo(0, 1);
});
