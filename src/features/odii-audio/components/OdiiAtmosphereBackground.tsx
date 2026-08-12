'use client';

import React from 'react';
import { OdiiBackgroundStage } from '../background/OdiiBackgroundStage';
import type { OdiiBackgroundVariant } from '../background/odiiBackground.types';

interface OdiiAtmosphereBackgroundProps {
  variant?: OdiiBackgroundVariant;
  selectedCategory?: string;
  isPlaying?: boolean;
}

export const OdiiAtmosphereBackground: React.FC<OdiiAtmosphereBackgroundProps> = ({
  variant = 'default',
  selectedCategory = '전체',
  isPlaying = false,
}) => {
  if (variant !== 'default') {
    return (
      <OdiiBackgroundStage
        variant={variant}
        selectedCategory={selectedCategory}
        isPlaying={isPlaying}
      />
    );
  }

  return (
    <div className="odii-atmosphere pointer-events-none fixed inset-0 z-0 overflow-hidden bg-white" aria-hidden="true">
      <div className="odii-atmosphere-layer absolute inset-0 opacity-100">
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
