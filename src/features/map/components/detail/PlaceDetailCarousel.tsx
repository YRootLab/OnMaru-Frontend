'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import {
  ChevronLeft,
  ChevronRight,
  Landmark,
  Home,
  Utensils,
  Coffee,
  ShoppingBag,
} from 'lucide-react';
import { meok } from '@/design-system/tokens';
import type { PlaceCategory } from '@/features/map/types';

const ImageContainer = styled.div<{ $hasImages: boolean }>`
  position: relative;
  width: 100%;
  aspect-ratio: ${({ $hasImages }) => ($hasImages ? '4 / 3' : '16 / 9')};
  background: #f0eae0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CarouselTrack = styled.div<{ $index: number }>`
  display: flex;
  width: 100%;
  height: 100%;
  transform: ${({ $index }) => `translateX(-${$index * 100}%)`};
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
`;

const CarouselSlide = styled.div`
  position: relative;
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
`;

const SlideImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const CarouselNavBtn = styled.button<{ $pos: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  ${({ $pos }) => ($pos === 'left' ? 'left: 8px;' : 'right: 8px;')}
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;

  border-radius: 50%;
  background: rgba(25, 31, 40, 0.5);
  color: #ffffff;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background 0.15s ease;

  &:hover {
    background: rgba(25, 31, 40, 0.8);
  }
`;

const DotsWrapper = styled.div`
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
`;

const Dot = styled.div<{ $active: boolean }>`
  width: ${({ $active }) => ($active ? '14px' : '5px')};
  height: 5px;
  border-radius: 9999px;
  background: ${({ $active }) => ($active ? '#ffffff' : 'rgba(255, 255, 255, 0.5)')};
  transition: all 0.2s ease;
`;

const FallbackGraphicBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f5efe6 0%, #ebe2d3 100%);
  color: ${meok[500]};
  user-select: none;
`;

const FallbackIconWrap = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${meok[700]};
`;

const FallbackText = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${meok[700]};
  letter-spacing: -0.2px;
`;

function renderCategoryFallback(category?: PlaceCategory | string) {
  let icon = <Landmark size={28} strokeWidth={2} />;
  let label = '한국의 아름다운 전통 공간';

  if (category === 'stay') {
    icon = <Home size={28} strokeWidth={2} />;
    label = '마당이 있는 한옥 스테이';
  } else if (category === 'food') {
    icon = <Utensils size={28} strokeWidth={2} />;
    label = '대를 이어온 전통의 손맛';
  } else if (category === 'cafe') {
    icon = <Coffee size={28} strokeWidth={2} />;
    label = '처마 밑 은은한 다도 향기';
  } else if (category === 'market') {
    icon = <ShoppingBag size={28} strokeWidth={2} />;
    label = '정겨운 전통시장 풍경';
  }

  return (
    <FallbackGraphicBox>
      <FallbackIconWrap>{icon}</FallbackIconWrap>
      <FallbackText>{label}</FallbackText>
    </FallbackGraphicBox>
  );
}

interface PlaceDetailCarouselProps {
  images: string[];
  title: string;
  category?: PlaceCategory | string;
}

export default function PlaceDetailCarousel({
  images,
  title,
  category,
}: PlaceDetailCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // 유효한 이미지 URL만 필터링
  const validImages = images.filter((img) => img && typeof img === 'string');

  return (
    <ImageContainer $hasImages={validImages.length > 0}>
      {validImages.length > 0 ? (
        <>
          <CarouselTrack $index={currentSlide}>
            {validImages.map((src, idx) => (
              <CarouselSlide key={idx}>
                <SlideImg src={src} alt={`${title} 사진 ${idx + 1}`} />
              </CarouselSlide>
            ))}
          </CarouselTrack>

          {validImages.length > 1 && (
            <>
              {currentSlide > 0 && (
                <CarouselNavBtn
                  $pos="left"
                  type="button"
                  onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
                  aria-label="이전 사진 보기"
                >
                  <ChevronLeft size={18} strokeWidth={2} />
                </CarouselNavBtn>
              )}
              {currentSlide < validImages.length - 1 && (
                <CarouselNavBtn
                  $pos="right"
                  type="button"
                  onClick={() => setCurrentSlide((prev) => Math.min(validImages.length - 1, prev + 1))}
                  aria-label="다음 사진 보기"
                >
                  <ChevronRight size={18} strokeWidth={2} />
                </CarouselNavBtn>
              )}

              <DotsWrapper>
                {validImages.map((_, idx) => (
                  <Dot key={idx} $active={idx === currentSlide} />
                ))}
              </DotsWrapper>
            </>
          )}
        </>
      ) : (
        renderCategoryFallback(category)
      )}
    </ImageContainer>
  );
}
