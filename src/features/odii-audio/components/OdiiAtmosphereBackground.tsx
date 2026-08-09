'use client';

import React from 'react';
export const OdiiAtmosphereBackground: React.FC = () => {
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
