import { TourApiClient } from '@/lib/tour-api/tourApiClient';
import type { Item, PlaceCategory, PlaceDetailData } from '../types';
import { sanitizeHtml, toHttps } from '../utils/formatters';

const MAX_RADIUS = 20000;
const CACHE_TTL = 10 * 60 * 1000; // 10분

interface CacheEntry {
  expiresAt: number;
  items: Item[];
}

const CATEGORY_MAP: Record<
  PlaceCategory,
  { contentTypeId: string; keep: (cat3: string, title: string) => boolean }
> = {
  spot: { contentTypeId: '12', keep: () => true },
  experience: { contentTypeId: '28', keep: () => true },
  culture: { contentTypeId: '14', keep: () => true },
  festival: { contentTypeId: '15', keep: () => true },
  stay: { contentTypeId: '32', keep: () => true },
  food: { contentTypeId: '39', keep: (cat3) => cat3 !== 'A05020900' },
  cafe: {
    contentTypeId: '39',
    keep: (cat3, title) => cat3 === 'A05020900' || /(카페|찻집|커피|다원)/.test(title),
  },
  market: {
    contentTypeId: '38',
    keep: (cat3, title) =>
      cat3 === 'A04010100' || cat3 === 'A04010200' || title.includes('시장'),
  },
};

export const PLACE_CATEGORIES = Object.keys(CATEGORY_MAP) as PlaceCategory[];

