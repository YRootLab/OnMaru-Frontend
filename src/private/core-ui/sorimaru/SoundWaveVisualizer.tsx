'use client';

import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion } from 'framer-motion';
import { palette, meok } from '@/design-system/tokens';

interface SoundWaveVisualizerProps {
  isPlaying: boolean;
  color?: string;
  barCount?: number;
}

const pulseAnim = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const VisualizerWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const Canvas = styled.canvas`
  height: 1.5rem;
  width: 5rem;
`;

const LiveBadge = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: ${palette.juhong[500]};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  animation: ${pulseAnim} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;

export const SoundWaveVisualizer: React.FC<SoundWaveVisualizerProps> = ({
  isPlaying,
  color = palette.juhong[400],
  barCount = 18,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const gap = 3;
      const barWidth = Math.max(2, (width - gap * (barCount - 1)) / barCount);

      phase += isPlaying ? 0.08 : 0.02;

      for (let i = 0; i < barCount; i++) {
        const factor = Math.sin(phase + i * 0.45) * 0.5 + 0.5;
        const barHeight = isPlaying
          ? Math.max(4, height * (0.2 + factor * 0.75))
          : Math.max(3, height * 0.15);

        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, palette.juhong[600]);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, color, barCount]);

  return (
    <VisualizerWrapper>
      <Canvas ref={canvasRef} width={80} height={24} />
      {isPlaying && (
        <LiveBadge>
          LIVE SOUND
        </LiveBadge>
      )}
    </VisualizerWrapper>
  );
};

const VinylWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const VinylDisc = styled(motion.div)`
  position: relative;
  display: flex;
  height: 6rem;
  width: 6rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background-color: #111111;
  padding: 0.25rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);

  @media (min-width: 640px) {
    height: 7rem;
    width: 7rem;
  }
`;

const TextureRing1 = styled.div`
  position: absolute;
  inset: 0.5rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const TextureRing2 = styled.div`
  position: absolute;
  inset: 1rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

const TextureRing3 = styled.div`
  position: absolute;
  inset: 1.5rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.04);
`;

const AlbumArtCenter = styled.div`
  height: 2.5rem;
  width: 2.5rem;
  overflow: hidden;
  border-radius: 9999px;
  border: 2px solid rgba(255, 255, 255, 0.2);

  @media (min-width: 640px) {
    height: 3rem;
    width: 3rem;
  }

  & img {
    height: 100%;
    width: 100%;
    object-fit: cover;
  }
`;

const CenterPinHole = styled.div`
  position: absolute;
  height: 0.75rem;
  width: 0.75rem;
  border-radius: 9999px;
  background-color: #fbf8f2;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.6);
`;

export const FloatingVinylDisc: React.FC<{ imageUrl: string; isPlaying: boolean }> = ({
  imageUrl,
  isPlaying,
}) => {
  return (
    <VinylWrapper>
      {}
      <VinylDisc
        animate={{ rotate: isPlaying ? 360 : 0 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      >
        {}
        <TextureRing1 />
        <TextureRing2 />
        <TextureRing3 />

        {}
        <AlbumArtCenter>
          <img
            src={imageUrl || 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80'}
            alt=""
          />
        </AlbumArtCenter>
      </VinylDisc>

      {}
      <CenterPinHole />
    </VinylWrapper>
  );
};
