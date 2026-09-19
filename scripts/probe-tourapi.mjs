// TourAPI 데이터 규모 탐침. UI 없음, 조사 전용.
// 실행: npm run probe  (하루 1~2회만!)
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = 'https://apis.data.go.kr/B551011/KorService2';
const KEY = process.env.TOUR_API_KEY;
if (!KEY) {
  console.error('TOUR_API_KEY 없음. .env.local 확인 (값은 출력하지 않음)');
  process.exit(1);
}

const AREA = {
  1: '서울', 2: '인천', 3: '대전', 4: '대구', 5: '광주', 6: '부산', 7: '울산', 8: '세종',
  31: '경기', 32: '강원', 33: '충북', 34: '충남', 35: '경북', 36: '경남', 37: '전북', 38: '전남', 39: '제주',
};
const SAMPLE_AREAS = [37, 35, 38];
const SAMPLE_SIZE = Number(process.env.PROBE_SAMPLE ?? 50); // 지역당 detailIntro2 호출 수

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let calls = 0;
async function get(path, params) {
  const rest = new URLSearchParams({ MobileOS: 'ETC', MobileApp: 'OnMaru', _type: 'json', ...params });
  // 재시도는 인코딩 방식 폴백을 겸함: 1) 디코딩 키를 인코딩  2) 키를 그대로(이미 인코딩된 경우)
  const urls = [
    `${BASE}/${path}?${new URLSearchParams({ serviceKey: KEY })}&${rest}`,
    `${BASE}/${path}?serviceKey=${KEY}&${rest}`,
  ];
  const label = `${path}?${new URLSearchParams(params)}`; // 키 제외 로그용

  for (let attempt = 0; attempt < urls.length; attempt++) {
    await sleep(200);
    calls++;
    try {
      const res = await fetch(urls[attempt]);
      const text = await res.text();
      if (!text.trim().startsWith('{')) throw new Error(`non-JSON: ${text.slice(0, 160).replace(/\s+/g, ' ')}`);
      const json = JSON.parse(text);
      const { resultCode, resultMsg } = json?.response?.header ?? {};
      if (resultCode && resultCode !== '0000') throw new Error(`resultCode ${resultCode}: ${resultMsg}`);
      return json;
    } catch (e) {
      if (attempt === urls.length - 1) {
        console.warn(`  ! 실패 ${label} → ${e.message}`);
        return null;
      }
    }
  }
}

// items가 ''(빈 문자열)/누락으로 오는 경우 대비
const itemsOf = (json) => {
  const item = json?.response?.body?.items?.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
};
const totalOf = (json) => Number(json?.response?.body?.totalCount ?? 0) || 0;
const pct = (n, d) => (d ? +((n / d) * 100).toFixed(1) : 0);

// ── TEST 1: 지역별 숙박 총 개수
async function test1() {
  console.log('\n[TEST 1] 지역별 숙박 총 개수');
  const rows = [];
  for (const [code, name] of Object.entries(AREA)) {
    const json = await get('areaBasedList2', {
      contentTypeId: '32', areaCode: code, numOfRows: '1', pageNo: '1',
    });
    rows.push({ 지역: name, areaCode: +code, 숙박총계: totalOf(json) });
  }
  console.table(rows);
  return { rows, total: rows.reduce((s, r) => s + r.숙박총계, 0) };
}

