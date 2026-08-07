'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { meok } from '@/design-system/tokens';
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

interface HanokArchiveProps {
  villages: Village[];
  meta: VillageMeta;
}

export default function HanokArchive({ villages, meta }: HanokArchiveProps) {
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);

  return (
    <Root>
      <PageInner>
        {/* 이 달의 한옥 큐레이션 (첫번째 인트로 섹션) */}
        <SectionWrapper style={{ paddingTop: 'clamp(24px, 4vh, 48px)' }}>
          <HanokMonthly villages={villages} onSelectVillage={setSelectedVillage} />
        </SectionWrapper>

        {/* 전통 한옥 & 문화유산 도감 그리드 */}
        <SectionWrapper>
          <HanokGrid villages={villages} onSelectVillage={setSelectedVillage} />
        </SectionWrapper>

        {/* 전국 시공간 분할 지도 인터랙션 */}
        <SectionWrapper>
          <HanokMap villages={villages} onSelectVillage={setSelectedVillage} />
        </SectionWrapper>

        {/* 한옥 고택 스테이 확장형 아코디언 컬렉션 */}
        <SectionWrapper>
          <HanokStayAccordion villages={villages} onSelectVillage={setSelectedVillage} />
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
