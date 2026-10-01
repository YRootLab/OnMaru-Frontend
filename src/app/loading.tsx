'use client';

import React, { useState } from 'react';

export default function Loading() {
  const [videoError, setVideoError] = useState(false);

  return (
    <div
      className="onmaru-loading-screen"
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        inset: 0,
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
        }}
      >
        {videoError ? (
          <img
            src="/images/character/Oni_loading.png"
            alt=""
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
