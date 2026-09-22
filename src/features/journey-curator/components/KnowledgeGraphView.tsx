'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Landmark,
  ShoppingBag,
  Headphones,
  Flame,
  Network,
  Sparkles,
  ArrowUpRight,
  RotateCcw,
  X,
} from 'lucide-react';
import { lightPalette , fontSize } from '@/design-system/tokens';
import type { GraphNode, NodeCategory } from '../types/journey.types';
import { useJourneyStore } from '../store/useJourneyStore';

const Container = styled.div`
  width: min(calc(100% - 40px), 1140px);
  max-width: 1140px;
  margin: 0 auto 36px;
  padding: 0;

  @media (max-width: 1024px) {
    width: calc(100% - 28px);
  }

  @media (max-width: 640px) {
    width: calc(100% - 24px);
  }
`;

const GraphCard = styled.div`
  position: relative;
  width: 100%;
  height: 400px;
  background: #ffffff;
  border-radius: 28px;
  border: 1px solid rgba(0, 0, 0, 0.07);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  user-select: none;

  [data-theme='dark'] & {
    background: #1c1a17;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.45);
  }

  @media (max-width: 768px) {
    height: 440px;
  }
`;

const GraphHeader = styled.div`
  position: absolute;
  top: 18px;
  left: 22px;
  right: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 20;
  pointer-events: none;
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${fontSize.sm};
  font-weight: 500;
  color: #191f28;
  pointer-events: auto;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }
`;

const Legend = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  pointer-events: auto;

  @media (max-width: 768px) {
    display: none;
  }
`;

const LegendItem = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: #6b7280;

  &::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${({ $color }) => $color};
  }

  [data-theme='dark'] & {
    color: #9ca3af;
  }
`;

const Controls = styled.div`
  position: absolute;
  bottom: 18px;
  right: 20px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ResetBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 9999px;
  padding: 5px 12px;
  font-size: ${fontSize.xs};
  color: #6b7280;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;

  [data-theme='dark'] & {
    background: #272420;
    border-color: rgba(255, 255, 255, 0.1);
    color: #9ca3af;
  }

  &:hover {
    background: #ffffff;
    color: #191f28;
    transform: translateY(-1px);

    [data-theme='dark'] & {
      background: #312d28;
      color: #ffffff;
    }
  }
`;

const CanvasLayer = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
`;

const NodeElement = styled.div<{
  $category: NodeCategory;
  $active: boolean;
  $color: string;
}>`
  position: absolute;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 9999px;
  cursor: grab;
  transform: translate(-50%, -50%);
  background: ${({ $active }) => ($active ? '#ffffff' : 'rgba(255, 255, 255, 0.92)')};
  border: 1.5px solid ${({ $active, $color }) => ($active ? $color : 'rgba(0, 0, 0, 0.08)')};
  box-shadow: ${({ $active, $color }) =>
    $active
      ? `0 8px 24px ${$color}33, 0 2px 6px rgba(0,0,0,0.06)`
      : '0 4px 16px rgba(0, 0, 0, 0.05)'};
  transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.1s ease;
  backdrop-filter: blur(8px);

  &:active {
    cursor: grabbing;
    transform: translate(-50%, -50%) scale(1.05);
  }

  [data-theme='dark'] & {
    background: ${({ $active }) => ($active ? '#2b2722' : 'rgba(36, 33, 29, 0.94)')};
    border-color: ${({ $active, $color }) => ($active ? $color : 'rgba(255, 255, 255, 0.1)')};
    box-shadow: ${({ $active, $color }) =>
      $active
        ? `0 8px 24px ${$color}44`
        : '0 4px 20px rgba(0, 0, 0, 0.35)'};
  }
`;

const NodeIcon = styled.div<{ $color: string }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $color }) => `${$color}18`};
  color: ${({ $color }) => $color};
  flex-shrink: 0;

  svg {
    width: 13px;
    height: 13px;
  }
`;

const NodeLabel = styled.span<{ $active: boolean }>`
  font-size: ${fontSize.xs};
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  color: #191f28;
  white-space: nowrap;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }
`;

const NodeBadge = styled.span`
  font-size: ${fontSize.micro};
  padding: 1px 6px;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.05);
  color: #6b7280;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
    color: #9ca3af;
  }
`;

const InspectorCard = styled(motion.div)`
  position: absolute;
  bottom: 16px;
  left: 20px;
  right: 20px;
  max-width: 480px;
  background: #ffffff;
  border-radius: 20px;
  padding: 16px 20px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.1);
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 8px;
  backdrop-filter: blur(12px);

  [data-theme='dark'] & {
    background: #24211d;
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
  }
`;

const InspectorTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const InspectorTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${fontSize.sm};
  font-weight: 600;
  color: #191f28;

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const CloseBtn = styled.button`
  border: none;
  background: transparent;
  color: #8b95a1;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;

  &:hover {
    color: #191f28;
    background: rgba(0, 0, 0, 0.05);

    [data-theme='dark'] & {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.08);
    }
  }
`;