// 🌟 대한민국 17개 광역시·도 대표 역사·전통 문화유산 & 한옥 마스터 시드 데이터 (전국 조망 보장)
const KOREA_TRADITIONAL_HERITAGE_SEEDS: Omit<Item, 'dist'>[] = [
  // ── 서울 / 경기 / 인천 ──
  {
    id: 'seed-seoul-bukchon',
    name: '북촌 한옥마을',
    category: 'spot',
    lat: 37.5826,
    lng: 126.9837,
    addr: '서울 종로구 계동길 37',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '02-2148-4158',
  },
  {
    id: 'seed-seoul-gyeongbok',
    name: '경복궁 & 근정전',
    category: 'culture',
    lat: 37.5796,
    lng: 126.977,
    addr: '서울 종로구 사직로 161',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '02-3700-3900',
  },
  {
    id: 'seed-seoul-changdeok',
    name: '창덕궁 & 후원 (UNESCO 세계유산)',
    category: 'culture',
    lat: 37.5794,
    lng: 126.991,
    addr: '서울 종로구 율곡로 99',
    image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
    tel: '02-3668-2300',
  },
  {
    id: 'seed-seoul-namsan',
    name: '남산골 한옥마을',
    category: 'spot',
    lat: 37.5592,
    lng: 126.9942,
    addr: '서울 중구 퇴계로34길 28',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '02-2261-0517',
  },
  {
    id: 'seed-seoul-eunpyeong',
    name: '은평 한옥마을 & 셋이서문학관',
    category: 'spot',
    lat: 37.6434,
    lng: 126.9388,
    addr: '서울 은평구 진관동 193-41',
    image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
    tel: '02-351-8523',
  },
  {
    id: 'seed-gyeonggi-hwaseong',
    name: '수원화성 & 화성행궁',
    category: 'culture',
    lat: 37.2825,
    lng: 127.0152,
    addr: '경기 수원시 팔달구 정조로 825',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '031-290-3600',
  },
  {
    id: 'seed-gyeonggi-folkvillage',
    name: '한국민속촌 전통한옥단지',
    category: 'experience',
    lat: 37.2589,
    lng: 127.1192,
    addr: '경기 용인시 기흥구 민속촌로 90',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    tel: '031-288-0000',
  },
  {
    id: 'seed-gyeonggi-namhansan',
    name: '남한산성 행궁 & 수어장대',
    category: 'culture',
    lat: 37.4789,
    lng: 127.1852,
    addr: '경기 광주시 남한산성면 산성리 937',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '031-8008-5155',
  },

  // ── 강원특별자치도 ──
  {
    id: 'seed-gangwon-seongyo',
    name: '강릉 선교장 (국가민속문화유산)',
    category: 'stay',
    lat: 37.7869,
    lng: 128.8872,
    addr: '강원 강릉시 운정길 63',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '033-648-5303',
  },
  {
    id: 'seed-gangwon-ojukheon',
    name: '강릉 오죽헌 & 시립박물관',
    category: 'culture',
    lat: 37.7792,
    lng: 128.8795,
    addr: '강원 강릉시 율곡로3139번길 24',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '033-660-3301',
  },
  {
    id: 'seed-gangwon-wanggok',
    name: '고성 왕곡 전통한옥마을',
    category: 'spot',
    lat: 38.3375,
    lng: 128.4975,
    addr: '강원 고성군 죽왕면 왕곡마을길 41',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    tel: '033-680-3361',
  },
  {
    id: 'seed-gangwon-sangdomun',
    name: '속초 상도문 돌담 한옥마을',
    category: 'spot',
    lat: 38.165,
    lng: 128.555,
    addr: '강원 속초시 도문동 상도문길 34',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '033-639-2690',
  },

  // ── 충청남북도 / 세종 / 대전 ──
  {
    id: 'seed-chungnam-gongju',
    name: '공주 한옥마을 & 국립공주박물관',
    category: 'stay',
    lat: 36.4631,
    lng: 127.112,
    addr: '충남 공주시 관광단지길 12',
    image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
    tel: '041-840-8900',
  },
  {
    id: 'seed-chungnam-oeam',
    name: '아산 외암민속마을',
    category: 'spot',
    lat: 36.7328,
    lng: 127.0142,
    addr: '충남 아산시 송악면 외암민속길 9번길 13-2',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    tel: '041-540-2654',
  },
  {
    id: 'seed-chungnam-baekje',
    name: '부여 백제문화단지 & 사비궁',
    category: 'culture',
    lat: 36.3175,
    lng: 126.9025,
    addr: '충남 부여군 규암면 백제문로 455',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '041-635-7740',
  },
  {
    id: 'seed-chungbuk-seonbyung',
    name: '보은 선병국 가옥 (우당고택)',
    category: 'stay',
    lat: 36.485,
    lng: 127.725,
    addr: '충북 보은군 장안면 개안길 10-2',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '043-542-9933',
  },
  {
    id: 'seed-chungnam-donam',
    name: '논산 돈암서원 (UNESCO 세계유산)',
    category: 'culture',
    lat: 36.2125,
    lng: 127.135,
    addr: '충남 논산시 연산면 임3길 26-14',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '041-736-0600',
  },

  // ── 전북 / 전남 / 광주 ──
  {
    id: 'seed-jeonbuk-jeonju',
    name: '전주 한옥마을',
    category: 'spot',
    lat: 35.815,
    lng: 127.153,
    addr: '전북 전주시 완산구 기린대로 99',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '063-281-2114',
  },
  {
    id: 'seed-jeonbuk-gyeonggijeon',
    name: '전주 경기전 & 어진박물관',
    category: 'culture',
    lat: 35.8153,
    lng: 127.1498,
    addr: '전북 전주시 완산구 태조로 44',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '063-281-2790',
  },
  {
    id: 'seed-jeonnam-nagan',
    name: '순천 낙안읍성 민속마을',
    category: 'spot',
    lat: 34.9065,
    lng: 127.3375,
    addr: '전남 순천시 낙안면 충민길 30',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    tel: '061-749-8831',
  },
  {
    id: 'seed-jeonbuk-gwanghanru',
    name: '남원 광한루원 & 완월정',
    category: 'culture',
    lat: 35.4055,
    lng: 127.3785,
    addr: '전북 남원시 요천로 1447',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '063-625-4861',
  },
  {
    id: 'seed-jeonnam-soswaewon',
    name: '담양 소쇄원 (한국전통원림)',
    category: 'culture',
    lat: 35.184,
    lng: 126.996,
    addr: '전남 담양군 가사문학면 소쇄원길 17',
    image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
    tel: '061-381-0115',
  },
  {
    id: 'seed-jeonnam-gurim',
    name: '영암 구림 전통한옥마을',
    category: 'spot',
    lat: 34.755,
    lng: 126.595,
    addr: '전남 영암군 군서면 서구림리 349',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    tel: '061-470-2440',
  },
  {
    id: 'seed-jeonnam-moksa',
    name: '나주 목사내아 금학헌',
    category: 'stay',
    lat: 35.0315,
    lng: 126.719,
    addr: '전남 나주시 금성관길 13-10',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '061-332-6565',
  },
  {
    id: 'seed-jeonnam-nogudang',
    name: '해남 녹우당 (고산 윤선도 종택)',
    category: 'culture',
    lat: 34.55,
    lng: 126.615,
    addr: '전남 해남군 해남읍 녹우당길 135',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '061-530-5548',
  },

  // ── 경북 / 경남 / 대구 / 부산 / 울산 ──
  {
    id: 'seed-gyeongbuk-hahoe',
    name: '안동 하회마을 (UNESCO 세계유산)',
    category: 'spot',
    lat: 36.5385,
    lng: 128.5195,
    addr: '경북 안동시 풍천면 하회종가길 2-1',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    tel: '054-853-0103',
  },
  {
    id: 'seed-gyeongbuk-dosan',
    name: '안동 도산서원 & 옥진각',
    category: 'culture',
    lat: 36.717,
    lng: 128.832,
    addr: '경북 안동시 도산면 도산서원길 207',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '054-840-6576',
  },
  {
    id: 'seed-gyeongbuk-byeongsan',
    name: '안동 병산서원 & 만대루',
    category: 'culture',
    lat: 36.54,
    lng: 128.562,
    addr: '경북 안동시 풍천면 병산서원길 386',
    image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
    tel: '054-858-5929',
  },
  {
    id: 'seed-gyeongbuk-yangdong',
    name: '경주 양동마을 (UNESCO 세계유산)',
    category: 'spot',
    lat: 35.9985,
    lng: 129.254,
    addr: '경북 경주시 강동면 양동마을길 134',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '054-762-6263',
  },
  {
    id: 'seed-gyeongbuk-gyochon',
    name: '경주 교촌 한옥마을 & 최부자댁',
    category: 'spot',
    lat: 35.829,
    lng: 129.214,
    addr: '경북 경주시 교촌길 39-2',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    tel: '054-760-7880',
  },
  {
    id: 'seed-gyeongbuk-bulguk',
    name: '경주 불국사 & 다보탑',
    category: 'culture',
    lat: 35.79,
    lng: 129.332,
    addr: '경북 경주시 불국로 385',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '054-746-9913',
  },
  {
    id: 'seed-gyeongbuk-museom',
    name: '영주 무섬 전통마을 & 외나무다리',
    category: 'spot',
    lat: 36.758,
    lng: 128.625,
    addr: '경북 영주시 문수면 무섬로 234',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '054-638-1127',
  },
  {
    id: 'seed-gyeongnam-namsa',
    name: '산청 남사예담촌 (한국에서 가장 아름다운 마을)',
    category: 'spot',
    lat: 35.295,
    lng: 127.975,
    addr: '경남 산청군 단성면 지리산대로 2897번길 10',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80&q=80',
    tel: '055-972-7107',
  },
  {
    id: 'seed-gyeongnam-gaepyeong',
    name: '함양 개평 한옥마을 & 일두고택',
    category: 'stay',
    lat: 35.59,
    lng: 127.755,
    addr: '경남 함양군 지곡면 개평길 59',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '055-962-7077',
  },
  {
    id: 'seed-gyeongnam-haein',
    name: '합천 해인사 & 장경판전 (팔만대장경)',
    category: 'culture',
    lat: 35.8,
    lng: 128.098,
    addr: '경남 합천군 가야면 해인사길 122',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '055-934-3000',
  },

  // ── 제주특별자치도 ──
  {
    id: 'seed-jeju-seongeup',
    name: '제주 성읍민속마을',
    category: 'spot',
    lat: 33.386,
    lng: 126.799,
    addr: '제주 서귀포시 표선면 성읍정의현로 22',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    tel: '064-710-6797',
  },
  {
    id: 'seed-jeju-mokgwana',
    name: '제주 목관아 & 관덕정',
    category: 'culture',
    lat: 33.5135,
    lng: 126.5225,
    addr: '제주 제주시 관덕로 25',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '064-710-6714',
  },
];

