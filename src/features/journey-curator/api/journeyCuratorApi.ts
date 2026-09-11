import type { BentoJourneyPlan, MoodId } from '../types/journey.types';
import { matchJourneyPlan } from '../data/curatedJourneys';

export interface CurateJourneyParams {
  query: string;
  mood?: MoodId;
  previousPlan?: BentoJourneyPlan;
}

/**
 * 온마루 Gemini AI 여정 큐레이션 API 호출
 * API Key 부재 또는 에러 발생 시 로컬 큐레이션 데이터로 안전하게 폴백
 */
export async function fetchCuratedJourney(params: CurateJourneyParams): Promise<BentoJourneyPlan> {
  try {
    const res = await fetch('/api/journey-curator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      console.warn(`[fetchCuratedJourney] API responded with status ${res.status}, falling back.`);
      return matchJourneyPlan(params.query);
    }

    const data = (await res.json()) as BentoJourneyPlan;
    if (data && data.nodes && data.routeCard) {
      return data;
    }
    return matchJourneyPlan(params.query);
  } catch (err) {
    console.error('[fetchCuratedJourney] Network/parse error, using local fallback:', err);
    return matchJourneyPlan(params.query);
  }
}
