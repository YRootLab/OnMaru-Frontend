'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './HanokScrollytelling.module.css';

interface StructureCard {
  id: string;
  nameKo: string;
  nameEn: string;
  emoji: string;
  desc: string;
  fact: string;
  color: string; // accent color for card top border
}

const STRUCTURE_CARDS: StructureCard[] = [
  {
    id: 'yongmaru',
    nameKo: '용마루',
    nameEn: 'Ridge Beam (Yongmaru)',
    emoji: '⛩',
    desc: '지붕 가장 높은 곳의 수평 마루대. 암수 기와로 봉긋하게 마감.',
    fact: '용마루는 집의 액운을 막는다고 믿어 양 끝에 망새(용두) 장식을 올렸습니다.',
    color: '#D4AF37',
  },
  {
    id: 'boaji',
    nameKo: '보아지',
    nameEn: 'Bracket (Boaji)',
    emoji: '🔩',
    desc: '기둥과 보 사이에서 하중을 분산시키는 목조 브라켓 요소.',
    fact: '단 하나의 못도 사용하지 않고 맞춤(홈)으로만 결합하는 한옥 목공예의 핵심 기술입니다.',
    color: '#a8855b',
  },
  {
    id: 'gidung',
    nameKo: '기둥',
    nameEn: 'Column (Gidung)',
    emoji: '🏛',
    desc: '수직 하중을 땅까지 전달하는 골격. 원기둥과 사각기둥이 혼용.',
    fact: '최고급 한옥은 자연스럽게 휘어진 나무를 구조 계산에 맞게 굳이 휜 채로 사용합니다. 이를 "원목의 기억"이라 부릅니다.',
    color: '#8b6f47',
  },
  {
    id: 'gujang',
    nameKo: '구들장',
    nameEn: 'Floor Stone (Gudeulgang)',
    emoji: '🔥',
    desc: '온돌 바닥을 이루는 편평한 돌판. 열을 저장하고 복사하는 축열체.',
    fact: '구들장은 한 번 달궈지면 8~12시간 동안 온기를 유지합니다. 현대 바닥난방의 원형입니다.',
    color: '#c0522a',
  },
  {
    id: 'damjang',
    nameKo: '담장',
    nameEn: 'Perimeter Wall (Damjang)',
    emoji: '🧱',
    desc: '내외부 경계를 짓되 자연의 소리와 빛은 통과시키는 낮은 담.',
    fact: '한옥 담장은 높게 쌓지 않습니다. "완전히 막는 것"이 아니라 "느슨하게 구분하는 것"이 한국 공간 철학입니다.',
    color: '#7a7a6a',
  },
  {
    id: 'sotulmun',
    nameKo: '솟을대문',
    nameEn: 'Grand Gate (Sotulmun)',
    emoji: '🚪',
    desc: '신분을 드러내는 높은 대문. 행랑채 지붕보다 높이 솟아오른 위용.',
    fact: '솟을대문의 높이는 조선시대 법제로 규제되어, 신분 사회의 위계가 건축 언어로 표현되었습니다.',
    color: '#4a6fa5',
  },
  {
    id: 'cheoma',
    nameKo: '처마',
    nameEn: 'Eave (Cheoma)',
    emoji: '🌿',
    desc: '지붕이 벽면 밖으로 뻗어 나온 부분. 비와 햇빛을 조절하는 자연 차양.',
    fact: '처마 길이는 위도에 따라 최적화됩니다. 한반도 중부 기준으로 하지에는 햇빛을 완전히 차단하고, 동지에는 실내 깊숙이 햇빛이 들어옵니다.',
    color: '#5a8a5a',
  },
  {
    id: 'haengnangchae',
    nameKo: '행랑채',
    nameEn: 'Servant\'s Quarters',
    emoji: '🏠',
    desc: '대문 옆에 놓인 하인들의 공간. 집의 첫 번째 방어선이자 안전망.',
    fact: '행랑채는 오늘날의 경비 시스템 + 게스트하우스 역할을 겸했습니다. 집 규모의 사회적 지위도 행랑채 규모로 가늠했습니다.',
    color: '#6a4a6a',
  },
];

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
