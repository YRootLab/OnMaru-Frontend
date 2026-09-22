








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
const MAX_PAGES = 6;
const DEFAULT_TARGET_PER_CATEGORY = 80;









const CATEGORY_CONFIGS = [
  { ...CATEGORY_MAPPINGS.STAY_HANOK, type: STAY_TYPE },
  { ...CATEGORY_MAPPINGS.HERITAGE_HOUSE, type: '고택' },
  { ...CATEGORY_MAPPINGS.FOLK_VILLAGE, type: '민속마을' },
  { ...CATEGORY_MAPPINGS.PALACE, type: '고궁' },
  { ...CATEGORY_MAPPINGS.BIRTHPLACE, type: '생가' },
  { ...CATEGORY_MAPPINGS.GATE, type: '문' },
];


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









async function buildSummary(item, type, region) {
  try {
    const detail = await detailCommon(item.contentid);
    const sentence = firstSentence(itemsOf(detail)[0]?.overview);
    if (sentence) return sentence;
  } catch {

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
