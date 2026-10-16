'use client';

import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { surface } from '@/design-system/tokens';

const shimmer = keyframes`
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
`;

const SkeletonBase = styled.div`
  background: linear-gradient(100deg, #e5e5e3 20%, #f5f5f4 42%, #e5e5e3 64%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.8s ease-in-out infinite;

  [data-theme='dark'] & {
    background: linear-gradient(100deg, #30302e 20%, #454542 42%, #30302e 64%);
    background-size: 200% 100%;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const CardSkeletonWrapper = styled.article`
  padding: 16px;
  margin: 4px 0 10px;
  border-radius: 20px;
  background: ${surface.light.surface};
  border: none;
  box-sizing: border-box;

  [data-theme='dark'] & {
    background: ${surface.dark.surface};
    box-shadow: var(--shadow-card-inset);
  }
`;

const PlaceHeaderSkeleton = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CategoryIconSkeleton = styled(SkeletonBase)`
  width: 38px;
  height: 38px;
  border-radius: 12px;
  flex-shrink: 0;
`;

const PlaceInfoSkeleton = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const TitleRowSkeleton = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const PlaceTitleSkeleton = styled(SkeletonBase)`
  height: 18px;
  width: 110px;
  border-radius: 4px;
`;

const BadgeSkeleton = styled(SkeletonBase)`
  height: 20px;
  width: 72px;
  border-radius: 9999px;
`;

const MetaSkeleton = styled(SkeletonBase)`
  height: 14px;
  width: 140px;
  border-radius: 4px;
`;

const MoodSkeleton = styled(SkeletonBase)`
  margin: 12px 0 12px;
  height: 48px;
  border-radius: 16px;
  width: 100%;
`;

const ReviewBodySkeleton = styled.div`
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TagsRowSkeleton = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
`;

const TagChipSkeleton = styled(SkeletonBase)<{ $width: number }>`
  height: 26px;
  width: ${({ $width }) => $width}px;
  border-radius: 9999px;
`;

const TextLineSkeleton = styled(SkeletonBase)<{ $width: string }>`
  height: 15px;
  width: ${({ $width }) => $width};
  border-radius: 4px;
`;

const FooterSkeleton = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 4px;
`;

const AuthorSkeleton = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const AvatarSkeleton = styled(SkeletonBase)`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const DateSkeleton = styled(SkeletonBase)`
  height: 14px;
  width: 90px;
  border-radius: 4px;
`;

const HelpfulBtnSkeleton = styled(SkeletonBase)`
  height: 30px;
  width: 80px;
  border-radius: 9999px;
`;

const RelatedPlaceSkeleton = styled(SkeletonBase)`
  margin-top: 12px;
  height: 56px;
  border-radius: 14px;
  width: 100%;
`;

export function WarmthCardSkeleton() {
  return (
    <CardSkeletonWrapper aria-hidden="true" data-testid="warmth-card-skeleton">
      <PlaceHeaderSkeleton>
        <CategoryIconSkeleton />
        <PlaceInfoSkeleton>
          <TitleRowSkeleton>
            <PlaceTitleSkeleton />
            <BadgeSkeleton />
          </TitleRowSkeleton>
          <MetaSkeleton />
        </PlaceInfoSkeleton>
      </PlaceHeaderSkeleton>

      <MoodSkeleton />

      <ReviewBodySkeleton>
        <TagsRowSkeleton>
          <TagChipSkeleton $width={58} />
          <TagChipSkeleton $width={68} />
          <TagChipSkeleton $width={52} />
        </TagsRowSkeleton>
        <TextLineSkeleton $width="94%" />
        <TextLineSkeleton $width="82%" />
        <TextLineSkeleton $width="60%" />
      </ReviewBodySkeleton>

      <FooterSkeleton>
        <AuthorSkeleton>
          <AvatarSkeleton />
          <DateSkeleton />
        </AuthorSkeleton>
        <HelpfulBtnSkeleton />
      </FooterSkeleton>

      <RelatedPlaceSkeleton />
    </CardSkeletonWrapper>
  );
}

export function WarmthFeedSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="온기 이야기를 불러오는 중입니다"
      data-testid="warmth-feed-skeleton-list"
    >
      {Array.from({ length: count }).map((_, index) => (
        <WarmthCardSkeleton key={`warmth-skeleton-${index}`} />
      ))}
    </div>
  );
}
