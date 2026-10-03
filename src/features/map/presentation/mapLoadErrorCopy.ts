import type { MapLoadError } from '../application/mapLoadError';

export type MapLoadErrorCopy = { title: string; description: string };

export function getMapLoadErrorCopy(error: MapLoadError): MapLoadErrorCopy {
  switch (error.kind) {
    case 'network':
      return {
        title: '네트워크 연결이 불안정해요',
        description: '인터넷 연결을 확인한 뒤 다시 시도해 주세요.',
      };
    case 'timeout':
      return {
        title: '지도 정보를 불러오는 데 시간이 걸리고 있어요',
        description: '잠시 후 다시 시도하면 지도를 이어서 볼 수 있어요.',
      };
    case 'rate-limited':
      return {
        title: '지금은 요청이 잠시 몰렸어요',
        description: '잠깐 기다린 뒤 다시 시도해 주세요.',
      };
    case 'server':
      return {
        title: '지도 정보를 준비하는 중 문제가 생겼어요',
        description: '잠시 후 다시 시도해 주세요.',
      };
    case 'unavailable':
      return {
        title: '지도 서버와 연결이 원활하지 않아요',
        description: '서버가 준비되면 다시 불러올 수 있어요. 잠시 후 시도해 주세요.',
      };
    default:
      return {
        title: '지도 정보를 불러오지 못했어요',
        description: '잠시 후 다시 시도해 주세요.',
      };
  }
}
