import { describe, expect, it } from 'vitest';
import { mapRegionGroups, mapStoryDetail, mapStoryPage } from './sorimaruStoryMapper';

const summary = {
  storyId: 'story-1', title: '제목', audioTitle: '오디오 제목', category: '오디오 관광',
  region: { regionCode: 'kr-11', name: '서울특별시', level: 'PROVINCE', parentRegionCode: null },
  coordinates: { lat: 37.5, lng: 127 }, durationSeconds: 180, imageUrl: 'https://example.com/1.jpg',
  linkedPlaceId: null, contentTags: ['궁궐'], savedByMe: false,
};

describe('mapStoryPage', () => {
  it('maps a list item without requiring audioUrl or transcript', () => {
    const page = mapStoryPage({
      schemaVersion: '1.2', items: [summary], totalCount: 23675, nextCursor: 'cursor-2', hasMore: true,
    });

    expect(page.items).toEqual([summary]);
    expect(page.items[0]).not.toHaveProperty('audioUrl');
    expect(page).toMatchObject({ totalCount: 23675, nextCursor: 'cursor-2', hasMore: true });
  });

  it('rejects a list payload without an items array', () => {
    expect(() => mapStoryPage({ schemaVersion: '1.2' })).toThrow('Invalid Sorimaru story page');
  });

  it('keeps a valid empty page empty', () => {
    expect(mapStoryPage({ items: [], totalCount: 0, nextCursor: null, hasMore: false })).toEqual({
      items: [], totalCount: 0, nextCursor: null, hasMore: false,
    });
  });

  it('rejects a list payload without a non-negative integer totalCount', () => {
    expect(() => mapStoryPage({ items: [summary], nextCursor: null, hasMore: false }))
      .toThrow('Invalid Sorimaru story page');
    expect(() => mapStoryPage({ items: [summary], totalCount: -1, nextCursor: null, hasMore: false }))
      .toThrow('Invalid Sorimaru story page');
    expect(() => mapStoryPage({ items: [summary], totalCount: 1.5, nextCursor: null, hasMore: false }))
      .toThrow('Invalid Sorimaru story page');
    expect(() => mapStoryPage({ items: [summary, { ...summary, storyId: 'story-2' }], totalCount: 1, nextCursor: null, hasMore: false }))
      .toThrow('Invalid Sorimaru story page');
    expect(() => mapStoryPage({ items: [summary], totalCount: Number.MAX_SAFE_INTEGER + 1, nextCursor: null, hasMore: false }))
      .toThrow('Invalid Sorimaru story page');
  });

  it('rejects malformed summary and pagination fields', () => {
    expect(() => mapStoryPage({ items: [{ ...summary, durationSeconds: '180' }], totalCount: 1, nextCursor: null, hasMore: false }))
      .toThrow('Invalid Sorimaru story page');
    expect(() => mapStoryPage({ items: [summary], totalCount: 1, nextCursor: 2, hasMore: true }))
      .toThrow('Invalid Sorimaru story page');
    expect(() => mapStoryPage({ items: [summary], totalCount: 1, nextCursor: null, hasMore: 'false' }))
      .toThrow('Invalid Sorimaru story page');
  });
});

describe('mapStoryDetail', () => {
  it('maps a nested story and timed transcript', () => {
    expect(mapStoryDetail({
      story: summary,
      audioUrl: 'https://example.com/1.mp3',
      transcript: [{ text: '첫 문장', startTimeSeconds: 0 }, { text: '둘째 문장' }],
    })).toEqual({
      ...summary,
      audioUrl: 'https://example.com/1.mp3',
      transcript: [{ text: '첫 문장', startTimeSeconds: 0 }, { text: '둘째 문장' }],
    });
  });

  it('rejects a detail with missing audio or invalid transcript', () => {
    expect(() => mapStoryDetail({ story: summary, transcript: [] }))
      .toThrow('Invalid Sorimaru story detail');
    expect(() => mapStoryDetail({ story: summary, audioUrl: 'https://example.com/1.mp3', transcript: [{ text: 4 }] }))
      .toThrow('Invalid Sorimaru story detail');
  });
});

describe('mapRegionGroups', () => {
  it('maps groups and preserves an empty success response', () => {
    expect(mapRegionGroups({ groups: [{ label: '서울', regionCodes: ['kr-11'], storyCount: 3 }] })).toEqual({
      groups: [{ label: '서울', regionCodes: ['kr-11'], storyCount: 3 }],
    });
    expect(mapRegionGroups({ groups: [] })).toEqual({ groups: [] });
  });

  it('rejects invalid group counts and region code arrays', () => {
    expect(() => mapRegionGroups({ groups: [{ label: '서울', regionCodes: ['kr-11'], storyCount: '3' }] }))
      .toThrow('Invalid Sorimaru region groups');
    expect(() => mapRegionGroups({ groups: [{ label: '서울', regionCodes: [11], storyCount: 3 }] }))
      .toThrow('Invalid Sorimaru region groups');
  });
});
