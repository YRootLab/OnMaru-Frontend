'use client';

import React from 'react';
import styled from '@emotion/styled';

const DECKLE_EDGE_PATH =
  'M18 0 L14 55 L20 110 L16 165 L22 220 L15 275 L19 330 L13 385 L21 440 L17 495 L14 550 L20 605 L16 660 L23 715 L15 770 L18 825 L12 880 L20 935 L16 990 L22 1045 L14 1100 L19 1155 L17 1200';

const Container = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  opacity: 0.85;
  transition: opacity 1.1s ease;
`;

const DeckleSvg = styled.svg`
  position: absolute;
  top: 0;
  width: 22px;
  height: 100%;

  @media (max-width: 700px) {
    width: 12px;
  }
`;

const DeckleLeft = styled(DeckleSvg)`
  left: 0;
`;

const DeckleRight = styled(DeckleSvg)`
  right: 0;
  transform: scaleX(-1);
`;

const DeckleBody = styled.path`
  fill: #ffffff;

  [data-theme='dark'] & {
    fill: #1c1a17;
  }
`;

const DeckleShadow = styled.path`
  fill: none;
  stroke: rgba(70, 70, 70, 0.1);
  stroke-width: 3px;
  filter: blur(2px);
  transform: translate(2px, 0);

  [data-theme='dark'] & {
    stroke: rgba(0, 0, 0, 0.5);
    stroke-width: 2.5px;
  }
`;

const DeckleFringe = styled.path`
  fill: none;
  stroke: rgba(112, 112, 112, 0.16);
  stroke-width: 1px;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 2 1 4 1 3 2;

  [data-theme='dark'] & {
    stroke: rgba(240, 235, 225, 0.28);
  }
`;

export function HanjiDeckleEdge() {
  return (
    <Container aria-hidden="true">
      <DeckleLeft viewBox="0 0 32 1200" preserveAspectRatio="none">
        <DeckleBody d={`${DECKLE_EDGE_PATH} L0 1200 L0 0 Z`} />
        <DeckleShadow d={DECKLE_EDGE_PATH} />
        <DeckleFringe d={DECKLE_EDGE_PATH} />
      </DeckleLeft>
      <DeckleRight viewBox="0 0 32 1200" preserveAspectRatio="none">
        <DeckleBody d={`${DECKLE_EDGE_PATH} L0 1200 L0 0 Z`} />
        <DeckleShadow d={DECKLE_EDGE_PATH} />
        <DeckleFringe d={DECKLE_EDGE_PATH} />
      </DeckleRight>
    </Container>
  );
}
