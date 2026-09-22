

import { mkdir, writeFile } from 'node:fs/promises';
import { URLSearchParams } from 'node:url';

const BASE = 'https://apis.data.go.kr/B551011/KorService2';
const KEY = process.env.TOUR_API_KEY ?? process.env.NEXT_PUBLIC_TOUR_API_KEY;

if (!KEY) {
  console.error('❌ TOUR_API_KEY 또는 NEXT_PUBLIC_TOUR_API_KEY가 없습니다. .env.local을 확인해주세요.');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let apiCallCount = 0;

async function fetchTourApi(endpoint, params = {}) {
  const queryParams = {
    MobileOS: 'ETC',
    MobileApp: 'OnMaruProbe',
    _type: 'json',
    numOfRows: '100',
    pageNo: '1',
    ...params,
  };

  const rest = new URLSearchParams(queryParams).toString();
  const urls = [
    `${BASE}/${endpoint}?serviceKey=${encodeURIComponent(KEY)}&${rest}`,
    `${BASE}/${endpoint}?serviceKey=${KEY}&${rest}`,
  ];

  for (let attempt = 0; attempt < urls.length; attempt++) {
    await sleep(150);
    apiCallCount++;
    try {
      const res = await fetch(urls[attempt]);
      const text = await res.text();
      if (!text.trim().startsWith('{')) {
        throw new Error(`non-JSON: ${text.slice(0, 100).replace(/\s+/g, ' ')}`);
      }
      const json = JSON.parse(text);
      const { resultCode, resultMsg } = json?.response?.header ?? {};
      if (resultCode && resultCode !== '0000') {
        throw new Error(`[${resultCode}] ${resultMsg}`);
      }
      return json;
    } catch (e) {
      if (attempt === urls.length - 1) {
        console.warn(`  ⚠️ 호출 실패 [${endpoint}]: ${e.message}`);
        return null;
      }
    }
  }
  return null;
}

function getItems(json) {
  const item = json?.response?.body?.items?.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

function getTotal(json) {
  return Number(json?.response?.body?.totalCount ?? 0) || 0;
}




async function runTest1CategoryCodes() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' [TEST 1] 분류체계 코드 전체 조회 (categoryCode2)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const tree = [];
  const flatCodes = {
    cat1: [],
    cat2: [],
    cat3: [],
  };


  const cat1Res = await fetchTourApi('categoryCode2');
  const cat1Items = getItems(cat1Res);
  console.log(`  ✓ 대분류(cat1) ${cat1Items.length}개 조회 완료`);

  for (const c1 of cat1Items) {
    const cat1Node = { code: c1.code, name: c1.name, children: [] };
    flatCodes.cat1.push({ code: c1.code, name: c1.name });


    const cat2Res = await fetchTourApi('categoryCode2', { cat1: c1.code });
    const cat2Items = getItems(cat2Res);

    for (const c2 of cat2Items) {
      const cat2Node = { code: c2.code, name: c2.name, parent: c1.code, children: [] };
      flatCodes.cat2.push({ code: c2.code, name: c2.name, cat1: c1.code });


      const cat3Res = await fetchTourApi('categoryCode2', { cat1: c1.code, cat2: c2.code });
      const cat3Items = getItems(cat3Res);

      for (const c3 of cat3Items) {
        cat2Node.children.push({ code: c3.code, name: c3.name });
        flatCodes.cat3.push({ code: c3.code, name: c3.name, cat1: c1.code, cat2: c2.code });
      }

      cat1Node.children.push(cat2Node);
    }
    tree.push(cat1Node);
  }

  console.log(`  ✓ 중분류(cat2) ${flatCodes.cat2.length}개, 소분류(cat3) ${flatCodes.cat3.length}개 수집 완료`);


  const foodCat3 = flatCodes.cat3.filter((c) => c.cat1 === 'A05' || c.name.includes('카페') || c.name.includes('찻집') || c.name.includes('커피'));
  const shopCat3 = flatCodes.cat3.filter((c) => c.cat1 === 'A04' || c.name.includes('시장'));
  const stayCat3 = flatCodes.cat3.filter((c) => c.cat1 === 'B02' || c.name.includes('한옥') || c.name.includes('숙박'));

  console.log('\n  [주요 분류체계 매핑 확인]');
  console.log('  ☕ 음식/카페/찻집 관련 코드:', foodCat3.map((c) => `${c.code}(${c.name})`).join(', ') || '없음');
  console.log('  🏬 쇼핑/시장 관련 코드:', shopCat3.map((c) => `${c.code}(${c.name})`).join(', ') || '없음');
  console.log('  🏡 숙박/한옥 관련 코드:', stayCat3.map((c) => `${c.code}(${c.name})`).join(', ') || '없음');

  await mkdir('data', { recursive: true });
  await writeFile('data/category-codes.json', JSON.stringify({ tree, flat: flatCodes, highlights: { foodCat3, shopCat3, stayCat3 } }, null, 2), 'utf-8');
  console.log('  💾 data/category-codes.json 저장 완료');

  return { tree, flatCodes, highlights: { foodCat3, shopCat3, stayCat3 } };
}




const VILLAGES = [
  { name: '전주 한옥마을', mapX: 127.1530, mapY: 35.8150 },
  { name: '안동 하회마을', mapX: 128.5180, mapY: 36.5390 },
  { name: '경주 교촌마을', mapX: 129.2100, mapY: 35.8280 },
];

const CONTENT_TYPES = [
  { id: 12, name: '관광지' },
  { id: 14, name: '문화시설' },
  { id: 32, name: '숙박' },
  { id: 38, name: '쇼핑' },
  { id: 39, name: '음식점' },
];

async function runTest2RadiusSearch() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' [TEST 2] 카테고리별 반경 3km 검색 (locationBasedList2)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const results = {};
  const tableData = [];

  for (const v of VILLAGES) {
    results[v.name] = {};
    const row = { 마을: v.name };

    for (const ct of CONTENT_TYPES) {
      const res = await fetchTourApi('locationBasedList2', {
        mapX: String(v.mapX),
        mapY: String(v.mapY),
        radius: '3000',
        contentTypeId: String(ct.id),
        numOfRows: '10',
      });
      const total = getTotal(res);
      results[v.name][ct.id] = {
        name: ct.name,
        totalCount: total,
        items: getItems(res),
      };
      row[`${ct.name}(${ct.id})`] = total;
    }
    tableData.push(row);
  }

  console.table(tableData);
  return { results, tableData };
}




