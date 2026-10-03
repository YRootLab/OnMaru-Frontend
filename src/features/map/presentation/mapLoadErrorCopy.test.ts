import { describe, expect, it } from 'vitest';
import { MapLoadError, toMapLoadError } from '../application/mapLoadError';
import { getMapLoadErrorCopy } from './mapLoadErrorCopy';

describe('map load error presentation', () => {
  it.each([
    ['network', '네트워크 연결이 불안정해요'],
    ['timeout', '지도 정보를 불러오는 데 시간이 걸리고 있어요'],
    ['rate-limited', '지금은 요청이 잠시 몰렸어요'],
    ['server', '지도 정보를 준비하는 중 문제가 생겼어요'],
    ['unavailable', '지도 서버와 연결이 원활하지 않아요'],
    ['unknown', '지도 정보를 불러오지 못했어요'],
  ] as const)('maps %s to calm user copy', (kind, title) => {
    expect(getMapLoadErrorCopy(new MapLoadError(kind)).title).toBe(title);
  });

  it.each([
    [408, 'timeout'], [504, 'timeout'], [429, 'rate-limited'], [500, 'server'], [502, 'unavailable'], [503, 'unavailable'],
  ] as const)('classifies HTTP %s as %s', (status, kind) => {
    expect(toMapLoadError({ status, code: `HTTP_${status}` }).kind).toBe(kind);
  });
});
