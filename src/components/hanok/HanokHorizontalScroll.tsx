'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './HanokScrollytelling.module.css';
import { STRUCTURE_CARDS } from './hanok.data';
export default function HanokHorizontalScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 20);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 20);
  };

  const scrollBy = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -380 : 380, behavior: 'smooth' });
  };

  return (
    <div className={styles.hScrollSection}>
      {/* Header */}
      <div className={styles.hScrollHeader}>
        <div>
          <p className={styles.hScrollTag}>더 깊이 살펴보기</p>
          <h3 className={styles.hScrollTitle}>한옥을 이루는 또 다른 요소들</h3>
        </div>
        {/* Arrow Navigation */}
        <div className={styles.hScrollArrows}>
          <button
            className={`${styles.arrowBtn} ${!canScrollLeft ? styles.arrowDisabled : ''}`}
            onClick={() => scrollBy('left')}
            aria-label="이전 카드"
          >
            ‹
          </button>
          <button
            className={`${styles.arrowBtn} ${!canScrollRight ? styles.arrowDisabled : ''}`}
            onClick={() => scrollBy('right')}
            aria-label="다음 카드"
          >
            ›
          </button>
        </div>
      </div>

      {/* Fade masks for scroll overflow */}
      <div className={styles.hScrollOuter}>
        {canScrollLeft && <div className={styles.fadeLeft} />}
        {canScrollRight && <div className={styles.fadeRight} />}

        {/* Scrollable Cards Track */}
        <div
          className={styles.hScrollTrack}
          ref={scrollRef}
          onScroll={handleScroll}
        >
          {STRUCTURE_CARDS.map((card) => (
            <motion.div
              key={card.id}
              className={styles.structureCard}
              style={{
                borderTopColor: hoveredId === card.id ? card.color : 'transparent',
              }}
              onHoverStart={() => setHoveredId(card.id)}
              onHoverEnd={() => setHoveredId(null)}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              {/* Card accent top border animation */}
              <motion.div
                className={styles.cardAccentBar}
                style={{ background: card.color }}
                animate={{ scaleX: hoveredId === card.id ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />

              {/* Emoji Icon */}
              <div className={styles.cardEmoji}>{card.emoji}</div>

              {/* Text */}
              <div className={styles.cardText}>
                <h4 className={styles.cardNameKo}>{card.nameKo}</h4>
                <p className={styles.cardNameEn}>{card.nameEn}</p>
                <p className={styles.cardDesc}>{card.desc}</p>
              </div>

              {/* Fact hover reveal */}
              <motion.div
                className={styles.cardFact}
                animate={{
                  opacity: hoveredId === card.id ? 1 : 0,
                  y: hoveredId === card.id ? 0 : 8,
                }}
                transition={{ duration: 0.3 }}
              >
                <span className={styles.cardFactIcon}>💡</span>
                {card.fact}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
