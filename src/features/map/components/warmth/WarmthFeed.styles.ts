import styled from '@emotion/styled';
import { ChevronDown } from 'lucide-react';
import { lightPalette, meok, surface, fontSize } from '@/design-system/tokens';

export const FeedContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: ${surface.light.card};

  [data-theme='dark'] & {
    background: ${surface.dark.card};
  }
`;

export const StickyTop = styled.div`
  position: sticky;
  top: 0;
  z-index: 5;
  background: ${surface.light.card};
  padding: 12px 16px 8px;

  [data-theme='dark'] & {
    background: ${surface.dark.card};
  }
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
  font-size: ${fontSize.sm};
  font-weight: 500;
  color: ${meok[900]};
  letter-spacing: -0.02em;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;



export const RegionCarouselWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  margin-top: 2px;
`;

export const RegionArrowBtn = styled.button<{ $direction: 'left' | 'right' }>`
  position: absolute;
  top: 0;
  bottom: 0;
  ${({ $direction }) => ($direction === 'left' ? 'left: 0;' : 'right: 0;')}
  z-index: 5;
  width: 36px;
  border: none;
  background: ${({ $direction }) =>
    $direction === 'left'
      ? 'linear-gradient(to right, rgba(255, 255, 255, 1) 40%, rgba(255, 255, 255, 0.85) 65%, rgba(255, 255, 255, 0) 100%)'
      : 'linear-gradient(to left, rgba(255, 255, 255, 1) 40%, rgba(255, 255, 255, 0.85) 65%, rgba(255, 255, 255, 0) 100%)'};
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: ${({ $direction }) => ($direction === 'left' ? 'flex-start' : 'flex-end')};
  padding: ${({ $direction }) => ($direction === 'left' ? '0 0 0 2px' : '0 2px 0 0')};
  cursor: pointer;
  color: #4b5563;
  transition: color 0.15s ease, opacity 0.15s ease;

  [data-theme='dark'] & {
    background: ${({ $direction }) =>
      $direction === 'left'
        ? 'linear-gradient(to right, rgba(28, 26, 23, 1) 40%, rgba(28, 26, 23, 0.85) 65%, rgba(28, 26, 23, 0) 100%)'
        : 'linear-gradient(to left, rgba(28, 26, 23, 1) 40%, rgba(28, 26, 23, 0.85) 65%, rgba(28, 26, 23, 0) 100%)'};
    color: #9ca3af;
  }

  &:hover {
    color: #191f28;

    [data-theme='dark'] & {
      color: #ffffff;
    }
  }

  &:active {
    opacity: 0.75;
  }
`;

export const RegionScroller = styled.div`
  display: flex;
  gap: 5px;
  overflow-x: auto;
  padding: 4px 28px 6px 2px;
  scrollbar-width: none;
  scroll-behavior: smooth;
  width: 100%;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const RegionChip = styled.button<{ $active: boolean }>`
  flex: none;
  padding: 4.5px 10.5px;
  border-radius: 9999px;
  border: none;
  background: ${({ $active }) => ($active ? '#191f28' : 'rgba(0,0,0,0.05)')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#333d4b')};
  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  cursor: pointer;
  white-space: nowrap;
  box-shadow: none;
  line-height: 1.35;
  transition: all 0.15s ease;

  [data-theme='dark'] & {
    border: none;
    background: ${({ $active }) =>
      $active ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.06)'};
    color: ${({ $active }) => ($active ? '#ffffff' : '#a1a1aa')};
  }

  &:hover {
    background: ${({ $active }) => ($active ? '#191f28' : 'rgba(0,0,0,0.08)')};
    color: ${({ $active }) => ($active ? '#ffffff' : '#191f28')};

    [data-theme='dark'] & {
      background: ${({ $active }) =>
        $active ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.1)'};
      color: #ffffff;
    }
  }

  &:active {
    transform: scale(0.96);
  }
`;

export const FeaturedPlaceArea = styled.div`
  padding: 8px 16px 14px;
`;

export const ScrubberSection = styled.div`
  padding: 0 16px 12px;
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
  font-size: ${fontSize.micro};
  font-weight: 700;
  color: ${lightPalette.juhong[500]};
  display: block;
  margin-bottom: 2px;
`;

export const FeaturedName = styled.h4`
  margin: 0 0 2px;
  font-size: ${fontSize.sm};
  font-weight: 500;
  color: ${meok[900]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

export const FeaturedMeta = styled.p`
  margin: 0;
  font-size: ${fontSize.xs};
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
  font-size: ${fontSize.xs};
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;

  &:hover {
    background: ${meok[900]};
    color: #ffffff;
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.1);
    color: ${meok[200]};

    &:hover {
      background: #ffffff;
      color: ${meok[900]};
    }
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
  font-size: ${fontSize.sm};
  font-weight: 500;
  color: ${meok[900]};
  display: flex;
  align-items: center;
  gap: 5px;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

export const SortWrapper = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.04);
  border: none;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.07);
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.06);
    border: none;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
`;

export const SortSelect = styled.select`
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background: transparent;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;

  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${meok[700]};
  padding: 4px 24px 4px 10px;
  cursor: pointer;

  [data-theme='dark'] & {
    color: ${meok[200]};
    background-color: transparent;

    option {
      background-color: #25221d;
      color: #ffffff;
    }
  }

  option {
    background-color: #ffffff;
    color: #191f28;
  }
`;

export const SortChevron = styled(ChevronDown)`
  position: absolute;
  right: 7px;
  pointer-events: none;
  color: ${meok[500]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

export const FeedScroll = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 16px 40px;
`;

export const EmptyState = styled.div`
  padding: 40px 16px;
  text-align: center;
  color: ${meok[500]};
  font-size: ${fontSize.sm};
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
  font-size: ${fontSize.xs};
  font-weight: 500;
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
  font-size: ${fontSize.xs};
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
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${meok[500]};
  margin-left: 4px;
`;
