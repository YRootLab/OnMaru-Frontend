'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import styles from './HanokScrollytelling.module.css';

export default function HanokDataSection() {
  const [dataSnapped, setDataSnapped] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const ch4Ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: ch4Scroll } = useScroll({
    target: ch4Ref,
    offset: ['start center', 'center center'],
  });

  useEffect(() => {
    return ch4Scroll.onChange((latest) => {
      if (latest > 0.6) {
        setDataSnapped(true);
      } else {
        setDataSnapped(false);
      }
    });
  }, [ch4Scroll]);

  return (
    <section className={styles.chapterDataSection} ref={ch4Ref}>
      <div className={styles.dataGrid}>
        {/* Left explanation card */}
        <div className={styles.dataTextWrap}>
          <span className={styles.sectionHeaderTag}>Chapter 4. 데이터로 읽는 한옥의 숨결</span>
          <h2 className={styles.sectionHeaderTitle}>전통과 데이터의 자석 결합</h2>
          <p className={styles.sectionHeaderSubtitle}>
            건축물대장 API를 통해 실시간으로 조각난 역사적 데이터 파편을 받아와 온마루 카드 안으로 단숨에 수집하고 서사로 묶습니다.
          </p>
        </div>

        {/* Right Magnetic Animation Demo Container */}
        <div className={styles.dataCardStage}>
          
          {/* Floating chips snapped to the card */}
          <div className={styles.magneticField}>
            <AnimatePresence>
              {!dataSnapped && (
                <>
                  <motion.div className={styles.dataChip} style={{ left: '10%', top: '20%' }} exit={{ x: 120, y: 150, opacity: 0 }} transition={{ duration: 0.5 }}>
                    구조: 목구조
                  </motion.div>
                  <motion.div className={styles.dataChip} style={{ right: '15%', top: '15%' }} exit={{ x: -140, y: 120, opacity: 0 }} transition={{ duration: 0.5 }}>
                    지붕: 기와지붕
                  </motion.div>
                  <motion.div className={styles.dataChip} style={{ left: '20%', bottom: '25%' }} exit={{ x: 80, y: -90, opacity: 0 }} transition={{ duration: 0.5 }}>
                    건축연도: 1934년
                  </motion.div>
                  <motion.div className={styles.dataChip} style={{ right: '25%', bottom: '20%' }} exit={{ x: -100, y: -110, opacity: 0 }} transition={{ duration: 0.5 }}>
                    지번: 계동길 41
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Main Glassmorphic Card */}
            <motion.div
              className={styles.glassRegistryCard}
              animate={{
                scale: dataSnapped ? 1.05 : 1,
                borderColor: dataSnapped ? 'rgba(212, 175, 55, 0.4)' : 'rgba(255,255,255,0.08)',
                boxShadow: dataSnapped ? '0 20px 50px rgba(212, 175, 55, 0.12)' : '0 10px 30px rgba(0,0,0,0.3)',
              }}
            >
              <div className={styles.cardGnb}>건축물대장 실시간 원격 연동</div>
              
              <div className={styles.registryContent}>
                <h3 className={styles.registryTitle}>북촌 한옥보존 가옥</h3>
                
                {dataSnapped ? (
                  <motion.div
                    className={styles.registryDataGrid}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className={styles.regItem}>
                      <span className={styles.regVal}>1934년</span>
                      <span className={styles.regLbl}>준공일자</span>
                    </div>
                    <div className={styles.regItem}>
                      <span className={styles.regVal}>전통 목구조</span>
                      <span className={styles.regLbl}>골조양식</span>
                    </div>
                    <div className={styles.regItem}>
                      <span className={styles.regVal}>한식 기와지붕</span>
                      <span className={styles.regLbl}>지붕양식</span>
                    </div>
                    <div className={styles.regItem}>
                      <span className={styles.regVal}>계동 11-2</span>
                      <span className={styles.regLbl}>소재지</span>
                    </div>
                  </motion.div>
                ) : (
                  <div className={styles.registryPlaceholder}>
                    스크롤하면 건축물대장 데이터 조각들이 자동으로 조립됩니다.
                  </div>
                )}

                {dataSnapped && (
                  <motion.div
                    className={styles.llmSummaryArea}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className={styles.llmBadge}>AI 3줄 요약 도슨트</div>
                    <div className={styles.llmText}>
                      <p>1. 1930년대 일제강점기 서울 북촌 한옥 보존 지구의 상징적인 근대 목구조 한옥입니다.</p>
                      <p>2. 암수기와가 겹쳐진 아름다운 곡선의 청회색 지붕으로 여름철 채광을 슬기롭게 차단합니다.</p>
                      <p>3. 전통 구들장을 사용한 온돌 방과 대청마루가 함께 공존하는 뛰어난 절충형 한옥입니다.</p>
                    </div>

                    {/* Expandable Accordion */}
                    <div className={styles.accordionContainer}>
                      <button
                        className={styles.accordionToggle}
                        onClick={() => setSummaryExpanded(!summaryExpanded)}
                      >
                        {summaryExpanded ? '닫기 ▲' : '한옥 역사 자세히 알아보기 ▼'}
                      </button>
                      
                      <AnimatePresence>
                        {summaryExpanded && (
                          <motion.div
                            className={styles.accordionText}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                          >
                            본 한옥은 1934년에 설립된 한식 목조 주택으로 전통 한옥의 골조를 계승하면서도, 도심지 밀집 지역에 적응하여 처마가 단축되고 방의 배치가 편리해진 근대 도시 한옥의 걸작입니다. 현재 온마루 파트너로서 전통 가치를 유지하고 있는 중요한 환대 공간입니다.
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
