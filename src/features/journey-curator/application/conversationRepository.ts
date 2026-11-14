import type { RunAccepted } from '../api/journeyApi';
import type { JourneyRunSnapshot, JourneySseFrame } from '../api/journeyContract';
import type {
  ConversationSnapshot,
  ExplorationPage,
  ExplorationTurnPage,
} from '../domain/conversation';

export interface ConversationRepository {
  listExplorations(input?: { limit?: number; cursor?: string }): Promise<ExplorationPage>;
  getExploration(explorationId: string): Promise<ConversationSnapshot>;
  listTurns(input: { explorationId: string; limit?: number; cursor?: string }): Promise<ExplorationTurnPage>;
  createExploration(input: { query: string; regionCode?: string | null; idempotencyKey: string }): Promise<RunAccepted>;
  createTurn(input: {
    explorationId: string;
    query: string;
    baseVersion: number;
    clientTurnId: string;
    clarificationAnswer?: { clarificationId: string; choiceId: string | null; text: string | null } | null;
    idempotencyKey: string;
  }): Promise<RunAccepted>;
  getAcceptedSnapshots(accepted: RunAccepted): Promise<{ run: JourneyRunSnapshot; snapshot: ConversationSnapshot }>;
  subscribeToRunEvents(
    eventsUrl: string,
    onEvent: (frame: JourneySseFrame) => void,
    onError: (error: unknown) => void,
  ): () => void;
  cancelRun(input: { explorationId: string; runId: string; idempotencyKey: string }): Promise<JourneyRunSnapshot>;
  deleteExploration(input: { explorationId: string; idempotencyKey: string }): Promise<void>;
}