// ── TEST 2: hanok 필드 존재 여부 및 비율
async function test2() {
  console.log(`\n[TEST 2] hanok 필드 조사 (지역 ${SAMPLE_AREAS.length}곳 × ${SAMPLE_SIZE}건, 수 분 소요)`);
  const rows = [];
  const hanokItems = [];
  const valueCounts = {};
  let firstHanokRaw = null, firstIntroRaw = null;

  for (const code of SAMPLE_AREAS) {
    const list = await get('areaBasedList2', {
      contentTypeId: '32', areaCode: String(code), numOfRows: String(SAMPLE_SIZE), pageNo: '1',
    });
    const items = itemsOf(list);
    let hasField = 0, isHanok = 0;

    for (const it of items) {
      const intro = await get('detailIntro2', { contentId: it.contentid, contentTypeId: '32' });
      const detail = itemsOf(intro)[0];
      if (!detail) continue;
      firstIntroRaw ??= detail;
      const v = detail.hanok;
      const key = v === undefined ? 'undefined' : v === '' ? '(empty)' : String(v);
      valueCounts[key] = (valueCounts[key] ?? 0) + 1;
      if (v !== undefined) hasField++;
      if (v && v !== '0') {
        isHanok++;
        hanokItems.push({ contentid: it.contentid, title: it.title, areaCode: code });
        firstHanokRaw ??= detail;
      }
    }
    rows.push({
      지역: AREA[code], 조회: items.length, 필드있음: hasField,
      'hanok=1': isHanok, '비율%': pct(isHanok, items.length),
    });
    console.log(`  ${AREA[code]} 완료: ${items.length}건 중 hanok ${isHanok}건`);
  }

  console.table(rows);
  console.log('hanok 값 분포:', valueCounts);
  console.log('\n첫 hanok 항목 detailIntro2 원본:\n', JSON.stringify(firstHanokRaw, null, 2));
  if (!firstHanokRaw) {
    console.log('hanok 항목 없음 → detailIntro2 응답 필드 확인용 원본:\n', JSON.stringify(firstIntroRaw, null, 2));
  }
  return { rows, valueCounts, hanokItems, firstHanokRaw, firstIntroRaw };
}

// ── TEST 3: 키워드 검색 백업 경로
async function test3() {
  console.log('\n[TEST 3] 키워드 검색 totalCount');
  const rows = [];
  for (const keyword of ['한옥', '고택', '종택', '한옥스테이']) {
    const json = await get('searchKeyword2', { keyword, contentTypeId: '32', numOfRows: '1' });
    rows.push({ 키워드: keyword, 타입: '숙박(32)', totalCount: totalOf(json) });
  }
  const all = await get('searchKeyword2', { keyword: '한옥마을', numOfRows: '1' });
  rows.push({ 키워드: '한옥마을', 타입: '전체', totalCount: totalOf(all) });
  console.table(rows);
  return rows;
}

// ── TEST 4: 이미지 / 개요 품질
async function test4(hanokItems) {
  const targets = hanokItems.slice(0, 20);
  console.log(`\n[TEST 4] 이미지/개요 품질 (${targets.length}건)`);
  if (!targets.length) return { sampled: 0, withCoord: [] };

  const LEGACY = { defaultYN: 'Y', firstImageYN: 'Y', overviewYN: 'Y', mapinfoYN: 'Y', addrinfoYN: 'Y' };
  let legacy = false; // KorService2는 옵션 불필요할 수 있어 무옵션 우선, 안 되면 폴백
  const lens = [], samples = [], withCoord = [];
  let noImage = 0, noOverview = 0, counted = 0;

  for (const t of targets) {
    let d = itemsOf(await get('detailCommon2', { contentId: t.contentid, ...(legacy ? LEGACY : {}) }))[0];
    if (!legacy && (!d || d.overview === undefined)) {
      legacy = true;
      console.log('  · 무옵션 응답에 overview 없음 → defaultYN 등 옵션 붙여 재호출');
      d = itemsOf(await get('detailCommon2', { contentId: t.contentid, ...LEGACY }))[0];
    }
    if (!d) continue;
    counted++;
    if (!d.firstimage) noImage++;
    const overview = (d.overview ?? '').replace(/<[^>]*>/g, '').trim();
    if (!overview) noOverview++;
    else {
      lens.push(overview.length);
      if (samples.length < 2) samples.push({ title: d.title, overview });
    }
    if (Number(d.mapx) && Number(d.mapy)) {
      withCoord.push({ contentid: d.contentid, title: d.title, mapx: d.mapx, mapy: d.mapy });
    }
  }

  const stat = {
    표본: counted,
    '이미지없음%': pct(noImage, counted),
    '개요없음%': pct(noOverview, counted),
    '좌표유효%': pct(withCoord.length, counted),
    개요최소: lens.length ? Math.min(...lens) : 0,
    개요최대: lens.length ? Math.max(...lens) : 0,
    개요평균: lens.length ? Math.round(lens.reduce((a, b) => a + b, 0) / lens.length) : 0,
  };
  console.table([stat]);
  samples.forEach((s, i) => console.log(`\n--- overview 샘플 ${i + 1}: ${s.title}\n${s.overview}`));
  return { ...stat, sampled: counted, imageRate: 100 - stat['이미지없음%'], samples, withCoord };
}

