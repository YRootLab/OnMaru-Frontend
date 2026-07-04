'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import styles from './HanokExplorer.module.css';
import type { HanokPart } from './hanok.data';

interface HanokDetailPanelProps {
  part: HanokPart | null;
  side: 'left' | 'right' | null;
  onClose: () => void;
}

export default function HanokDetailPanel({ part, side, onClose }: HanokDetailPanelProps) {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  // Reset accordion when part changes
  React.useEffect(() => {
    setIsAccordionOpen(false);
  }, [part?.id]);

  const cardStyle: React.CSSProperties = {
    top: '120px',
    ...(side === 'left' ? { left: '32px', right: 'auto' } : { right: '32px', left: 'auto' }),
  };

  const initialX = side === 'right' ? 40 : -40;

  return (
    <AnimatePresence mode="wait">
      {part && (
        <motion.aside
          key={part.id}
          className={styles.detailPanel}
          style={cardStyle}
          initial={{ opacity: 0, scale: 0.96, x: initialX, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.96, x: initialX * 0.5, filter: 'blur(4px)' }}
          transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
          role="complementary"
          aria-label={`${part.nameKo} 상세 정보`}
        >
          {/* Close button */}
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>

          {/* Close-up Image */}
          <div className={styles.detailImageWrap}>
            <Image
              src={part.detailImageSrc}
              alt={`${part.nameKo} 클로즈업`}
              fill
              className={styles.detailImage}
              sizes="320px"
              priority={false}
            />
            <span className={styles.detailBadge}>{part.nameEn.split(' ')[0]}</span>
          </div>

          {/* Header */}
          <div className={styles.detailHeader}>
            <h2 className={styles.detailNameKo}>{part.nameKo}</h2>
            <span className={styles.detailNameEn}>{part.nameEn}</span>
          </div>

          <div className={styles.detailDivider} />

          {/* Summary (3 lines) */}
          <div className={styles.detailSummary}>
            {part.summary.map((text, i) => (
              <p
                key={i}
                className={styles.detailSummaryItem}
              >
                <span className={styles.detailSummaryNumber}>{i + 1}</span>
                {text}
              </p>
            ))}
          </div>

          {/* Accordion */}
          <div className={styles.accordion}>
            <button
              className={styles.accordionToggle}
              onClick={() => setIsAccordionOpen(!isAccordionOpen)}
              aria-expanded={isAccordionOpen}
            >
              <span
                className={`${styles.accordionArrow} ${isAccordionOpen ? styles.open : ''}`}
              >
                ▶
              </span>
              {isAccordionOpen ? '접기' : '더 알아보기'}
            </button>

            <AnimatePresence>
              {isAccordionOpen && (
                <motion.div
                  className={styles.accordionContent}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <p className={styles.accordionText}>{part.fullDescription}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
