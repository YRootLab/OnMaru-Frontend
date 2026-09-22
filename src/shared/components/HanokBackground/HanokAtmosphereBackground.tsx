'use client';

import React from 'react';
import styled from '@emotion/styled';
import { surface } from '@/design-system/tokens';

const BackgroundContainer = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;




  z-index: -1;
  overflow: hidden;
  background-color: #ffffff;
  transition: background-color 0.4s ease;

  [data-theme='dark'] & {
    background-color: ${surface.dark.app};
  }
`;


const HanjiFiberLayer = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.5;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='hanjiNoise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.1 0 0 0 0 0.1 0 0 0 0 0.1 0 0 0 0.038 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23hanjiNoise)'/%3E%3C/svg%3E");
  background-repeat: repeat;

  [data-theme='dark'] & {
    opacity: 0.3;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='hanjiNoiseDark'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0.9 0 1 0 0 0.9 0 0 1 0 0.9 0 0 0 0.032 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23hanjiNoiseDark)'/%3E%3C/svg%3E");
  }
`;


const HanjiAmbientGlow = styled.div`
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.75) 0%, transparent 70%);

  [data-theme='dark'] & {
    background: radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.02) 0%, transparent 70%);
  }
`;

export function HanokAtmosphereBackground() {
  return (
    <BackgroundContainer aria-hidden="true">
      <HanjiFiberLayer />
      <HanjiAmbientGlow />
    </BackgroundContainer>
  );
}

export default HanokAtmosphereBackground;
