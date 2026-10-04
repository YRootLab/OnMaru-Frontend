'use client';

import styled from '@emotion/styled';
import type { Item, MapInfoCategory } from '@/features/map/types';
import LiveNoticeBanner from './feed/LiveNoticeBanner';
import FestivalExhibitionCarousel from './feed/FestivalExhibitionCarousel';
import SorimaruSpotlightBanner from './feed/SorimaruSpotlightBanner';
import SmartAroundFeed from './feed/SmartAroundFeed';

const EditorialSections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-bottom: 32px;
`;

interface InfoMapEditorialFeedProps {
  category: MapInfoCategory;
  regionCode: string | null;
  items: Item[];
  loading: boolean;
  onShowAllFestivals: () => void;
  onSelectItem: (item: Item) => void;
}

export default function InfoMapEditorialFeed({
  category,
  regionCode,
  items,
  loading,
  onShowAllFestivals,
  onSelectItem,
}: InfoMapEditorialFeedProps) {
  const showDiscovery = category === 'all' && regionCode === null;
  const festivals = items.filter((item) => item.category === 'festival');

  return (
    <>
      <LiveNoticeBanner />
      {showDiscovery && (
        <EditorialSections aria-label="한옥 지도 추천 콘텐츠">
          <FestivalExhibitionCarousel
            festivals={festivals}
            loading={loading}
            onShowAll={onShowAllFestivals}
            onSelect={(item) => {
              if (festivals.some((festival) => festival.id === item.id)) {
                onSelectItem(item);
                return;
              }
              onShowAllFestivals();
            }}
          />
          <SorimaruSpotlightBanner />
          <SmartAroundFeed items={items} />
        </EditorialSections>
      )}
    </>
  );
}
