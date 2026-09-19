import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import SorimaruPage from './page';
import BeVer1Page from './be-ver1/page';
import BeVer2Page from './be-ver2/page';
import BeVer3Page from './be-ver3/page';
import BeVer4Page from './be-ver4/page';

type VariantElement = ReactElement<{
  backgroundVariant?: string;
  children?: ReactElement<{ backgroundVariant?: string }>;
}>;

function getVariant(element: VariantElement): string | undefined {
  return element.props.backgroundVariant ?? element.props.children?.props.backgroundVariant;
}

describe('Sorimaru background routes', () => {
  it('puts the production Sorimaru route on the hanji-journey background', () => {
    expect(getVariant(SorimaruPage() as VariantElement)).toBe('hanji-journey');
  });

  it.each([
    [BeVer1Page, 'warmth-grain'],
    [BeVer2Page, 'changho-breeze'],
    [BeVer3Page, 'hanji-journey'],
    [BeVer4Page, 'onmaru-signature'],
  ] as const)('passes the intended background variant', (Page, variant) => {
    expect(getVariant(Page() as VariantElement)).toBe(variant);
  });
});