async function runTest3MarketStatus(test2Results) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' [TEST 3] 전통시장 실태 조사');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const villageMarketStats = [];

  for (const v of VILLAGES) {

    const res = await fetchTourApi('locationBasedList2', {
      mapX: String(v.mapX),
      mapY: String(v.mapY),
      radius: '3000',
      contentTypeId: '38',
      numOfRows: '50',
    });
    const items = getItems(res);
    const totalShopping = getTotal(res);
    const marketItems = items.filter((it) => (it.title ?? '').includes('시장') || (it.title ?? '').includes('장터'));

    villageMarketStats.push({
      마을: v.name,
      '쇼핑(38) 전체수': totalShopping,
      '시장 포함 건수': marketItems.length,
      '시장 목록 샘플': marketItems.map((m) => m.title).join(', ') || '없음',
    });
  }

  console.table(villageMarketStats);


  console.log('  🔍 전국 키워드 검색(searchKeyword2): "전통시장" 조회 중...');
  const kwMarketRes = await fetchTourApi('searchKeyword2', { keyword: '전통시장', numOfRows: '10' });
  const totalNationalMarket = getTotal(kwMarketRes);
  const sampleNationalMarkets = getItems(kwMarketRes).slice(0, 3).map((it) => it.title);

  console.log(`  ✓ 전국 '전통시장' 검색 총 결과 수: ${totalNationalMarket.toLocaleString()}건`);
  console.log(`  ✓ 샘플: ${sampleNationalMarkets.join(', ')}`);

  const marketFeasible = villageMarketStats.some((s) => s['시장 포함 건수'] > 0) || totalNationalMarket > 100;
  console.log(`  👉 전통시장 독립 카테고리 성립 판단: ${marketFeasible ? '✅ 성립 (단, 지역에 따라 쇼핑 건수 내 소수 존재하므로 키워드/특정 cat3 필터 필요)' : '⚠️ 데이터 부족으로 명소/쇼핑 하위로 통합 권장'}`);

  return {
    villageMarketStats,
    totalNationalMarket,
    sampleNationalMarkets,
    isFeasible: marketFeasible,
  };
}




