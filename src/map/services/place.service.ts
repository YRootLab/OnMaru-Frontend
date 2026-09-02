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

/**
 * 🌟 대한민국 전국 모든 소도시, 군(郡), 시골 읍·면 구석구석 숨어있는
 * 전통 한옥마을, 종택, 고택, 서원, 향교, 산사, 민속문화재 마스터 데이터베이스 (70+ 개소 전수 포괄)
 */
const KOREA_TRADITIONAL_HERITAGE_SEEDS: Omit<Item, 'dist'>[] = [
  // ── 1. 서울특별시 / 경기도 / 인천광역시 ──
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
    name: '창덕궁 & 후원 (비원)',
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
    name: '은평 한옥마을',
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
    name: '용인 한국민속촌 전통가옥단지',
    category: 'experience',
    lat: 37.2589,
    lng: 127.1192,
    addr: '경기 용인시 기흥구 민속촌로 90',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    tel: '031-288-0000',
  },
  {
    id: 'seed-gyeonggi-namhansan',
    name: '광주 남한산성 행궁',
    category: 'culture',
    lat: 37.4789,
    lng: 127.1852,
    addr: '경기 광주시 남한산성면 산성리 937',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '031-8008-5155',
  },
  {
    id: 'seed-incheon-ganghwa',
    name: '강화 용흥궁 & 한옥성당',
    category: 'culture',
    lat: 37.7475,
    lng: 126.488,
    addr: '인천 강화군 강화읍 동문안길21번길 16-1',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '032-930-3624',
  },

  // ── 2. 강원특별자치도 소도시 & 군(郡) (고성, 속초, 강릉, 정선, 영월, 삼척, 평창, 양양) ──
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
  {
    id: 'seed-gangwon-yangyang',
    name: '양양 낙산사 & 의상대',
    category: 'culture',
    lat: 38.125,
    lng: 128.628,
    addr: '강원 양양군 강현면 낙산사로 100',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '033-672-2447',
  },
  {
    id: 'seed-gangwon-seongyo',
    name: '강릉 선교장 (국가민속문화유산 99칸 사대부고택)',
    category: 'stay',
    lat: 37.7869,
    lng: 128.8872,
    addr: '강원 강릉시 운정길 63',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '033-648-5303',
  },
  {
    id: 'seed-gangwon-ojukheon',
    name: '강릉 오죽헌 & 몽룡실',
    category: 'culture',
    lat: 37.7792,
    lng: 128.8795,
    addr: '강원 강릉시 율곡로3139번길 24',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '033-660-3301',
  },
  {
    id: 'seed-gangwon-jeongseon',
    name: '정선 아라리촌 전통와가·너와집',
    category: 'experience',
    lat: 37.382,
    lng: 128.665,
    addr: '강원 정선군 정선읍 애산로 37',
    image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
    tel: '033-560-3435',
  },
  {
    id: 'seed-gangwon-yeongwol',
    name: '영월 장릉 & 청령포 (단종 유적)',
    category: 'culture',
    lat: 37.195,
    lng: 128.455,
    addr: '강원 영월군 영월읍 단종로 190',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '033-370-2621',
  },
  {
    id: 'seed-gangwon-samcheok',
    name: '삼척 죽서루 & 신리 너와집마을',
    category: 'spot',
    lat: 37.441,
    lng: 129.158,
    addr: '강원 삼척시 성내길 236',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '033-570-3670',
  },
  {
    id: 'seed-gangwon-pyeongchang',
    name: '평창 월정사 전나무숲 & 팔각구층석탑',
    category: 'culture',
    lat: 37.7314,
    lng: 128.5919,
    addr: '강원 평창군 진부면 오대산로 374-8',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    tel: '033-339-6800',
  },

  // ── 3. 충청남북도 소도시 & 군(郡) (아산, 공주, 부여, 논산, 예산, 서산, 보은, 괴산, 옥천, 제천, 단양) ──
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
    id: 'seed-chungnam-gongju',
    name: '공주 한옥마을 & 마곡사',
    category: 'stay',
    lat: 36.4631,
    lng: 127.112,
    addr: '충남 공주시 관광단지길 12',
    image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
    tel: '041-840-8900',
  },
  {
    id: 'seed-chungnam-baekje',
    name: '부여 백제문화단지 사비궁 & 무량사',
    category: 'culture',
    lat: 36.3175,
    lng: 126.9025,
    addr: '충남 부여군 규암면 백제문로 455',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '041-635-7740',
  },
  {
    id: 'seed-chungnam-myeongjae',
    name: '논산 명재고택 (300년 백의정승 윤증 고택)',
    category: 'stay',
    lat: 36.294,
    lng: 127.118,
    addr: '충남 논산시 노성면 노성산성길 50',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '041-735-1215',
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
  {
    id: 'seed-chungnam-yesan',
    name: '예산 추사 김정희고택 & 수덕사',
    category: 'culture',
    lat: 36.755,
    lng: 126.795,
    addr: '충남 예산군 신암면 추사고택로 261',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    tel: '041-339-8242',
  },
  {
    id: 'seed-chungnam-seosan',
    name: '서산 해미읍성 & 개심사',
    category: 'culture',
    lat: 36.7135,
    lng: 126.4835,
    addr: '충남 서산시 해미면 남문2로 143',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '041-660-2540',
  },
  {
    id: 'seed-chungbuk-seonbyung',
    name: '보은 선병국가옥 (우당고택 99칸) & 법주사',
    category: 'stay',
    lat: 36.485,
    lng: 127.725,
    addr: '충북 보은군 장안면 개안길 10-2',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '043-542-9933',
  },
  {
    id: 'seed-chungbuk-goesan',
    name: '괴산 김기응가옥 & 화양서원',
    category: 'culture',
    lat: 36.685,
    lng: 127.815,
    addr: '충북 괴산군 칠성면 칠성로 11-18',
    image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
    tel: '043-830-3433',
  },
  {
    id: 'seed-chungbuk-okcheon',
    name: '옥천 육영수생가 99칸 전통한옥',
    category: 'spot',
    lat: 36.305,
    lng: 127.585,
    addr: '충북 옥천군 옥천읍 향수길 56',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '043-730-3417',
  },
  {
    id: 'seed-chungbuk-jecheon',
    name: '제천 청풍문화재단지 한옥촌',
    category: 'experience',
    lat: 36.998,
    lng: 128.175,
    addr: '충북 제천시 청풍면 청풍호로 2048',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    tel: '043-641-5532',
  },
  {
    id: 'seed-chungbuk-danyang',
    name: '단양 온달관광지 한옥세트장 & 구인사',
    category: 'culture',
    lat: 37.055,
    lng: 128.485,
    addr: '충북 단양군 영춘면 온달로 23',
    image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
    tel: '043-423-8820',
  },

  // ── 4. 전북특별자치도 소도시 & 군(郡) (전주, 완주, 남원, 정읍, 고창, 부안, 무주, 순창, 임실, 진안) ──
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
    id: 'seed-jeonbuk-wanju',
    name: '완주 오성한옥마을 & 아원고택',
    category: 'stay',
    lat: 35.885,
    lng: 127.235,
    addr: '전북 완주군 소양면 송광수만로 516-7',
    image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
    tel: '063-241-8195',
  },
  {
    id: 'seed-jeonbuk-gwanghanru',
    name: '남원 광한루원 & 몽심재고택',
    category: 'culture',
    lat: 35.4055,
    lng: 127.3785,
    addr: '전북 남원시 요천로 1447',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '063-625-4861',
  },
  {
    id: 'seed-jeonbuk-jeongeup',
    name: '정읍 김동수가옥 (99칸 아흔아홉칸 고택) & 무성서원',
    category: 'spot',
    lat: 35.635,
    lng: 126.965,
    addr: '전북 정읍시 산외면 공동길 72-10',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '063-539-5182',
  },
  {
    id: 'seed-jeonbuk-gochang',
    name: '고창 모양성 & 신재효고택 판소리전수관',
    category: 'culture',
    lat: 35.435,
    lng: 126.705,
    addr: '전북 고창군 고창읍 모양성로 1',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    tel: '063-560-8055',
  },
  {
    id: 'seed-jeonbuk-buan',
    name: '부안 내소사 (꽃창살 대웅전) & 개암사',
    category: 'culture',
    lat: 35.618,
    lng: 126.635,
    addr: '전북 부안군 진서면 내소사로 243',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '063-583-7246',
  },
  {
    id: 'seed-jeonbuk-muju',
    name: '무주 한풍루 & 향로산 한옥마을',
    category: 'spot',
    lat: 36.005,
    lng: 127.665,
    addr: '전북 무주군 무주읍 한풍루로 326-17',
    image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
    tel: '063-324-2114',
  },
  {
    id: 'seed-jeonbuk-sunchang',
    name: '순창 전통고추장민속마을',
    category: 'experience',
    lat: 35.375,
    lng: 127.135,
    addr: '전북 순창군 순창읍 민속마을길 55',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    tel: '063-650-5411',
  },

  // ── 5. 전라남도 소도시 & 군(郡) (담양, 순천, 구례, 영암, 해남, 나주, 강진, 장흥, 보성, 영광, 장성, 완도) ──
  {
    id: 'seed-jeonnam-soswaewon',
    name: '담양 소쇄원 & 식영정·환벽당',
    category: 'culture',
    lat: 35.184,
    lng: 126.996,
    addr: '전남 담양군 가사문학면 소쇄원길 17',
    image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
    tel: '061-381-0115',
  },
  {
    id: 'seed-jeonnam-nagan',
    name: '순천 낙안읍성 초가민속마을',
    category: 'spot',
    lat: 34.9065,
    lng: 127.3375,
    addr: '전남 순천시 낙안면 충민길 30',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    tel: '061-749-8831',
  },
  {
    id: 'seed-jeonnam-gurye',
    name: '구례 운조루 고택 (타인능해 뒤주) & 쌍산재',
    category: 'stay',
    lat: 35.265,
    lng: 127.485,
    addr: '전남 구례군 토지면 운조루길 59',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '061-781-2644',
  },
  {
    id: 'seed-jeonnam-gurim',
    name: '영암 구림 전통한옥마을 & 도갑사',
    category: 'spot',
    lat: 34.755,
    lng: 126.595,
    addr: '전남 영암군 군서면 서구림리 349',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    tel: '061-470-2440',
  },
  {
    id: 'seed-jeonnam-nogudang',
    name: '해남 녹우당 (고산 윤선도 종택) & 대흥사',
    category: 'culture',
    lat: 34.55,
    lng: 126.615,
    addr: '전남 해남군 해남읍 녹우당길 135',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '061-530-5548',
  },
  {
    id: 'seed-jeonnam-gangjin',
    name: '강진 다산초당 & 영랑생가',
    category: 'culture',
    lat: 34.575,
    lng: 126.745,
    addr: '전남 강진군 도암면 다산초당길 68-15',
    image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
    tel: '061-430-3788',
  },
  {
    id: 'seed-jeonnam-boseong',
    name: '보성 강골전통마을 & 열화정',
    category: 'spot',
    lat: 34.775,
    lng: 127.185,
    addr: '전남 보성군 득량면 강골길 32-1',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '061-850-5224',
  },
  {
    id: 'seed-jeonnam-yeonggwang',
    name: '영광 매간당고택 (연안김씨 140칸 종택)',
    category: 'stay',
    lat: 35.255,
    lng: 126.515,
    addr: '전남 영광군 군남면 동간길2길 7-9',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '061-350-5224',
  },
  {
    id: 'seed-jeonnam-jangseong',
    name: '장성 필암서원 (UNESCO 세계유산)',
    category: 'culture',
    lat: 35.315,
    lng: 126.775,
    addr: '전남 장성군 황룡면 필암서원로 184',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '061-390-7224',
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
    id: 'seed-jeonnam-wando',
    name: '완도 보길도 세연정 (고산 윤선도 원림)',
    category: 'culture',
    lat: 34.145,
    lng: 126.555,
    addr: '전남 완도군 보길면 부황길 57',
    image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
    tel: '061-550-5151',
  },

  // ── 6. 경상북도 소도시 & 군(郡) (안동, 영주, 봉화, 청송, 예천, 문경, 영양, 영덕, 경주, 성주, 고령, 군위) ──
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
    name: '안동 도산서원 & 병산서원',
    category: 'culture',
    lat: 36.717,
    lng: 128.832,
    addr: '경북 안동시 도산면 도산서원길 207',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '054-840-6576',
  },
  {
    id: 'seed-gyeongbuk-bonghwa',
    name: '봉화 닭실마을 & 청암정',
    category: 'stay',
    lat: 36.892,
    lng: 128.745,
    addr: '경북 봉화군 봉화읍 충재길 44',
    image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
    tel: '054-679-6642',
  },
  {
    id: 'seed-gyeongbuk-cheongsong',
    name: '청송 송소고택 (99칸 민속문화유산)',
    category: 'stay',
    lat: 36.415,
    lng: 129.045,
    addr: '경북 청송군 파천면 송소고택길 15-2',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '054-874-6556',
  },
  {
    id: 'seed-gyeongbuk-museom',
    name: '영주 무섬마을 & 소수서원·부석사',
    category: 'spot',
    lat: 36.758,
    lng: 128.625,
    addr: '경북 영주시 문수면 무섬로 234',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '054-638-1127',
  },
  {
    id: 'seed-gyeongbuk-yecheon',
    name: '예천 금당실 전통마을 & 삼강주막',
    category: 'spot',
    lat: 36.635,
    lng: 128.385,
    addr: '경북 예천군 용문면 금당실길 54',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    tel: '054-650-6395',
  },
  {
    id: 'seed-gyeongbuk-mungyeong',
    name: '문경새재 한옥마을 & 조령원터',
    category: 'spot',
    lat: 36.765,
    lng: 128.085,
    addr: '경북 문경시 문경읍 새재로 932',
    image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
    tel: '054-571-0709',
  },
  {
    id: 'seed-gyeongbuk-yeongyang',
    name: '영양 두들마을 (장계향 여중군자 생가촌)',
    category: 'spot',
    lat: 36.565,
    lng: 129.115,
    addr: '경북 영양군 석보면 두들마을길 70',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '054-680-6412',
  },
  {
    id: 'seed-gyeongbuk-yeongdeok',
    name: '영덕 괴시리 전통한옥마을',
    category: 'spot',
    lat: 36.545,
    lng: 129.395,
    addr: '경북 영덕군 영해면 괴시리 318',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    tel: '054-730-6114',
  },
  {
    id: 'seed-gyeongbuk-yangdong',
    name: '경주 양동마을 & 교촌한옥마을',
    category: 'spot',
    lat: 35.9985,
    lng: 129.254,
    addr: '경북 경주시 강동면 양동마을길 134',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '054-762-6263',
  },
  {
    id: 'seed-gyeongbuk-seongju',
    name: '성주 한개마을 600년 돌담길',
    category: 'spot',
    lat: 35.885,
    lng: 128.295,
    addr: '경북 성주군 월항면 한개2길 8',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    tel: '054-930-6764',
  },
  {
    id: 'seed-gyeongbuk-goryeong',
    name: '고령 개실마을 (점필재 김종직 종택)',
    category: 'stay',
    lat: 35.735,
    lng: 128.325,
    addr: '경북 고령군 쌍림면 개실길 29',
    image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
    tel: '054-956-4022',
  },
  {
    id: 'seed-gyeongbuk-gunwi',
    name: '군위 한밤마을 돌담길 & 군위삼존석굴',
    category: 'spot',
    lat: 36.085,
    lng: 128.695,
    addr: '대구 군위군 부계면 대율리 482',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '054-380-6915',
  },

  // ── 7. 경상남도 소도시 & 군(郡) (산청, 함양, 하동, 거창, 합천, 밀양, 남해, 통영) ──
  {
    id: 'seed-gyeongnam-namsa',
    name: '산청 남사예담촌 (한국 가장 아름다운 마을 1호)',
    category: 'spot',
    lat: 35.295,
    lng: 127.975,
    addr: '경남 산청군 단성면 지리산대로 2897번길 10',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
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
    id: 'seed-gyeongnam-hadong',
    name: '하동 평사리 최참판댁 & 쌍계사',
    category: 'culture',
    lat: 35.155,
    lng: 127.685,
    addr: '경남 하동군 악양면 평사리길 66-7',
    image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
    tel: '055-880-2651',
  },
  {
    id: 'seed-gyeongnam-geochang',
    name: '거창 황산고가마을 & 수승대 요수정',
    category: 'spot',
    lat: 35.725,
    lng: 127.875,
    addr: '경남 거창군 위천면 황산1길 60-2',
    image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    tel: '055-940-8428',
  },
  {
    id: 'seed-gyeongnam-haein',
    name: '합천 해인사 & 묵와고가',
    category: 'culture',
    lat: 35.8,
    lng: 128.098,
    addr: '경남 합천군 가야면 해인사길 122',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '055-934-3000',
  },
  {
    id: 'seed-gyeongnam-miryang',
    name: '밀양 영남루 & 월연정·금시당',
    category: 'culture',
    lat: 35.495,
    lng: 128.755,
    addr: '경남 밀양시 중앙로 324',
    image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
    tel: '055-359-5646',
  },
  {
    id: 'seed-gyeongnam-namhae',
    name: '남해 가천 다랭이마을 & 보리암',
    category: 'spot',
    lat: 34.725,
    lng: 127.895,
    addr: '경남 남해군 남면 남면로679번길 21',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    tel: '055-863-3427',
  },
  {
    id: 'seed-gyeongnam-tongyeong',
    name: '통영 삼도수군통제영 세병관',
    category: 'culture',
    lat: 34.845,
    lng: 128.425,
    addr: '경남 통영시 세병로 27',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    tel: '055-645-3805',
  },

  // ── 8. 제주특별자치도 (서귀포시 표선/대정, 제주시 조천/한림) ──
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
    id: 'seed-jeju-daejeong',
    name: '제주 대정향교 & 추사유배지',
    category: 'culture',
    lat: 33.235,
    lng: 126.285,
    addr: '제주 서귀포시 안덕면 사계남로 251-18',
    image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
    tel: '064-794-8551',
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

