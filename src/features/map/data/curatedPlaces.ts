import type { PlaceDetailData } from '@/features/map/types';

export interface CuratedPlaceInfo {
  id: string;
  name: string;
  category: 'spot' | 'culture' | 'stay' | 'market';
  lat: number;
  lng: number;
  addr1: string;
  tel: string | null;
  overview: string;
  images: string[];
  intro: Record<string, string>;
}

export const CURATED_PLACES: Record<string, CuratedPlaceInfo> = {
  'dy-juknokwon': {
    id: 'dy-juknokwon',
    name: '죽녹원',
    category: 'spot',
    lat: 35.321,
    lng: 126.986,
    addr1: '전라남도 담양군 담양읍 죽녹원로 119',
    tel: '061-380-2680',
    overview:
      '담양군이 성인산 일대에 조성하여 2003년 5월 개원한 대나무 정원으로, 약 31만㎡의 공간에 울창한 대나무 숲과 가사문학의 산실인 담양의 정자 문화를 재현한 시가지가 어우러져 있습니다. 사계절 푸른 대숲 길을 걸으며 죽림욕을 즐기고 일상의 피로를 씻어낼 수 있는 힐링 명소입니다.',
    images: [
      'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '하절기(3~10월) 09:00~19:00 / 동절기(11~2월) 09:00~18:00',
      쉬는날: '연중무휴',
      주차시설: '죽녹원 정문 및 후문 주차장 완비 (무료)',
      이용요금: '일반 3,000원 / 청소년 및 군인 1,500원 / 초등학생 1,000원',
      문의전화: '061-380-2680',
    },
  },
  'dy-soswaewon': {
    id: 'dy-soswaewon',
    name: '소쇄원',
    category: 'culture',
    lat: 35.234,
    lng: 127.006,
    addr1: '전라남도 담양군 가사문학면 소쇄원길 17',
    tel: '061-381-0115',
    overview:
      '조선 중종 때 양산보가 은사인 조광조가 기묘사화로 유배되자 세속의 뜻을 버리고 고향으로 내려와 조성한 한국 전통 원림의 정수입니다. 자연의 계곡과 바위, 나무를 훼손하지 않고 정자와 조화를 이루도록 축조되어 조선 사대부 정원 건축의 백미로 꼽힙니다.',
    images: [
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '09:00~18:00 (계절별 탄력 운영)',
      쉬는날: '연중무휴',
      주차시설: '소쇄원 공영주차장 이용 가능',
      이용요금: '어른 2,000원 / 청소년 1,000원 / 어린이 700원',
      문의전화: '061-381-0115',
    },
  },
  'dy-myeongok': {
    id: 'dy-myeongok',
    name: '명옥헌원림',
    category: 'culture',
    lat: 35.26,
    lng: 126.988,
    addr1: '전라남도 담양군 고서면 후산길 103',
    tel: '061-380-3151',
    overview:
      '조선 중기 오희도가 살던 터에 아들 오이징이 정자를 짓고 연못을 파서 꾸민 원림으로, 물 흐르는 소리가 옥구슬 굴러가는 소리와 같다고 하여 명옥헌이라 불립니다. 여름철 못 주변으로 수령 수백 년 된 배롱나무 백일홍 꽃이 만개하여 붉은 꽃대궐을 이룹니다.',
    images: [
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '상시 개방',
      쉬는날: '연중무휴',
      주차시설: '마을 입구 주차공간 이용',
      이용요금: '무료 관람',
      문의전화: '061-380-3151',
    },
  },
  'sl-bukchon': {
    id: 'sl-bukchon',
    name: '북촌한옥마을',
    category: 'culture',
    lat: 37.5826,
    lng: 126.9832,
    addr1: '서울특별시 종로구 계동길 37',
    tel: '02-2148-4161',
    overview:
      '경복궁과 창덕궁, 종묘 사이에 위치한 북촌은 600년 조선 왕조의 역사와 함께해 온 서울의 대표적인 전통 한옥 주거 지역입니다. 원서동, 재동, 계동, 가회동 일대에 모여 있는 골목길과 처마선이 이루는 풍광이 고즈넉한 아름다움을 선사합니다.',
    images: [
      'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '주민 거주 지역으로 월~토 10:00~17:00 방문 권장 (일요일 골목길 쉬는 날)',
      쉬는날: '일요일 침묵의 날 방문 제한',
      주차시설: '주변 공영주차장 이용 권장 (대중교통 안국역 추천)',
      이용요금: '무료 관람 (각 체험관별 유료)',
      문의전화: '02-2148-4161',
    },
  },
  'sl-gyeongbok': {
    id: 'sl-gyeongbok',
    name: '경복궁',
    category: 'culture',
    lat: 37.5796,
    lng: 126.977,
    addr1: '서울특별시 종로구 사직로 161',
    tel: '02-3700-3900',
    overview:
      '1395년 태조 이성계에 의해 창건된 조선 왕조 제일의 법궁입니다. 백악산 아래 넓은 터에 근정전, 경회루, 향원정 등 웅장하고 유려한 전통 목조건축물이 자리하며, 사계절 한국 궁궐 건축미의 정점을 보여줍니다.',
    images: [
      'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '09:00~18:00 (계절별 변동, 입장마감 17:00)',
      쉬는날: '매주 화요일',
      주차시설: '경복궁 지하/지상 공영주차장 완비',
      이용요금: '대인(만 25세~64세) 3,000원 / 만 24세 이하 및 한복 착용자 무료',
      문의전화: '02-3700-3900',
    },
  },
  'sl-changdeok': {
    id: 'sl-changdeok',
    name: '창덕궁',
    category: 'culture',
    lat: 37.5794,
    lng: 126.991,
    addr1: '서울특별시 종로구 율곡로 99',
    tel: '02-3668-2300',
    overview:
      '자연 지형을 그대로 살려 전각을 배치한 가장 한국적인 궁궐로, 유네스코 세계문화유산에 등재되어 있습니다. 부용지, 애련지 등 비원(후원)의 수려한 전통 연못과 정자가 빼어난 조경을 자랑합니다.',
    images: [
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '09:00~18:00 (후원 관람은 사전 예약제)',
      쉬는날: '매주 월요일',
      주차시설: '인근 유료 주차장 이용',
      이용요금: '일반 3,000원 / 후원 5,000원 (한복 착용자 전각 무료)',
      문의전화: '02-3668-2300',
    },
  },
  'sl-namsangol': {
    id: 'sl-namsangol',
    name: '남산골한옥마을',
    category: 'culture',
    lat: 37.5591,
    lng: 126.994,
    addr1: '서울특별시 중구 퇴계로34길 28',
    tel: '02-2261-0517',
    overview:
      '남산 북쪽 기슭에 시내에 흩어져 있던 사대부가부터 서민 가옥까지 전통 한옥 5동을 이전 복원해 놓은 전통 정원입니다. 전통 혼례, 다도 체험 등 다양한 한옥 문화 행사가 열립니다.',
    images: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '09:00~21:00 (월요일 휴관)',
      쉬는날: '매주 월요일',
      주차시설: '인근 공영주차장 이용',
      이용요금: '무료 관람',
      문의전화: '02-2261-0517',
    },
  },
  'sl-eunpyeong': {
    id: 'sl-eunpyeong',
    name: '은평한옥마을',
    category: 'spot',
    lat: 37.6355,
    lng: 126.931,
    addr1: '서울특별시 은평구 진관동 193-37',
    tel: '02-351-8524',
    overview:
      '북한산 웅장한 바위 암벽을 병풍 삼아 조성된 현대식 전통 한옥 집단 거주 단지입니다. 한옥박물관, 삼각산금암미술관, 진관사 계곡과 연결되어 자연과 한옥이 어우러진 현대적인 정취를 만끽할 수 있습니다.',
    images: [
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '상시 개방 (주택가 에티켓 준수)',
      쉬는날: '연중무휴',
      주차시설: '은평역사한옥박물관 주차장 이용',
      이용요금: '마을 무료 관람',
      문의전화: '02-351-8524',
    },
  },
  'jj-gyeonggijeon': {
    id: 'jj-gyeonggijeon',
    name: '경기전',
    category: 'culture',
    lat: 35.8156,
    lng: 127.15,
    addr1: '전북특별자치도 전주시 완산구 태조로 44',
    tel: '063-281-2790',
    overview:
      '조선 태조 이성계의 어진을 봉안하고 제사를 지내기 위해 태종 10년(1410년)에 창건된 사적 유적지입니다. 아름드리 대나무 숲길과 수백 년 묵은 은행나무, 조경묘, 전주사고 등이 울창한 숲과 함께 어우러져 있습니다.',
    images: [
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '09:00~19:00 (동절기 18:00)',
      쉬는날: '연중무휴',
      주차시설: '전주한옥마을 공영주차장 이용',
      이용요금: '어른 3,000원 / 청소년 2,000원 / 어린이 1,000원',
      문의전화: '063-281-2790',
    },
  },
  'jj-omokdae': {
    id: 'jj-omokdae',
    name: '오목대',
    category: 'culture',
    lat: 35.8163,
    lng: 127.1533,
    addr1: '전북특별자치도 전주시 완산구 기린대로 55',
    tel: '063-281-2114',
    overview:
      '고려 우왕 6년(1380년) 이성계가 황산에서 왜구를 토벌하고 귀경하는 길에 승전을 자축하는 연회를 베풀었던 유서 깊은 언덕입니다. 누각에 오르면 전주한옥마을의 흑기와 물결이 한눈에 파노라마로 펼쳐집니다.',
    images: [
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '상시 개방 (야경 명소)',
      쉬는날: '연중무휴',
      주차시설: '한옥마을 공영주차장 이용',
      이용요금: '무료 관람',
      문의전화: '063-281-2114',
    },
  },
  'jj-hyanggyo': {
    id: 'jj-hyanggyo',
    name: '전주향교',
    category: 'culture',
    lat: 35.8135,
    lng: 127.156,
    addr1: '전북특별자치도 전주시 완산구 향교길 139',
    tel: '063-288-4544',
    overview:
      '조선 시대 지방 교육기관으로, 대성전을 비롯해 명륜당 등 고풍스러운 한옥 전각과 400년 된 거대한 은행나무 보호수가 장관을 이루는 유학의 본산입니다.',
    images: [
      'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '09:00~18:00',
      쉬는날: '매주 월요일',
      주차시설: '주변 공영주차장 이용',
      이용요금: '무료 관람',
      문의전화: '063-288-4544',
    },
  },
  'jj-nambu': {
    id: 'jj-nambu',
    name: '전주 남부시장',
    category: 'market',
    lat: 35.8117,
    lng: 127.144,
    addr1: '전북특별자치도 전주시 완산구 풍남문1길 19-3',
    tel: '063-284-1344',
    overview:
      '조선 시대 3대 시장 중 하나였던 유서 깊은 전통시장으로, 전주 콩나물국밥, 피순대 등 향토 미식과 청년몰의 개성 넘치는 공방, 주말 야시장의 열기가 가득합니다.',
    images: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '09:00~21:00 (금·토 야시장 18:00~23:00)',
      쉬는날: '점포별 상이',
      주차시설: '남부시장 천변공영주차장',
      이용요금: '무료',
      문의전화: '063-284-1344',
    },
  },
  'ad-hahoe': {
    id: 'ad-hahoe',
    name: '안동 하회마을',
    category: 'culture',
    lat: 36.5391,
    lng: 128.5175,
    addr1: '경상북도 안동시 풍천면 하회종가길 2-1',
    tel: '054-853-0103',
    overview:
      '풍산 류씨가 600여 년간 대대로 살아온 한국의 대표적인 동성 집성촌으로, 낙동강 물줄기가 마을을 S자로 감싸 안고 흐르는 물돌이동입니다. 양진당, 충효당 등 조선 사대부 가옥과 서민의 초가가 잘 보존되어 유네스코 세계문화유산에 등재되었습니다.',
    images: [
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '하절기 09:00~18:00 / 동절기 09:00~17:00',
      쉬는날: '연중무휴',
      주차시설: '하회마을 종합안내소 대형 주차장 완비',
      이용요금: '어른 5,000원 / 청소년 2,500원 / 어린이 1,500원',
      문의전화: '054-853-0103',
    },
  },
  'ad-byeongsan': {
    id: 'ad-byeongsan',
    name: '병산서원',
    category: 'culture',
    lat: 36.5306,
    lng: 128.475,
    addr1: '경상북도 안동시 풍천면 병산길 386',
    tel: '054-858-5929',
    overview:
      '서애 류성룡의 학문과 덕행을 추모하기 위해 창건된 서원으로, 한국 서원 건축의 백미인 만대루에서 바라보는 낙동강과 병풍 같은 절벽의 절경이 일품입니다.',
    images: [
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '09:00~18:00 (동절기 17:00)',
      쉬는날: '연중무휴',
      주차시설: '서원 앞 무료 주차장 완비',
      이용요금: '무료 관람',
      문의전화: '054-858-5929',
    },
  },
  'ad-imcheonggak': {
    id: 'ad-imcheonggak',
    name: '임청각',
    category: 'culture',
    lat: 36.5729,
    lng: 128.7378,
    addr1: '경상북도 안동시 임청각길 63',
    tel: '054-853-3455',
    overview:
      '대한민국 임시정부 초대 국무령을 지낸 석주 이상룡 선생의 생가이자 보물로 지정된 99칸 대저택입니다. 3대에 걸쳐 독립운동에 헌신한 유서 깊은 민족 독립의 성지입니다.',
    images: [
      'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '09:30~17:30',
      쉬는날: '연중무휴',
      주차시설: '인근 주차장 이용 가능',
      이용요금: '무료 관람',
      문의전화: '054-853-3455',
    },
  },
  'ad-dosan': {
    id: 'ad-dosan',
    name: '도산서원',
    category: 'culture',
    lat: 36.7276,
    lng: 128.8425,
    addr1: '경상북도 안동시 도산면 도산서원길 207',
    tel: '054-840-6599',
    overview:
      '퇴계 이황 선생이 도산서당을 짓고 유생을 가르치던 곳으로, 퇴계 서거 후 문인들이 서원을 건립하였습니다. 안동호 맑은 물과 어우러져 조선 선비 정신의 담백하고 기품 있는 미학을 보여줍니다.',
    images: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '09:00~18:00 (동절기 17:00)',
      쉬는날: '연중무휴',
      주차시설: '도산서원 공영주차장 이용',
      이용요금: '어른 2,000원 / 청소년 1,000원',
      문의전화: '054-840-6599',
    },
  },
  'gj-gyochon': {
    id: 'gj-gyochon',
    name: '경주 교촌마을',
    category: 'culture',
    lat: 35.832,
    lng: 129.216,
    addr1: '경상북도 경주시 교촌길 39-2',
    tel: '054-760-7880',
    overview:
      '신라 국학부터 조선 향교로 이어지는 교육의 산실이자 12대 300년 동안 부를 베풀며 덕을 쌓은 경주 최부자 고택이 자리한 전통 한옥마을입니다. 월정교와 이어져 신라와 조선의 역사를 잇습니다.',
    images: [
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '09:00~18:00',
      쉬는날: '연중무휴',
      주차시설: '월정교 앞 공영주차장 이용 (무료)',
      이용요금: '마을 무료 관람',
      문의전화: '054-760-7880',
    },
  },
  'gj-choebuja': {
    id: 'gj-choebuja',
    name: '경주 최부자댁',
    category: 'culture',
    lat: 35.8317,
    lng: 129.2166,
    addr1: '경상북도 경주시 교촌안길 19-21',
    tel: '054-772-9988',
    overview:
      '‘과객을 후하게 대접하라’, ‘사방 백리 안에 굶어 죽는 사람이 없게 하라’는 가훈을 지키며 노블레스 오블리주를 실천한 경주 최씨 종택입니다. 장독대와 널찍한 곳간, 사랑채가 온전히 보존되어 있습니다.',
    images: [
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '09:30~17:00',
      쉬는날: '매월 마지막 주 월요일',
      주차시설: '교촌마을 공영주차장 이용',
      이용요금: '무료 관람',
      문의전화: '054-772-9988',
    },
  },
  'gn-seongyojang': {
    id: 'gn-seongyojang',
    name: '강릉 선교장',
    category: 'culture',
    lat: 37.786,
    lng: 128.885,
    addr1: '강원특별자치도 강릉시 운정길 63',
    tel: '033-648-5303',
    overview:
      '조선 후기 전형적인 사대부가의 99칸 대저택으로, 300년 동안 원형이 잘 보존된 국가민속문화재입니다. 연못 위에 세워진 정자 활래정과 솟을대문 열화당에서 기품 있는 조선 선비의 풍류와 온기를 느낄 수 있습니다.',
    images: [
      'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '하절기 09:00~18:00 / 동절기 09:00~17:00',
      쉬는날: '연중무휴',
      주차시설: '선교장 전용 주차장 완비 (무료)',
      이용요금: '어른 5,000원 / 청소년 3,000원 / 어린이 2,000원',
      문의전화: '033-648-5303',
    },
  },
  'gn-ojukheon': {
    id: 'gn-ojukheon',
    name: '강릉 오죽헌',
    category: 'culture',
    lat: 37.779,
    lng: 128.878,
    addr1: '강원특별자치도 강릉시 율곡로3139번길 24',
    tel: '033-660-3301',
    overview:
      '신사임당과 율곡 이이가 태어난 곳으로, 한국 주택 건축물 중에서 가장 오래된 건축물 중 하나로 꼽히는 보물입니다. 뒤뜰에 줄기가 까마귀처럼 검은 검은대나무(오죽)가 숲을 이루고 있어 오죽헌이라 불립니다.',
    images: [
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '09:00~18:00 (입장마감 17:00)',
      쉬는날: '연중무휴',
      주차시설: '오죽헌 공영주차장 이용 (무료)',
      이용요금: '어른 3,000원 / 청소년 2,000원 / 어린이 1,000원',
      문의전화: '033-660-3301',
    },
  },
  'as-oeam': {
    id: 'as-oeam',
    name: '아산 외암민속마을',
    category: 'culture',
    lat: 36.736,
    lng: 126.935,
    addr1: '충청남도 아산시 송악면 외암민속길 9번길 13-2',
    tel: '041-541-0848',
    overview:
      '예안 이씨 정착촌으로 약 500년 전 형성된 고즈넉한 전통마을입니다. 돌담길을 따라 초가지붕과 기와집이 정겹게 어우러져 실제 주민들이 농사를 지으며 전통 생활 양식을 이어오고 있습니다.',
    images: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '하절기 09:00~18:00 / 동절기 09:00~17:00',
      쉬는날: '연중무휴',
      주차시설: '외암마을 공영주차장 무료 이용',
      이용요금: '어른 2,000원 / 청소년 1,000원',
      문의전화: '041-541-0848',
    },
  },
  'ns-myeongjae': {
    id: 'ns-myeongjae',
    name: '논산 명재고택',
    category: 'culture',
    lat: 36.205,
    lng: 127.09,
    addr1: '충청남도 논산시 노성면 노성산성길 50',
    tel: '041-735-1215',
    overview:
      '조선 숙종 때 소론의 영수 명재 윤증 선생의 고택으로, 사랑채와 안채, 사당이 자연 지형과 과학적인 통풍 구조를 완벽히 살린 18세기 한옥 건축의 교과서입니다. 수백 개의 장독대와 거대한 배롱나무가 한 폭의 그림을 연출합니다.',
    images: [
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '하절기 10:00~17:00 / 동절기 10:00~16:00',
      쉬는날: '매주 월요일',
      주차시설: '고택 앞 무료 주차장 완비',
      이용요금: '무료 관람',
      문의전화: '041-735-1215',
    },
  },
  'sc-nagan': {
    id: 'sc-nagan',
    name: '순천 낙안읍성',
    category: 'culture',
    lat: 34.907,
    lng: 127.34,
    addr1: '전라남도 순천시 낙안면 충민길 30',
    tel: '061-749-8831',
    overview:
      '조선 시대 읍성의 원형이 고스란히 남아 있는 대한민국 대표 전통 마을입니다. 성곽을 따라 걷다 보면 소담스러운 초가집들이 옹기종기 모여 있는 풍경을 마주하게 되며, 지금도 주민들이 실제로 거주하고 있습니다.',
    images: [
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '09:00~18:00 (계절별 변동)',
      쉬는날: '연중무휴',
      주차시설: '낙안읍성 공영주차장 이용 (무료)',
      이용요금: '어른 4,000원 / 청소년 2,500원 / 어린이 1,500원',
      문의전화: '061-749-8831',
    },
  },
  'jj-seongeup': {
    id: 'jj-seongeup',
    name: '제주 성읍민속마을',
    category: 'culture',
    lat: 33.386,
    lng: 126.802,
    addr1: '제주특별자치도 서귀포시 표선면 성읍정의현로 22',
    tel: '064-710-6797',
    overview:
      '조선 시대 정의현의 도읍지였던 곳으로, 현무암 돌담과 제주 고유의 초가지붕, 팽나무 고목이 육지의 한옥과는 또 다른 제주 전통 주거 문화의 깊이를 전해줍니다.',
    images: [
      'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1200&q=80',
    ],
    intro: {
      이용시간: '상시 개방',
      쉬는날: '연중무휴',
      주차시설: '성읍민속마을 공영주차장 완비 (무료)',
      이용요금: '무료 관람',
      문의전화: '064-710-6797',
    },
  },
};

/** placeId 또는 placeName으로 큐레이션된 명소 데이터 검색 */
export function getCuratedPlace(placeId: string, placeName?: string): CuratedPlaceInfo | null {
  if (CURATED_PLACES[placeId]) return CURATED_PLACES[placeId];

  // 이름 기반 매칭 검색
  const targetName = (placeName || placeId).trim();
  for (const place of Object.values(CURATED_PLACES)) {
    if (
      place.id === placeId ||
      place.name === targetName ||
      place.name.includes(targetName) ||
      targetName.includes(place.name)
    ) {
      return place;
    }
  }

  return null;
}

/** 큐레이션 데이터를 PlaceDetailData 형태로 변환 */
export function toPlaceDetailData(info: CuratedPlaceInfo): PlaceDetailData {
  return {
    contentId: info.id,
    contentTypeId: '12',
    title: info.name,
    overview: info.overview,
    addr1: info.addr1,
    addr2: '',
    tel: info.tel,
    images: info.images,
    mapx: info.lng,
    mapy: info.lat,
    intro: info.intro,
    homepage: null,
  };
}
