// 한옥도감 정적 폴백 스냅샷(src/data/hanokVillages.fallback.json) 빌드 스크립트.
//
// 라이브 요청 경로(src/hanok/services/hanokArchive.service.ts)가 쓰는 것과 똑같은
// 카테고리 6종·분류 규칙(src/hanok/lib/classify.mjs)을 그대로 가져다 쓴다. 폴백과
// 라이브가 서로 다른 유형/뱃지 체계로 갈라지면, 라이브 fetch가 실패하는 순간 필터
// UI도 '이달의 한옥' 매칭도 함께 깨진다 — 이 스크립트를 만든 이유가 그 사고다.
//
// 실행: npm run build:fallback [-- --dry-run] [-- --limit=20]
// 검증: npm run build:fallback:check   (네트워크 호출 없음, 저장된 파일만 검사)
import { writeFile, readFile } from 'node:fs/promises';
import { areaBasedList, detailCommon, itemsOf, totalOf, stripTags, getCallStats } from './lib/tourapi.mjs';
import {
  CATEGORY_MAPPINGS,
  STAY_TYPE,
  LIVE_VILLAGE_TYPES,
  BADGE_RULES,
  classifyHeritageHouse,
  resolveRegion,
  assignBadges,
  inKorea,
  toHttps,
} from '../src/hanok/lib/classify.mjs';
import { MONTHLY_CURATIONS } from '../src/hanok/data/monthlyCurations.mjs';

const OUT_PATH = 'src/data/hanokVillages.fallback.json';
const ROWS = 100;
const MAX_PAGES = 6; // hanokArchive.service.ts의 fetchCategory와 같은 안전장치 — 무한 페이징 방지
const DEFAULT_TARGET_PER_CATEGORY = 80; // 60~100건 권장 범위의 중간값. 6종 × 80 ≈ 480회 상세 호출로 일일 호출 한도(1,000회) 안에 여유를 둔다.

/*
  카테고리 코드는 classify.mjs에서 가져오지만, '이 코드로 받아온 건 이 유형'이라는
  짝짓기는 hanokArchive.service.ts의 configs 배열과 이 파일 두 곳에 각각 있다.
  STAY_TYPE 같은 라이브 Village.type 리터럴은 service.ts 쪽 타입 안전성을 위해
  types.ts에서 직접 가져오므로(순수 JS 스크립트는 .ts를 import 못 한다) 완전히 하나로
  합치지는 못했다 — 이 두 배열이 같은 값을 만드는지는
  src/hanok/lib/classify.contract.test.ts가 지킨다.
*/
const CATEGORY_CONFIGS = [
  { ...CATEGORY_MAPPINGS.STAY_HANOK, type: STAY_TYPE },
  { ...CATEGORY_MAPPINGS.HERITAGE_HOUSE, type: '고택' },
  { ...CATEGORY_MAPPINGS.FOLK_VILLAGE, type: '민속마을' },
  { ...CATEGORY_MAPPINGS.PALACE, type: '고궁' },
  { ...CATEGORY_MAPPINGS.BIRTHPLACE, type: '생가' },
  { ...CATEGORY_MAPPINGS.GATE, type: '문' },
];

/** 한 카테고리를 목표 건수까지 받아온다. service.ts의 fetchCategory와 같은 페이지 루프. */
async function collectCategory(config, cap) {
  const items = [];
  let totalCount = 0;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const json = await areaBasedList({ ...config, numOfRows: ROWS, pageNo: page, arrange: 'P' });
    if (!json) break;

    totalCount = totalOf(json);
    const batch = itemsOf(json);
    items.push(...batch);

    if (batch.length < ROWS || items.length >= totalCount || items.length >= cap) break;
  }

  return { items: items.slice(0, cap), totalCount };
}

function firstSentence(overview) {
  const text = stripTags(overview);
  if (!text) return '';
  const first = text.split(/(?<=[.!?])\s+/)[0] ?? text;
  return first.length > 60 ? `${first.slice(0, 59)}…` : first;
}

/*
  목록 API(areaBasedList2)엔 개요가 없다 — 항목마다 상세를 한 번 더 불러야 있다.
  라이브 요청 경로는 이 비용을 매 요청마다 치를 수 없어 summary를 주소로 대신한다
  (hanokArchive.service.ts). 스냅샷은 한 번 만들어 오래 쓰므로 이 비용을 여기서 낸다.

  전에는 실패하든 성공하든 `${title} - ${addr}`였다 — 카드 제목 바로 아래에 그 제목이
  주소와 함께 한 번 더 찍혀 정보량이 0이었다. 최소한 이름을 되풀이하지는 않는다.
*/
async function buildSummary(item, type, region) {
  try {
    const detail = await detailCommon(item.contentid);
    const sentence = firstSentence(itemsOf(detail)[0]?.overview);
    if (sentence) return sentence;
  } catch {
    // 상세 호출 실패는 폴백 문구로 넘어간다 — 스냅샷 생성 전체를 멈추지 않는다.
  }
  return `${type} · ${region}`;
}

function checkMonthlyCurations(villages) {
  const ids = new Set(villages.map((v) => v.id));
  const missing = [];
  for (const [month, curation] of Object.entries(MONTHLY_CURATIONS)) {
    if (!ids.has(curation.contentId)) missing.push({ month, contentId: curation.contentId });
  }
  return missing;
}

