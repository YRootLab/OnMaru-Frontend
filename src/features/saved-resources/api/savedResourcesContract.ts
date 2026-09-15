export type SavedResourceType = 'PLACE' | 'ODII_STORY';

export type SaveIntent = {
  resourceType: 'PLACE';
  placeId: string;
  desiredSaved: true;
  createdAt: string;
};

export type SavedPlaceSummary = {
  resourceType: 'PLACE';
  resourceId: string;
  placeId: string;
  name: string;
  category: string;
  regionName: string | null;
  thumbnailUrl: string | null;
  savedByMe: true;
  savedAt: string;
};

export type SavedOdiiStorySummary = {
  resourceType: 'ODII_STORY';
  resourceId: string;
  storyId: string;
  spotId: string;
  title: string;
  placeId: string | null;
  durationSeconds: number | null;
  savedByMe: true;
  savedAt: string;
};
