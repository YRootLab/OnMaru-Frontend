'use client';

import React, { useState, useMemo } from 'react';
import styled from '@emotion/styled';
import { Flame, Leaf, Users, Plus, MessageCircleHeart } from 'lucide-react';
import { lightPalette, meok } from '@/design-system/tokens';
import { useMapStore } from '../../hooks/useMapStore';
import WriteWarmthModal from './WriteWarmthModal';
import MoodSelector from './MoodSelector';
import type { Warmth } from '../../types';

interface PlaceWarmthSectionProps {
  placeId: string;
  placeName: string;
  lat: number;
  lng: number;
}

const SectionContainer = styled.section`
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid ${meok[200]};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
`;

const TitleBox = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: ${meok[900]};
`;

const CountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 9999px;
  background: ${lightPalette.juhong[50]};
  color: ${lightPalette.juhong[700]};
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
`;

const WriteButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid ${lightPalette.juhong[200]};
  border-radius: 9999px;
  background: ${lightPalette.juhong[50]};
  color: ${lightPalette.juhong[700]};
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${lightPalette.juhong[500]};
    color: #ffffff;
    border-color: ${lightPalette.juhong[500]};
  }

  &:active {
    transform: scale(0.96);
  }
`;

const WarmthList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const WarmthCard = styled.div`
  padding: 14px 16px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(78, 89, 104, 0.08);
  box-shadow: 0 2px 8px rgba(25, 31, 40, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(25, 31, 40, 0.08);
  }
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const LeftBadges = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const MoodBadge = styled.span<{ $mood: '한적' | '북적' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2.5px 7px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  color: ${({ $mood }) => ($mood === '한적' ? lightPalette.cheongrok[700] : lightPalette.juhong[700])};
  background: ${({ $mood }) => ($mood === '한적' ? lightPalette.cheongrok[50] : lightPalette.juhong[50])};
`;

const TimeAndMine = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const MineBadge = styled.span`
  padding: 1.5px 6px;
  border-radius: 4px;
  background: ${meok[900]};
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
`;

const TimeText = styled.span`
  font-size: 11px;
  color: ${meok[400]};
`;

const MoodSelectorWrap = styled.div`
  margin: 6px 0 10px;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 8px;
`;

const TagItem = styled.span`
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(30, 122, 104, 0.07);
  color: ${lightPalette.cheongrok[700]};
  font-size: 11px;
  font-weight: 600;
`;

const WarmthText = styled.p`
  margin: 0;
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.55;
  color: ${meok[900]};
  word-break: keep-all;
`;

const EmptyBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  border-radius: 16px;
  background: #fafafa;
  border: 1px dashed ${meok[200]};
  text-align: center;
`;

const EmptyIconBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${lightPalette.juhong[50]};
  color: ${lightPalette.juhong[500]};
  margin-bottom: 10px;
`;

const EmptyTitle = styled.div`
  font-size: 13.5px;
  font-weight: 600;
  color: ${meok[900]};
  margin-bottom: 4px;
`;

const EmptySub = styled.div`
  font-size: 12px;
  color: ${meok[500]};
  margin-bottom: 12px;
`;

const EmptyActionBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 14px;
  border: none;
  border-radius: 9999px;
  background: ${lightPalette.juhong[500]};
  color: #ffffff;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(232, 90, 24, 0.3);
  transition: background 0.15s ease;

  &:hover {
    background: ${lightPalette.juhong[700]};
  }
`;

function formatRelativeTime(isoString: string): string {
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 5) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '어제';
    if (days < 30) return `${days}일 전`;
    return '최근';
  } catch {
    return '최근';
  }
}

/** 위도/경도 간 유클리드 근사 거리 (미터) */
function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat2 - lat1) * 111000;
  const dLng = (lng2 - lng1) * 88800;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

export default function PlaceWarmthSection({
  placeId,
  placeName,
  lat,
  lng,
}: PlaceWarmthSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const warmths = useMapStore((s) => s.warmths);

  // 해당 장소와 매칭되는 온기 목록 필터링
  const matchedWarmths = useMemo(() => {
    const cleanTargetName = placeName.replace(/\s+/g, '').toLowerCase();

    return warmths
      .filter((w) => {
        // 1. placeId 직접 일치
        if (w.placeId && w.placeId === placeId) return true;

        // 2. 장소명 상호 포함 검사
        const cleanName = w.placeName.replace(/\s+/g, '').toLowerCase();
        if (
          cleanTargetName.includes(cleanName) ||
          cleanName.includes(cleanTargetName)
        ) {
          return true;
        }

        // 3. 좌표 근접성 (반경 350m 이내)
        if (
          Number.isFinite(lat) &&
          Number.isFinite(lng) &&
          Number.isFinite(w.lat) &&
          Number.isFinite(w.lng) &&
          lat > 0 &&
          lng > 0
        ) {
          const dist = getDistanceMeters(lat, lng, w.lat, w.lng);
          if (dist <= 350) return true;
        }

        return false;
      })
      .slice(0, 10);
  }, [warmths, placeId, placeName, lat, lng]);

  return (
    <>
      <SectionContainer>
        <SectionHeader>
          <TitleBox>
            <Flame size={16} color={lightPalette.juhong[500]} />
            <SectionTitle>머문 이들의 온기</SectionTitle>
            <CountBadge>{matchedWarmths.length}</CountBadge>
          </TitleBox>
          <WriteButton type="button" onClick={() => setIsModalOpen(true)}>
            <Plus size={13} />
            <span>온기 남기기</span>
          </WriteButton>
        </SectionHeader>

        {matchedWarmths.length > 0 ? (
          <WarmthList>
            {matchedWarmths.map((item) => (
              <WarmthCard key={item.id}>
                <CardTop>
                  <LeftBadges>
                    <MoodBadge $mood={item.mood}>
                      {item.mood === '한적' ? <Leaf size={11} /> : <Users size={11} />}
                      <span>{item.mood}</span>
                    </MoodBadge>
                  </LeftBadges>
                  <TimeAndMine>
                    {item.mine && <MineBadge>내가 남김</MineBadge>}
                    <TimeText>{formatRelativeTime(item.createdAt)}</TimeText>
                  </TimeAndMine>
                </CardTop>

                {/* 5단계 표정 감정 표시기 */}
                {item.score && (
                  <MoodSelectorWrap>
                    <MoodSelector value={item.score} readonly />
                  </MoodSelectorWrap>
                )}

                {/* 추천 키워드 태그 */}
                {item.tags && item.tags.length > 0 && (
                  <TagList>
                    {item.tags.map((t, idx) => (
                      <TagItem key={idx}>{t}</TagItem>
                    ))}
                  </TagList>
                )}

                <WarmthText>{item.text}</WarmthText>
              </WarmthCard>
            ))}
          </WarmthList>
        ) : (
          <EmptyBox>
            <EmptyIconBox>
              <MessageCircleHeart size={20} />
            </EmptyIconBox>
            <EmptyTitle>아직 등록된 온기가 없습니다</EmptyTitle>
            <EmptySub>이 고즈넉한 장소에 첫 번째 온기 한 줄을 남겨보세요!</EmptySub>
            <EmptyActionBtn type="button" onClick={() => setIsModalOpen(true)}>
              <Plus size={13} />
              <span>첫 온기 남기기</span>
            </EmptyActionBtn>
          </EmptyBox>
        )}
      </SectionContainer>

      <WriteWarmthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultPlace={{
          id: placeId,
          name: placeName,
          lat,
          lng,
        }}
      />
    </>
  );
}
