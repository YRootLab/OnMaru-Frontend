'use client';

import React from 'react';
import { SorimaruBackgroundStage } from '@/features/sorimaru-audio/background/SorimaruBackgroundStage';
import type { SorimaruBackgroundVariant } from '@/features/sorimaru-audio/background/sorimaruBackground.types';
import { HanokAtmosphereBackground } from '@/shared/components/HanokBackground';

interface SorimaruAtmosphereBackgroundProps {
  variant?: SorimaruBackgroundVariant;
  selectedCategory?: string;
  isPlaying?: boolean;
}

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

  return <HanokAtmosphereBackground />;
};
