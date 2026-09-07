'use client';

import React, { useMemo } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { meok, lightPalette } from '@/design-system/tokens';
import { ArrowRight, Quote } from 'lucide-react';
import PolaroidCard from '@/hanok/components/PolaroidCard';
import type { Village } from '@/hanok/types';

// 12개월치 에디터 큐레이션 스토리 데이터 (미리 작성되어 자동 운영 가능)
//
// contentId는 TourAPI의 실제 콘텐츠 ID다. 예전엔 matchKeyword만 두고 이름·주소·설명에
// 그 단어가 들어가는 '첫 번째' 항목을 집었는데, 8월 '안동'이 임의의 종택으로 튀는 등
// 에디터가 쓴 글과 화면에 뜨는 곳이 어긋났다. 이제 ID로 못 박고 키워드는 폴백으로만 쓴다.
interface MonthlyCuration {
  contentId: string;
  handNote: string;
  curatorComment: string;
  matchKeyword: string;
}

const MONTHLY_CURATIONS: Record<number, MonthlyCuration> = {
  1: {
    contentId: '126508', // 경복궁
    handNote: '눈 내린 궁궐에서',
    curatorComment: '서설이 덮인 기와지붕 아래에서 새해 첫 숨을 고릅니다. 왕실의 온기가 남은 낙선재 툇마루에 잠시 앉아 보세요.',
    matchKeyword: '경복궁',
  },
  2: {
    contentId: '125800', // 강릉 선교장
    handNote: '매화 향 감도는 강릉에서',
    curatorComment: '오래된 처마 밑으로 매화 향이 번지면 봄이 멀지 않았습니다. 연못 위 활래정에서 차 한 잔을 권합니다.',
    matchKeyword: '선교장',
  },
  3: {
    contentId: '126747', // 남산골한옥마을
    handNote: '봄바람 부는 도심에서',
    curatorComment: '남산 자락 마루에 앉으면 도심 소음이 잦아듭니다. 남는 것은 봄바람과 한옥의 온기뿐입니다.',
    matchKeyword: '남산',
  },
  4: {
    contentId: '128994', // 구례 운조루 고택
    handNote: '살구꽃 흩날리는 구례에서',
    curatorComment: '지리산 자락 솟을대문 너머로 꽃잎이 날립니다. 누구나 쌀을 퍼 가게 했던 타인능해 쌀궤에서 나눔의 뜻을 읽습니다.',
    matchKeyword: '운조루',
  },
  5: {
    contentId: '894027', // 안동 하회마을
    handNote: '신록이 짙어지는 하회에서',
    curatorComment: '낙동강이 마을을 휘돌아 나가고 솔숲이 초록으로 차오릅니다. 양진당 대청 툇간을 스치는 바람에 마음을 풀어 놓습니다.',
    matchKeyword: '하회',
  },
  6: {
    contentId: '1882371', // 전주 학인당
    handNote: '차 한 잔의 전주 고택에서',
    curatorComment: '전주 한옥마을에서 가장 오래된 고택 학인당. 100년 된 대들보 아래에서 전통 차로 초여름 더위를 식힙니다.',
    matchKeyword: '학인당',
  },
  7: {
    contentId: '3038753', // 봉정사영산암
    handNote: '비 내리는 마당을 바라보며',
    curatorComment: '봉정사 영산암 마당에 낙숫물 소리가 가득합니다. 마루에 앉아 장맛비를 바라보는 것으로 충분한 하루.',
    matchKeyword: '영산암',
  },
  8: {
    contentId: '128560', // 안동 임청각
    handNote: '낙동강 굽어보는 안동에서',
    curatorComment: '낙동강 물길을 마주 보고 선 임청각. 군자정 마루에 앉아 강바람을 맞으면 여름 한낮의 열기가 한 겹 걷힙니다.',
    matchKeyword: '임청각',
  },
  9: {
    contentId: '126001', // 외암민속마을
    handNote: '달빛 기우는 돌담길에서',
    curatorComment: '높고 푸른 하늘 아래 돌담길이 굽이집니다. 노랗게 익어가는 초가와 기와 사이로 가을이 번집니다.',
    matchKeyword: '외암',
  },
  10: {
    contentId: '2614343', // 경주 최부자댁
    handNote: '단풍 물든 경주 고택에서',
    curatorComment: '가진 것을 나눈 가풍이 남은 최부자댁. 붉은 감나무와 마루 사이로 드는 가을 햇살을 쬐어 보세요.',
    matchKeyword: '최부자',
  },
  11: {
    contentId: '1992090', // 논산 명재고택(윤증고택)
    handNote: '낙엽 쌓인 명재고택에서',
    curatorComment: '장독대 위로 노란 은행잎이 쌓입니다. 비움의 미학이 담긴 명재고택에서 늦가을의 차분함을 누립니다.',
    matchKeyword: '명재',
  },
  12: {
    contentId: '2724392', // 은평한옥마을
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
  font-size: 14.5px;
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

  // 못 박아 둔 contentId를 먼저 찾고, 이번 수집분에 없을 때만 키워드로 대체한다.
  const targetVillage = useMemo(() => {
    if (!villages || villages.length === 0) return null;
    const pinned = villages.find((v) => v.id === curationInfo.contentId);
    if (pinned) return pinned;

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
              isImageLoading={!isFeaturedReady}
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

