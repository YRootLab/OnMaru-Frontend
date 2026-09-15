export type TimelineTarget =
  | { type: 'PLACE'; placeId: string }
  | { type: 'ODII_STORY'; storyId: string; placeId: string | null }
  | { type: 'SAVED_JOURNEY'; savedJourneyId: string }
  | { type: 'VISIT_REVIEW'; reviewId: string; placeId: string };

export type TimelineItemType = 'SAVED_PLACE' | 'SAVED_ODII_STORY' | 'SAVED_JOURNEY' | 'WROTE_VISIT_REVIEW';

export type TimelineItem = {
  id: string;
  type: TimelineItemType;
  occurredAt: string;
  title: string;
  subtitle: string | null;
  thumbnailUrl: string | null;
  target: TimelineTarget;
};

export type TimelineDayGroup = {
  date: string;
  items: TimelineItem[];
};

export type MemberTimeline = {
  month: string;
  groups: TimelineDayGroup[];
  nextCursor: string | null;
  hasMore: boolean;
  unavailableCount: number;
};

const SUPPORTED_TIMELINE_TYPES = new Set<string>([
  'SAVED_PLACE',
  'SAVED_ODII_STORY',
  'SAVED_JOURNEY',
  'WROTE_VISIT_REVIEW',
]);

export function isSupportedTimelineItem(item: TimelineItem): boolean {
  return SUPPORTED_TIMELINE_TYPES.has(item.type);
}

export function formatTimelineDayLabel(date: string, locale = 'ko-KR'): string {
  const [year, month, day] = date.split('-').map((value) => Number(value));
  return new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
}
