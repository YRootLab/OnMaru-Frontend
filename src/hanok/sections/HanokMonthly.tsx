'use client';

import React, { useMemo } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { meok, lightPalette } from '@/design-system/tokens';
import { ArrowRight, Quote } from 'lucide-react';
import PolaroidCard from '@/hanok/components/PolaroidCard';
import type { Village } from '@/hanok/types';

// 12개월치 에디터 큐레이션 스토리 데이터 (미리 작성되어 자동 운영 가능)
const MONTHLY_CURATIONS: Record<number, { titleKeyword: string; handNote: string; curatorComment: string; matchKeyword: string }> = {
  1: {
    titleKeyword: '경복궁',
    handNote: '눈 내린 궁궐에서',
    curatorComment: '서설이 덮인 기와지붕 아래에서 새해 첫 숨을 고릅니다. 왕실의 온기가 남은 낙선재 툇마루에 잠시 앉아 보세요.',
    matchKeyword: '경복궁',
  },
  2: {
    titleKeyword: '선교장',
    handNote: '매화 향 감도는 강릉에서',
    curatorComment: '오래된 처마 밑으로 매화 향이 번지면 봄이 멀지 않았습니다. 연못 위 활래정에서 차 한 잔을 권합니다.',
    matchKeyword: '선교장',
  },
  3: {
    titleKeyword: '남산골',
    handNote: '봄바람 부는 도심에서',
    curatorComment: '남산 자락 마루에 앉으면 도심 소음이 잦아듭니다. 남는 것은 봄바람과 한옥의 온기뿐입니다.',
    matchKeyword: '남산',
  },
  4: {
    titleKeyword: '운조루',
    handNote: '살구꽃 흩날리는 구례에서',
    curatorComment: '지리산 자락 솟을대문 너머로 꽃잎이 날립니다. 누구나 쌀을 퍼 가게 했던 타인능해 쌀궤에서 나눔의 뜻을 읽습니다.',
    matchKeyword: '운조루',
  },
  5: {
    titleKeyword: '양진당',
    handNote: '신록이 짙어지는 안동에서',
    curatorComment: '솔숲이 초록으로 차오르는 계절입니다. 대청 툇간을 스치는 바람에 마음을 풀어 놓습니다.',
    matchKeyword: '하회',
  },
  6: {
    titleKeyword: '학인당',
    handNote: '차 한 잔의 전주 고택에서',
    curatorComment: '전주 한옥마을에서 가장 오래된 고택 학인당. 100년 된 대들보 아래에서 전통 차로 초여름 더위를 식힙니다.',
    matchKeyword: '학인당',
  },
  7: {
    titleKeyword: '영산암',
    handNote: '비 내리는 마당을 바라보며',
    curatorComment: '봉정사 영산암 마당에 낙숫물 소리가 가득합니다. 마루에 앉아 장맛비를 바라보는 것으로 충분한 하루.',
    matchKeyword: '영산암',
  },
  8: {
    titleKeyword: '안동',
    handNote: '녹음 우거진 안동 고택에서',
    curatorComment: '낙동강 자락에 물안개가 오릅니다. 대청에 누워 솔바람 소리를 듣는 여름 한낮의 안식처입니다.',
    matchKeyword: '안동',
  },
  9: {
    titleKeyword: '외암마을',
    handNote: '달빛 기우는 돌담길에서',
    curatorComment: '높고 푸른 하늘 아래 돌담길이 굽이집니다. 노랗게 익어가는 초가와 기와 사이로 가을이 번집니다.',
    matchKeyword: '외암',
  },
  10: {
    titleKeyword: '최부자댁',
    handNote: '단풍 물든 경주 고택에서',
    curatorComment: '가진 것을 나눈 가풍이 남은 최부자댁. 붉은 감나무와 마루 사이로 드는 가을 햇살을 쬐어 보세요.',
    matchKeyword: '최부자',
  },
  11: {
    titleKeyword: '윤증고택',
    handNote: '낙엽 쌓인 윤증고택에서',
    curatorComment: '장독대 위로 노란 은행잎이 쌓입니다. 비움의 미학이 담긴 명재고택에서 늦가을의 차분함을 누립니다.',
    matchKeyword: '윤증',
  },
  12: {
    titleKeyword: '은평',
    handNote: '눈 덮인 북한산 아래',
    curatorComment: '북한산 능선에 흰 눈이 앉은 도심 한옥. 데워진 구들목에 앉아 겨울밤 이야기를 나눕니다.',
    matchKeyword: '은평',
  },
};

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
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 700;
  color: ${meok[900]};
  margin: 0 0 10px;
  letter-spacing: -0.03em;
  line-height: 1.2;
