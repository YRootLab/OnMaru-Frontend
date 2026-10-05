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
  background-color: ${surface.light.base};
  transition: background-color 0.4s ease;

  [data-theme='dark'] & {
    background-color: ${surface.dark.app};
  }
`;

const AmbientGlow = styled.div`
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
      <AmbientGlow />
    </BackgroundContainer>
  );
}

export default HanokAtmosphereBackground;