// ── TEST 5: 주변 관광지
async function test5(withCoord = []) {
  console.log('\n[TEST 5] 주변 관광지');
  const base = withCoord[0];
  if (!base) {
    console.log('  좌표 있는 항목 없음, 건너뜀');
    return null;
  }
  const json = await get('locationBasedList2', {
    mapX: base.mapx, mapY: base.mapy, radius: '5000', contentTypeId: '12', numOfRows: '5',
  });
  const rows = itemsOf(json).map((i) => ({ title: i.title, dist: Math.round(Number(i.dist)) }));
  console.log(`  기준: ${base.title} / totalCount: ${totalOf(json)}`);
  console.table(rows);
  return { base: base.title, totalCount: totalOf(json), items: rows };
}

// ── main (에러가 나도 여기까지 모은 결과는 저장)
const t0 = Date.now();
const out = { probedAt: new Date().toISOString() };
try {
  out.test1 = await test1();
  out.test2 = await test2();
  out.test3 = await test3();
  // hanok 필드로 못 찾으면 키워드 검색 결과로 품질 표본 대체
  let sample = out.test2.hanokItems;
  out.qualitySource = 'hanok 필드';
  if (!sample.length) {
    console.log('\nhanok 항목 0건 → searchKeyword2 "한옥" 상위 20건으로 TEST 4 표본 대체');
    sample = itemsOf(await get('searchKeyword2', { keyword: '한옥', contentTypeId: '32', numOfRows: '20' }))
      .map((i) => ({ contentid: i.contentid, title: i.title }));
    out.qualitySource = 'keyword:한옥';
  }
  out.test4 = await test4(sample);
  out.test5 = await test5(out.test4.withCoord);
} catch (e) {
  out.error = e.message;
  console.error('\n중단됨:', e.message, '(수집분은 저장)');
} finally {
  const r1 = out.test1 ?? { rows: [], total: 0 };
  const r2 = out.test2 ?? { rows: [] };
  const r3 = out.test3 ?? [];
  const r4 = out.test4 ?? {};
  const sum = (k) => r2.rows.reduce((s, r) => s + r[k], 0);
  const sampled = sum('조회'), hanokHits = sum('hanok=1');
  const fieldRate = pct(sum('필드있음'), sampled);
  const hanokRate = pct(hanokHits, sampled);
  const 신뢰도 = fieldRate >= 90 ? '높음' : fieldRate >= 50 ? '보통' : '낮음';
  const keywordMax = Math.max(0, ...r3.map((r) => r.totalCount));
  const 예상규모 = Math.round((r1.total * hanokRate) / 100);
  const 권장 = 신뢰도 === '높음' && hanokHits >= 10 ? 'hanok 필드'
    : 신뢰도 === '낮음' ? '키워드 검색' : '혼합';

  out.summary = {
    전국숙박총계: r1.total, hanok신뢰도: 신뢰도, hanok필드보유율: fieldRate,
    표본: sampled, hanok적중: hanokHits, 예상한옥규모: 예상규모,
    이미지보유율: r4.imageRate ?? 0, 키워드최대: keywordMax, 권장접근: 권장, apiCalls: calls,
  };
  await mkdir('data', { recursive: true });
  await writeFile('data/probe-result.json', JSON.stringify(out, null, 2), 'utf8');

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━ 요약 ━━━━━━━━━━━━━━━━━━━━━━━━━
전국 숙박 총 ${r1.total.toLocaleString()}건
hanok 필드 신뢰도: ${신뢰도} (필드 보유율 ${fieldRate}%, 표본 ${sampled}건 중 hanok ${hanokHits}건)
예상 한옥 규모: 약 ${예상규모.toLocaleString()}건 (키워드 검색 최대 ${keywordMax}건)
이미지 보유율: ${out.test4?.imageRate ?? 0}%
권장 접근: ${권장}
API 호출 ${calls}회 / ${Math.round((Date.now() - t0) / 1000)}초 → data/probe-result.json
`);
}
