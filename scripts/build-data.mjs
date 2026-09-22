


import { mkdir, writeFile, readFile } from 'node:fs/promises';
import {
  searchKeyword,
  searchStay,
  detailCommon,
  detailImage,
  detailIntro,
  locationBased,
  searchFestival,
  detailPetTour,
  areaBasedList,
  CATEGORY_MAPPINGS,
  parseHanokQuery,
  getCallStats,
  itemsOf,
  totalOf,
  stripTags,
  toHttps,
} from './lib/tourapi.mjs';

const OUT_DIR = 'public/data';
const CURATION_PATH = 'data/curation.json';
const ERRORS_PATH = 'data/build-errors.json';
const FAILURE_ABORT_RATE = 0.3;

const AREA = {
  1: '서울', 2: '인천', 3: '대전', 4: '대구', 5: '광주', 6: '부산', 7: '울산', 8: '세종',
  31: '경기', 32: '강원', 33: '충북', 34: '충남', 35: '경북', 36: '경남', 37: '전북', 38: '전남', 39: '제주',
};
const METRO = ['서울', '부산', '대구', '인천', '광주', '대전', '울산'];

const ADDR_PREFIX = {
  서울특별시: '서울', 부산광역시: '부산', 대구광역시: '대구', 인천광역시: '인천',
  광주광역시: '광주', 대전광역시: '대전', 울산광역시: '울산', 세종특별자치시: '세종',
  경기도: '경기', 강원특별자치도: '강원', 강원도: '강원', 충청북도: '충북', 충청남도: '충남',
  전북특별자치도: '전북', 전라북도: '전북', 전라남도: '전남', 경상북도: '경북', 경상남도: '경남',
  제주특별자치도: '제주',
};

const VILLAGE_KEYWORDS = [
  '한옥마을', '민속마을', '전통마을', '경복궁', '창덕궁', '덕수궁',
  '고택', '종택', '서원', '향교', '돌담길', '민속촌', '한옥',
];
const HERITAGE_MATCH_WORDS = [
  '마을', '촌', '궁', '전', '재', '당', '원', '장', '택', '가',
  '정', '루', '길', '한옥', '고택', '종택', '서원', '향교', '유적',
];
const VILLAGE_ALLOWED_TYPE_IDS = ['12', '14'];
const VILLAGE_EXCLUDE_WORDS = [
  '게스트하우스', '펜션', '민박', '카페', '식당',
  '공예관', '전시관', '주차장',
];

const STAY_KEYWORDS = ['한옥', '고택', '종택', '한옥스테이'];
const STAY_EXCLUDE_WORDS = ['펜션', '모텔', '호텔', '리조트', '게스트하우스', '뷰'];

const BADGE_PRIORITY = {
  세계유산: 100, 국가지정: 95, 민속마을: 90, 시도지정: 85,
  보존마을: 82, 고택: 80, '서원·향교': 78, 기와집: 76, 초가: 75,
  조선시대: 70, 고려시대: 70, 근대건축: 68, '600년': 65,
  돌담길: 60, 전통정원: 58, 강변: 56, 산자락: 55, 바다: 54, 한옥골목: 52,
  숙박가능: 50, 전통체험: 48, 드라마촬영: 46, 한복: 45, 다도: 44, 공예: 42,
  전통음식: 40, 공연: 38, 축제: 36, 포토스팟: 35, 도심접근: 34, 주차가능: 30, 무장애: 28, 대규모: 25,
  취사가능: 68, 바베큐: 65, 반려동물: 52, 체험가능: 50, 신조성마을: 35,
};

