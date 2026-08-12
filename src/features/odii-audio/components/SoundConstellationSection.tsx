'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CONSTELLATION_NODES, ConstellationNode } from '../data/constellationData';
import { recommendationAdapter, RecommendationResult } from '../api/recommendationAdapter';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiStoryItem } from '../types/odii.types';

export const SoundConstellationSection: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<ConstellationNode>(CONSTELLATION_NODES[0]);
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [isLoadingRec, setIsLoadingRec] = useState<boolean>(false);

  const currentStory = useOdiiAudioStore((state) => state.currentStory);
  const isPlaying = useOdiiAudioStore((state) => state.isPlaying);
  const setCurrentStory = useOdiiAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((state) => state.setIsPlaying);

  const handleNodeClick = async (node: ConstellationNode) => {
    setSelectedNode(node);
    setIsLoadingRec(true);
    try {
      const result = await recommendationAdapter.getRecommendationForNode(node);
      setRecommendation(result);
    } catch (err) {
      console.warn('[Constellation] 추천 픽업 오류', err);
    } finally {
      setIsLoadingRec(false);
    }
  };

  useEffect(() => {
    handleNodeClick(CONSTELLATION_NODES[0]);
  }, []);

  // Apple HIG 스타일 1px 헤어라인 캔버스
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    const particles = CONSTELLATION_NODES.map((node) => ({
      ...node,
      x: node.xRatio * width,
      y: node.yRatio * height,
      baseX: node.xRatio * width,
      baseY: node.yRatio * height,
      phase: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.phase += 0.008;
        p.x = p.baseX + Math.sin(p.phase) * 4;
        p.y = p.baseY + Math.cos(p.phase * 0.7) * 4;
      });

      CONSTELLATION_NODES.forEach((node) => {
        const sourceP = particles.find((p) => p.id === node.id);
        if (!sourceP) return;

        node.connections.forEach((targetId) => {
          const targetP = particles.find((p) => p.id === targetId);
          if (!targetP) return;

          const isSelected = selectedNode.id === node.id || selectedNode.id === targetId;

          ctx.beginPath();
          ctx.moveTo(sourceP.x, sourceP.y);
          ctx.lineTo(targetP.x, targetP.y);

          if (isSelected) {
            ctx.strokeStyle = 'rgba(169, 77, 53, 0.4)';
            ctx.lineWidth = 1.2;
          } else {
            ctx.strokeStyle = 'rgba(33, 30, 25, 0.08)';
            ctx.lineWidth = 0.6;
          }
          ctx.stroke();
        });
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [selectedNode]);

  const recommendedStory: OdiiStoryItem | null = recommendation?.recommendedStory || null;
  const isThisPlaying = recommendedStory && currentStory.stid === recommendedStory.stid && isPlaying;

  const playStory = () => {
    if (!recommendedStory) return;
    if (currentStory.stid === recommendedStory.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(recommendedStory);
    }
  };

  return (
    <section aria-label="소리의 실타래 탐색" className="relative w-full py-10 sm:py-14">
      <div className="w-full">
        {/* 인위적인 요약 뱃지 제거 — 순수 타이포그래피 헤더 */}
        <div className="flex flex-col gap-1 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="inline-block bg-gradient-to-r from-[#211e19] via-[#403b35] to-[#6a6158] bg-clip-text font-odii-sans text-[clamp(24px,3.2vw,36px)] font-bold leading-tight tracking-[-0.04em] text-transparent">
              이야기와 소리로 이어지는 한국의 장소들
            </h2>
          </div>
          <p className="text-xs text-[#786d5e]">
            관심 있는 장소 키워드를 선택하면 소리가 연결됩니다.
          </p>
        </div>

        {/* 애플 스타일 미니멀 스테이지 */}
        <div className="relative min-h-[400px] w-full overflow-hidden rounded-3xl border border-[#211e19]/10 bg-[#fbf8f2] shadow-[0_8px_24px_rgba(33,30,25,0.04)] sm:min-h-[440px]">
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />

          {/* 노드 태그 칩 레이어 */}
          <div className="relative z-10 h-full min-h-[400px] w-full p-6 sm:min-h-[440px]">
            {CONSTELLATION_NODES.map((node) => {
              const isSelected = selectedNode.id === node.id;

              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => handleNodeClick(node)}
                  style={{
                    left: `${node.xRatio * 100}%`,
                    top: `${node.yRatio * 100}%`,
                    transform: `translate(-50%, -50%)`,
                  }}
                  className={`absolute flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-300 ${
                    isSelected
                      ? 'z-30 bg-[#211e19] text-white shadow-md font-bold'
                      : 'z-20 border border-[#211e19]/10 bg-white/90 text-[#211e19] hover:border-[#a94d35]/50 hover:bg-white'
                  }`}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: isSelected ? '#a94d35' : node.color }}
                  />
                  <span className="font-odii-sans text-xs whitespace-nowrap">
                    {node.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 하단 미니멀 오버레이 카드 */}
          <div className="absolute bottom-4 left-4 right-4 z-40 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-md">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedNode.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border border-[#211e19]/10 bg-white/95 p-4 shadow-lg backdrop-blur-md"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#a94d35]">
                    #{selectedNode.keyword}
                  </h3>
                  <span className="text-[10px] text-[#8c7e6c]">
                    {selectedNode.tags.join(' ')}
                  </span>
                </div>

                <p className="mt-1 text-xs text-[#655b4d]">{selectedNode.description}</p>

                <div className="mt-3 flex items-center justify-between rounded-xl bg-[#f7f4ee] p-3">
                  {isLoadingRec ? (
                    <div className="text-xs text-[#8c7e6c]">연결하는 중...</div>
                  ) : recommendedStory ? (
                    <>
                      <div className="min-w-0 pr-3">
                        <h4 className="truncate font-odii-sans text-xs font-bold text-[#211e19]">
                          {recommendedStory.title}
                        </h4>
                        <p className="truncate text-[10px] text-[#786d5e]">
                          {recommendedStory.audioTitle}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={playStory}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                          isThisPlaying
                            ? 'bg-[#a94d35] text-white shadow-xs'
                            : 'bg-[#211e19] text-white hover:bg-[#a94d35]'
                        }`}
                      >
                        {isThisPlaying ? (
                          <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                        ) : (
                          <svg className="ml-0.5 h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="text-xs text-[#8c7e6c]">소리를 준비 중입니다.</div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};