const InspectorDesc = styled.p`
  font-size: ${fontSize.xs};
  line-height: 1.5;
  color: #4e5968;
  margin: 0;

  [data-theme='dark'] & {
    color: #a1a1aa;
  }
`;

const CATEGORY_COLORS: Record<NodeCategory, string> = {
  region: '#3b82f6',
  hanok: '#00b882',
  market: '#f59e0b',
  sorimaru: '#8b5cf6',
  warmth: '#ff5414',
};

function renderNodeIcon(category: NodeCategory) {
  switch (category) {
    case 'region':
      return <MapPin />;
    case 'hanok':
      return <Landmark />;
    case 'market':
      return <ShoppingBag />;
    case 'sorimaru':
      return <Headphones />;
    case 'warmth':
      return <Flame />;
  }
}

interface PhysicsNode {
  id: string;
  label: string;
  category: NodeCategory;
  badge?: string;
  description?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isDragging?: boolean;
}

export default function KnowledgeGraphView() {
  const plan = useJourneyStore((s) => s.currentPlan);
  const isGenerating = useJourneyStore((s) => s.isGenerating);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [physicsNodes, setPhysicsNodes] = useState<PhysicsNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<PhysicsNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const draggingNodeRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const particleOffsetRef = useRef<number>(0);


  const initSimulation = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 400;

    const rawNodes = plan.nodes || [];
    const centerX = width / 2;
    const centerY = height / 2;


    const layoutAngles: Record<NodeCategory, { angle: number; dist: number }> = {
      region: { angle: Math.PI, dist: width * 0.32 },
      hanok: { angle: -Math.PI * 0.65, dist: width * 0.22 },
      market: { angle: Math.PI * 0.65, dist: width * 0.24 },
      sorimaru: { angle: -Math.PI * 0.2, dist: width * 0.3 },
      warmth: { angle: Math.PI * 0.25, dist: width * 0.32 },
    };

    const initialNodes: PhysicsNode[] = rawNodes.map((n, i) => {
      const preset = layoutAngles[n.category] || {
        angle: (i / rawNodes.length) * Math.PI * 2,
        dist: width * 0.25,
      };
      return {
        id: n.id,
        label: n.label,
        category: n.category,
        badge: n.badge,
        description: n.description || `${n.label}에 얽힌 고유한 이야기와 온기`,
        x: centerX + Math.cos(preset.angle) * preset.dist,
        y: centerY + Math.sin(preset.angle) * preset.dist * 0.65,
        vx: 0,
        vy: 0,
      };
    });

    setPhysicsNodes(initialNodes);
  }, [plan.nodes]);

  useEffect(() => {
    initSimulation();
  }, [initSimulation]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const width = containerRef.current?.clientWidth || 800;
      const height = containerRef.current?.clientHeight || 400;


      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      particleOffsetRef.current = (particleOffsetRef.current + 0.008) % 1;
      const pOffset = particleOffsetRef.current;


      const centerX = width / 2;
      const centerY = height / 2;
      ctx.strokeStyle = 'rgba(0, 184, 130, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 110, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, 190, 0, Math.PI * 2);
      ctx.stroke();


      const edges = plan.edges || [];
      physicsNodes.forEach((src) => {
        edges
          .filter((e) => e.source === src.id)
          .forEach((edge) => {
            const tgt = physicsNodes.find((n) => n.id === edge.target);
            if (!tgt) return;

            const isHighlighted =
              hoveredNodeId === src.id ||
              hoveredNodeId === tgt.id ||
              selectedNode?.id === src.id ||
              selectedNode?.id === tgt.id;


            const midX = (src.x + tgt.x) / 2;
            const midY = (src.y + tgt.y) / 2 - 12;

            ctx.beginPath();
            ctx.moveTo(src.x, src.y);
            ctx.quadraticCurveTo(midX, midY, tgt.x, tgt.y);

            const strokeColor = isHighlighted
              ? '#00b882'
              : 'rgba(100, 116, 139, 0.2)';
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = isHighlighted ? 2.4 : 1.2;
            if (edge.dashed) {
              ctx.setLineDash([4, 4]);
            } else {
              ctx.setLineDash([]);
            }
            ctx.stroke();


            const t = (pOffset + (edge.id.charCodeAt(0) % 5) * 0.2) % 1;
            const px = (1 - t) * (1 - t) * src.x + 2 * (1 - t) * t * midX + t * t * tgt.x;
            const py = (1 - t) * (1 - t) * src.y + 2 * (1 - t) * t * midY + t * t * tgt.y;

            ctx.beginPath();
            ctx.arc(px, py, isHighlighted ? 3.5 : 2, 0, Math.PI * 2);
            ctx.fillStyle = isHighlighted ? '#00b882' : 'rgba(212, 175, 55, 0.7)';
            ctx.fill();
          });
      });


      setPhysicsNodes((prevNodes) => {
        if (prevNodes.length === 0) return prevNodes;

        return prevNodes.map((node) => {
          if (node.isDragging) return node;

          let fx = 0;
          let fy = 0;


          prevNodes.forEach((other) => {
            if (other.id === node.id) return;
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            if (dist < 180) {
              const rep = 800 / (dist * dist);
              fx += (dx / dist) * rep;
              fy += (dy / dist) * rep;
            }
          });


          const cdx = centerX - node.x;
          const cdy = centerY - node.y;
          fx += cdx * 0.003;
          fy += cdy * 0.003;


          const vx = (node.vx + fx) * 0.85;
          const vy = (node.vy + fy) * 0.85;


          const margin = 50;
          const nx = Math.max(margin, Math.min(width - margin, node.x + vx));
          const ny = Math.max(margin, Math.min(height - margin, node.y + vy));

          return { ...node, x: nx, y: ny, vx, vy };
        });
      });

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [plan.edges, hoveredNodeId, selectedNode]);


  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const node = physicsNodes.find((n) => n.id === id);
    if (!node) return;

    draggingNodeRef.current = {
      id,
      offsetX: e.clientX - node.x,
      offsetY: e.clientY - node.y,
    };

    setPhysicsNodes((nodes) =>
      nodes.map((n) => (n.id === id ? { ...n, isDragging: true } : n)),
    );
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingNodeRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;

    const draggingId = draggingNodeRef.current.id;
    setPhysicsNodes((nodes) =>
      nodes.map((n) => (n.id === draggingId ? { ...n, x: curX, y: curY, vx: 0, vy: 0 } : n)),
    );
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!draggingNodeRef.current) return;
    const draggingId = draggingNodeRef.current.id;
    draggingNodeRef.current = null;

    setPhysicsNodes((nodes) =>
      nodes.map((n) => (n.id === draggingId ? { ...n, isDragging: false } : n)),
    );
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <Container>
      <GraphCard
        ref={containerRef}
        style={{ opacity: isGenerating ? 0.6 : 1, transition: 'opacity 0.25s ease' }}
      >
        <GraphHeader>
          <HeaderTitle>
            <Network size={16} color={lightPalette.cheongrok[500]} />
            <span>AI 여정 지식 그래프 · {plan.region}</span>
          </HeaderTitle>

          <Legend>
            <LegendItem $color={CATEGORY_COLORS.region}>지역 권역</LegendItem>
            <LegendItem $color={CATEGORY_COLORS.hanok}>한옥 건축</LegendItem>
            <LegendItem $color={CATEGORY_COLORS.market}>전통시장</LegendItem>
            <LegendItem $color={CATEGORY_COLORS.sorimaru}>소리마루 SORIMARU</LegendItem>
            <LegendItem $color={CATEGORY_COLORS.warmth}>실시간 온기</LegendItem>
          </Legend>
        </GraphHeader>

        {}
        <CanvasLayer ref={canvasRef} />

        {}
        {physicsNodes.map((node) => {
          const isSelected = selectedNode?.id === node.id;
          const color = CATEGORY_COLORS[node.category] || '#00b882';

          return (
            <NodeElement
              key={node.id}
              $category={node.category}
              $active={isSelected || hoveredNodeId === node.id}
              $color={color}
              style={{ left: `${node.x}px`, top: `${node.y}px` }}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              onClick={() => setSelectedNode(isSelected ? null : node)}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
            >
              <NodeIcon $color={color}>{renderNodeIcon(node.category)}</NodeIcon>
              <NodeLabel $active={isSelected}>{node.label}</NodeLabel>
              {node.badge && <NodeBadge>{node.badge}</NodeBadge>}
            </NodeElement>
          );
        })}

        {}
        <Controls>
          <ResetBtn type="button" onClick={initSimulation} title="노드 배치 원래대로">
            <RotateCcw size={12} />
            <span>원래 위치로</span>
          </ResetBtn>
        </Controls>

        {}
        <AnimatePresence>
          {selectedNode && (
            <InspectorCard
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
            >
              <InspectorTop>
                <InspectorTitle>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: CATEGORY_COLORS[selectedNode.category],
                    }}
                  />
                  <span>{selectedNode.label}</span>
                  {selectedNode.badge && <NodeBadge>{selectedNode.badge}</NodeBadge>}
                </InspectorTitle>
                <CloseBtn onClick={() => setSelectedNode(null)}>
                  <X size={14} />
                </CloseBtn>
              </InspectorTop>
              <InspectorDesc>{selectedNode.description}</InspectorDesc>
            </InspectorCard>
          )}
        </AnimatePresence>
      </GraphCard>
    </Container>
  );
}
