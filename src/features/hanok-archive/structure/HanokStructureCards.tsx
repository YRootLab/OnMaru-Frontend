'use client';

/*
  구조 챕터 진입 카드 두 장.

  절기 그림자와 7단계 조립은 도감의 대표 연출이라, 텍스트 링크로 접어두면 지나쳐 버린다.
  무엇을 보게 되는지 카드 안에서 먼저 보여주고 누를 이유를 만든다.
  3D는 모달을 열 때 비로소 받아온다 — 도감 본문 스크롤에는 아무 비용도 얹지 않는다.
*/

import { useState } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';

import { meok, palette, lightPalette, surface, fluidHeading , fontSize } from '@/design-system/tokens';
import SectionHeader from '@/features/hanok-archive/components/SectionHeader';

const SolarShadowModal = dynamic(() => import('./SolarShadowModal'), { ssr: false });
const HanokAssemblyModal = dynamic(() => import('./HanokAssemblyModal'), { ssr: false });

type OpenModal = 'shadow' | 'assembly' | null;

/*
  카드 두 장은 각각 다른 축이다 — 빛(절기), 순서(조립).
  같은 한옥을 두 방향에서 여는 문이라 나란히 서야 한다.
*/
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(12px, 1.6vw, 20px);

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

/*
  이 도감의 카드 언어는 색 배경이 아니라 중성 워시다 (분포 섹션의 통계 박스와 같은
  rgba(78, 89, 104, 0.03)). 두 카드만 채도 있는 파스텔로 서 있으면 도감 전체에서
  여기만 배너처럼 튄다. 구분은 배경색이 아니라 Eyebrow·Cue의 악센트 컬러가 진다.
*/
const Card = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: clamp(20px, 2.4vw, 30px);
  text-align: left;

  border: none;
  border-radius: 20px;
  background: rgba(78, 89, 104, 0.03);
  font-family: inherit;
  cursor: pointer;
  transition:
    background-color 0.18s ease-out,
    transform 0.18s ease-out;

  &:hover {
    background: rgba(78, 89, 104, 0.06);
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid ${meok[900]};
    outline-offset: 3px;
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.04);
  }

  [data-theme='dark'] &:hover {
    background: rgba(255, 255, 255, 0.07);
  }

  [data-theme='dark'] &:focus-visible {
    outline-color: ${meok[100]};
  }
`;

const Eyebrow = styled.span<{ $color: string; $darkColor?: string }>`
  font-size: ${fontSize.xs};
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${({ $color }) => $color};

  [data-theme='dark'] & {
    color: ${({ $darkColor, $color }) => $darkColor || $color};
  }
`;

const CardTitle = styled.span`
  font-size: ${fluidHeading.card};
  font-weight: 500;
  letter-spacing: -0.022em;
  line-height: 1.3;
  color: ${meok[900]};
  word-break: keep-all;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const CardDesc = styled.span`
  font-size: ${fontSize.sm};
  font-weight: 400;
  line-height: 1.7;
  color: ${meok[700]};
  word-break: keep-all;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const Cue = styled.span<{ $color: string; $darkColor?: string }>`
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${({ $color }) => $color};

  [data-theme='dark'] & {
    color: ${({ $darkColor, $color }) => $darkColor || $color};
  }
`;

/** 카드 안에서 무엇을 보게 되는지 먼저 보여주는 정지 프레임. */
const Preview = styled.span`
  position: relative;
  display: block;
  width: 100%;
  height: clamp(96px, 12vw, 132px);
  margin-top: 6px;
  overflow: hidden;
  border-radius: 12px;
  background: ${surface.light.card};

  [data-theme='dark'] & {
    background: ${surface.dark.card};
  }
`;

/** 처마 한 겹과 그 아래로 뻗는 그림자. 절기가 바뀌면 이 길이가 바뀐다. */
const ShadowPreview = styled(Preview)`
  &::before {
    content: '';
    position: absolute;
    left: 14%;
    top: 26%;
    width: 44%;
    height: 12%;
    border-radius: 3px;
    background: ${meok[700]};
  }

  &::after {
    content: '';
    position: absolute;
    left: 22%;
    top: 58%;
    width: 62%;
    height: 9%;
    border-radius: 3px;
    background: linear-gradient(to right, rgba(58, 46, 31, 0.42), rgba(58, 46, 31, 0.06));
    transform: skewX(-38deg);
  }
`;

/** 아래에서부터 쌓여 올라가는 부재 일곱 켜. */
const AssemblyPreview = styled(Preview)`
  display: flex;
  flex-direction: column-reverse;
  align-items: stretch;
  justify-content: center;
  gap: 4px;
  /* 세로 패딩을 %로 주면 가로 길이 기준이라 내용 높이를 다 먹는다. px로 잡는다. */
  padding: 14px 24%;

  span {
    display: block;
    flex: 0 0 8px;
    border-radius: 2px;
    background: ${lightPalette.juhong[400]};
  }

  span:nth-of-type(1) {
    opacity: 1;
  }
  span:nth-of-type(2) {
    opacity: 0.88;
  }
  span:nth-of-type(3) {
    opacity: 0.76;
  }
  span:nth-of-type(4) {
    opacity: 0.62;
  }
  span:nth-of-type(5) {
    opacity: 0.46;
  }
  span:nth-of-type(6) {
    opacity: 0.3;
  }
  span:nth-of-type(7) {
    opacity: 0.16;
  }
`;

export default function HanokStructureCards() {
  const [open, setOpen] = useState<OpenModal>(null);
  const close = () => setOpen(null);

  return (
    <>
      <SectionHeader
        id="structure-heading"
        title="한옥 공간 미학과 구조의 과학"
        subtitle="24절기 처마 일조 분석과 7단계 3D 부재 결구"
      />
      <Grid>
        <Card type="button" onClick={() => setOpen('shadow')}>
          <Eyebrow $color={lightPalette.hwanggeum[700]} $darkColor={palette.hwanggeum[400]}>빛</Eyebrow>
          <CardTitle>처마는 어떻게 여름 볕을 자르고 겨울 볕을 들이나</CardTitle>
          <CardDesc>
            절기를 옮겨 보세요. 남중고도에 따라 처마 그림자가 실제 비율로 늘고 줄어듭니다.
          </CardDesc>
          <ShadowPreview aria-hidden="true" />
          <Cue $color={lightPalette.hwanggeum[700]} $darkColor={palette.hwanggeum[400]}>
            그림자 시뮬레이션 열기 <span aria-hidden="true">→</span>
          </Cue>
        </Card>

        <Card type="button" onClick={() => setOpen('assembly')}>
          <Eyebrow $color={lightPalette.juhong[700]} $darkColor={palette.juhong[400]}>뼈대</Eyebrow>
          <CardTitle>기단에서 기와까지, 한옥은 일곱 켜로 선다</CardTitle>
          <CardDesc>
            스크롤을 내리며 한 켜씩 세워 보세요. 못 하나 없이 부재가 제자리를 찾아 들어갑니다.
          </CardDesc>
          <AssemblyPreview aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </AssemblyPreview>
          <Cue $color={lightPalette.juhong[700]} $darkColor={palette.juhong[400]}>
            7단계 조립 열기 <span aria-hidden="true">→</span>
          </Cue>
        </Card>
      </Grid>

      {open === 'shadow' && <SolarShadowModal onClose={close} />}
      {open === 'assembly' && <HanokAssemblyModal onClose={close} />}
    </>
  );
}
