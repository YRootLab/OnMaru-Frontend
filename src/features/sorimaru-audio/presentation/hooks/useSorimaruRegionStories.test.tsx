// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SorimaruRepository } from '../../application/SorimaruRepository';
import type { SorimaruRegionGroups, SorimaruStoryPage, SorimaruStorySummary } from '../../domain/sorimaruStory';
import { useSorimaruRegionStories } from './useSorimaruRegionStories';

const story = (storyId: string): SorimaruStorySummary => ({
  storyId, title: storyId, audioTitle: storyId, category: '소리 이야기',
  region: { regionCode: 'returned-seoul', name: '서울', level: 'PROVINCE', parentRegionCode: null },
  coordinates: null, durationSeconds: 180, imageUrl: null, linkedPlaceId: null, contentTags: [], savedByMe: false,
});
const page = (id: string, nextCursor: string | null = null): SorimaruStoryPage => ({
  items: id ? [story(id)] : [], nextCursor, hasMore: nextCursor !== null,
});
const groups: SorimaruRegionGroups = { groups: [
  { label: '서울·경기·인천', regionCodes: ['returned-seoul'], storyCount: 5 },
  { label: '강원', regionCodes: ['returned-gangwon'], storyCount: 2 },
] };
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
function repository() {
  return {
    listRegionGroups: vi.fn<SorimaruRepository['listRegionGroups']>().mockResolvedValue(groups),
    listStories: vi.fn<SorimaruRepository['listStories']>().mockResolvedValue(page('first')),
    getStoryDetail: vi.fn<SorimaruRepository['getStoryDetail']>(),
  };
}
afterEach(cleanup);

