import styled from '@emotion/styled';
import { lightPalette, meok } from '@/design-system/tokens';
import { ChevronDown } from 'lucide-react';

export const FeedContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
`;

export const StickyTop = styled.div`
  position: sticky;
  top: 0;
  z-index: 5;
  background: #ffffff;
  padding: 12px 16px 8px;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

export const SectionTitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const SectionTitle = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: ${meok[900]};
  letter-spacing: -0.02em;
`;

export const RegionScroller = styled.div`
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const RegionChip = styled.button<{ $active: boolean }>`
  flex: none;
  padding: 6px 13px;

  border-radius: 9999px;
  background: ${({ $active }) =>
    $active ? meok[900] : 'rgba(78, 89, 104, 0.07)'};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $active }) =>
      $active ? meok[900] : 'rgba(78, 89, 104, 0.12)'};
    color: ${({ $active }) => ($active ? '#ffffff' : meok[900])};
  }

  &:active {
    transform: scale(0.96);
  }
`;

export const FeaturedPlaceArea = styled.div`
  padding: 8px 16px 14px;
`;

export const FeaturedCard = styled.div`
  padding: 14px 16px;
  background: #f7f1e6;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: #f0eae0;
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.985);
  }
`;

export const FeaturedLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

export const FeaturedIconBox = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${lightPalette.juhong[500]};
  flex-shrink: 0;
`;

export const FeaturedInfo = styled.div`
  min-width: 0;
`;

export const FeaturedRank = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: ${lightPalette.juhong[700]};
  display: block;
  margin-bottom: 2px;
`;

export const FeaturedName = styled.h4`
  margin: 0 0 2px;
  font-size: 14.5px;
  font-weight: 700;
  color: ${meok[900]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const FeaturedMeta = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${meok[500]};
`;

export const MoreBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;

  border-radius: 9999px;
  background: #ffffff;
  color: ${meok[900]};
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;

  &:hover {
    background: ${meok[900]};
    color: #ffffff;
  }
`;

export const ReviewSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 6px;
`;

export const ReviewSectionTitle = styled.h4`
  margin: 0;
  font-size: 14.5px;
  font-weight: 700;
  color: ${meok[900]};
  display: flex;
  align-items: center;
  gap: 5px;
`;

export const SortWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

export const SortSelect = styled.select`
  appearance: none;
  background: transparent;

  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  color: ${meok[700]};
  padding: 2px 16px 2px 4px;
  cursor: pointer;
  outline: none;

  &:hover {
    color: ${meok[900]};
  }
`;

export const SortChevron = styled(ChevronDown)`
  position: absolute;
  right: 0;
  pointer-events: none;
  color: ${meok[500]};
`;

export const FeedScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const EmptyState = styled.div`
  padding: 40px 16px;
  text-align: center;
  color: ${meok[500]};
  font-size: 13.5px;
  line-height: 1.6;
`;
