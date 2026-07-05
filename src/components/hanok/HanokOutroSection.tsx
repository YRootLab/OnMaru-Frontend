'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './HanokScrollytelling.module.css';

export default function HanokOutroSection() {
  const outroCanvasRef = useRef<HTMLCanvasElement>(null);
  const [mapHovered, setMapHovered] = useState(false);

  useEffect(() => {
    const canvas = outroCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Array<{ x: number; y: number; radius: number; opacity: number; vx: number; vy: number }> = [];

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Spawn metaball heat particles
      if (particles.length < 40) {
        particles.push({
          x,
          y,
          radius: 12 + Math.random() * 20,
          opacity: 0.8,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
        });
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Render particles
      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= 0.01;
        p.radius *= 0.98;

        if (p.opacity <= 0 || p.radius < 1) {
          particles.splice(index, 1);
          return;
        }

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, `rgba(255, 90, 0, ${p.opacity})`);
        grad.addColorStop(0.5, `rgba(255, 140, 0, ${p.opacity * 0.4})`);
        grad.addColorStop(1, 'rgba(255, 90, 0, 0)');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <section
      className={styles.outroSection}
      onMouseEnter={() => setMapHovered(true)}
      onMouseLeave={() => setMapHovered(false)}
    >
      {/* Particle Canvas on hover background */}
      <canvas ref={outroCanvasRef} className={styles.particleCanvas} />

      <div className={styles.outroContent}>
        <motion.span
          className={styles.outroTag}
          animate={{ scale: mapHovered ? 1.05 : 1 }}
        >
          Always Connected · On-Maru
        </motion.span>
        
        <h2 className={styles.outroTitle}>
          이제 당신의 발자취로<br />
          온기를 남길 시간입니다.
        </h2>
        
        <p className={styles.outroSubtitle}>
          지도를 문지르면 당신이 지나간 걸음대로 따뜻한 주황빛 온기가 피어오릅니다.<br />
          온마루 지도로 진입하여 다양한 한옥들이 제공하는 가장 한국적인 따뜻함을 직접 체감해 보세요.
        </p>

        {/* Pulser Gold gradient Button */}
        <motion.button
          className={styles.ctaButton}
          whileHover={{ scale: 1.05, boxShadow: '0 8px 30px rgba(212, 175, 55, 0.4)' }}
          whileTap={{ scale: 0.98 }}
        >
          온마루 지도 입장하기
        </motion.button>
      </div>
    </section>
  );
}
