import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import OdiiPage from './page';
import BeVer1Page from './be-ver1/page';
import BeVer2Page from './be-ver2/page';
import BeVer3Page from './be-ver3/page';
import BeVer4Page from './be-ver4/page';

type VariantElement = ReactElement<{ backgroundVariant?: string }>;

describe('Odii background routes', () => {
  it('leaves the production Odii route on the compatibility background', () => {
    expect((OdiiPage() as VariantElement).props.backgroundVariant).toBeUndefined();
  });

  it.each([
    [BeVer1Page, 'warmth-grain'],
    [BeVer2Page, 'changho-breeze'],
    [BeVer3Page, 'hanji-journey'],
    [BeVer4Page, 'onmaru-signature'],
  ] as const)('passes the intended background variant', (Page, variant) => {
    expect((Page() as VariantElement).props.backgroundVariant).toBe(variant);
  });
});
