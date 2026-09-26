import type { CheckInResponse, StampDef, StampSummary } from '../domain/models';

interface ExecuteStampCheckInOptions {
  loggedIn: boolean;
  placeId: string;
  runCheckIn: (placeId: string) => Promise<CheckInResponse>;
  recordSuccess: (placeId: string, summary: StampSummary) => void;
  refreshBook: () => Promise<unknown>;
  resolveAwards: (response: CheckInResponse) => StampDef[];
  enqueueAwards: (stamps: StampDef[]) => void;
}

export type StampCheckInOutcome =
  | { kind: 'login-required' }
  | { kind: 'duplicate'; response: CheckInResponse }
  | { kind: 'recorded'; response: CheckInResponse }
  | { kind: 'awarded'; response: CheckInResponse; awardCount: number };

export async function executeStampCheckIn(
  options: ExecuteStampCheckInOptions,
): Promise<StampCheckInOutcome> {
  if (!options.loggedIn) return { kind: 'login-required' };

  const response = await options.runCheckIn(options.placeId);
  options.recordSuccess(options.placeId, response.summary);

  if (response.checkIn.alreadyCheckedIn) {
    await options.refreshBook().catch(() => undefined);
    return { kind: 'duplicate', response };
  }

  const awards = options.resolveAwards(response);
  if (awards.length > 0) options.enqueueAwards(awards);
  await options.refreshBook().catch(() => undefined);

  if (awards.length > 0) {
    return { kind: 'awarded', response, awardCount: awards.length };
  }
  return { kind: 'recorded', response };
}