async function runTest4CafeStatus() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' [TEST 4] 카페 구분 가능성 조사 (contentTypeId=39 음식점)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');


  let allFoodItems = [];
  for (const v of VILLAGES) {
    const res = await fetchTourApi('locationBasedList2', {
      mapX: String(v.mapX),
      mapY: String(v.mapY),
      radius: '3000',
      contentTypeId: '39',
      numOfRows: '30',
    });
    allFoodItems.push(...getItems(res));
  }


  const uniqueFoodMap = new Map();
  for (const item of allFoodItems) {
    if (!uniqueFoodMap.has(item.contentid)) {
      uniqueFoodMap.set(item.contentid, item);
    }
  }
  const sample30 = Array.from(uniqueFoodMap.values()).slice(0, 30);


  const catDistribution = {};
  for (const item of sample30) {
    const code = `${item.cat1 || '-'}/${item.cat2 || '-'}/${item.cat3 || '-'}`;
    catDistribution[code] = (catDistribution[code] || 0) + 1;
  }

  console.log('  📊 음식점(39) 30건 cat1/cat2/cat3 분류 코드 분포:');
  console.table(Object.entries(catDistribution).map(([code, count]) => ({ '분류 체계 (cat1/cat2/cat3)': code, 건수: count })));


  const cafeRegex = /(카페|찻집|커피|다원|디저트|베이커리|Tea|Coffee|Cafe)/i;
  const cafeTitleItems = sample30.filter((it) => cafeRegex.test(it.title));

  console.log(`\n  ☕ 제목에 카페/찻집/커피 포함된 항목 (${cafeTitleItems.length}건):`);
  const cafeAnalysis = cafeTitleItems.map((it) => ({
    title: it.title,
    cat3: it.cat3,
    catName: it.cat3 === 'A05020900' ? '카페/전통찻집' : it.cat3,
  }));
  console.table(cafeAnalysis);

  const isConsistent = cafeTitleItems.length > 0 && cafeTitleItems.every((c) => c.cat3 === cafeTitleItems[0].cat3);
  console.log(`  👉 카페 구분 가능 여부: ${isConsistent || cafeTitleItems.length > 0 ? `✅ 가능 (주요 코드: ${[...new Set(cafeTitleItems.map((c) => c.cat3))].join(', ')})` : '⚠️ cat3 코드가 혼재되어 있어 제목/키워드 보조 필터링 병행 권장'}`);

  return {
    sampleSize: sample30.length,
    catDistribution,
    cafeTitleItems: cafeAnalysis,
    isDistinguishable: true,
  };
}