// 🌟 전국 16개 핵심 역사 문화유산 허브로 확장
const NATIONWIDE_HUBS = [
  { lat: 37.58, lng: 126.98 }, // 1. 서울·북촌·경복궁
  { lat: 37.28, lng: 127.01 }, // 2. 수원·화성·용인
  { lat: 37.88, lng: 127.73 }, // 3. 춘천·가평
  { lat: 37.79, lng: 128.89 }, // 4. 강릉·평창·속초
  { lat: 36.46, lng: 127.12 }, // 5. 공주·부여·아산
  { lat: 36.35, lng: 127.38 }, // 6. 대전·계룡
  { lat: 36.64, lng: 127.48 }, // 7. 청주·보은
  { lat: 35.815, lng: 127.153 }, // 8. 전주 한옥마을
  { lat: 35.41, lng: 127.38 }, // 9. 남원·지리산
  { lat: 34.95, lng: 127.48 }, // 10. 순천·여수·낙안읍성
  { lat: 35.16, lng: 126.85 }, // 11. 광주·담양
  { lat: 36.54, lng: 128.80 }, // 12. 안동 하회마을·서원
  { lat: 35.83, lng: 129.22 }, // 13. 경주 양동마을·유적
  { lat: 35.87, lng: 128.60 }, // 14. 대구·달성
  { lat: 35.22, lng: 128.68 }, // 15. 창원·진주·산청
  { lat: 33.49, lng: 126.53 }, // 16. 제주 성읍·목관아
];

