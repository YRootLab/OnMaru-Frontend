'use client';

import { useState } from 'react';
import { useSceneStore } from '@/scroll-core/sceneStore';
import { lightPalette } from '@/design-system/tokens';

/**
 * 온마루 3D 한옥 실시간 위치/크기/카메라 튜닝 패널 (DevTuner)
 */
export default function HanokDevTuner() {
  const { devTuner, setDevTuner } = useSceneStore();
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!devTuner.enabled) return null;

  const handleChange = (key, value) => {
    const num = parseFloat(value);
    setDevTuner({ [key]: isNaN(num) ? 0 : num });
  };

  const handleReset = () => {
    setDevTuner({
      posX: 0,
      posY: 0,
      posZ: -16.0,
      scale: 1.35,
      targetY: 6.0,
    });
  };

  const handleCopyCode = () => {
    const code = `// 튜닝 완료 수치\nposition: [${devTuner.posX}, ${devTuner.posY}, ${devTuner.posZ}],\nscale: ${devTuner.scale},\ntargetY: ${devTuner.targetY}`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        width: collapsed ? '160px' : '300px',
        padding: '14px 18px',
        borderRadius: '16px',
        background: 'rgba(28, 26, 23, 0.88)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(245, 166, 35, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        color: '#FAFAFA',
        fontFamily: 'monospace, sans-serif',
        fontSize: '12px',
        transition: 'width 0.3s ease, height 0.3s ease',
        userSelect: 'none',
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: collapsed ? '0px' : '12px',
          paddingBottom: collapsed ? '0px' : '8px',
          borderBottom: collapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <span style={{ fontWeight: 700, color: lightPalette.hwanggeum[400] }}>
          한옥 3D 튜너
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'none',
            border: 'none',
            color: '#B0B8C1',
            cursor: 'pointer',
            fontSize: '11px',
          }}
        >
          {collapsed ? '펼치기' : '접기'}
        </button>
      </div>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Y축 수직 높이 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#FF9A60' }}>Y축 높이 (PosY)</span>
              <strong>{devTuner.posY.toFixed(1)}</strong>
            </div>
            <input
              type="range"
              min="-10"
              max="35"
              step="0.2"
              value={devTuner.posY}
              onChange={(e) => handleChange('posY', e.target.value)}
              style={{ width: '100%', accentColor: lightPalette.juhong[500] }}
            />
          </div>

          {/* X축 좌우 오프셋 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>X축 좌우 (PosX)</span>
              <strong>{devTuner.posX.toFixed(1)}</strong>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="0.2"
              value={devTuner.posX}
              onChange={(e) => handleChange('posX', e.target.value)}
              style={{ width: '100%', accentColor: lightPalette.hwanggeum[400] }}
            />
          </div>

          {/* Z축 전후 오프셋 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Z축 전후 (PosZ)</span>
              <strong>{devTuner.posZ.toFixed(1)}</strong>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="0.2"
              value={devTuner.posZ}
              onChange={(e) => handleChange('posZ', e.target.value)}
              style={{ width: '100%', accentColor: lightPalette.cheongrok[400] }}
            />
          </div>

          {/* 한옥 크기 (Scale) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#90D4C0' }}>크기 (Scale)</span>
              <strong>{devTuner.scale.toFixed(2)}x</strong>
            </div>
            <input
              type="range"
              min="0.3"
              max="2.5"
              step="0.05"
              value={devTuner.scale}
              onChange={(e) => handleChange('scale', e.target.value)}
              style={{ width: '100%', accentColor: lightPalette.cheongrok[500] }}
            />
          </div>

          {/* 하단 버튼 */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={handleReset}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#FAFAFA',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              초기화
            </button>
            <button
              type="button"
              onClick={handleCopyCode}
              style={{
                flex: 1.4,
                padding: '6px',
                borderRadius: '6px',
                background: lightPalette.juhong[500],
                border: 'none',
                color: '#FFFFFF',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              {copied ? '복사완료!' : '수치 코드 복사'}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
