import { describe, expect, it, vi } from 'vitest';
import { createOdiiApiAdapter } from './odiiApi';
import type { OdiiNetworkClient } from './odiiNetwork';

const storyItem = {
  tid: 'story-1',
  stid: 'stid-1',
  title: '테스트 한옥 이야기',
  audioTitle: '대청마루의 아침',
  audioUrl: 'https://example.com/story.mp3',
  playTime: '180',
  imageUrl: 'https://example.com/story.jpg',
  mapX: '126.9780',
  mapY: '37.5665',
};

function makeNetwork(response: unknown): OdiiNetworkClient & { request: ReturnType<typeof vi.fn> } {
  return {
    request: vi.fn().mockResolvedValue(response),
  };
}

describe('Odii API adapter', () => {
  it('스토리 목록 API 응답을 화면 모델로 매핑하고 요청 파라미터를 전달한다', async () => {
    const network = makeNetwork({
      response: { body: { items: { item: [storyItem] }, totalCount: 1 } },
    });
    const api = createOdiiApiAdapter(network);

    const result = await api.getStoryPage(undefined, '테스트-스토리-파라미터', 2, 7);

    expect(network.request).toHaveBeenCalledWith({
      type: 'stories',
      params: { numOfRows: '7', pageNo: '2', keyword: '테스트-스토리-파라미터' },
    });
    expect(result.items[0]).toMatchObject({
      stid: 'stid-1',
      title: '테스트 한옥 이야기',
      formattedDuration: '3분 00초',
    });
    expect(result.source).toBe('api');
  });

  it('API 이미지가 없으면 공통 이미지를 주입하지 않는다', async () => {
    const { imageUrl: _imageUrl, ...storyWithoutImage } = storyItem;
    const network = makeNetwork({
      response: { body: { items: { item: [storyWithoutImage] }, totalCount: 1 } },
    });
    const api = createOdiiApiAdapter(network);

    const result = await api.getStoryList(undefined, '이미지-없음-테스트');

    expect(result[0].imageUrl).toBe('');
  });

  it('위치 기반 API를 별도 타입으로 호출하고 거리순 결과를 반환한다', async () => {
    const network = makeNetwork({
      response: { body: { items: { item: [storyItem] } } },
    });
    const api = createOdiiApiAdapter(network);

    const result = await api.getNearbyStories('126.9780', '37.5665', 3000);

    expect(network.request).toHaveBeenCalledWith({
      type: 'nearby',
      params: { xCoord: '126.9780', yCoord: '37.5665', radius: '3000' },
    });
    expect(result).toHaveLength(1);
    expect(result[0].distance).toBe('100m');
  });

  it('같은 날짜의 같은 요청은 네트워크 의존성을 한 번만 호출한다', async () => {
    const network = makeNetwork({ response: { body: { items: { item: [storyItem] } } } });
    const api = createOdiiApiAdapter(network);

    await Promise.all([
      api.getStoryPage(undefined, '캐시-동시성-테스트', 1, 7),
      api.getStoryPage(undefined, '캐시-동시성-테스트', 1, 7),
    ]);

    expect(network.request).toHaveBeenCalledTimes(1);
  });

  it('네트워크 오류를 목업 데이터로 바꾸지 않고 호출자에게 전달한다', async () => {
    const network = {
      request: vi.fn().mockRejectedValue(new Error('network down')),
    } satisfies OdiiNetworkClient;
    const api = createOdiiApiAdapter(network);

    await expect(api.getStoryList(undefined, '오류-전파-테스트')).rejects.toThrow('network down');
  });
});
