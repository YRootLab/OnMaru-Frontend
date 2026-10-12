'use client';

import styled from '@emotion/styled';
import type { Item, MapInfoCategory } from '@/features/map/types';
import LiveNoticeBanner from './feed/LiveNoticeBanner';
import SorimaruSpotlightBanner from './feed/SorimaruSpotlightBanner';
import SmartAroundFeed from './feed/SmartAroundFeed';

const EditorialSections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-top: 12px;
  margin-bottom: 20px;
`;

interface InfoMapEditorialFeedProps {
  category: MapInfoCategory;
  regionCode: string | null;
  items: Item[];
}

export default function InfoMapEditorialFeed({
  category,
  regionCode,
  items,
}: InfoMapEditorialFeedProps) {
  const showDiscovery = category === 'hanok' && regionCode === null;

  return (
    <>
      <LiveNoticeBanner />
      {showDiscovery && (
        <EditorialSections aria-label="한옥 지도 추천 콘텐츠">
          <SorimaruSpotlightBanner />
          <SmartAroundFeed items={items} />
        </EditorialSections>
      )}
    </>
  );
}
