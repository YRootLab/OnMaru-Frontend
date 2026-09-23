'use client';

import React from 'react';
import styled from '@emotion/styled';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';

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
  width: 20px;
  height: 100%;

  @media (max-width: 700px) {
    width: 10px;
  }
`;

const DeckleLeft = styled(DeckleSvg)`
  left: 0;
`;

const DeckleRight = styled(DeckleSvg)`
  right: 0;
  transform: scaleX(-1);
`;

const DeckleShadow = styled.path<{ $isDark: boolean }>`
  fill: none;
  stroke: ${({ $isDark }) =>
    $isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(70, 70, 70, 0.08)'};
  stroke-width: 2.5px;
  filter: blur(1.5px);
  transform: translate(1px, 0);
  vector-effect: non-scaling-stroke;
`;

const DeckleFringe = styled.path<{ $isDark: boolean }>`
  fill: none;
  stroke: ${({ $isDark }) =>
    $isDark ? 'rgba(240, 235, 225, 0.32)' : 'rgba(112, 112, 112, 0.22)'};
  stroke-width: 1.2px;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 2 1 4 1 3 2;
  vector-effect: non-scaling-stroke;
  transition: stroke 0.3s ease;
`;

export function HanjiDeckleEdge() {



  return null;














}