`;

const Subtitle = styled.p`
  font-size: clamp(13.5px, 1.4vw, 15.5px);
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
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: ${lightPalette.kobalt[500]};
  letter-spacing: 0.12em;
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
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: clamp(26px, 3.2vw, 38px);
  font-weight: 700;
  color: ${meok[900]};
  margin: 0 0 6px;
  letter-spacing: -0.025em;
  line-height: 1.25;
`;

const SubRegionTag = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: ${meok[500]};
  margin: 0 0 24px;
`;

const StorySection = styled.div`
  position: relative;
  background: #faf8f5;
  border-radius: 24px;
  padding: 28px 32px;
  border: 1px solid rgba(43, 92, 230, 0.08);
  margin-bottom: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
`;

const QuoteHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${lightPalette.kobalt[400]};
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 12px;
`;

const CommentText = styled.p`
  font-family: 'NostalgicGukhanbakOchungiWriterKim', 'SpoqaHanSansNeo', cursive, sans-serif;
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
  border: 1.5px solid ${lightPalette.kobalt[500]};
  font-size: 14.5px;
  font-weight: 700;
  padding: 13px 26px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.22s ease;

  &:hover {
    background: ${lightPalette.kobalt[500]};
    color: #ffffff;
    box-shadow: 0 6px 18px rgba(43, 92, 230, 0.22);
    transform: translateY(-2px);
  }
`;

interface HanokMonthlyProps {
  villages: Village[];
  onSelectVillage?: (v: Village) => void;
}

export default function HanokMonthly({ villages, onSelectVillage }: HanokMonthlyProps) {
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const korMonth = `${currentMonth}월`;

  const curationInfo = useMemo(() => {
    return MONTHLY_CURATIONS[currentMonth] || MONTHLY_CURATIONS[8];
  }, [currentMonth]);

  // 이번 달 큐레이션에 매칭되는 한옥 선택 (없을 경우 첫번째)
  const targetVillage = useMemo(() => {
    if (!villages || villages.length === 0) return null;
    const found = villages.find(
      (v) =>
        v.name.includes(curationInfo.matchKeyword) ||
        v.addr.includes(curationInfo.matchKeyword) ||
        v.overview.includes(curationInfo.matchKeyword)
    );
    return found || villages[0];
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
          <Subtitle>
            에디터가 계절에 맞는 한옥 한 곳을 매달 고릅니다.
          </Subtitle>
        </Header>

        <CuratedFeaturedContainer>
          <CardWrapper>
            <PolaroidCard
              village={targetVillage}
              index={0}
              customHandText={curationInfo.handNote}
              onClick={onSelectVillage}
            />
          </CardWrapper>

          <EditorialContent
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <CategoryMeta>CURATOR&apos;S CHOICE · 계절의 기억</CategoryMeta>

            <FeaturedTitle>{targetVillage.name}</FeaturedTitle>
            <SubRegionTag>{targetVillage.addr || targetVillage.region} · {targetVillage.type}</SubRegionTag>

            <StorySection>
              <QuoteHeader>
                <Quote size={15} /> 에디터 노트
              </QuoteHeader>
              <CommentText>{curationInfo.curatorComment}</CommentText>
            </StorySection>

            <DetailsButton onClick={() => onSelectVillage?.(targetVillage)}>
              {targetVillage.name} 자세히 보기 <ArrowRight size={16} />
            </DetailsButton>
          </EditorialContent>
        </CuratedFeaturedContainer>
      </Inner>
    </Section>
  );
}

