'use client';

import React, { useMemo } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { meok, lightPalette } from '@/design-system/tokens';
import { Sparkles, ArrowRight } from 'lucide-react';
import PolaroidCard from '@/hanok/components/PolaroidCard';
import type { Village } from '@/hanok/types';
import { filterLabel } from '@/hanok/filterLabels';
import { MONTHLY_CURATIONS } from '@/hanok/data/monthlyCurations.mjs';

const Section = styled.section`
  padding: 0;
  position: relative;
`;

const Inner = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
`;

const Header = styled.div`
  margin-bottom: clamp(28px, 4vh, 44px);
`;

const Title = styled(motion.h2)`
  font-family: var(--font-hanok);
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 300;
  color: ${meok[900]};
  margin: 0 0 10px;
  letter-spacing: -0.02em;
  line-height: 1.2;
`;

const Subtitle = styled.p`
  font-size: clamp(14px, 1.4vw, 15px);
  font-weight: 400;
  color: ${meok[500]};
  margin: 0;
  line-height: 1.7;
`;

// 1개 큐레이션 전용 피처드 레이아웃
const CuratedFeaturedContainer = styled.div`
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: clamp(32px, 5vw, 64px);
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 36px;
  }
`;

const CardWrapper = styled.div`
  width: 100%;
  max-width: 380px;
  margin: 0 auto;
`;

const EditorialContent = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const CategoryMeta = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-hanok);
  font-size: 12px;
  font-weight: 500;
  color: ${lightPalette.kobalt[500]};
  letter-spacing: 0.16em;
  text-transform: uppercase;
  margin-bottom: 8px;

  &::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${lightPalette.kobalt[500]};
  }
`;

const FeaturedTitle = styled.h3`
  font-family: var(--font-hanok);
  font-size: clamp(26px, 3.2vw, 38px);
  font-weight: 400;
  color: ${meok[900]};
  margin: 0 0 6px;
  letter-spacing: -0.025em;
  line-height: 1.25;
`;

const SubRegionTag = styled.p`
  font-size: 13.5px;
  font-weight: 400;
  color: ${meok[500]};
  margin: 0 0 24px;
`;

// 페이지 바탕이 한지톤이라 예전의 #faf8f5는 배경에 묻힌다. 흰 종이가 얹힌 것처럼 띄운다.
const StorySection = styled.div`
  position: relative;
  background: #ffffff;
  border-radius: 24px;
  padding: 28px 32px;
  margin-bottom: 28px;
`;

// 에디터가 직접 쓴 글의 머리표. 코발트는 인터랙션 색으로 남기고 여긴 무채색으로.
const QuoteHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${meok[500]};
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  margin-bottom: 12px;
`;

const CommentText = styled.p`
  font-family: var(--font-hanok);
  font-size: clamp(19px, 1.9vw, 23px);
  color: ${meok[900]};
  line-height: 1.7;
  margin: 0;
  word-break: keep-all;
`;

const DetailsButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  color: ${lightPalette.kobalt[500]};
  font-size: 14px;
  font-weight: 700;
  padding: 13px 26px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.22s ease;

  &:hover {
    background: ${lightPalette.kobalt[500]};
    color: #ffffff;
    transform: translateY(-2px);
  }
`;

interface HanokMonthlyProps {
  villages: Village[];
  onSelectVillage?: (v: Village) => void;
  isFeaturedReady?: boolean;
}

export default function HanokMonthly({ villages, onSelectVillage, isFeaturedReady = true }: HanokMonthlyProps) {
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const korMonth = `${currentMonth}월`;

  const curationInfo = useMemo(() => {
    return MONTHLY_CURATIONS[currentMonth] || MONTHLY_CURATIONS[8];
  }, [currentMonth]);

  /*
    못 박아 둔 contentId를 먼저 찾고, 이번 수집분에 없을 때만 키워드로 대체한다.

    둘 다 실패하면 villages[0]으로 채우지 않는다 — 그러면 에디터가 쓴 글(2월 "매화 향
    감도는 강릉")과 화면에 뜨는 마을(전혀 다른 곳)이 어긋난 채로 보여진다. 틀린 내용을
    보여주느니 이 섹션을 그냥 숨기는 편이 낫다.
  */
  const targetVillage = useMemo(() => {
    if (!villages || villages.length === 0) return null;
    const pinned = villages.find((v) => v.id === curationInfo.contentId);
    if (pinned) return pinned;

    return (
      villages.find(
        (v) =>
          v.name.includes(curationInfo.matchKeyword) ||
          v.addr.includes(curationInfo.matchKeyword) ||
          v.overview.includes(curationInfo.matchKeyword)
      ) ?? null
    );
  }, [villages, curationInfo]);

  if (!targetVillage) return null;

  return (
    <Section id="monthly" aria-labelledby="monthly-heading">
      <Inner>
        <Header>
          <Title
            id="monthly-heading"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            이달의 한옥
          </Title>
          <Subtitle>{korMonth}에는 어느 마루에 앉아 볼까요?</Subtitle>
        </Header>

        <CuratedFeaturedContainer>
          <CardWrapper>
            <PolaroidCard
              village={targetVillage}
              index={0}
              customHandText={curationInfo.handNote}
              onClick={onSelectVillage}
              isImageLoading={!isFeaturedReady}
            />
          </CardWrapper>

          <EditorialContent
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <CategoryMeta>계절이 고른 한 곳</CategoryMeta>

            <FeaturedTitle>{targetVillage.name}</FeaturedTitle>
            <SubRegionTag>{targetVillage.addr || targetVillage.region} · {filterLabel(targetVillage.type)}</SubRegionTag>

            <StorySection>
              <QuoteHeader>
                <Sparkles size={15} strokeWidth={2} /> 에디터 노트
              </QuoteHeader>
              <CommentText>{curationInfo.curatorComment}</CommentText>
            </StorySection>

            <DetailsButton onClick={() => onSelectVillage?.(targetVillage)}>
              {targetVillage.name} 자세히 보기 <ArrowRight size={16} strokeWidth={2} />
            </DetailsButton>
          </EditorialContent>
        </CuratedFeaturedContainer>
      </Inner>
    </Section>
  );
}

