import type { BentoJourneyPlan, MoodId } from '../types/journey.types';
import { matchJourneyPlan } from '../data/curatedJourneys';
import { defaultJourneyRepository, type JourneyRepository, type RunAccepted } from './journeyApi';

export interface CurateJourneyParams {
  query: string;
  mood?: MoodId;
  previousPlan?: BentoJourneyPlan;
}

export interface CuratedJourneyRunResult {
  plan: BentoJourneyPlan;
  explorationId: string | null;
  runId: string | null;
  stateVersion: number | null;
}

type RunJourneyOptions = {
  repository?: JourneyRepository;
  idempotencyKeyFactory?: () => string;
};

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `journey-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function readAcceptedSnapshot(
  accepted: RunAccepted,
  repository: JourneyRepository,
): Promise<CuratedJourneyRunResult> {
  await repository.getRun(accepted.explorationId, accepted.runId);
  const snapshot = await repository.getExploration(accepted.explorationId);

  return {
    plan: snapshot.board ?? matchJourneyPlan(''),
    explorationId: snapshot.id,
    runId: accepted.runId,
    stateVersion: snapshot.stateVersion,
  };
}

export async function runJourneyCurator(
  params: CurateJourneyParams,
  options: RunJourneyOptions = {},
): Promise<CuratedJourneyRunResult> {
  const repository = options.repository ?? defaultJourneyRepository;
  const accepted = await repository.start({
    query: params.query,
    idempotencyKey: options.idempotencyKeyFactory?.() ?? createIdempotencyKey(),
  });

  return readAcceptedSnapshot(accepted, repository);
}





export async function fetchCuratedJourney(params: CurateJourneyParams): Promise<BentoJourneyPlan> {
  if (process.env.NEXT_PUBLIC_API_URL) {
    try {
      return (await runJourneyCurator(params)).plan;
    } catch (err) {
      console.warn('[fetchCuratedJourney] Backend journey run failed, falling back:', err);
    }
  }

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
