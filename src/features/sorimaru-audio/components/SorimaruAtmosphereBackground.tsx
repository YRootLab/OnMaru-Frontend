'use client';

import React from 'react';
import styled from '@emotion/styled';
import { SorimaruBackgroundStage } from '@/features/sorimaru-audio/background/SorimaruBackgroundStage';
import type { SorimaruBackgroundVariant } from '@/features/sorimaru-audio/background/sorimaruBackground.types';

interface SorimaruAtmosphereBackgroundProps {
  variant?: SorimaruBackgroundVariant;
  selectedCategory?: string;
  isPlaying?: boolean;
}

const FixedAtmosphere = styled.div`
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background-color: #ffffff;
`;

const LayerInner = styled.div`
  position: absolute;
  inset: 0;
  opacity: 1;
`;

const RadialMask = styled.div`
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.96), transparent 72%);
`;

export const SorimaruAtmosphereBackground: React.FC<SorimaruAtmosphereBackgroundProps> = ({
  variant = 'default',
  selectedCategory = '전체',
  isPlaying = false,
}) => {
  if (variant !== 'default') {
    return (
      <SorimaruBackgroundStage
        variant={variant}
        selectedCategory={selectedCategory}
        isPlaying={isPlaying}
      />
    );
  }

  return (
    <FixedAtmosphere aria-hidden="true">
      <LayerInner>
        <RadialMask />
      </LayerInner>
    </FixedAtmosphere>
  );
};
