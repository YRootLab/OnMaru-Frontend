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
        zIndex: 9999,
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
      <div className="onmaru-spinner" aria-label="페이지 로딩 중" role="status" />
    </div>
  );
}