export class PlaceService {
  private static placeCache = new Map<string, CacheEntry>();

  private static getCacheKey(
    lat: number,
    lng: number,
    radius: number,
    category?: PlaceCategory | null,
  ): string {
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLng = Math.round(lng * 100) / 100;
    const roundedRadius = Math.round(radius / 500) * 500;
    return `${roundedLat}_${roundedLng}_${roundedRadius}_${category || 'all'}`;
  }

  /**
   * 지도 뷰포트 기준 장소 목록 조회 (캐시 및 카테고리 필터링)
   */
  public static async getNearbyPlaces(opts: {
    lat: number;
    lng: number;
    radius: number;
    category?: PlaceCategory | null;
  }): Promise<Item[]> {
    const isNationwide = opts.radius >= 20000;
    const radius = isNationwide ? 18000 : Math.min(MAX_RADIUS, Math.max(1000, Math.round(opts.radius)));
    const cacheKey = this.getCacheKey(opts.lat, opts.lng, opts.radius, opts.category);

    // 1. 캐시 히트 검사
    const cached = this.placeCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.items;
    }

    const signal = AbortSignal.timeout(10000);
    const out: Item[] = [];
    const seen = new Set<string>();

    // 🌟 2. 대한민국 대표 문화유산 시드 데이터 우선 주입 (전국 조망 및 카테고리 일치 시 100% 보장)
    for (const seed of KOREA_TRADITIONAL_HERITAGE_SEEDS) {
      if (!opts.category || seed.category === opts.category) {
        if (!seen.has(seed.id)) {
          seen.add(seed.id);
          const dLat = (seed.lat - opts.lat) * 111000;
          const dLng = (seed.lng - opts.lng) * 88800;
          const dist = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
          // 반경 내이거나 전국 조망일 때 포함
          if (isNationwide || dist <= opts.radius + 5000) {
            out.push({ ...seed, dist });
          }
        }
      }
    }

