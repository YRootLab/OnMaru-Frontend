'use client';

import React from 'react';
import styled from '@emotion/styled';
import { Activity, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { meok, palette , fontSize } from '@/design-system/tokens';
import type { TranquilityData } from '../hooks/useHanokTranquility';

interface TranquilityGaugeProps {
  data: TranquilityData | null;
  loading?: boolean;
}

export default function TranquilityGauge({ data, loading }: TranquilityGaugeProps) {
  if (loading) {
    return (
      <Container>
        <HeaderRow>
          <BadgeBox>
            <Activity size={14} color={palette.juhong[500]} />
            <BadgeText>관광 빅데이터 실시간 분석 중...</BadgeText>
          </BadgeBox>
        </HeaderRow>
      </Container>
    );
  }

  if (!data) return null;

  return (
    <Container>
      <HeaderRow>
        <BadgeBox>
          <Activity size={14} color={palette.juhong[500]} />
          <BadgeText>한국관광공사 DataLab 실시간 고즈넉 지수</BadgeText>
        </BadgeBox>
        <DistrictTag>{data.district} 권역</DistrictTag>
      </HeaderRow>

      <MainRow>
        <ScoreBox>
          <ScoreNumber>{data.score}</ScoreNumber>
          <ScoreMax>/ 100</ScoreMax>
        </ScoreBox>

        <LevelBadge style={{ backgroundColor: `${data.badgeColor}18`, color: data.badgeColor }}>
          <Sparkles size={13} />
          <span>{data.level}</span>
        </LevelBadge>
      </MainRow>

      {}
      <GaugeTrack>
        <GaugeFill
          style={{
            width: `${data.score}%`,
            backgroundColor: data.badgeColor,
          }}
        />
      </GaugeTrack>

      <InfoCardsRow>
        <InfoPill>
          <Clock size={13} color={palette.hwanggeum[700]} />
          <PillLabel>추천 골든타임:</PillLabel>
          <PillVal>{data.goldenHour}</PillVal>
        </InfoPill>
      </InfoCardsRow>

      <AdviceText>
        <ShieldCheck size={14} color={palette.juhong[600]} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>{data.advice}</span>
      </AdviceText>
    </Container>
  );
}

const Container = styled.div`
  background: #f5f5f4;
  border: none;
  box-shadow: none;
  border-radius: 20px;
  padding: 22px 24px;
  margin-top: 16px;
  margin-bottom: 24px;

  [data-theme='dark'] & {
    background: #24211D;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
`;

const BadgeBox = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: ${palette.juhong[50]};
  padding: 4px 10px;
  border-radius: 9999px;
  border: none;

  [data-theme='dark'] & {
    background: rgba(255, 85, 0, 0.2);
  }
`;

const BadgeText = styled.span`
  font-size: ${fontSize.xs};
  font-weight: 700;
  color: ${palette.juhong[700]};

  [data-theme='dark'] & {
    color: ${palette.juhong[400]};
  }
`;

const DistrictTag = styled.span`
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${meok[500]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const MainRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const ScoreBox = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
`;

const ScoreNumber = styled.span`
  font-family: var(--font-hanok);
  font-size: ${fontSize['3xl']};
  font-weight: 700;
  color: ${meok[900]};
  line-height: 1;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const ScoreMax = styled.span`
  font-size: ${fontSize.xs};
  color: ${meok[400]};
`;

const LevelBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: ${fontSize.xs};
  font-weight: 700;
  padding: 5px 13px;
  border-radius: 9999px;
  border: none;
  box-shadow: none;
`;

const GaugeTrack = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 14px;
  border: none;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const GaugeFill = styled.div`
  height: 100%;
  border-radius: 9999px;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
`;

const InfoCardsRow = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
`;

const InfoPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: ${fontSize.xs};
  color: ${meok[700]};
  background: #ffffff;
  padding: 8px 14px;
  border-radius: 10px;
  border: none;
  box-shadow: none;

  [data-theme='dark'] & {
    background: #1C1A17;
    color: ${meok[200]};
  }
`;

const PillLabel = styled.span`
  font-weight: 600;
  color: ${meok[500]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const PillVal = styled.span`
  font-weight: 700;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const AdviceText = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: ${fontSize.xs};
  line-height: 1.5;
  color: ${meok[500]};
  background: rgba(0, 0, 0, 0.02);
  padding: 10px 14px;
  border-radius: 10px;
  border: none;
  box-shadow: none;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.04);
    color: ${meok[200]};
  }
`;