async function main() {
  const args = process.argv;
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const perCategoryCap = limitArg ? Number(limitArg.split('=')[1]) : DEFAULT_TARGET_PER_CATEGORY;

  console.log('====================================================');
  console.log('  한옥도감 폴백 스냅샷 빌드 (라이브 분류 로직 재사용)');
  console.log(`  [설정] perCategoryCap: ${perCategoryCap}, dryRun: ${dryRun}`);
  console.log('====================================================\n');

  const villages = [];
  const seenIds = new Set();
  const sourceTotals = {};

  for (const config of CATEGORY_CONFIGS) {
    console.log(`[수집] type=${config.type} (cat3=${config.cat3})`);
    const { items, totalCount } = await collectCategory(config, perCategoryCap);
    sourceTotals[config.type] = totalCount;
    console.log(`  · ${items.length}건 수집 (관광공사 전체 ${totalCount}건)`);

    for (const item of items) {
      const id = String(item.contentid ?? '');
      if (!id || seenIds.has(id)) continue;

      const title = String(item.title ?? '').trim();
      const addr = String(item.addr1 ?? '').trim();
      const lat = parseFloat(String(item.mapy ?? ''));
      const lng = parseFloat(String(item.mapx ?? ''));

      /*
        좌표가 한국 범위를 벗어나거나 없으면 이 항목 자체를 스냅샷에서 뺀다(null로
        저장하지 않는다). 그래야 스냅샷에서 온 마을은 상세 모달의 "지도에서 위치 보기"가
        항상 /map?lat=<수>&lng=<수> 꼴이다 — 예전엔 null로 저장해 lat=null&lng=null
        링크가 만들어졌다. 라이브 경로는 TourAPI가 준 항목을 하나도 숨기면 안 되므로
        이 규칙을 그대로 적용하지 않는다(hanokArchive.service.ts는 null로 남긴다) —
        스냅샷은 사람이 골라 심사·시연에 쓰는 정적 데이터라 더 엄격해도 된다.
      */
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inKorea(lat, lng)) continue;

      seenIds.add(id);
      const type = config.type === '고택' ? classifyHeritageHouse(title, addr) : config.type;
      const region = resolveRegion(String(item.areacode ?? ''), addr);

      villages.push({
        id,
        name: title,
        rawTitle: title,
        region,
        addr,
        lat,
        lng,
        type,
        badges: assignBadges(title, addr),
        image: toHttps(item.firstimage || item.firstimage2),
        summary: await buildSummary(item, type, region),
        overview: '',
      });
    }
  }

  console.log(`\n총 ${villages.length}건 수집(좌표 무효 항목 제외)`);
  console.log('API 호출 통계:', getCallStats());

  const missingMonths = checkMonthlyCurations(villages);
  if (missingMonths.length > 0) {
    console.warn(
      `\n⚠️ 이달의 한옥 contentId가 스냅샷에 없습니다: ${missingMonths
        .map((m) => `${m.month}월 큐레이션 contentId ${m.contentId}이(가) 폴백에 없습니다`)
        .join(', ')}`,
    );
  } else {
    console.log('\n이달의 한옥 12개월 contentId가 전부 스냅샷에 존재합니다.');
  }

  const output = {
    generatedAt: new Date().toISOString(),
    sourceTotals,
    villages,
  };

  if (dryRun) {
    console.log('\n--dry-run 실행: 저장 과정 생략');
    console.log('sourceTotals:', JSON.stringify(sourceTotals, null, 2));
    return;
  }

  await writeFile(OUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`\n✅ ${OUT_PATH} 저장 완료 (${villages.length}건)`);
}

// ─────────────────────────────────────────────
// 자체 검증 (API 호출 없음) — 지금 저장된 스냅샷 파일만 검사한다.
// 실행: npm run build:fallback:check
// ─────────────────────────────────────────────
async function selfCheck() {
  const { strict: assert } = await import('node:assert');
  const raw = await readFile(OUT_PATH, 'utf-8');
  const snapshot = JSON.parse(raw);

  assert.ok(Array.isArray(snapshot.villages) && snapshot.villages.length > 0, 'villages가 비어 있음');
  assert.ok(typeof snapshot.generatedAt === 'string' && snapshot.generatedAt, 'generatedAt 없음');
  assert.ok(snapshot.sourceTotals && typeof snapshot.sourceTotals === 'object', 'sourceTotals 없음');

  const badgeNames = new Set(BADGE_RULES.map((r) => r.badge));
  const liveTypes = new Set(LIVE_VILLAGE_TYPES);

  for (const v of snapshot.villages) {
    assert.ok(liveTypes.has(v.type), `알 수 없는 유형: '${v.type}' (${v.name})`);
    for (const b of v.badges) {
      assert.ok(badgeNames.has(b), `알 수 없는 뱃지: '${b}' (${v.name})`);
    }
    assert.ok(Number.isFinite(v.lat) && Number.isFinite(v.lng), `좌표 없음: ${v.name}`);
    assert.ok(inKorea(v.lat, v.lng), `한국 범위 밖 좌표: ${v.name} (${v.lat}, ${v.lng})`);
    assert.ok(!v.summary.startsWith(`${v.name} -`), `summary가 이름을 되풀이함: ${v.name}`);
  }

  const missingMonths = checkMonthlyCurations(snapshot.villages);
  assert.equal(
    missingMonths.length,
    0,
    `이달의 한옥 contentId 누락: ${missingMonths.map((m) => `${m.month}월(${m.contentId})`).join(', ')}`,
  );

  console.log(`self-check 통과 (${snapshot.villages.length}건, 이달의 한옥 12개월 전부 매칭)`);
}

if (process.argv.includes('--self-check')) {
  await selfCheck();
} else {
  main().catch((err) => {
    console.error('빌드 도중 중대 오류 발생:', err);
    process.exitCode = 1;
  });
}
