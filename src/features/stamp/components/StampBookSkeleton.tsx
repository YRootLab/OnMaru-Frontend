'use client';

import styled from '@emotion/styled';

const Root = styled.div`
  width: 100%;
  padding: clamp(80px, 10vw, 120px) clamp(16px, 4vw, 48px) 100px;
`;

const Line = styled.div<{ $width: string; $height: number }>`
  width: ${({ $width }) => $width};
  height: ${({ $height }) => $height}px;
  border-radius: 8px;
  background: linear-gradient(90deg, #e5e5e3 25%, #f5f5f4 50%, #e5e5e3 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;

  @keyframes shimmer {
    to { background-position: -200% 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Header = styled.div`
  display: grid;
  gap: 10px;
  margin-bottom: clamp(32px, 4vw, 48px);
`;

const Hero = styled.div`
  display: grid;
  grid-template-columns: minmax(320px, 1.2fr) minmax(220px, 0.8fr);
  gap: 40px;
  align-items: center;
  min-height: 430px;
  margin-bottom: 48px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const Map = styled.div`
  width: 100%;
  max-width: 580px;
  aspect-ratio: 800 / 759;
  border-radius: 40%;
  background: #f5f5f4;
`;

const Stats = styled.div`
  display: grid;
  gap: 20px;
`;

const Tabs = styled.div`
  height: 45px;
  margin-bottom: 28px;
  border-bottom: 1px solid #e5e5e3;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px 16px;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 28px 12px;
  }
`;

const Card = styled.div`
  min-height: 190px;
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 12px;
`;

const Seal = styled.div`
  width: clamp(96px, 14vw, 140px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: #e5e5e3;

  @media (max-width: 480px) {
    width: clamp(72px, 20vw, 96px);
  }
`;

export default function StampBookSkeleton() {
  return (
    <Root aria-label="수결첩을 불러오는 중" aria-busy="true">
      <Header>
        <Line $width="260px" $height={44} />
        <Line $width="90px" $height={20} />
        <Line $width="220px" $height={16} />
      </Header>
      <Hero>
        <Map />
        <Stats>
          <Line $width="190px" $height={116} />
          <Line $width="90px" $height={18} />
          <Line $width="100%" $height={18} />
        </Stats>
      </Hero>
      <Tabs />
      <Grid>
        {Array.from({ length: 12 }, (_, index) => (
          <Card key={index}>
            <Seal />
            <Line $width="70%" $height={18} />
            <Line $width="54%" $height={13} />
          </Card>
        ))}
      </Grid>
    </Root>
  );
}
