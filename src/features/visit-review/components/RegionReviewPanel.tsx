'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { Heart, MessageSquareText, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { getPlaceSlipMotion } from '@/shared/motion/placeSlip';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { defaultVisitReviewRepository, type VisitReviewRepository } from '../api/visitReviewApi';
import type { VisitReviewRegionItem } from '../api/visitReviewContract';
import { createInitialVisitReviewListState, reduceVisitReviewListState } from '../reducers/visitReviewListReducer';

type RegionReviewPanelProps = {
  repository?: VisitReviewRepository;
};

const Wrap = styled.section`
  margin: 14px;
  padding: 14px;
  border: 1px solid #e5e5e3;
  border-radius: 12px;
  background: #f8f8f7;
`;

const Head = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
`;

const Title = styled.h3`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: #1f2328;
  font-size: 13px;
  font-weight: 900;
`;

const Help = styled.p`
  margin: 6px 0 0;
  color: #626b75;
  font-size: 11.5px;
  line-height: 1.45;
`;

const ChipGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
`;

const RegionChip = styled.button<{ $active: boolean }>`
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid ${({ $active }) => ($active ? '#2f6f4e' : '#e5e5e3')};
  border-radius: 9999px;
  background: ${({ $active }) => ($active ? 'rgba(47, 111, 78, 0.12)' : '#fff')};
  color: ${({ $active }) => ($active ? '#245b3f' : '#1f2328')};
  font: inherit;
  font-size: 11.5px;
  font-weight: 800;
  cursor: pointer;
`;

const Action = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 34px;
  margin-top: 10px;
  border: 0;
  border-radius: 8px;
  background: #1f2328;
  color: #fff;
  font: inherit;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const ReviewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  content-visibility: auto;
  contain-intrinsic-size: 240px;
`;

const ReviewCard = styled(motion.article)`
  padding: 10px;
  border-radius: 10px;
  background: #fff;
`;

const ReviewText = styled.p`
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: #1f2328;
  font-size: 12.5px;
  line-height: 1.55;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  color: #626b75;
  font-size: 11px;
`;

export default function RegionReviewPanel({ repository = defaultVisitReviewRepository }: RegionReviewPanelProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [regions, setRegions] = useState<VisitReviewRegionItem[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<VisitReviewRegionItem | null>(null);
  const [state, dispatch] = useReducer(reduceVisitReviewListState, undefined, createInitialVisitReviewListState);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    let active = true;
    repository
      .listRegions()
      .then((result) => {
        if (active) setRegions(result.items);
      })
      .catch(() => {
        if (active) setRegions([]);
      });
    return () => {
      active = false;
    };
  }, [repository]);

  const loadReviews = async () => {
    if (!selectedRegion) return;
    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;
    dispatch({ type: 'region-load-started', requestSeq, regionCode: selectedRegion.regionCode });
    try {
      const page = await repository.listReviews({
        scope: 'REGION',
        regionCode: selectedRegion.regionCode,
        limit: 20,
      });
      dispatch({ type: 'region-load-succeeded', requestSeq, page });
    } catch {
      dispatch({ type: 'region-load-failed', requestSeq, error: '후기를 불러오지 못했습니다.' });
    }
  };

  return (
    <Wrap aria-label="방문 후기 지역 탐색">
      <Head>
        <div>
          <Title>
            <MessageSquareText size={14} />
            지역 방문 후기
          </Title>
          <Help>지도 이동만으로 후기를 바꾸지 않고, 지역을 고른 뒤 목록을 불러옵니다.</Help>
        </div>
      </Head>

      <ChipGrid>
        {regions.map((region) => (
          <RegionChip
            key={region.regionCode}
            type="button"
            $active={selectedRegion?.regionCode === region.regionCode}
            onClick={() => setSelectedRegion(region)}
          >
            {region.name} {region.reviewCount}
          </RegionChip>
        ))}
      </ChipGrid>

      <Action type="button" disabled={!selectedRegion || state.loading} onClick={() => void loadReviews()}>
        {state.loading ? <RotateCcw size={13} /> : <MessageSquareText size={13} />}
        이 지역 후기 보기
      </Action>

      <ReviewList>
        {state.error && <Help role="alert">{state.error}</Help>}
        {state.reviews.map((review, index) => (
          <ReviewCard key={review.id} {...getPlaceSlipMotion({ reducedMotion, index })}>
            <ReviewText>{review.text}</ReviewText>
            <Meta>
              <span>{new Date(review.createdAt).toLocaleDateString('ko-KR')}</span>
              <span>
                <Heart size={11} fill={review.likedByMe ? 'currentColor' : 'none'} /> {review.likeCount}
              </span>
            </Meta>
          </ReviewCard>
        ))}
      </ReviewList>
    </Wrap>
  );
}