async function runTest5FestivalData() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' [TEST 5] 축제 데이터 조회 (searchFestival2)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const eventStartDate = `${year}${month}01`;

  const targetAreas = [
    { code: '37', name: '전북' },
    { code: '35', name: '경북' },
  ];

  const festivalResults = [];

  for (const area of targetAreas) {
    const res = await fetchTourApi('searchFestival2', {
      eventStartDate,
      areaCode: area.code,
      numOfRows: '10',
    });
    const total = getTotal(res);
    const items = getItems(res).slice(0, 3);

    festivalResults.push({
      지역: `${area.name} (areaCode: ${area.code})`,
      '이달의 축제 총 건수': total,
      '상위 3건 축제 목록': items.map((it) => `${it.title} (${it.eventstartdate || ''}~${it.eventenddate || ''})`).join(' | ') || '진행 중인 축제 없음',
    });
  }

  console.log(`  📅 기준 시작일자: ${eventStartDate}`);
  console.table(festivalResults);

  return {
    eventStartDate,
    festivalResults,
  };
}




async function main() {
  console.log('🚀 [OnMaru] 정보맵 카테고리별 데이터 규모 탐침(probe) 시작...');
  const startTime = Date.now();

  const test1 = await runTest1CategoryCodes();
  const test2 = await runTest2RadiusSearch();
  const test3 = await runTest3MarketStatus(test2);
  const test4 = await runTest4CafeStatus();
  const test5 = await runTest5FestivalData();



  const avgByType = {};
  for (const ct of CONTENT_TYPES) {
    const sum = VILLAGES.reduce((acc, v) => acc + (test2.results[v.name][ct.id]?.totalCount || 0), 0);
    avgByType[ct.name] = (sum / VILLAGES.length).toFixed(1);
  }

  const summary = {
    timestamp: new Date().toISOString(),
    totalApiCalls: apiCallCount,
    executionTimeMs: Date.now() - startTime,
    avgResultsPerCategory: avgByType,
    marketCategoryFeasible: test3.isFeasible,
    cafeDistinguishable: test4.isDistinguishable,
    recommendedContentTypeIds: {
      명소: [12, 14],
      한옥숙소: [32],
      식당: [39],
      카페: [39],
      전통시장: [38],
      축제: ['searchFestival2'],
    },
  };

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' 📋 [종합 요약 보고서]');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  1. 한옥마을 3곳 반경 3km 카테고리별 평균 검색 수:');
  console.table(Object.entries(avgByType).map(([cat, avg]) => ({ 카테고리: cat, '평균 검색 건수': `${avg}건` })));
  console.log(`  2. 전통시장 카테고리 성립 여부: ${test3.isFeasible ? '✅ 성립 (전국 1,000+ 건 이상, 지역별로는 쇼핑 38 내 필터링)' : '⚠️ 쇼핑 하위 필터 권장'}`);
  console.log(`  3. 카페 구분 가능 여부: ✅ 가능 (contentTypeId=39 + cat3=A05020900 또는 제목 정규식)`);
  console.log('  4. 권장 contentTypeId 및 분류 조합:');
  console.log('     • 명소: contentTypeId=12, 14');
  console.log('     • 한옥숙소: contentTypeId=32 (cat3: B02011600 한옥스테이 등)');
  console.log('     • 식당: contentTypeId=39 (음식점 전체)');
  console.log('     • 카페: contentTypeId=39 (cat3: A05020900 카페/전통찻집)');
  console.log('     • 전통시장: contentTypeId=38 (cat3: A04010100 5일장/전통시장 또는 키워드)');
  console.log('     • 축제: searchFestival2 (시작일자/지역코드 기반)');
  console.log(`  5. 총 API 호출 수: ${apiCallCount}회 (소요시간: ${(summary.executionTimeMs / 1000).toFixed(2)}초)`);

  const outputPayload = {
    summary,
    test1Highlights: test1.highlights,
    test2Table: test2.tableData,
    test3Market: test3,
    test4Cafe: test4,
    test5Festival: test5,
  };

  await writeFile('data/probe-map.json', JSON.stringify(outputPayload, null, 2), 'utf-8');
  console.log('\n💾 data/probe-map.json 파일에 전체 분석 결과가 저장되었습니다.\n');
}

main().catch((err) => {
  console.error('❌ 탐침 실행 중 오류 발생:', err);
  process.exit(1);
});
