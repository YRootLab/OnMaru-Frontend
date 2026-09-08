'use client';

import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { Camera, X, AlertCircle } from 'lucide-react';
import { meok, lightPalette, darkPalette } from '@/design-system/tokens';

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(14, 16, 22, 0.78);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: modal-fade-in 0.2s ease-out;

  @keyframes modal-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const Container = styled.div`
  position: relative;
  width: 100%;
  max-width: 780px;
  height: 520px;
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;

  [data-theme='dark'] & {
    background: #1c1a17;
  }

  @media (max-width: 768px) {
    height: 80vh;
    border-radius: 16px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #ffffff;
  border-bottom: 1px solid rgba(78, 89, 104, 0.1);
  z-index: 2;

  [data-theme='dark'] & {
    background: #25221d;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
`;

const TitleBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Title = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: ${meok[900]};
  margin: 0;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const SubBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 9999px;
  background: ${lightPalette.cheongrok[50]};
  color: ${lightPalette.cheongrok[700]};
  font-size: 11px;
  font-weight: 700;

  [data-theme='dark'] & {
    background: rgba(0, 167, 106, 0.18);
    color: ${darkPalette.cheongrok[200]};
  }
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(25, 31, 40, 0.05);
  color: ${meok[700]};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(25, 31, 40, 0.12);
    color: ${meok[900]};
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
    color: ${meok[200]};

    &:hover {
      background: rgba(255, 255, 255, 0.18);
      color: #ffffff;
    }
  }
`;

const RoadviewBody = styled.div`
  position: relative;
  flex: 1;
  width: 100%;
  height: 100%;
  background: #25221d;
`;

const FallbackOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
  color: #ffffff;
  background: #1c1a17;

  p {
    font-size: 14px;
    color: ${meok[400]};
    margin: 0;
    max-width: 320px;
    line-height: 1.5;
  }
`;

interface RoadviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeName: string;
  lat: number;
  lng: number;
}

export default function RoadviewModal({
  isOpen,
  onClose,
  placeName,
  lat,
  lng,
}: RoadviewModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !lat || !lng || !containerRef.current || !window.kakao?.maps) return;

    setLoading(true);
    setError(null);

    const roadviewContainer = containerRef.current;
    const roadview = new window.kakao.maps.Roadview(roadviewContainer);
    const roadviewClient = new window.kakao.maps.RoadviewClient();
    const position = new window.kakao.maps.LatLng(lat, lng);

    // 반경 100m 이내의 가장 가까운 로드뷰 파노라마 ID 조회
    roadviewClient.getNearestPanoId(position, 100, (panoId: number | null) => {
      setLoading(false);
      if (panoId) {
        roadview.setPanoId(panoId, position);
      } else {
        setError('해당 장소 인근 100m 내에 등록된 카카오 현장 360도 거리 풍경이 없습니다.');
      }
    });
  }, [isOpen, lat, lng]);

  if (!isOpen) return null;

  return (
    <Backdrop onClick={onClose} role="dialog" aria-modal="true" aria-label="현장 360도 거리 풍경">
      <Container onClick={(e) => e.stopPropagation()}>
        <Header>
          <TitleBox>
            <Title>{placeName}</Title>
            <SubBadge>
              <Camera size={13} strokeWidth={2} />
              <span>현장 360° 둘러보기</span>
            </SubBadge>
          </TitleBox>
          <CloseButton type="button" onClick={onClose} aria-label="닫기">
            <X size={20} strokeWidth={2} />
          </CloseButton>
        </Header>

        <RoadviewBody>
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

          {error && (
            <FallbackOverlay>
              <AlertCircle size={32} color={lightPalette.juhong[500]} strokeWidth={1.8} />
              <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>거리 풍경을 불러올 수 없습니다</h4>
              <p>{error}</p>
            </FallbackOverlay>
          )}
        </RoadviewBody>
      </Container>
    </Backdrop>
  );
}
