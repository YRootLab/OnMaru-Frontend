'use client';

import React from 'react';
import { SorimaruBackgroundStage } from '@/features/sorimaru-audio/background/SorimaruBackgroundStage';
import type { SorimaruBackgroundVariant } from '@/features/sorimaru-audio/background/sorimaruBackground.types';

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

  return (
    <div className="sorimaru-atmosphere pointer-events-none fixed inset-0 z-0 overflow-hidden bg-white" aria-hidden="true">
      <div className="sorimaru-atmosphere-layer absolute inset-0 opacity-100">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.96), transparent 72%)',
          }}
        />
      </div>
    </div>
  );
};
