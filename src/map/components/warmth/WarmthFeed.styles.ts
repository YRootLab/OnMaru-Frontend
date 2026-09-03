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

/*
  클릭으로 상세를 여는 카드라 button으로 둔다.
  div + onClick이면 Tab으로 닿지 않고 Enter로도 열리지 않는다.
*/
export const FeaturedCard = styled.button`
  width: 100%;
  text-align: left;
  font-family: inherit;
  cursor: pointer;

  padding: 14px 16px;
  background: #f8f6f0;
  border-radius: 18px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: #f2eee6;
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.985);
  }

  [data-theme='dark'] & {
    background: #25221d;

    &:hover {
      background: #2c2822;
    }
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
  color: ${meok[900]};
  flex-shrink: 0;

  [data-theme='dark'] & {
    background: #1c1a17;
    color: ${meok[100]};
  }
`;

export const FeaturedInfo = styled.div`
  min-width: 0;
`;

export const FeaturedRank = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: ${lightPalette.juhong[500]};
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

export const PaginationWrapper = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px 0 24px;
`;

export const PageNavBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 32px;
  padding: 0 10px;
  border-radius: 10px;
  border: none;
  background: rgba(78, 89, 104, 0.06);
  color: ${meok[700]};
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: rgba(78, 89, 104, 0.12);
    color: ${meok[900]};
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

export const PageNumberGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 4px;
`;

export const PageNumberBtn = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  border-radius: 10px;
  border: none;
  background: ${({ $active }) =>
    $active ? lightPalette.juhong[500] : 'transparent'};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  font-family: inherit;
  font-size: 12.5px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ $active }) =>
      $active ? lightPalette.juhong[700] : 'rgba(78, 89, 104, 0.08)'};
    color: ${({ $active }) => ($active ? '#ffffff' : meok[900])};
  }
`;

export const PageIndicator = styled.span`
  font-size: 11.5px;
  font-weight: 500;
  color: ${meok[500]};
  margin-left: 4px;
`;
