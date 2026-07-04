import Link from 'next/link'

export default function Home() {
  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'var(--font-noto-sans-kr, sans-serif)',
      background: 'linear-gradient(180deg, #f8f6f2, #eee9e2)',
      gap: '24px',
      padding: '2rem',
    }}>
      <span style={{
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '2px',
        textTransform: 'uppercase' as const,
        color: '#c4956a',
      }}>
        ON-MARU · 온마루
      </span>
      <h1 style={{
        fontFamily: 'var(--font-noto-serif-kr, serif)',
        fontSize: '36px',
        fontWeight: 700,
        color: '#1a1714',
        textAlign: 'center',
      }}>
        한옥의 온기를 잇다 🏯
      </h1>
      <p style={{
        fontSize: '15px',
        color: '#6b6560',
        textAlign: 'center',
        maxWidth: '400px',
        lineHeight: 1.6,
      }}>
        한국 전통 건축의 지혜와 아름다움을 인터랙티브하게 탐험하세요.
      </p>
      <Link
        href="/hanok"
        style={{
          marginTop: '16px',
          padding: '14px 36px',
          background: 'linear-gradient(135deg, #c4956a, #d4a574)',
          color: 'white',
          borderRadius: '12px',
          fontSize: '15px',
          fontWeight: 600,
          textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(196, 149, 106, 0.3)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
      >
        한옥 A to Z 탐험하기 →
      </Link>
    </main>
  )
}

