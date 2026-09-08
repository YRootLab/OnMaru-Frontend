'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IoLocationOutline,
  IoStorefrontOutline,
  IoBagHandleOutline,
  IoHeadsetOutline,
  IoFlame,
  IoGitNetworkOutline,
} from 'react-icons/io5';
import { lightPalette, meok, surface } from '@/design-system/tokens';
import { transientProps } from '@/design-system/styled';
import type { GraphNode, NodeCategory } from '../types/journey.types';
import { useJourneyStore } from '../store/useJourneyStore';

const Container = styled.div`
  max-width: 1120px;
  margin: 0 auto 36px;
  padding: 0 20px;
`;

const GraphCard = styled.div`
  position: relative;
  width: 100%;
  height: 340px;
  background: #ffffff;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.07);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
  overflow: hidden;

  [data-theme='dark'] & {
    background: #1c1a17;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  }

  @media (max-width: 768px) {
    height: 380px;
  }
`;

const GraphHeader = styled.div`
  position: absolute;
  top: 16px;
  left: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 10;
  pointer-events: none;
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #4e5968;
  letter-spacing: -0.01em;

  [data-theme='dark'] & {
    color: #a1a1aa;
  }
`;

const Legend = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  pointer-events: auto;

  @media (max-width: 640px) {
    display: none;
  }
`;

const LegendItem = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
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

const SvgCanvas = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

const NodeButton = styled(motion.button, transientProps)<{
  $active: boolean;
  $category: NodeCategory;
  $left: number;
  $top: number;
}>`
  position: absolute;
  left: ${({ $left }) => $left}%;
  top: ${({ $top }) => $top}%;
  transform: translate(-50%, -50%);
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 9999px;
  border: ${({ $active }) =>
    $active ? '1.5px solid #191f28' : '1px solid rgba(0, 0, 0, 0.08)'};
  background: ${({ $active }) => ($active ? '#ffffff' : 'rgba(255, 255, 255, 0.94)')};
  box-shadow: ${({ $active }) =>
    $active ? '0 6px 20px rgba(0, 0, 0, 0.12)' : '0 2px 8px rgba(0, 0, 0, 0.04)'};
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);

  [data-theme='dark'] & {
    background: ${({ $active }) => ($active ? '#2d2924' : '#24211d')};
    border-color: ${({ $active }) =>
      $active ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.12)'};
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }

  &:hover {
    transform: translate(-50%, -50%) scale(1.06);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
`;

const NodeIconWrap = styled.div<{ $category: NodeCategory }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: #ffffff;
  background: ${({ $category }) => {
    switch ($category) {
      case 'region':
        return '#3b82f6';
      case 'hanok':
        return lightPalette.cheongrok[500];
      case 'market':
        return '#f59e0b';
      case 'odii':
        return '#8b5cf6';
      case 'warmth':
        return lightPalette.juhong[500];
      default:
        return '#6b7280';
    }
  }};

  svg {
    width: 13px;
    height: 13px;
  }
`;

const NodeTextWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
`;

const NodeLabel = styled.span<{ $active: boolean }>`
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? 700 : 600)};
  color: #191f28;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }
`;

const NodeBadge = styled.span`
  font-size: 10.5px;
  color: #8b95a1;
  font-weight: 500;
`;

function renderCategoryIcon(category: NodeCategory) {
  switch (category) {
    case 'region':
      return <IoLocationOutline />;
    case 'hanok':
      return <IoStorefrontOutline />;
    case 'market':
      return <IoBagHandleOutline />;
    case 'odii':
      return <IoHeadsetOutline />;
    case 'warmth':
      return <IoFlame />;
  }
}

export default function KnowledgeGraphView() {
  const plan = useJourneyStore((s) => s.currentPlan);
  const selectedNodeId = useJourneyStore((s) => s.selectedNodeId);
  const selectNode = useJourneyStore((s) => s.selectNode);

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const { nodes, edges } = plan;

  return (
    <Container>
      <GraphCard>
        <GraphHeader>
          <HeaderTitle>
            <IoGitNetworkOutline size={16} />
            <span>AI 여정 지식 그래프 · {plan.region}</span>
          </HeaderTitle>

          <Legend>
            <LegendItem $color="#3b82f6">지역 권역</LegendItem>
            <LegendItem $color={lightPalette.cheongrok[500]}>한옥 건축</LegendItem>
            <LegendItem $color="#f59e0b">전통시장</LegendItem>
            <LegendItem $color="#8b5cf6">소리마루 ODII</LegendItem>
            <LegendItem $color={lightPalette.juhong[500]}>실시간 온기</LegendItem>
          </Legend>
        </GraphHeader>

        {/* SVG 에지 연결선 */}
        <SvgCanvas>
          <defs>
            <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#00b882" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ff5414" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {edges.map((edge) => {
            const srcNode = nodes.find((n) => n.id === edge.source);
            const tgtNode = nodes.find((n) => n.id === edge.target);
            if (!srcNode || !tgtNode) return null;

            const isHighlighted =
              hoveredNodeId === edge.source ||
              hoveredNodeId === edge.target ||
              selectedNodeId === edge.source ||
              selectedNodeId === edge.target;

            // 곡선 경로 (Bézier)
            const x1 = `${srcNode.x}%`;
            const y1 = `${srcNode.y}%`;
            const x2 = `${tgtNode.x}%`;
            const y2 = `${tgtNode.y}%`;

            return (
              <g key={edge.id}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isHighlighted ? '#191f28' : 'rgba(0, 0, 0, 0.12)'}
                  strokeWidth={isHighlighted ? 2.2 : 1.2}
                  strokeDasharray={edge.dashed ? '4,4' : undefined}
                  style={{ transition: 'stroke 0.2s ease, stroke-width 0.2s ease' }}
                />
              </g>
            );
          })}
        </SvgCanvas>

        {/* 인터랙티브 노드들 */}
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isHovered = hoveredNodeId === node.id;

          return (
            <NodeButton
              key={node.id}
              type="button"
              $active={isSelected || isHovered}
              $category={node.category}
              $left={node.x}
              $top={node.y}
              onClick={() => selectNode(isSelected ? null : node.id)}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <NodeIconWrap $category={node.category}>
                {renderCategoryIcon(node.category)}
              </NodeIconWrap>
              <NodeTextWrap>
                <NodeLabel $active={isSelected || isHovered}>{node.label}</NodeLabel>
                {node.badge && <NodeBadge>{node.badge}</NodeBadge>}
              </NodeTextWrap>
            </NodeButton>
          );
        })}
      </GraphCard>
    </Container>
  );
}
