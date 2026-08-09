'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
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

const SectionWrapper = styled.div`
  padding-top: clamp(48px, 6vh, 80px);
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
      <PageInner>
        {/* 페이지 진입부: 한옥도감이 무엇이고 왜 필요한지 */}
        <Intro>
          <Eyebrow>온마루 한옥도감</Eyebrow>
          <PageTitle>한옥은 지나간 유산이 아니라 지금도 사람이 사는 집입니다</PageTitle>
          <Lead>
            수백 년을 버틴 집이 지금 어디에 어떤 모습으로 남아 있는지, 궁궐부터 고택·서원·전통마을과
            머물 수 있는 고택 스테이까지 한자리에 기록합니다.
          </Lead>
          <SourceNote>
            한국관광공사 TourAPI 실시간 연동 · 현재 <strong>{meta.total}곳</strong> 수집
          </SourceNote>
        </Intro>

        {/* 이 달의 한옥 큐레이션 */}
        <SectionWrapper style={{ paddingTop: 'clamp(24px, 4vh, 48px)' }}>
          <HanokMonthly villages={villages} onSelectVillage={setSelectedVillage} />
        </SectionWrapper>

        {/* 전통 한옥 & 문화유산 도감 그리드 */}
        <SectionWrapper>
          <HanokGrid villages={villages} onSelectVillage={setSelectedVillage} />
        </SectionWrapper>

        {/* 한옥 고택 스테이 확장형 아코디언 컬렉션 */}
        <SectionWrapper>
          <HanokStayAccordion villages={villages} onSelectVillage={setSelectedVillage} />
        </SectionWrapper>

        {/* 전국 시공간 분할 지도 인터랙션 */}
        <SectionWrapper>
          <HanokMap villages={villages} onSelectVillage={setSelectedVillage} />
        </SectionWrapper>

        {/* 온마루 한옥 매니페스토 */}
        <SectionWrapper>
          <HanokManifestoCta />
        </SectionWrapper>
      </PageInner>

      {/* 마을 상세 인터랙티브 모달 */}
      <VillageDetailModal
        village={selectedVillage}
        onClose={() => setSelectedVillage(null)}
      />
    </Root>
  );
}
