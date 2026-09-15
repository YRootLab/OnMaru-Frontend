export type JourneySchemaVersion = '1.2';

export type JourneyRunStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type JourneyRunStage = 'INTERPRETING' | 'RETRIEVING' | 'VALIDATING' | 'PERSISTING';
export type JourneyRunEngine = 'LLM' | 'BASELINE';
export type JourneyDegradedReason =
  | 'AI_QUOTA_EXCEEDED'
  | 'AI_TIMEOUT'
  | 'AI_INVALID_RESPONSE'
  | 'AI_SERVICE_UNAVAILABLE';
export type JourneyRunOutcome = 'INITIAL_BOARD' | 'PROPOSAL' | 'CLARIFICATION_REQUIRED' | 'NO_RESULTS';

export type JourneyClarification = {
  id: string;
  reason: 'REGION_MISSING' | 'REGION_AMBIGUOUS' | 'UNSUPPORTED_CONDITION';
  question: string;
  choices: Array<{ id: string; label: string; regionCode: string | null }>;
  allowFreeText: boolean;
};

export type JourneyRunSnapshot = {
  schemaVersion: JourneySchemaVersion;
  runId: string;
  status: JourneyRunStatus;
  engine: JourneyRunEngine;
  degradedReason: JourneyDegradedReason | null;
  stage: JourneyRunStage | null;
  outcome: JourneyRunOutcome | null;
  clarification: JourneyClarification | null;
  retryAfterMs: number;
  createdAt: string;
  startedAt: string | null;
  deadlineAt: string;
  error: { code: string; requestId: string } | null;
};

export type JourneyStageFrame = {
  id: string;
  event: 'run.stage';
  data: {
    schemaVersion: JourneySchemaVersion;
    runId: string;
    sequence: number;
    status: 'QUEUED' | 'RUNNING';
    stage: JourneyRunStage;
  };
};

export type JourneyTerminalFrame = {
  id: string;
  event: 'run.terminal';
  data: {
    schemaVersion: JourneySchemaVersion;
    runId: string;
    sequence: number;
    status: 'COMPLETED' | 'FAILED' | 'CANCELLED';
    outcome: JourneyRunOutcome | null;
    errorCode?: string;
  };
};

export type JourneyHeartbeatFrame = {
  id: string;
  event: 'heartbeat';
  data: {
    schemaVersion: JourneySchemaVersion;
    runId: string;
    sequence: number;
  };
};

export type JourneyResetFrame = {
  event: 'reset';
  data: {
    schemaVersion: JourneySchemaVersion;
    runId: string;
  };
};

export type JourneySseFrame =
  | JourneyStageFrame
  | JourneyTerminalFrame
  | JourneyHeartbeatFrame
  | JourneyResetFrame;
