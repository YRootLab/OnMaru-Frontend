import type {
  CheckInResponse,
  StampBookResponse,
  StampCatalogResponse,
  StampLeaderboardResponse,
  StampRankingStatusResponse,
} from '../domain/models';

export interface CheckInPosition {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
}

export interface StampRepository {
  getCatalog(): Promise<StampCatalogResponse>;
  getMyStampBook(): Promise<StampBookResponse>;
  checkIn(placeId: string, body: CheckInPosition, idempotencyKey: string): Promise<CheckInResponse>;
  getLeaderboard(limit?: number): Promise<StampLeaderboardResponse>;
  getMyRanking(): Promise<StampRankingStatusResponse>;
  updateRankingParticipation(participating: boolean): Promise<StampRankingStatusResponse>;
}

export interface PositionProvider {
  getCurrentPosition(): Promise<CheckInPosition>;
}

export interface LegacyStampStorage {
  removeLegacyStampData(): void;
}
