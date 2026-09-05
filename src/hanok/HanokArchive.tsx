'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/react';
import { meok, lightPalette } from '@/design-system/tokens';
import HanokGrid from '@/hanok/sections/HanokGrid';
import HanokMap from '@/hanok/sections/HanokMap';
import HanokStayAccordion from '@/hanok/sections/HanokStayAccordion';
import HanokMonthly from '@/hanok/sections/HanokMonthly';
import HanokManifestoCta from '@/hanok/sections/HanokManifestoCta';
import VillageDetailModal from '@/hanok/components/VillageDetailModal';
import type { Village, VillageMeta } from '@/hanok/types';

const Root = styled.div`
  min-height: 100vh;
  font-family: 'SpoqaHanSansNeo', sans-serif;
  color: ${meok[900]};
`;

const PageInner = styled.div`
  width: 100%;
  margin: 0;
  padding: 0;
`;

// 페이지 바탕. PageContainer가 좌우 패딩을 가지고 있어 Root에 칠하면 양옆이 흰색으로 남는다.
// 한옥 페이지에 있는 동안만 body 자체를 한지톤으로 깐다(언마운트 시 자동 복원).
const paperGround = css`
  body {
    background: #f5f5f4;
  }
`;

// 섹션 완급: 매거진(이달의 한옥·매니페스토)은 넓게 비우고,
// 아카이브 3종(도감·스테이·지도)은 붙여서 한 덩어리로 읽히게 한다.
const EditorialSection = styled.div`
  padding-top: clamp(28px, 4vh, 52px);
`;

const ArchiveGroup = styled.div`
  padding-top: clamp(88px, 12vh, 160px);
`;

const ArchiveSection = styled.div`
  padding-top: clamp(36px, 4.5vh, 60px);
`;

const Intro = styled.header`
  padding: clamp(40px, 7vh, 88px) 0 clamp(8px, 2vh, 20px);
  max-width: 760px;
`;

const Eyebrow = styled.p`
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${lightPalette.kobalt[500]};
  margin: 0 0 14px;
`;

const PageTitle = styled.h1`
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: clamp(32px, 5.2vw, 56px);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.035em;
  color: ${meok[900]};
  margin: 0 0 18px;
  word-break: keep-all;
`;

const Lead = styled.p`
  font-size: clamp(15px, 1.6vw, 17px);
  line-height: 1.75;
  color: ${meok[700]};
  margin: 0 0 20px;
  word-break: keep-all;
`;

const SourceNote = styled.p`
  font-size: 13px;
  color: ${meok[500]};
  margin: 0;

  strong {
    font-weight: 700;
    color: ${lightPalette.kobalt[500]};
  }
`;

interface HanokArchiveProps {
  villages: Village[];
  meta: VillageMeta;
}

export default function HanokArchive({ villages, meta }: HanokArchiveProps) {
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);

  return (
    <Root>
      <Global styles={paperGround} />
      <PageInner>
        {/* 진입부는 질문을 던지고, 답(왜 한옥인가)은 맨 아래 매니페스토가 한다 */}
        <Intro>
          <Eyebrow>온마루 한옥도감</Eyebrow>
          <PageTitle>지금 한옥은 어디에 남아 있을까</PageTitle>
          <Lead>
            궁궐과 고택, 서원과 전통마을, 그리고 하룻밤 머물 수 있는 집까지. 계절마다 한 곳을
            골라 들여다보고 나머지는 도감과 지도로 기록합니다.
          </Lead>
          <SourceNote>
            한국관광공사 TourAPI 실시간 연동 · 현재 <strong>{meta.total}곳</strong> 수집
          </SourceNote>
        </Intro>

        {/* 이 달의 한옥 큐레이션 */}
        <EditorialSection>
          <HanokMonthly villages={villages} onSelectVillage={setSelectedVillage} />
        </EditorialSection>

        {/* 아카이브 한 덩어리: 도감 → 스테이 → 지도 */}
        <ArchiveGroup>
          <HanokGrid villages={villages} onSelectVillage={setSelectedVillage} />

          <ArchiveSection>
            <HanokStayAccordion villages={villages} onSelectVillage={setSelectedVillage} />
          </ArchiveSection>

          <ArchiveSection>
            <HanokMap villages={villages} onSelectVillage={setSelectedVillage} />
          </ArchiveSection>
        </ArchiveGroup>

        {/* 온마루 한옥 매니페스토 (자체 상하 여백을 가지고 있다) */}
        <HanokManifestoCta />
      </PageInner>

      {/* 마을 상세 인터랙티브 모달 */}
      <VillageDetailModal
        village={selectedVillage}
        onClose={() => setSelectedVillage(null)}
      />
    </Root>
  );
}
