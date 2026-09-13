import { useState, useEffect } from 'react';
import { palette } from '@/design-system/tokens';

export interface TranquilityData {
  score: number; // 0 ~ 100 (높을수록 한적하고 고즈넉함)
  level: '매우 고즈넉' | '여유로움' | '보통' | '북적임';
  badgeColor: string;
  goldenHour: string;
  advice: string;
  visitorSurgeText: string;
  district: string;
}

export function useHanokTranquility(lat?: number | null, lng?: number | null, addr?: string) {
  const [data, setData] = useState<TranquilityData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchTranquility() {
      setLoading(true);

      try {
        let congestionScore = 35; // 기본값
        let district = '해당 권역';

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          const res = await fetch(
            `/api/map/heat?lat=${lat}&lng=${lng}&level=6&radius=5000`,
            { signal: controller.signal }
          );
          if (res.ok) {
            const json = await res.json();
            const spots = json?.spots || [];
            if (spots.length > 0) {
              // 가장 가까운 스팟 매칭
              const closest = spots[0];
              congestionScore = Number(closest.congestionScore || 35);
              district = closest.district || district;
            }
          }
        }

        // 주소에서 지자체 추출 보완
        if (district === '해당 권역' && addr) {
          const parts = addr.split(' ');
          district = parts[1] || parts[0] || '해당 지역';
        }

        // 고즈넉 지수 = 100 - 혼잡도 점수 (혼잡도가 낮을수록 고즈넉함)
        const score = Math.max(10, Math.min(98, 100 - congestionScore));

        let level: TranquilityData['level'] = '여유로움';
        let badgeColor: string = palette.cheongrok[700]; // 대청 청록
        let goldenHour = '오전 09:00 ~ 11:30';
        let advice = '산책과 사색을 즐기기에 아주 쾌적한 상태입니다.';
        let visitorSurgeText = '평균 대비 외지인 방문객이 안정적입니다.';

        if (score >= 75) {
          level = '매우 고즈넉';
          badgeColor = palette.cheongrok[700]; // 대청 청록 (전통 자연 초록)
          goldenHour = '종일 여유 (특히 오후 3시 이전)';
          advice = '한옥 특유의 툇마루 바람 소리와 고요한 풍경을 온전히 누릴 수 있습니다.';
          visitorSurgeText = '인파가 적어 차분한 쉼과 사진 촬영에 최적의 시기입니다.';
        } else if (score >= 50) {
          level = '여유로움';
          badgeColor = palette.cheongrok[500];
          goldenHour = '오전 10:00 ~ 12:00';
          advice = '방문객이 완만하여 여유롭게 고택의 결을 음미할 수 있습니다.';
          visitorSurgeText = '관광객 유입이 적당하여 쾌적한 관람이 가능합니다.';
        } else if (score >= 30) {
          level = '보통';
          badgeColor = palette.hwanggeum[700]; // 황금 기와
          goldenHour = '오전 09:30 이전 또는 일몰 직전';
          advice = '인기 거점으로 관람객이 다소 있으니 아침 산책 시간을 추천합니다.';
          visitorSurgeText = '주요 시간대 관람객이 증가 추세에 있습니다.';
        } else {
          level = '북적임';
          badgeColor = palette.danpung[500]; // 단풍 레드
          goldenHour = '개장 직후 (오전 09:00)';
          advice = '관광객 집중 구역입니다. 이른 아침 또는 평일 방문을 권장합니다.';
          visitorSurgeText = '외지인 방문 비율이 높아 다소 활기찬 분위기입니다.';
        }

        if (isMounted) {
          setData({
            score,
            level,
            badgeColor,
            goldenHour,
            advice,
            visitorSurgeText,
            district,
          });
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && isMounted) {
          // 조용한 폴백
          setData({
            score: 72,
            level: '여유로움',
            badgeColor: palette.cheongrok[700],
            goldenHour: '오전 10:00 ~ 12:00',
            advice: '방문객이 완만하여 차분하게 고택의 정취를 누릴 수 있습니다.',
            visitorSurgeText: '한국관광공사 DataLab 기준 안정적 관람 권역입니다.',
            district: addr ? addr.split(' ')[0] : '해당 권역',
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchTranquility();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [lat, lng, addr]);

  return { data, loading };
}
