'use client';

import React, { useState, useMemo, useCallback } from 'react';
import styles from './HanokExplorer.module.css';
import HanokCanvas from './HanokCanvas';
import HanokDetailPanel from './HanokDetailPanel';
import { HANOK_PARTS, HANOK_TABS } from './hanok.data';
import type { TabId, HanokPart } from './hanok.data';
import { motion } from 'framer-motion';

export default function HanokExplorer() {
  const [activeTabId, setActiveTabId] = useState<TabId>('exterior');
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);

  // Filter parts by active tab
  const visibleParts = useMemo(() => {
    return HANOK_PARTS.filter((p) => p.tabId === activeTabId);
  }, [activeTabId]);

  // Find the selected part
  const selectedPart = useMemo(() => {
    return HANOK_PARTS.find((p) => p.id === selectedPartId) ?? null;
  }, [selectedPartId]);

  // Calculate which side the floating panel should appear (opposite to the hotspot)
  const panelSide = useMemo(() => {
    if (!selectedPart) return 'right';
    return selectedPart.position.x <= 50 ? 'right' : 'left';
  }, [selectedPart]);

  const handleSelectPart = useCallback((partId: string) => {
    setSelectedPartId((prev) => (prev === partId ? null : partId));
  }, []);

  const handleDeselect = useCallback(() => {
    setSelectedPartId(null);
  }, []);

  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTabId(tabId);
    setSelectedPartId(null);
  }, []);

  const activeTab = useMemo(() => {
    return HANOK_TABS.find((t) => t.id === activeTabId)!;
  }, [activeTabId]);

  return (
    <div className={styles.page}>
      <div className={styles.explorer}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerTag}>온마루 · 공간의 해부학</span>
            <h1 className={styles.headerTitle}>Hanok A to Z</h1>
            <p className={styles.headerSubtitle}>
              {activeTab.description}
            </p>
          </div>

          {/* 3-Step Tab Navigation */}
          <nav className={styles.categoryTabs} role="tablist" aria-label="한옥 탐색 탭">
            {HANOK_TABS.map((tab) => (
              <motion.button
                key={tab.id}
                className={`${styles.categoryTab} ${activeTabId === tab.id ? styles.active : ''}`}
                onClick={() => handleTabChange(tab.id)}
                role="tab"
                aria-selected={activeTabId === tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                {tab.label}
              </motion.button>
            ))}
          </nav>
        </header>

        {/* Canvas Area */}
        <HanokCanvas
          parts={visibleParts}
          imageSrc={activeTab.imageSrc}
          selectedPartId={selectedPartId}
          onSelectPart={handleSelectPart}
          onDeselect={handleDeselect}
        />

        {/* Floating Detail Panel with Intelligent Side Placement */}
        <HanokDetailPanel
          part={selectedPart}
          side={panelSide}
          onClose={handleDeselect}
        />
      </div>
    </div>
  );
}
