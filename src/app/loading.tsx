'use client';

import React, { useRef, useEffect } from 'react';

export default function Loading() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.defaultMuted = true;
    video.muted = true;
    const playPromise = video.play?.();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  }, []);

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
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
          onCanPlay={(e) => {
            e.currentTarget.muted = true;
            const p = e.currentTarget.play?.();
            if (p && typeof p.catch === 'function') {
              p.catch(() => {});
            }
          }}
        >
          <source src="/videos/Oni_loading.webm" type="video/webm" />
        </video>
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
