export default function Loading() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-app, #FAF7F4)',
        zIndex: 99,
      }}
    >
      <style>{`
        @keyframes onmaru-spin {
          to { transform: rotate(360deg); }
        }
        .onmaru-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid rgba(217, 64, 0, 0.15);
          border-top-color: #D94000;
          border-radius: 50%;
          animation: onmaru-spin 0.7s linear infinite;
        }
      `}</style>
      <div className="onmaru-spinner" role="status">
        <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>페이지 로딩 중</span>
      </div>
    </div>
  );
}
