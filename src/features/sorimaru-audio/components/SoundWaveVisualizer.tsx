'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface SoundWaveVisualizerProps {
  isPlaying: boolean;
  color?: string;
  barCount?: number;
}

export const SoundWaveVisualizer: React.FC<SoundWaveVisualizerProps> = ({
  isPlaying,
  color = '#d4af37',
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
        gradient.addColorStop(1, '#a94d35');

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
    <div className="flex items-center gap-1">
      <canvas ref={canvasRef} width={80} height={24} className="h-6 w-20" />
      {isPlaying && (
        <span className="animate-pulse text-[9px] font-bold text-[#d4af37] uppercase tracking-wider">
          LIVE SOUND
        </span>
      )}
    </div>
  );
};

export const FloatingVinylDisc: React.FC<{ imageUrl: string; isPlaying: boolean }> = ({
  imageUrl,
  isPlaying,
}) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* 바깥쪽 회전 바이닐 LP 판 */}
      <motion.div
        animate={{ rotate: isPlaying ? 360 : 0 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#111111] p-1   sm:h-28 sm:w-28"
      >
        {/* LP 텍스처 링 */}
        <div className="absolute inset-2 rounded-full " />
        <div className="absolute inset-4 rounded-full " />
        <div className="absolute inset-6 rounded-full " />

        {/* 앨범 아트 섬네일 중심 */}
        <div className="h-10 w-10 overflow-hidden rounded-full   sm:h-12 sm:w-12">
          <img src={imageUrl || 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80'} alt="" className="h-full w-full object-cover" />
        </div>
      </motion.div>

      {/* 중앙 핀 홀 */}
      <div className="absolute h-3 w-3 rounded-full bg-[#fbf8f2] " />
    </div>
  );
};
