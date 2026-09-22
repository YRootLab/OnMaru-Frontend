

import { mkdir, writeFile } from 'node:fs/promises';

const BASE = 'https://apis.data.go.kr/B551011/KorService2';
const KEY = process.env.TOUR_API_KEY ?? process.env.NEXT_PUBLIC_TOUR_API_KEY;

if (!KEY) {
  console.error('TOUR_API_KEY 없음. .env.local 확인 (값은 출력하지 않음)');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let calls = 0;
async function get(path, params) {
  const rest = new URLSearchParams({
    MobileOS: 'ETC',
    MobileApp: 'OnMaru',
    _type: 'json',
    ...params,
  });

  const urls = [
    `${BASE}/${path}?${new URLSearchParams({ serviceKey: KEY })}&${rest}`,
    `${BASE}/${path}?serviceKey=${KEY}&${rest}`,
  ];
  const label = `${path}?${new URLSearchParams(params)}`;

  for (let attempt = 0; attempt < urls.length; attempt++) {
    await sleep(200);
    calls++;
    try {
      const res = await fetch(urls[attempt]);
      const text = await res.text();
      if (!text.trim().startsWith('{')) {
        throw new Error(`non-JSON: ${text.slice(0, 160).replace(/\s+/g, ' ')}`);
      }
      const json = JSON.parse(text);
      const { resultCode, resultMsg } = json?.response?.header ?? {};
      if (resultCode && resultCode !== '0000') {
        throw new Error(`resultCode ${resultCode}: ${resultMsg}`);
      }
      return json;
    } catch (e) {
      if (attempt === urls.length - 1) {
        console.warn(`  ! 실패 ${label} → ${e.message}`);
        return null;
      }
    }
  }
}

const itemsOf = (json) => {
  const item = json?.response?.body?.items?.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
};

const totalOf = (json) => Number(json?.response?.body?.totalCount ?? 0) || 0;

const AREA = {
  1: '서울', 2: '인천', 3: '대전', 4: '대구', 5: '광주', 6: '부산', 7: '울산', 8: '세종',
  31: '경기', 32: '강원', 33: '충북', 34: '충남', 35: '경북', 36: '경남', 37: '전북', 38: '전남', 39: '제주',
};

const CONTENT_TYPES = {
  '12': '관광지',
  '14': '문화시설',
  '15': '축제공연행사',
  '25': '여행코스',
  '28': '레포츠',
  '32': '숙박',
  '38': '쇼핑',
  '39': '음식점',
};

async function main() {
  console.log('====================================================');
  console.log('  TourAPI 한옥마을 데이터 규모 탐침 (probe-village)');
  console.log('====================================================');

  const rawKeywordResults = {};
  const allKeywordItems = [];




  console.log('\n[TEST A] 한옥마을 관련 키워드 전수 조회');
  const keywords = ['한옥마을', '민속마을', '전통마을', '한옥촌'];
  const testAOverview = [];

  for (const kw of keywords) {
    const json = await get('searchKeyword2', {
      keyword: kw,
      numOfRows: '100',
      pageNo: '1',
    });

    const total = totalOf(json);
    const items = itemsOf(json);
    rawKeywordResults[kw] = { totalCount: total, count: items.length, items };

    testAOverview.push({ 키워드: kw, totalCount: total, 수신건수: items.length });

    for (const it of items) {
      allKeywordItems.push({
        keywordOrigin: kw,
        contentId: String(it.contentid ?? ''),
        title: it.title ?? '',
        addr1: it.addr1 ?? '',
        contentTypeId: String(it.contenttypeid ?? ''),
        areaCode: String(it.areacode ?? ''),
        hasImage: Boolean(it.firstimage && it.firstimage.trim().length > 0),
        firstimage: it.firstimage ?? '',
        mapx: it.mapx ?? '',
        mapy: it.mapy ?? '',
      });
    }
  }

  console.table(testAOverview);




  console.log('\n[TEST B] contentTypeId 분포 (전체 키워드 조회 결과 중복 포함)');
  const typeDistribution = {};
  for (const item of allKeywordItems) {
    const typeId = item.contentTypeId;
    typeDistribution[typeId] = (typeDistribution[typeId] ?? 0) + 1;
  }

  const testBTable = Object.entries(CONTENT_TYPES).map(([id, label]) => ({
    contentTypeId: id,
    타입명: label,
    건수: typeDistribution[id] ?? 0,
  }));
  console.table(testBTable);




  console.log('\n[TEST C] 중복 제거 후 실제 마을 후보 추출');
  const excludeKeywords = [
    '게스트하우스', '펜션', '민박', '카페', '식당',
    '체험관', '공예관', '전시관', '주차장',
  ];

  const candidateMap = new Map();

  for (const item of allKeywordItems) {

    if (item.contentTypeId !== '12' && item.contentTypeId !== '14') {
      continue;
    }


    const title = item.title;
    if (!title.includes('마을') && !title.includes('촌')) {
      continue;
    }


    const hasExcludedWord = excludeKeywords.some((exKw) => title.includes(exKw));
    if (hasExcludedWord) {
      continue;
    }


    if (!candidateMap.has(item.contentId)) {
      candidateMap.set(item.contentId, item);
    }
  }

  const candidates = Array.from(candidateMap.values());
  const candidateTable = candidates.map((c) => ({
    contentId: c.contentId,
    title: c.title,
    지역: AREA[c.areaCode] ?? c.areaCode,
    contentTypeId: c.contentTypeId,
    이미지보유: c.hasImage ? 'Y' : 'N',
    addr1: c.addr1,
  }));

  console.table(candidateTable);
  console.log(`실제 마을 후보 수 (중복 제거 후): ${candidates.length}개`);




  console.log('\n[TEST D] 마을별 주변 밀도 검증 (상위 5곳, 반경 3km)');
  const top5Candidates = candidates.slice(0, 5);
  const testDResults = [];

  for (const village of top5Candidates) {
    let accommodationCount = 0;
    let attractionCount = 0;
    let restaurantCount = 0;

    if (village.mapx && village.mapy) {

      const json32 = await get('locationBasedList2', {
        mapX: village.mapx,
        mapY: village.mapy,
        radius: '3000',
        contentTypeId: '32',
        numOfRows: '1',
        pageNo: '1',
      });
      accommodationCount = totalOf(json32);


      const json12 = await get('locationBasedList2', {
        mapX: village.mapx,
        mapY: village.mapy,
        radius: '3000',
        contentTypeId: '12',
        numOfRows: '1',
        pageNo: '1',
      });
      attractionCount = totalOf(json12);


      const json39 = await get('locationBasedList2', {
        mapX: village.mapx,
        mapY: village.mapy,
        radius: '3000',
        contentTypeId: '39',
        numOfRows: '1',
        pageNo: '1',
      });
      restaurantCount = totalOf(json39);
    }

    testDResults.push({
      contentId: village.contentId,
      마을명: village.title,
      지역: AREA[village.areaCode] ?? village.areaCode,
      숙박: accommodationCount,
      관광지: attractionCount,
      음식점: restaurantCount,
      mapx: village.mapx,
      mapy: village.mapy,
    });
  }

  console.table(testDResults);




  const totalCandidates = candidates.length;
  const imageCount = candidates.filter((c) => c.hasImage).length;


  const accom5Count = testDResults.filter((r) => r.숙박 >= 5).length;

  const isRecommended = totalCandidates >= 3 && imageCount >= 3;
  const recommendation = isRecommended ? '마을 섹션 가능' : '불가 (후보 부족)';

  console.log('\n====================================================');
  console.log('  [최종 분석 요약]');
  console.log('====================================================');
  console.log(`- 실제 마을 단위로 쓸 수 있는 건: ${totalCandidates}개`);
  console.log(`- 그중 이미지 보유: ${imageCount}개`);
  console.log(`- 그중 주변 숙박 5곳 이상 (상위 5곳 검증): ${accom5Count}개 / ${top5Candidates.length}개`);
  console.log(`- 권장: ${recommendation}`);
  console.log(`- API 총 호출 횟수: ${calls}회`);
  console.log('====================================================');

  const reportData = {
    probedAt: new Date().toISOString(),
    apiCalls: calls,
    testA: {
      overview: testAOverview,
      rawCount: allKeywordItems.length,
    },
    testB: testBTable,
    testC: {
      candidateCount: candidates.length,
      candidates,
    },
    testD: testDResults,
    summary: {
      totalCandidates,
      imageCount,
      accom5CountInTop5: accom5Count,
      recommendation,
    },
  };

  await mkdir('data', { recursive: true });
  await writeFile('data/probe-village.json', JSON.stringify(reportData, null, 2), 'utf-8');
  console.log('\n 결과 데이터가 data/probe-village.json 에 저장되었습니다.\n');
}

main().catch((err) => {
  console.error('Probe 스크립트 실행 중 에러 발생:', err);
  process.exit(1);
});
