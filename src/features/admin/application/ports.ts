export type ModerationNextStatus = 'PUBLISHED' | 'HIDDEN' | 'DELETED';
export type ModerationReason = 'POLICY_VIOLATION' | 'SPAM_CONFIRMED' | 'FALSE_REPORT' | 'OTHER';

export interface ModerationQueueItem {
  [key: string]: unknown;
}

export interface ModerationQueueResult {
  items: ModerationQueueItem[];
}

export interface ModerationRepository {
  getQueue(operatorId: string, limit?: number): Promise<ModerationQueueResult>;
  moderateReview(
    operatorId: string,
    reviewId: string,
    input: { nextStatus: ModerationNextStatus; reason?: ModerationReason },
  ): Promise<void>;
}
