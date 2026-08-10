const baseUrl = process.env.ODII_TEST_BASE_URL || 'http://localhost:3001';

const cases = [
  {
    name: 'stories',
    params: { type: 'stories', numOfRows: '7', pageNo: '1', keyword: '한옥' },
  },
  {
    name: 'nearby',
    params: { type: 'nearby', xCoord: '126.9936798', yCoord: '37.559163', radius: '3000' },
  },
];

let failed = false;

for (const testCase of cases) {
  const url = new URL('/api/odii', baseUrl);
  Object.entries(testCase.params).forEach(([key, value]) => url.searchParams.set(key, value));
  const startedAt = performance.now();

  try {
    const response = await fetch(url);
    const payload = await response.json();
    const rawItems = payload?.response?.body?.items?.item;
    const itemCount = Array.isArray(rawItems) ? rawItems.length : rawItems ? 1 : 0;

    console.log(`[Odii API Test] ${testCase.name}`, {
      status: response.status,
      itemCount,
      durationMs: Math.round(performance.now() - startedAt),
    });

    if (!response.ok) failed = true;
    if (itemCount === 0) console.warn(`[Odii API Test] ${testCase.name} returned no items`);
  } catch (error) {
    failed = true;
    console.error(`[Odii API Test] ${testCase.name} failed`, error);
  }
}

if (failed) {
  console.error(`[Odii API Test] failed. Is the dev server running at ${baseUrl}?`);
  process.exitCode = 1;
} else {
  console.log('[Odii API Test] all endpoint checks passed');
}