describe('useSorimaruRegionStories', () => {
  it('activates once and loads summaries using only a returned exact group code, including StrictMode', async () => {
    const repo = repository();
    const pending = deferred<SorimaruRegionGroups>();
    repo.listRegionGroups.mockReturnValue(pending.promise);
    const { result, rerender } = renderHook(({ active }) => useSorimaruRegionStories(repo, active), {
      initialProps: { active: false }, wrapper: ({ children }) => <React.StrictMode>{children}</React.StrictMode>,
    });
    expect(repo.listRegionGroups).not.toHaveBeenCalled();
    rerender({ active: true });
    expect(result.current.groupsState.status).toBe('loading');
    await act(async () => pending.resolve(groups));
    expect(result.current.groupsState.status).toBe('success');
    expect(result.current.regionStoriesState.items.map((item) => item.storyId)).toEqual(['first']);
    expect(repo.listRegionGroups).toHaveBeenCalledTimes(1);
    expect(repo.listStories).toHaveBeenCalledTimes(1);
    expect(repo.listStories).toHaveBeenCalledWith({ language: 'ko-KR', regionCode: 'returned-seoul', limit: 20 });
    expect(repo.getStoryDetail).not.toHaveBeenCalled();
    rerender({ active: false });
    rerender({ active: true });
    expect(repo.listRegionGroups).toHaveBeenCalledTimes(1);
  });

  it('keeps group failure as an error and retries without fabricating zero counts or list requests', async () => {
    const repo = repository();
    repo.listRegionGroups.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useSorimaruRegionStories(repo, true));
    await waitFor(() => expect(result.current.groupsState.status).toBe('error'));
    expect(result.current.groupsState.data).toBeNull();
    expect(repo.listStories).not.toHaveBeenCalled();
    await act(async () => result.current.retryGroups());
    expect(result.current.groupsState.status).toBe('success');
    expect(result.current.regionStoriesState.status).toBe('success');
  });

  it('treats an omitted exact visual group as empty without inventing a code from a similar label', async () => {
    const repo = repository();
    repo.listRegionGroups.mockResolvedValue({ groups: [{ label: '서울', regionCodes: ['11'], storyCount: 4 }] });
    const { result } = renderHook(() => useSorimaruRegionStories(repo, true));
    await waitFor(() => expect(result.current.regionStoriesState.status).toBe('empty'));
    expect(result.current.groupsState.status).toBe('success');
    expect(repo.listStories).not.toHaveBeenCalled();
  });

  it('distinguishes an empty list from a request error and retries the selected region', async () => {
    const repo = repository();
    repo.listStories.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(page(''));
    const { result } = renderHook(() => useSorimaruRegionStories(repo, true));
    await waitFor(() => expect(result.current.regionStoriesState.status).toBe('error'));
    expect(result.current.regionStoriesState.error?.message).toBe('offline');
    await act(async () => result.current.retryRegion());
    expect(result.current.regionStoriesState.status).toBe('empty');
    expect(result.current.regionStoriesState.error).toBeNull();
  });

  it('ignores the late first region response after a second region is selected', async () => {
    const repo = repository();
    const first = deferred<SorimaruStoryPage>();
    const second = deferred<SorimaruStoryPage>();
    repo.listStories.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useSorimaruRegionStories(repo, true));
    await waitFor(() => expect(repo.listStories).toHaveBeenCalledTimes(1));
    act(() => { void result.current.selectRegion('gangwon'); });
    await act(async () => second.resolve(page('second')));
    await act(async () => first.resolve(page('stale')));
    expect(result.current.selectedRegionId).toBe('gangwon');
    expect(result.current.regionStoriesState.items.map((item) => item.storyId)).toEqual(['second']);
    expect(repo.listStories).toHaveBeenLastCalledWith({ language: 'ko-KR', regionCode: 'returned-gangwon', limit: 20 });
  });

  it('loads the real next cursor once and retains the loaded list when that page fails', async () => {
    const repo = repository();
    const next = deferred<SorimaruStoryPage>();
    repo.listStories.mockResolvedValueOnce(page('first', 'opaque-cursor')).mockReturnValueOnce(next.promise)
      .mockResolvedValueOnce({ items: [story('first'), story('second')], nextCursor: null, hasMore: false });
    const { result } = renderHook(() => useSorimaruRegionStories(repo, true));
    await waitFor(() => expect(result.current.regionStoriesState.status).toBe('success'));
    act(() => { void result.current.loadNextRegionPage(); void result.current.loadNextRegionPage(); });
    expect(repo.listStories).toHaveBeenCalledTimes(2);
    expect(repo.listStories).toHaveBeenLastCalledWith({ language: 'ko-KR', regionCode: 'returned-seoul', limit: 20, cursor: 'opaque-cursor' });
    await act(async () => next.reject(new Error('page failed')));
    expect(result.current.regionStoriesState.items.map((item) => item.storyId)).toEqual(['first']);
    expect(result.current.regionStoriesState.error?.message).toBe('page failed');
    await act(async () => result.current.retryRegion());
    expect(result.current.regionStoriesState.items.map((item) => item.storyId)).toEqual(['first', 'second']);
    expect(result.current.regionStoriesState.hasMore).toBe(false);
  });

  it('exhausts a returned code cursor before lazily advancing to the next code in a combined group', async () => {
    const repo = repository();
    repo.listRegionGroups.mockResolvedValue({ groups: [{ label: '서울·경기·인천', regionCodes: ['11', '41'], storyCount: 3 }] });
    repo.listStories.mockResolvedValueOnce(page('seoul-1', 'cursor-11')).mockResolvedValueOnce(page('seoul-2')).mockResolvedValueOnce(page('gyeonggi'));
    const { result } = renderHook(() => useSorimaruRegionStories(repo, true));
    await waitFor(() => expect(result.current.regionStoriesState.status).toBe('success'));
    expect(repo.listStories).toHaveBeenCalledTimes(1);
    await act(async () => result.current.loadNextRegionPage());
    expect(repo.listStories).toHaveBeenLastCalledWith({ language: 'ko-KR', regionCode: '11', limit: 20, cursor: 'cursor-11' });
    expect(result.current.regionStoriesState.hasMore).toBe(true);
    await act(async () => result.current.loadNextRegionPage());
    expect(repo.listStories).toHaveBeenLastCalledWith({ language: 'ko-KR', regionCode: '41', limit: 20 });
    expect(result.current.regionStoriesState.items.map((item) => item.storyId)).toEqual(['seoul-1', 'seoul-2', 'gyeonggi']);
    expect(result.current.regionStoriesState.hasMore).toBe(false);
  });

  it('ignores a stale next page after switching regions', async () => {
    const repo = repository();
    const next = deferred<SorimaruStoryPage>();
    repo.listStories.mockResolvedValueOnce(page('seoul', 'next-seoul')).mockReturnValueOnce(next.promise).mockResolvedValueOnce(page('gangwon'));
    const { result } = renderHook(() => useSorimaruRegionStories(repo, true));
    await waitFor(() => expect(result.current.regionStoriesState.status).toBe('success'));
    act(() => { void result.current.loadNextRegionPage(); });
    await act(async () => result.current.selectRegion('gangwon'));
    await act(async () => next.resolve(page('old-seoul', 'later-seoul')));
    expect(result.current.regionStoriesState.items.map((item) => item.storyId)).toEqual(['gangwon']);
    expect(result.current.regionStoriesState.hasMore).toBe(false);
  });

  it('retries the failed cursor even when the preceding successful page was empty', async () => {
    const repo = repository();
    repo.listStories.mockResolvedValueOnce(page('', 'empty-page-cursor')).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(page('found'));
    const { result } = renderHook(() => useSorimaruRegionStories(repo, true));
    await waitFor(() => expect(result.current.regionStoriesState.status).toBe('empty'));
    await act(async () => result.current.loadNextRegionPage());
    await act(async () => result.current.retryRegion());
    expect(repo.listStories).toHaveBeenLastCalledWith({ language: 'ko-KR', regionCode: 'returned-seoul', limit: 20, cursor: 'empty-page-cursor' });
    expect(result.current.regionStoriesState.items.map((item) => item.storyId)).toEqual(['found']);
  });
});