const BADGE_RULES = [

  { badge: '세계유산',   keywords: ['세계유산', '유네스코', 'UNESCO'] },
  { badge: '국가지정',   keywords: ['국보', '보물', '사적', '명승'] },
  { badge: '민속마을',   keywords: ['중요민속문화재', '국가민속문화재', '민속마을'] },
  { badge: '시도지정',   keywords: ['시도지정', '유형문화재', '기념물'] },


  { badge: '조선시대',   keywords: ['조선', '이조'] },
  { badge: '고려시대',   keywords: ['고려'] },
  { badge: '근대건축',   keywords: ['일제강점기', '근대', '개항'] },
  { badge: '600년',     keywords: ['600년', '육백년'] },


  { badge: '고택',      keywords: ['고택', '종택', '종가'] },
  { badge: '초가',      keywords: ['초가', '초가집', '초가지붕'] },
  { badge: '기와집',    keywords: ['기와집', '와가'] },
  { badge: '서원·향교',  keywords: ['서원', '향교', '書院'] },
  { badge: '정자·누각',  keywords: ['정자', '누각', '누정'] },
  { badge: '사당',      keywords: ['사당', '재실'] },


  { badge: '돌담길',    keywords: ['돌담', '담장', '토담'] },
  { badge: '한옥골목',  keywords: ['골목', '골목길'] },
  { badge: '강변',      keywords: ['강변', '낙동강', '섬진강', '금강', '하천'] },
  { badge: '산자락',    keywords: ['산자락', '산기슭', '배산임수'] },
  { badge: '바다',      keywords: ['바다', '해변', '해안'] },
  { badge: '전통정원',  keywords: ['정원', '원림', '연못', '정원'] },


  { badge: '숙박가능',  keywords: ['숙박', '민박', '한옥스테이', '체험숙박'] },
  { badge: '전통체험',  keywords: ['체험', '체험관', '체험프로그램'] },
  { badge: '공예',      keywords: ['공예', '도자기', '한지', '옻칠', '장인'] },
  { badge: '전통음식',  keywords: ['향토음식', '한정식', '전통음식', '종가음식'] },
  { badge: '한복',      keywords: ['한복', '한복대여'] },
  { badge: '다도',      keywords: ['다도', '차문화', '전통차'] },
  { badge: '공연',      keywords: ['공연', '판소리', '국악', '풍물'] },
  { badge: '축제',      keywords: ['축제', '행사'] },


  { badge: '드라마촬영', keywords: ['드라마', '영화', '촬영지', '로케이션'] },
  { badge: '포토스팟',  keywords: ['사진', '전망', '경치', '야경'] },


  { badge: '도심접근',  keywords: ['도심', '시내', '역에서', '도보'] },
  { badge: '무장애',    keywords: ['휠체어', '무장애', '경사로'] },
  { badge: '주차가능',  keywords: ['주차장', '주차'] },


  { badge: '대규모',    keywords: ['최대', '가장 큰', '수백 채', '군락'] },
  { badge: '보존마을',  keywords: ['원형 보존', '집성촌', '동성마을'] },
];

const BRACKET_BADGE = {
  '유네스코 세계유산': '세계유산',
  세계문화유산: '세계유산',
  슬로시티: '슬로시티',
  국가민속문화재: '민속마을',
  중요민속문화재: '민속마을',
};
const MAX_BADGES = 6;





export function regionOf(areaCode, addr) {
  const byCode = AREA[Number(areaCode)];
  if (byCode) return byCode;
  const head = String(addr ?? '').trim().split(/\s+/)[0] ?? '';
  const key = Object.keys(ADDR_PREFIX).sort((a, b) => b.length - a.length).find((p) => head.startsWith(p));
  if (key) return ADDR_PREFIX[key];
  return Object.values(ADDR_PREFIX).find((r) => head.startsWith(r)) ?? '';
}

export function classifyType(region, addr, name, override) {
  if (override) return override;
  const combined = `${name} ${addr}`;
  if (combined.includes('궁') || combined.includes('궁궐')) return '궁궐 한옥';
  if (combined.includes('서원') || combined.includes('향교')) return '서원·향교';
  if (combined.includes('고택') || combined.includes('종택') || combined.includes('선교장') || combined.includes('종가')) return '사대부 고택';
  if (METRO.includes(region)) return '도심형';
  if (combined.includes('전주')) return '도심형';
  return '체험형';
}

export function parseTitle(rawTitle) {
  const title = String(rawTitle ?? '');
  const bracketBadges = [];
  for (const match of title.match(/\[([^\]]+)\]/g) ?? []) {
    const inner = match.slice(1, -1).trim();
    const mapped = BRACKET_BADGE[inner];
    if (mapped) bracketBadges.push(mapped);
    else if (inner.length > 0 && inner.length <= 10) bracketBadges.push(inner);
  }
  const name = title.replace(/\[[^\]]*\]/g, '').trim().replace(/\s+/g, ' ');
  return { name, bracketBadges };
}