    // 🌟 3. 축제/야행(festival) 카테고리 요청 시: TourAPI searchFestival2 및 광역 야행 병렬 수집
    if (opts.category === 'festival') {
      const yearStart = `${new Date().getFullYear() - 1}0101`;

      const festivalQueries = await Promise.allSettled([
        TourApiClient.get(
          'searchFestival2',
          {
            eventStartDate: yearStart,
            arrange: 'E',
            numOfRows: 35,
          },
          signal,
        ),
        TourApiClient.get(
          'areaBasedList2',
          {
            contentTypeId: '15',
            arrange: 'Q',
            numOfRows: 35,
          },
          signal,
        ),
      ]);

      festivalQueries.forEach((res) => {
        if (res.status !== 'fulfilled' || !res.value) return;
        const raw = res.value?.response?.body?.items?.item;
        const rows = (Array.isArray(raw) ? raw : raw ? [raw] : []) as Record<string, unknown>[];

        for (const row of rows) {
          const id = String(row.contentid);
          if (seen.has(id)) continue;
          seen.add(id);

          const title = String(row.title ?? '').trim();
          const y = Number(row.mapy);
          const x = Number(row.mapx);
          if (!title || !Number.isFinite(y) || !Number.isFinite(x)) continue;

          const dLat = (y - opts.lat) * 111000;
          const dLng = (x - opts.lng) * 88800;
          const dist = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));

          out.push({
            id,
            name: title,
            category: 'festival',
            lat: y,
            lng: x,
            addr: String(row.addr1 ?? '').trim(),
            image: toHttps(String(row.firstimage || row.firstimage2 || '')),
            tel: row.tel ? String(row.tel).trim() : null,
            dist,
          });
        }
      });
    } else {
      // 🌟 4. 일반/전체 카테고리 TourAPI 16개 허브 병렬 수집
      const queryCenters = isNationwide
        ? NATIONWIDE_HUBS
        : [{ lat: opts.lat, lng: opts.lng }];

      const contentTypes = opts.category
        ? [CATEGORY_MAP[opts.category].contentTypeId]
        : ['12', '14', '15', '28', '32', '38', '39'];

      const fetchTasks: Promise<{ cType: string; rows: Record<string, unknown>[] }>[] = [];

      for (const center of queryCenters) {
        for (const cType of contentTypes) {
          fetchTasks.push(
            TourApiClient.get(
              'locationBasedList2',
              {
                mapX: center.lng,
                mapY: center.lat,
                radius,
                contentTypeId: cType,
                arrange: 'E',
                numOfRows: isNationwide ? 10 : 25,
              },
              signal,
            )
              .then((res) => {
                const raw = res?.response?.body?.items?.item;
                const rows = (Array.isArray(raw) ? raw : raw ? [raw] : []) as Record<string, unknown>[];
                return { cType, rows };
              })
              .catch(() => ({ cType, rows: [] })),
          );
        }
      }

      const results = await Promise.allSettled(fetchTasks);

      results.forEach((res) => {
        if (res.status !== 'fulfilled' || !res.value) return;
        const { cType, rows } = res.value;

        for (const row of rows) {
          const id = String(row.contentid);
          if (seen.has(id)) continue;
          seen.add(id);

          const title = String(row.title ?? '').trim();
          const cat3 = String(row.cat3 ?? '');
          const y = Number(row.mapy);
          const x = Number(row.mapx);
          if (!title || !Number.isFinite(y) || !Number.isFinite(x)) continue;

          let category: PlaceCategory = 'spot';
          if (cType === '32') category = 'stay';
          else if (cType === '28') category = 'experience';
          else if (cType === '14') category = 'culture';
          else if (cType === '15') category = 'festival';
          else if (cType === '38') category = 'market';
          else if (cType === '39') {
            category =
              cat3 === 'A05020900' || /(카페|찻집|커피|다원)/.test(title)
                ? 'cafe'
                : 'food';
          }

          if (opts.category && category !== opts.category) continue;

          // 사용자 중심점(opts.lat, opts.lng) 기준 절대거리 재계산
          const dLat = (y - opts.lat) * 111000;
          const dLng = (x - opts.lng) * 88800;
          const dist = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));

          out.push({
            id,
            name: title,
            category,
            lat: y,
            lng: x,
            addr: String(row.addr1 ?? '').trim(),
            image: toHttps(String(row.firstimage || row.firstimage2 || '')),
            tel: row.tel ? String(row.tel).trim() : null,
            dist,
          });
        }
      });
    }

    // 4. 캐시 저장
    this.placeCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL,
      items: out,
    });

    return out;
  }

  /**
   * 장소 상세 정보 조회 (detailCommon2, detailIntro2, detailImage2 병렬 처리)
   */
  public static async getPlaceDetail(
    contentId: string,
    contentTypeId = '12',
  ): Promise<PlaceDetailData> {
    const signal = AbortSignal.timeout(10000);

    try {
      const [commonRes, introRes, imageRes] = await Promise.allSettled([
        TourApiClient.get(
          'detailCommon2',
          {
            contentId,
            defaultYN: 'Y',
            firstImageYN: 'Y',
            addrinfoYN: 'Y',
            mapinfoYN: 'Y',
            overviewYN: 'Y',
          },
          signal,
        ),
        TourApiClient.get(
          'detailIntro2',
          { contentId, contentTypeId },
          signal,
        ),
        TourApiClient.get(
          'detailImage2',
          { contentId, imageYN: 'Y', subImageYN: 'Y', numOfRows: '10' },
          signal,
        ),
      ]);

      const commonRaw =
        commonRes.status === 'fulfilled' && commonRes.value
          ? commonRes.value?.response?.body?.items?.item
          : null;
      const common = Array.isArray(commonRaw) ? commonRaw[0] : commonRaw;

      const introRawItem =
        introRes.status === 'fulfilled' && introRes.value
          ? introRes.value?.response?.body?.items?.item
          : null;
      const introRaw = Array.isArray(introRawItem) ? introRawItem[0] : introRawItem;

      const imageRaw =
        imageRes.status === 'fulfilled' && imageRes.value
          ? imageRes.value?.response?.body?.items?.item
          : null;
      const imageList = Array.isArray(imageRaw) ? imageRaw : imageRaw ? [imageRaw] : [];

      const images: string[] = [];
      const mainImg = toHttps(common?.firstimage || common?.firstimage2);
      if (mainImg) images.push(mainImg);

      for (const item of imageList) {
        const url = toHttps(item.originimgurl || item.smallimageurl);
        if (url && !images.includes(url)) images.push(url);
      }

      const intro: Record<string, string> = {};
      if (introRaw) {
        if (introRaw.usetime) intro['이용시간'] = sanitizeHtml(introRaw.usetime);
        if (introRaw.usetimeculture) intro['이용시간'] = sanitizeHtml(introRaw.usetimeculture);
        if (introRaw.restdate) intro['쉬는날'] = sanitizeHtml(introRaw.restdate);
        if (introRaw.restdateculture) intro['쉬는날'] = sanitizeHtml(introRaw.restdateculture);
        if (introRaw.parking) intro['주차시설'] = sanitizeHtml(introRaw.parking);
        if (introRaw.parkingculture) intro['주차시설'] = sanitizeHtml(introRaw.parkingculture);
        if (introRaw.usefee) intro['이용요금'] = sanitizeHtml(introRaw.usefee);
        if (introRaw.infocenter) intro['문의전화'] = sanitizeHtml(introRaw.infocenter);
        if (introRaw.infocenterculture) intro['문의전화'] = sanitizeHtml(introRaw.infocenterculture);

        if (introRaw.checkintime) intro['체크인'] = sanitizeHtml(introRaw.checkintime);
        if (introRaw.checkouttime) intro['체크아웃'] = sanitizeHtml(introRaw.checkouttime);
        if (introRaw.roomcount) intro['객실수'] = sanitizeHtml(introRaw.roomcount);
        if (introRaw.chkcooking) intro['취사여부'] = sanitizeHtml(introRaw.chkcooking);

        if (introRaw.opentimefood) intro['영업시간'] = sanitizeHtml(introRaw.opentimefood);
        if (introRaw.restdatefood) intro['쉬는날'] = sanitizeHtml(introRaw.restdatefood);
        if (introRaw.firstmenu) intro['대표메뉴'] = sanitizeHtml(introRaw.firstmenu);
        if (introRaw.treatmenu) intro['취급메뉴'] = sanitizeHtml(introRaw.treatmenu);
      }

      return {
        contentId,
        contentTypeId,
        title: common?.title ? sanitizeHtml(common.title) : '한옥 명소 상세',
        overview: common?.overview ? sanitizeHtml(common.overview) : '',
        addr1: common?.addr1 ? sanitizeHtml(common.addr1) : '',
        addr2: common?.addr2 ? sanitizeHtml(common.addr2) : '',
        tel: common?.tel ? sanitizeHtml(common.tel) : (intro['문의전화'] || null),
        images,
        mapx: Number(common?.mapx) || 0,
        mapy: Number(common?.mapy) || 0,
        intro,
        homepage: common?.homepage ? sanitizeHtml(common.homepage) : null,
      };
    } catch {
      return this.createFallbackDetail(contentId, contentTypeId);
    }
  }

  private static createFallbackDetail(
    contentId: string,
    contentTypeId: string,
  ): PlaceDetailData {
    return {
      contentId,
      contentTypeId,
      title: '한옥 명소 상세',
      overview: '한국의 전통미와 고즈넉한 정취를 품은 한옥 명소입니다.',
      addr1: '대한민국 전통 한옥 명소',
      addr2: '',
      tel: null,
      images: [],
      mapx: 0,
      mapy: 0,
      intro: { 이용시간: '상시 개방', 문의전화: '안내소 문의' },
      homepage: null,
    };
  }
}
