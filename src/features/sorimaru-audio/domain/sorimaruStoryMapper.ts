import type {
  SorimaruRegionGroup,
  SorimaruRegionGroups,
  SorimaruStoryDetail,
  SorimaruStoryPage,
  SorimaruStorySummary,
} from './sorimaruStory';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isSummary(value: unknown): value is SorimaruStorySummary {
  if (!isObject(value) || !isObject(value.region)) return false;

  const region = value.region;
  const coordinates = value.coordinates;
  return isString(value.storyId) && value.storyId.length > 0
    && isString(value.title)
    && isString(value.audioTitle)
    && isString(value.category)
    && isString(region.regionCode)
    && isString(region.name)
    && isString(region.level)
    && isNullableString(region.parentRegionCode)
    && (coordinates === null || (isObject(coordinates) && isNumber(coordinates.lat) && isNumber(coordinates.lng)))
    && isNumber(value.durationSeconds)
    && isNullableString(value.imageUrl)
    && isNullableString(value.linkedPlaceId)
    && isStringArray(value.contentTags)
    && typeof value.savedByMe === 'boolean';
}

function mapSummary(value: SorimaruStorySummary): SorimaruStorySummary {
  return {
    storyId: value.storyId,
    title: value.title,
    audioTitle: value.audioTitle,
    category: value.category,
    region: {
      regionCode: value.region.regionCode,
      name: value.region.name,
      level: value.region.level,
      parentRegionCode: value.region.parentRegionCode,
    },
    coordinates: value.coordinates === null ? null : { lat: value.coordinates.lat, lng: value.coordinates.lng },
    durationSeconds: value.durationSeconds,
    imageUrl: value.imageUrl,
    linkedPlaceId: value.linkedPlaceId,
    contentTags: [...value.contentTags],
    savedByMe: value.savedByMe,
  };
}

export function mapStoryPage(payload: unknown): SorimaruStoryPage {
  if (!isObject(payload)
    || !Array.isArray(payload.items)
    || !payload.items.every(isSummary)
    || !isNullableString(payload.nextCursor)
    || typeof payload.hasMore !== 'boolean') {
    throw new Error('Invalid Sorimaru story page');
  }

  return {
    items: payload.items.map(mapSummary),
    nextCursor: payload.nextCursor,
    hasMore: payload.hasMore,
  };
}

export function mapStoryDetail(payload: unknown): SorimaruStoryDetail {
  if (!isObject(payload)) throw new Error('Invalid Sorimaru story detail');

  const story = payload.story ?? payload;
  if (!isSummary(story)
    || !isString(payload.audioUrl)
    || payload.audioUrl.length === 0
    || !Array.isArray(payload.transcript)
    || !payload.transcript.every((line: unknown) =>
      isObject(line)
      && isString(line.text)
      && (line.startTimeSeconds === undefined || isNumber(line.startTimeSeconds)))) {
    throw new Error('Invalid Sorimaru story detail');
  }

  return {
    ...mapSummary(story),
    audioUrl: payload.audioUrl,
    transcript: payload.transcript.map((line: { text: string; startTimeSeconds?: number }) => ({
      text: line.text,
      ...(line.startTimeSeconds === undefined ? {} : { startTimeSeconds: line.startTimeSeconds }),
    })),
  };
}

function isRegionGroup(value: unknown): value is SorimaruRegionGroup {
  return isObject(value)
    && isString(value.label)
    && isStringArray(value.regionCodes)
    && isNumber(value.storyCount);
}

export function mapRegionGroups(payload: unknown): SorimaruRegionGroups {
  if (!isObject(payload) || !Array.isArray(payload.groups) || !payload.groups.every(isRegionGroup)) {
    throw new Error('Invalid Sorimaru region groups');
  }

  return {
    groups: payload.groups.map((group) => ({
      label: group.label,
      regionCodes: [...group.regionCodes],
      storyCount: group.storyCount,
    })),
  };
}
