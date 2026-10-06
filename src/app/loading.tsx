'use client';

import React, { useState } from 'react';
import { useIsAppleDevice } from '@/shared/hooks/useIsAppleDevice';

export default function Loading() {
  const isApple = useIsAppleDevice();
  const [videoError, setVideoError] = useState(false);
  const showApng = isApple || videoError;

  return (
    <div
      className="onmaru-loading-screen"
      role="status"
      aria-live="polite"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <style>{`
        [data-theme='dark'] .onmaru-loading-screen {
          background: transparent !important;
        }
      `}</style>
      <div
        style={{
          width: 'clamp(200px, 24vw, 280px)',
          height: 'clamp(200px, 24vw, 280px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          userSelect: 'none',
          filter: 'drop-shadow(0 10px 24px rgba(0, 0, 0, 0.16))',
        }}
      >
        {showApng ? (
          <img
            src="/images/character/Oni_loading.png"
            alt="온마루 로딩 중"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-label="온마루 로딩 중"
            onError={() => setVideoError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          >
            <source src="/videos/Oni_loading.webm" type="video/webm" onError={() => setVideoError(true)} />
          </video>
        )}
      </div>
      <span
        style={{
          marginTop: '12px',
          fontSize: '13px',
          color: 'rgba(78, 89, 104, 0.5)',
          letterSpacing: '0.02em',
        }}
      >
        페이지 로딩 중
      </span>
    </div>
  );
}