export function parseBadges(text, bracketBadges = [], introInfo = {}, manualBadges = []) {
  const hits = new Set([...bracketBadges, ...manualBadges]);
  for (const { badge, keywords } of BADGE_RULES) {
    if (keywords.some((w) => text.includes(w))) hits.add(badge);
  }
  if (introInfo.chkcooking?.includes('가능') || introInfo.chkcooking?.includes('원')) hits.add('취사가능');
  if (introInfo.barbecue?.includes('가능') || introInfo.barbecue?.includes('원')) hits.add('바베큐');
  if (introInfo.parkinglodging?.includes('가능') || introInfo.parkinglodging?.includes('주차')) hits.add('주차가능');
  if (introInfo.petFriendly) hits.add('반려동물');

  const priorityOf = (b) => BADGE_PRIORITY[b] ?? 40;
  return [...hits].sort((a, b) => priorityOf(b) - priorityOf(a)).slice(0, MAX_BADGES);
}

export function toSummary(overview) {
  const text = stripTags(overview);
  if (!text) return '';
  const first = text.split(/(?<=[.!?])\s+/)[0] ?? text;
  return first.length > 60 ? `${first.slice(0, 59)}…` : first;
}


export function getDistanceKm(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}





async function loadCuration() {
  try {
    const raw = JSON.parse(await readFile(CURATION_PATH, 'utf-8'));
    return {
      excludeIds: raw.excludeIds ?? raw.exclude ?? [],
      includeIds: raw.includeIds ?? raw.include ?? [],
      villageTypes: raw.villageTypes ?? raw.types ?? {},
      aliases: raw.aliases ?? {},
      badges: raw.badges ?? {},
    };
  } catch {
    console.warn(`  · ${CURATION_PATH} 없음 → 기본 설정 사용`);
    return { excludeIds: [], includeIds: [], villageTypes: {}, aliases: {}, badges: {} };
  }
}

