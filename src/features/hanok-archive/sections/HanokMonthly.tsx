'use client';

import React, { useMemo } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { meok, palette, surface } from '@/design-system/tokens';
import { Sparkles, ArrowRight } from 'lucide-react';
import PolaroidCard from '@/features/hanok-archive/components/PolaroidCard';
import type { Village } from '@/features/hanok-archive/types';
import { filterLabel } from '@/features/hanok-archive/filterLabels';
import { MONTHLY_CURATIONS } from '@/features/hanok-archive/data/monthlyCurations.mjs';

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

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const Subtitle = styled.p`
  font-size: clamp(14px, 1.4vw, 15px);
  font-weight: 400;
  color: ${meok[500]};
  margin: 0;
  line-height: 1.7;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

// 1개 큐레이션 전용 피처드 레이아웃
const CuratedFeaturedContainer = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: clamp(32px, 5vw, 64px);
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 36px;
  }
`;

/*
  폴라로이드가 살짝 기울어진 채(회전 축은 바닥 중심) 렌더되는데, 이 섹션을 감싸는
  VesselReveal이 overflow: hidden이라 회전으로 삐져나온 하단 모서리가 잘렸다.
  잘리는 만큼을 여기 패딩으로 미리 확보해 둔다.
*/
const CardWrapper = styled.div`
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  padding-bottom: 24px;
`;

const EditorialContent = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const FeaturedTitle = styled.h3`
  font-family: var(--font-hanok);
  font-size: clamp(26px, 3.2vw, 38px);
  font-weight: 400;
  color: ${meok[900]};
  margin: 0 0 6px;
  letter-spacing: -0.025em;
  line-height: 1.25;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const SubRegionTag = styled.p`
  font-size: 13.5px;
  font-weight: 400;
  color: ${meok[500]};
  margin: 0 0 24px;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

// 페이지 배경도 순백(#ffffff)이라 카드 배경만 같은 흰색이면 경계가 아예 안 보인다.
// 그림자·테두리로 "종이가 얹힌" 경계를 실제로 만든다.
const StorySection = styled.div`
  position: relative;
  background: #ffffff;
  border: 1px solid rgba(25, 31, 40, 0.06);
  border-radius: 24px;
  padding: 28px 32px;
  margin-bottom: 28px;
  box-shadow: 0 1px 3px rgba(25, 31, 40, 0.04), 0 8px 24px rgba(25, 31, 40, 0.06);

  [data-theme='dark'] & {
    background: ${surface.dark.card};
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: none;
  }
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

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const CommentText = styled.p`
  font-family: 'GeuriunXGukhanbakSingoyangI', var(--font-hanok);
  font-size: clamp(19px, 1.9vw, 23px);
  color: ${meok[900]};
  line-height: 1.7;
  margin: 0;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

/* 형광펜으로 그은 느낌 — 황금빛 햇살이 드리운 듯한 은은한 전통 책갈피 톤 */
const Highlight = styled.span`
  background: rgba(255, 208, 38, 0.32);
  padding: 0.05em 0.25em;
  border-radius: 3px;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;

  [data-theme='dark'] & {
    background: rgba(255, 208, 38, 0.22);
  }
`;

const DetailsButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: ${palette.kobalt[50]};
  color: ${palette.kobalt[700]};
  font-size: 14px;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  transition: all 0.22s ease;

  &:hover {
    background: ${palette.kobalt[500]};
    color: #ffffff;
    transform: translateY(-2px);
  }

  [data-theme='dark'] & {
    background: rgba(27, 91, 255, 0.18);
    color: ${palette.kobalt[400]};

    &:hover {
      background: ${palette.kobalt[500]};
      color: #ffffff;
    }
  }
`;

interface HanokMonthlyProps {
  villages: Village[];
  onSelectVillage?: (v: Village) => void;
  isFeaturedReady?: boolean;
}

/* 형광펜 표시를 전체 문장이 아니라 절반(첫 문장)에만 긋는다 */
function splitFirstSentence(text: string): [string, string] {
  const match = text.match(/^([\s\S]+?[.!?])\s*([\s\S]*)$/);
  if (!match) return [text, ''];
  return [match[1], match[2]];
}

export default function HanokMonthly({ villages, onSelectVillage, isFeaturedReady = true }: HanokMonthlyProps) {
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const korMonth = `${currentMonth}월`;

  const curationInfo = useMemo(() => {
    const curations = MONTHLY_CURATIONS as Record<number, (typeof MONTHLY_CURATIONS)[keyof typeof MONTHLY_CURATIONS]>;
    return curations[currentMonth] || curations[8];
  }, [currentMonth]);

  /*
    못 박아 둔 contentId를 먼저 찾고, 이번 수집분에 없을 때만 키워드로 대체한다.

    둘 다 실패하면 villages[0]으로 채우지 않는다 — 그러면 에디터가 쓴 글(2월 "매화 향
    감도는 강릉")과 화면에 뜨는 마을(전혀 다른 곳)이 어긋난 채로 보여진다. 틀린 내용을
    보여주느니 이 섹션을 그냥 숨기는 편이 낫다.

    후보 중엔 사진이 없는 항목도 섞여 있어 폴라로이드가 빈 아이콘으로 뜨는 경우가
    있었다. 같은 장소를 가리키는 후보(핀 + 키워드) 중 사진이 있는 쪽을 우선한다.
  */
  const targetVillage = useMemo(() => {
    if (!villages || villages.length === 0) return null;
    const pinned = villages.find((v) => v.id === curationInfo.contentId) ?? null;
    const keywordMatches = villages.filter(
      (v) =>
        v.name.includes(curationInfo.matchKeyword) ||
        v.addr.includes(curationInfo.matchKeyword) ||
        v.overview.includes(curationInfo.matchKeyword)
    );

    const withImage = [pinned, ...keywordMatches].find((v) => v?.hasImage);
    return withImage ?? pinned ?? keywordMatches[0] ?? null;
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
            이달의 픽
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
            <FeaturedTitle>{targetVillage.name}</FeaturedTitle>
            <SubRegionTag>{targetVillage.addr || targetVillage.region} · {filterLabel(targetVillage.type)}</SubRegionTag>

            <StorySection>
              <QuoteHeader>
                <Sparkles size={15} strokeWidth={2} /> 에디터 노트
              </QuoteHeader>
              <CommentText>
                {(() => {
                  const [marked, rest] = splitFirstSentence(curationInfo.curatorComment);
                  return (
                    <>
                      <Highlight>{marked}</Highlight>
                      {rest ? ` ${rest}` : ''}
                    </>
                  );
                })()}
              </CommentText>
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

