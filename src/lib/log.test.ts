import { afterEach, expect, test } from 'vitest';
import { __test } from './log';

afterEach(() => {
  delete process.env.DEBUG;
});

test('DEBUG 문자열 파싱', () => {
  const on = (debug: string | undefined, ns: string) => {
    if (debug === undefined) delete process.env.DEBUG;
    else process.env.DEBUG = debug;
    return __test.enabled(ns);
  };

  expect(on(undefined, 'map')).toBe(false);
  expect(on('', 'map')).toBe(false);
  expect(on('*', 'map')).toBe(true);
  expect(on('map', 'map')).toBe(true);
  expect(on(' map , landing ', 'landing')).toBe(true);
  expect(on('map', 'landing')).toBe(false);
  // 부분일치로 새면 안 된다
  expect(on('mapping', 'map')).toBe(false);
});
