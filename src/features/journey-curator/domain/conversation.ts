import type { JourneyBoard, JourneyProposal, ResourceRef } from '../types/exploration.types';
import type { JourneyRunSnapshot } from '../api/journeyContract';

export type ExplorationSummary = {
  explorationId: string;
  title: string;
  lastUserQueryPreview: string | null;
  latestRunStatus: JourneyRunSnapshot['status'] | null;
  candidateCount: number;
  pinnedCount: number;
  updatedAt: string;
};

export type ExplorationPage = {
  schemaVersion: '1.3';
  items: ExplorationSummary[];
  totalCount: number;
  nextCursor: string | null;
  hasMore: boolean;
};

export type TurnResponse = {
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  outcome: JourneyRunSnapshot['outcome'] | null;
  summary: string | null;
  board: JourneyBoard | null;
  proposal: JourneyProposal | null;
  clarification: JourneyRunSnapshot['clarification'];
  error: JourneyRunSnapshot['error'];
};

export type ExplorationTurn = {
  turnId: string;
  query: string;
  createdAt: string;
  runId: string | null;
  response: TurnResponse;
};

export type ExplorationTurnPage = {
  schemaVersion: '1.3';
  items: ExplorationTurn[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type ConversationSnapshot = {
  schemaVersion: '1.3';
  explorationId: string;
  stateVersion: number;
  board: JourneyBoard | null;
  pinnedRefs: ResourceRef[];
  excludedRefs: ResourceRef[];
  unavailableRefs: ResourceRef[];
  latestRun: JourneyRunSnapshot | null;
  pendingProposal: JourneyProposal | null;
  updatedAt: string;
};