async function main() {
  const args = process.argv;
  const dryRun = args.includes('--dry-run');
  const withNearby = args.includes('--with-nearby');
  const villagesOnly = args.includes('--villages-only');
  const staysOnly = args.includes('--stays-only');
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : null;

  console.log('====================================================');
  console.log(`  OnMaru TourAPI 전체 데이터 파이프라인 빌드`);
  console.log(`  [설정] nearby: ${withNearby}, villagesOnly: ${villagesOnly}, staysOnly: ${staysOnly}, limit: ${limit ?? '없음'}, dryRun: ${dryRun}`);
  console.log('====================================================\n');

  const curation = await loadCuration();
  const excludedSet = new Set(curation.excludeIds.map(String));
  const errors = [];




  let villageItems = [];
  if (!staysOnly) {
    console.log('[STEP 1] 마을 키워드 수집 중...');
    const byId = new Map();

    for (const keyword of VILLAGE_KEYWORDS) {
      try {
        const json = await searchKeyword(keyword);
        const items = itemsOf(json);
        console.log(`  · '${keyword}' ${items.length}건 수신`);
        for (const item of items) {
          const typeId = String(item.contenttypeid ?? '');
          const title = String(item.title ?? '');
          if (!VILLAGE_ALLOWED_TYPE_IDS.includes(typeId)) continue;
          if (!HERITAGE_MATCH_WORDS.some((w) => title.includes(w))) continue;
          if (VILLAGE_EXCLUDE_WORDS.some((w) => title.includes(w))) continue;
          const id = String(item.contentid ?? '');
          if (id && !excludedSet.has(id)) byId.set(id, item);
        }
      } catch (err) {
        console.warn(`  ! 마을 수집 실패 ('${keyword}'): ${err.message}`);
        errors.push({ step: 'STEP 1', target: keyword, error: err.message });
      }
    }


    const categoryConfigs = [CATEGORY_MAPPINGS.PALACE, CATEGORY_MAPPINGS.HERITAGE_HOUSE, CATEGORY_MAPPINGS.VILLAGE];
    for (const cfg of categoryConfigs) {
      try {
        const json = await areaBasedList({ ...cfg, arrange: 'C', numOfRows: 50 });
        const items = itemsOf(json);
        console.log(`  · areaBasedList(cat3=${cfg.cat3}) ${items.length}건 수신`);
        for (const item of items) {
          const id = String(item.contentid ?? '');
          if (id && !excludedSet.has(id)) byId.set(id, item);
        }
      } catch (err) {
        console.warn(`  ! areaBasedList 수집 실패 (cat3=${cfg.cat3}): ${err.message}`);
      }
    }


    for (const incId of curation.includeIds.map(String)) {
      if (!excludedSet.has(incId) && !byId.has(incId)) {
        byId.set(incId, { contentid: incId, __forced: true });
      }
    }

    villageItems = [...byId.values()];
    if (limit) villageItems = villageItems.slice(0, limit);
    console.log(`  → 총 ${villageItems.length}개 마을 후보 확정\n`);
  }




  let stayItems = [];
  if (!villagesOnly) {
    console.log('[STEP 2] 한옥 숙소 수집 중...');
    const byId = new Map();


    try {
      const stayJson = await searchStay({ hanok: '1' });
      const items = itemsOf(stayJson);
      console.log(`  · searchStay(hanok=1) ${items.length}건 수신`);
      for (const item of items) {
        const id = String(item.contentid ?? '');
        if (id && !excludedSet.has(id)) byId.set(id, item);
      }
    } catch (err) {
      console.warn(`  ! searchStay 실패: ${err.message}`);
      errors.push({ step: 'STEP 2', target: 'searchStay', error: err.message });
    }


    for (const keyword of STAY_KEYWORDS) {
      try {
        const json = await searchKeyword(keyword, { contentTypeId: 32 });
        const items = itemsOf(json);
        console.log(`  · searchKeyword('${keyword}', 32) ${items.length}건 수신`);
        for (const item of items) {
          const title = String(item.title ?? '');
          if (STAY_EXCLUDE_WORDS.some((w) => title.includes(w))) continue;
          const id = String(item.contentid ?? '');
          if (id && !excludedSet.has(id)) byId.set(id, item);
        }
      } catch (err) {
        console.warn(`  ! 숙소 수집 실패 ('${keyword}'): ${err.message}`);
        errors.push({ step: 'STEP 2', target: keyword, error: err.message });
      }
    }

    stayItems = [...byId.values()];
    if (limit) stayItems = stayItems.slice(0, limit);
    console.log(`  → 총 ${stayItems.length}개 숙소 후보 확정\n`);
  }




  console.log('[STEP 3~5] 상세 보강 및 시설/반려동물 정보 처리 중...');
  let enrichFailedCount = 0;

  const processCategory = async (items, isStay = false) => {
    const list = [];
    for (const item of items) {
      const id = String(item.contentid);
      try {
        const commonJson = await detailCommon(id);
        const detail = itemsOf(commonJson)[0];
        if (!detail) {
          enrichFailedCount++;
          errors.push({ step: 'STEP 3', id, error: 'detailCommon 반환값 없음' });
          continue;
        }

        const rawTitle = String(detail.title ?? item.title ?? '').trim();
        const parsed = parseTitle(rawTitle);
        const name = curation.aliases?.[id] ?? parsed.name;
        const addr = String(detail.addr1 ?? item.addr1 ?? '').trim();
        const region = regionOf(detail.areacode ?? item.areacode, addr);
        const overview = stripTags(detail.overview);
        const lat = Number(detail.mapy ?? item.mapy);
        const lng = Number(detail.mapx ?? item.mapx);
        let image = toHttps(detail.firstimage ?? item.firstimage);
        let copyright = null;


        if (!image) {
          try {
            const imgJson = await detailImage(id);
            const imgs = itemsOf(imgJson);
            if (imgs.length > 0) {
              image = toHttps(imgs[0].originimgurl ?? imgs[0].imgname);
              copyright = {
                title: imgs[0].imgname ?? imgs[0].cpktitle ?? '',
                typeCode: imgs[0].cpyrhtTypeCd ?? '',
              };
            }
          } catch {

          }
        }


        let introInfo = {};
        if (isStay) {
          try {
            const introJson = await detailIntro(id, 32);
            const intro = itemsOf(introJson)[0] ?? {};
            introInfo = {
              checkintime: stripTags(intro.checkintime),
              checkouttime: stripTags(intro.checkouttime),
              roomcount: stripTags(intro.roomcount),
              roomtype: stripTags(intro.roomtype),
              parkinglodging: stripTags(intro.parkinglodging),
              chkcooking: stripTags(intro.chkcooking),
              barbecue: stripTags(intro.barbecue),
              pickup: stripTags(intro.pickup),
              foodplace: stripTags(intro.foodplace),
              reservationurl: stripTags(intro.reservationurl),
              scalelodging: stripTags(intro.scalelodging),
            };
          } catch {

          }
        }


        let petInfo = { petFriendly: false };
        try {
          const petJson = await detailPetTour(id);
          const pet = itemsOf(petJson)[0];
          if (pet && (pet.chkpet || pet.petinfo)) {
            petInfo = {
              petFriendly: true,
              chkpet: stripTags(pet.chkpet),
              petinfo: stripTags(pet.petinfo),
            };
          }
        } catch {

        }

        const type = isStay ? '숙소' : classifyType(region, addr, name, curation.villageTypes?.[id]);
        const manualBadges = curation.badges?.[id] ?? [];
        const badges = parseBadges(`${rawTitle} ${overview}`, parsed.bracketBadges, introInfo, manualBadges);

        list.push({
          id,
          name,
          rawTitle,
          region,
          addr,
          lat: Number.isFinite(lat) ? lat : null,
          lng: Number.isFinite(lng) ? lng : null,
          type,
          badges,
          image,
          hasImage: image.length > 0,
          copyright,
          summary: toSummary(overview),
          overview,
          ...(isStay ? { intro: introInfo } : {}),
          petInfo,
        });
      } catch (err) {
        enrichFailedCount++;
        errors.push({ step: 'STEP 3', id, error: err.message });
        console.warn(`  ! [ID ${id}] 상세 보강 실패: ${err.message}`);
      }
    }
    return list;
  };

  const processedVillages = await processCategory(villageItems, false);
  const processedStays = await processCategory(stayItems, true);

  console.log(`  → 마을 ${processedVillages.length}개 / 숙소 ${processedStays.length}개 보강 완료 (실패 ${enrichFailedCount}개)\n`);

  const totalCandidates = villageItems.length + stayItems.length;
  if (totalCandidates > 0 && enrichFailedCount / totalCandidates > FAILURE_ABORT_RATE) {
    console.error(`❌ 실패율 ${(enrichFailedCount / totalCandidates * 100).toFixed(1)}% > ${FAILURE_ABORT_RATE * 100}% 기준 초과! 중단합니다.`);
    process.exit(1);
  }




  const enrichNearby = async (item) => {
    if (!withNearby || !item.lat || !item.lng) return { stays: [], attractions: [], restaurants: [] };
    const fetchCategory = async (contentTypeId) => {
      try {
        const json = await locationBased(item.lng, item.lat, 3000, contentTypeId, { numOfRows: 6 });
        return itemsOf(json).map((loc) => ({
          id: String(loc.contentid),
          title: stripTags(loc.title),
          addr: stripTags(loc.addr1),
          image: toHttps(loc.firstimage),
          distKm: getDistanceKm(item.lat, item.lng, Number(loc.mapy), Number(loc.mapx)),
        })).sort((a, b) => a.distKm - b.distKm);
      } catch {
        return [];
      }
    };

    return {
      stays: await fetchCategory(32),
      attractions: await fetchCategory(12),
      restaurants: await fetchCategory(39),
    };
  };




  console.log('[STEP 7] 이 달의 축제 수집 중...');
  let filteredFestivals = [];
  try {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const eventStartDate = `${yyyy}${mm}01`;
    const festJson = await searchFestival(eventStartDate);
    const festivals = itemsOf(festJson);

    for (const fest of festivals) {
      const fLat = Number(fest.mapy);
      const fLng = Number(fest.mapx);
      if (!Number.isFinite(fLat) || !Number.isFinite(fLng)) continue;


      const isNearbyVillage = processedVillages.some(
        (v) => getDistanceKm(v.lat, v.lng, fLat, fLng) <= 10
      );
      if (isNearbyVillage) {
        filteredFestivals.push({
          id: String(fest.contentid),
          title: stripTags(fest.title),
          addr: stripTags(fest.addr1),
          eventStartDate: fest.eventstartdate,
          eventEndDate: fest.eventenddate,
          image: toHttps(fest.firstimage),
          lat: fLat,
          lng: fLng,
        });
      }
    }
    console.log(`  → 한옥마을 반경 10km 축제 ${filteredFestivals.length}개 필터링 완료\n`);
  } catch (err) {
    console.warn(`  ! 축제 수집 실패: ${err.message}`);
    errors.push({ step: 'STEP 7', error: err.message });
  }




  console.log('[STEP 9] 12개월 큐레이션 생성 중...');
  const pool = [...processedVillages, ...processedStays].filter(
    (item) => item.overview.length >= 150 && item.hasImage
  );

  const monthlyCurations = Array.from({ length: 12 }, (_, monthIdx) => {
    const month = monthIdx + 1;

    const selected = [];
    const usedRegions = new Set();
    let offset = (monthIdx * 3) % pool.length;

    for (let i = 0; i < pool.length && selected.length < 4; i++) {
      const candidate = pool[(offset + i) % pool.length];
      if (!usedRegions.has(candidate.region)) {
        selected.push(candidate);
        usedRegions.add(candidate.region);
      }
    }
    return {
      month,
      items: selected.map((s) => ({ id: s.id, name: s.name, region: s.region, type: s.type, image: s.image, summary: s.summary })),
    };
  });




  const stats = {
    villagesByType: processedVillages.reduce((acc, v) => ({ ...acc, [v.type]: (acc[v.type] ?? 0) + 1 }), {}),
    villagesByRegion: processedVillages.reduce((acc, v) => ({ ...acc, [v.region]: (acc[v.region] ?? 0) + 1 }), {}),
    staysByRegion: processedStays.reduce((acc, s) => ({ ...acc, [s.region]: (acc[s.region] ?? 0) + 1 }), {}),
  };

  const meta = {
    generatedAt: new Date().toISOString(),
    totalVillages: processedVillages.length,
    totalStays: processedStays.length,
    apiCalls: getCallStats(),
    errorCount: errors.length,
  };




  if (dryRun) {
    console.log('\n--dry-run 실행: 저장 과정 생략');
    console.log('메타:', JSON.stringify(meta, null, 2));
    console.log('집계 통계:', JSON.stringify(stats, null, 2));
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(`${OUT_DIR}/village`, { recursive: true });
  await mkdir(`${OUT_DIR}/stay`, { recursive: true });
  await mkdir('data', { recursive: true });

  await writeFile(`${OUT_DIR}/meta.json`, `${JSON.stringify(meta, null, 2)}\n`);
  await writeFile(`${OUT_DIR}/villages.json`, `${JSON.stringify(processedVillages, null, 2)}\n`);
  await writeFile(`${OUT_DIR}/stays.json`, `${JSON.stringify(processedStays, null, 2)}\n`);
  await writeFile(`${OUT_DIR}/summary.json`, `${JSON.stringify(stats, null, 2)}\n`);
  await writeFile(`${OUT_DIR}/monthly.json`, `${JSON.stringify(monthlyCurations, null, 2)}\n`);
  await writeFile(`${OUT_DIR}/festivals.json`, `${JSON.stringify(filteredFestivals, null, 2)}\n`);
  await writeFile(ERRORS_PATH, `${JSON.stringify(errors, null, 2)}\n`);


  console.log('개별 상세 파일(village/{id}.json, stay/{id}.json) 저장 중...');
  for (const v of processedVillages) {
    const nearby = await enrichNearby(v);
    await writeFile(`${OUT_DIR}/village/${v.id}.json`, `${JSON.stringify({ ...v, nearby }, null, 2)}\n`);
  }
  for (const s of processedStays) {
    const nearby = await enrichNearby(s);
    await writeFile(`${OUT_DIR}/stay/${s.id}.json`, `${JSON.stringify({ ...s, nearby }, null, 2)}\n`);
  }

  console.log(`\n✅ 성공적으로 ${OUT_DIR}/ 디렉토리에 데이터 생성을 완료했습니다!`);
  console.log(`  · 마을: ${meta.totalVillages}개 | 숙소: ${meta.totalStays}개 | 축제: ${filteredFestivals.length}개`);
  console.log(`  · API 총 호출수: ${meta.apiCalls.totalCalls}회`);
}





async function selfCheck() {
  const { strict: assert } = await import('node:assert');


  assert.equal(regionOf(37, ''), '전북');
  assert.equal(regionOf('', '충청남도 논산시 연산면'), '충남', 'areacode 없으면 주소 폴백');
  assert.equal(regionOf('', '강원특별자치도 철원군'), '강원', '긴 접두사 우선');
  assert.equal(regionOf('', '전북 순창군 백산리'), '전북', '축약형 주소');
  assert.equal(regionOf('', '알수없는곳 어딘가'), '');


  assert.equal(classifyType('서울', '서울특별시 종로구', '북촌한옥마을'), '도심형');
  assert.equal(classifyType('전북', '전북 전주시 완산구', '전주한옥마을'), '도심형', '전주는 예외적으로 도심형');
  assert.equal(classifyType('경남', '경상남도 함양군', '개평한옥마을'), '체험형');
  assert.equal(classifyType('경남', '경상남도 함양군', '개평한옥마을', '집성촌형'), '집성촌형', 'curation 우선');


  assert.deepEqual(parseTitle('안동 하회마을 [유네스코 세계유산]'), { name: '안동 하회마을', bracketBadges: ['세계유산'] });
  assert.deepEqual(parseTitle('전북 전주 한옥마을 [슬로시티]').bracketBadges, ['슬로시티']);
  assert.deepEqual(parseTitle('마을 [국가민속문화재]').bracketBadges, ['민속마을']);
  assert.deepEqual(parseTitle('마을 [아주아주아주기다란설명문구]').bracketBadges, [], '10자 초과는 통과 안 됨');
  assert.deepEqual(parseTitle('마을 [전통정원]').bracketBadges, ['전통정원'], '매핑 없으면 원문 통과');
  assert.equal(parseTitle('북촌한옥마을').name, '북촌한옥마을', '대괄호 없으면 그대로');
  assert.equal(parseTitle('가 [X] 나').name, '가 나', '제거 후 공백 정리');


  assert.deepEqual(parseBadges('조선시대 사적으로 지정된 고택, 돌담길'), ['국가지정', '고택', '조선시대', '돌담길']);
  assert.deepEqual(parseBadges('마을', ['세계유산']), ['세계유산'], '대괄호 유래 뱃지 병합');
  assert.deepEqual(parseBadges('유네스코 세계유산', ['세계유산']), ['세계유산'], '중복 제거');
  assert.deepEqual(parseBadges('마을', [], {}, ['신조성마을']), ['신조성마을'], 'curation.badges 수동 부여');

  assert.ok(!parseBadges('북촌은 조선시대에 조성된 양반층 주거지').includes('신조성마을'), "'조성'만으로는 신조성마을이 붙지 않는다");
  assert.equal(parseBadges('국가지정 사적 고택 조선 돌담 체험 유네스코 신축').length, MAX_BADGES, `최대 ${MAX_BADGES}개`);


  assert.ok(parseBadges('한옥', [], { chkcooking: '가능' }).includes('취사가능'));
  assert.ok(parseBadges('한옥', [], { barbecue: '가능' }).includes('바베큐'));
  assert.ok(parseBadges('한옥', [], { petFriendly: true }).includes('반려동물'));
  assert.deepEqual(parseBadges('한옥', [], { chkcooking: '불가' }), [], '불가면 안 붙음');


  assert.equal(toSummary('<b>북촌</b>은 아름답다. 두 번째 문장.'), '북촌은 아름답다.');
  assert.equal(toSummary(''), '');
  assert.equal(toSummary(`${'가'.repeat(80)}.`).length, 60, '60자 제한');


  assert.equal(Math.round(getDistanceKm(37.5665, 126.978, 35.1796, 129.0756)), 325);
  assert.equal(getDistanceKm(37.5, 127.0, 37.5, 127.0), 0, '같은 좌표는 0');
  assert.equal(getDistanceKm(null, 127.0, 37.5, 127.0), Infinity, '좌표 없으면 Infinity');


  assert.deepEqual(itemsOf({ response: { body: { items: '' } } }), [], "items가 ''로 오는 경우");
  assert.deepEqual(itemsOf({ response: { body: { items: { item: { a: 1 } } } } }), [{ a: 1 }], '단건은 배열 아님');

  console.log('self-check 통과');
}

if (process.argv.includes('--self-check')) {
  await selfCheck();
} else {
  main().catch((err) => {
    console.error('빌드 도중 중대 오류 발생:', err);
    process.exit(1);
  });
}
