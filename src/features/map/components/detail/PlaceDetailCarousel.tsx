'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { HugeiconsIcon } from '@hugeicons/react'
import { ChevronLeftIcon, ChevronRightIcon, LandmarkIcon, Home01Icon, UtensilsIcon, Coffee01Icon, ShoppingBag01Icon } from '@hugeicons/core-free-icons'
import { meok , fontSize } from '@/design-system/tokens';
import type { PlaceCategory } from '@/features/map/types';

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #f5f5f4;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const shimmer = keyframes`
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
`;

const ImageSkeleton = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  overflow: hidden;
  background: #e5e5e3;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
    animation: ${shimmer} 1.4s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    &::after { animation: none; }
  }
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

const SlideImg = styled.img<{ $loaded: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: ${({ $loaded }) => ($loaded ? 1 : 0)};
  transition: opacity 0.18s ease;
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
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${meok[700]};
  letter-spacing: -0.2px;
`;

function renderCategoryFallback(category?: PlaceCategory | string) {
  let icon = <HugeiconsIcon icon={LandmarkIcon} size={28} strokeWidth={2} />;
  let label = '한국의 아름다운 전통 공간';

  if (category === 'stay') {
    icon = <HugeiconsIcon icon={Home01Icon} size={28} strokeWidth={2} />;
    label = '마당이 있는 한옥 스테이';
  } else if (category === 'food') {
    icon = <HugeiconsIcon icon={UtensilsIcon} size={28} strokeWidth={2} />;
    label = '대를 이어온 전통의 손맛';
  } else if (category === 'cafe') {
    icon = <HugeiconsIcon icon={Coffee01Icon} size={28} strokeWidth={2} />;
    label = '처마 밑 은은한 다도 향기';
  } else if (category === 'market') {
    icon = <HugeiconsIcon icon={ShoppingBag01Icon} size={28} strokeWidth={2} />;
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
  loading?: boolean;
}

export default function PlaceDetailCarousel({
  images,
  title,
  category,
  loading = false,
}: PlaceDetailCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(() => new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());

  const validImages = useMemo(
    () => images.filter((img) => img && typeof img === 'string' && !failedImages.has(img)),
    [failedImages, images],
  );
  const currentImage = validImages[currentSlide];
  const currentImageLoaded = Boolean(currentImage && loadedImages.has(currentImage));

  useEffect(() => {
    if (currentSlide < validImages.length) return;
    setCurrentSlide(Math.max(0, validImages.length - 1));
  }, [currentSlide, validImages.length]);

  return (
    <ImageContainer>
      {loading ? (
        <ImageSkeleton role="status" aria-label="장소 이미지 불러오는 중" />
      ) : validImages.length > 0 ? (
        <>
          <CarouselTrack $index={currentSlide}>
            {validImages.map((src, idx) => (
              <CarouselSlide key={idx}>
                <SlideImg
                  src={src}
                  alt={`${title} 사진 ${idx + 1}`}
                  $loaded={loadedImages.has(src)}
                  onLoad={() => setLoadedImages((current) => new Set(current).add(src))}
                  onError={() => setFailedImages((current) => new Set(current).add(src))}
                />
              </CarouselSlide>
            ))}
          </CarouselTrack>

          {!currentImageLoaded && (
            <ImageSkeleton role="status" aria-label="장소 이미지 불러오는 중" />
          )}

          {validImages.length > 1 && (
            <>
              {currentSlide > 0 && (
                <CarouselNavBtn
                  $pos="left"
                  type="button"
                  onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
                  aria-label="이전 사진 보기"
                >
                  <HugeiconsIcon icon={ChevronLeftIcon} size={18} strokeWidth={2} />
                </CarouselNavBtn>
              )}
              {currentSlide < validImages.length - 1 && (
                <CarouselNavBtn
                  $pos="right"
                  type="button"
                  onClick={() => setCurrentSlide((prev) => Math.min(validImages.length - 1, prev + 1))}
                  aria-label="다음 사진 보기"
                >
                  <HugeiconsIcon icon={ChevronRightIcon} size={18} strokeWidth={2} />
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
