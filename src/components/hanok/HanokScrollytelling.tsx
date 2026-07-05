'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import styles from './HanokScrollytelling.module.css';
import RegionalMap from './RegionalMap';
import TimeLapseView from './TimeLapseView';
import HanokAnnotatedImage from './HanokAnnotatedImage';
import HanokHorizontalScroll from './HanokHorizontalScroll';

export default function HanokScrollytelling() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Chapter 4: Data snaps simulation state
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

  // Outro: Heat Metaparticles canvas
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
    <div className={styles.scrollyContainer} ref={containerRef}>
      
      {/* GNB Logo Header */}
      <header className={styles.gnb}>
        <div className={styles.logo}>ON-MARU <span>A to Z</span></div>
        <div className={styles.gnbRight}>Hospitality Tech Labs</div>
      </header>

      {/* SECTION 0: HERO INTRO */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <motion.span
            className={styles.heroTag}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Brand Identity · 온마루
          </motion.span>
          <motion.h1
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            가장 한국적인 공간에서 느끼는<br />
            가장 따뜻한 환대
          </motion.h1>
          <motion.p
            className={styles.heroSubtitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            한옥은 자연을 빌려 짓고, 바람의 길을 열어두는 온전한 우주입니다.
          </motion.p>
        </div>
        
        {/* Apple Bouncing Scroll Indicator */}
        <div className={styles.heroScrollPrompt}>
          <span>SCROLL DOWN TO EXPLORE</span>
          <div className={styles.scrollDot} />
        </div>
      </section>

      {/* SECTION 1: CHAPTER 1 - 공간의 해부학 (Annotated Image + Horizontal Scroll) */}
      <section className={styles.chapterAnnotatedSection}>
        <HanokAnnotatedImage />
        <HanokHorizontalScroll />
      </section>

      {/* SECTION 2: CHAPTER 2 - 바람과 땅이 빚어낸 형태 */}
      <section className={styles.chapterMapSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionHeaderTag}>Chapter 2. 바람과 땅이 빚어낸 형태</span>
          <h2 className={styles.sectionHeaderTitle}>기후와 형태의 큐레이션</h2>
          <p className={styles.sectionHeaderSubtitle}>
            바람이 거센 북쪽은 가옥들이 서로를 꼭 껴안아 가두었고, 따사로운 남쪽은 대청을 열어 세상을 향해 양팔을 뻗었습니다.
          </p>
        </div>
        
        {/* Dynamic Regional Map Component */}
        <RegionalMap />
      </section>

      {/* SECTION 3: CHAPTER 3 - 마루와 정의 철학 (Time Lapse) */}
      <section className={styles.chapterTimeSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionHeaderTag}>Chapter 3. &apos;마루&apos;와 &apos;정(情)&apos;의 철학</span>
          <h2 className={styles.sectionHeaderTitle}>자연을 들이는 마당의 액자</h2>
          <p className={styles.sectionHeaderSubtitle}>
            방 안과 바깥뜰의 한계를 완전히 지우는 경계 없는 환대의 열린 소통구. 대청마루에 가만히 앉아 하루의 시간과 사계의 순환을 지켜봅니다.
          </p>
        </div>
        
        {/* Porch Time Lapse Renderer */}
        <TimeLapseView />
      </section>

      {/* SECTION 4: CHAPTER 4 - 데이터로 읽는 한옥의 숨결 (Technical Data Snaps) */}
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

      {/* SECTION 5: OUTRO & MAP CALL TO ACTION */}
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

      {/* Interactive Helper Overlay (bottom left) */}
      <div className={styles.interactionHelper}>
        Tip: Scroll to story, hover Timelapse to change hours, move mouse over outro map.
      </div>
    </div>
  );
}