/**
 * 🌟 전국 36개 세부 소도시 & 군(郡) 거점 쿼리 허브
 */
const NATIONWIDE_HUBS = [
  { lat: 37.58, lng: 126.98 }, // 1. 서울 종로/북촌
  { lat: 37.28, lng: 127.01 }, // 2. 경기 수원/용인
  { lat: 37.75, lng: 126.48 }, // 3. 인천 강화
  { lat: 38.33, lng: 128.50 }, // 4. 강원 고성/속초
  { lat: 37.79, lng: 128.89 }, // 5. 강원 강릉
  { lat: 37.38, lng: 128.66 }, // 6. 강원 정선/평창
  { lat: 37.19, lng: 128.45 }, // 7. 강원 영월/삼척
  { lat: 36.73, lng: 127.01 }, // 8. 충남 아산/천안
  { lat: 36.46, lng: 127.12 }, // 9. 충남 공주/부여
  { lat: 36.21, lng: 127.13 }, // 10. 충남 논산/금산
  { lat: 36.75, lng: 126.79 }, // 11. 충남 예산/서산/태안
  { lat: 36.48, lng: 127.72 }, // 12. 충북 보은/괴산/옥천
  { lat: 37.05, lng: 128.35 }, // 13. 충북 제천/단양
  { lat: 35.815, lng: 127.153 }, // 14. 전북 전주/완주
  { lat: 35.40, lng: 127.38 }, // 15. 전북 남원/임실/순창
  { lat: 35.43, lng: 126.70 }, // 16. 전북 고창/부안/정읍
  { lat: 36.00, lng: 127.66 }, // 17. 전북 무주/장수/진안
  { lat: 35.18, lng: 126.99 }, // 18. 전남 담양/장성
  { lat: 34.90, lng: 127.33 }, // 19. 전남 순천/여수/보성
  { lat: 35.26, lng: 127.48 }, // 20. 전남 구례/곡성/광양
  { lat: 34.75, lng: 126.59 }, // 21. 전남 영암/나주/화순
  { lat: 34.55, lng: 126.61 }, // 22. 전남 해남/강진/장흥
  { lat: 34.15, lng: 126.55 }, // 23. 전남 완도/진도/신안
  { lat: 36.54, lng: 128.52 }, // 24. 경북 안동/예천
  { lat: 36.75, lng: 128.62 }, // 25. 경북 영주/봉화/문경
  { lat: 36.41, lng: 129.04 }, // 26. 경북 청송/영양/영덕/울진
  { lat: 35.83, lng: 129.22 }, // 27. 경북 경주/포항
  { lat: 35.88, lng: 128.29 }, // 28. 경북 성주/고령/칠곡/군위
  { lat: 35.59, lng: 127.75 }, // 29. 경남 함양/거창
  { lat: 35.29, lng: 127.97 }, // 30. 경남 산청/하동
  { lat: 35.80, lng: 128.09 }, // 31. 경남 합천/의령/창녕
  { lat: 35.49, lng: 128.75 }, // 32. 경남 밀양/양산
  { lat: 34.72, lng: 127.89 }, // 33. 경남 남해/통영/거제
  { lat: 33.38, lng: 126.79 }, // 34. 제주 서귀포 표선
  { lat: 33.23, lng: 126.28 }, // 35. 제주 서귀포 대정
  { lat: 33.51, lng: 126.52 }, // 36. 제주시
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
    const radius = isNationwide ? 22000 : Math.min(MAX_RADIUS, Math.max(1000, Math.round(opts.radius)));
    const cacheKey = this.getCacheKey(opts.lat, opts.lng, opts.radius, opts.category);

    // 1. 캐시 히트 검사
    const cached = this.placeCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.items;
    }

    const signal = AbortSignal.timeout(10000);
    const out: Item[] = [];
    const seen = new Set<string>();

    // 🌟 2. 대한민국 전국 소도시 & 군(郡) 시골 전통 문화유산 시드 데이터 전수 주입
    for (const seed of KOREA_TRADITIONAL_HERITAGE_SEEDS) {
      if (!opts.category || seed.category === opts.category) {
        if (!seen.has(seed.id)) {
          seen.add(seed.id);
          const dLat = (seed.lat - opts.lat) * 111000;
          const dLng = (seed.lng - opts.lng) * 88800;
          const dist = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
          // 반경 내이거나 전국 조망일 때 포함
          if (isNationwide || dist <= opts.radius + 10000) {
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
            numOfRows: 40,
          },
          signal,
        ),
        TourApiClient.get(
          'areaBasedList2',
          {
            contentTypeId: '15',
            arrange: 'Q',
            numOfRows: 40,
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
      // 🌟 4. 일반/전체 카테고리 TourAPI 36개 소도시/군(郡) 허브 병렬 수집
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
                numOfRows: isNationwide ? 6 : 25,
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
