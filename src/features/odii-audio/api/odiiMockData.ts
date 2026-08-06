import { OdiiStoryItem, ScriptLine } from '../types/odii.types';

export function parseScriptToLines(script: string, totalPlayTimeSec: number): ScriptLine[] {
  const rawLines = script.split('\n').filter((l) => l.trim().length > 0);
  if (rawLines.length === 0) return [];
  
  const step = Math.max(1, totalPlayTimeSec / rawLines.length);
  return rawLines.map((text, idx) => ({
    id: idx + 1,
    timeSec: Math.floor(idx * step),
    text: text.trim(),
  }));
}

export const MOCK_ODII_STORIES: OdiiStoryItem[] = [
  {
    tid: '1001',
    tlid: '1',
    stid: '1',
    stlid: '1',
    title: '북촌 한옥마을의 새벽',
    audioTitle: '100년 고택 대청마루에서 맞이하는 아침',
    speaker: '김한옥 수석 도슨트',
    category: '한옥/고택',
    distance: '300m',
    mapX: '126.9830',
    mapY: '37.5826',
    badgeText: '한옥도감',
    locationName: '서울 종로구 북촌 한옥길',
    likesCount: 1420,
    script: `조선시대 명망 높은 대가가 살던 북촌 고택의 조용한 아침을 엽니다.
이 고택은 100년 넘는 시간을 자리를 지켜온 한옥의 백미입니다.
처마 끝에 달린 풍경 소리가 은은하게 아침 바람에 울려 퍼집니다.
대청마루에 앉아 들어오는 따스한 볕은 마음까지 따뜻하게 만들어 줍니다.
창호지를 통해 들어오는 온화한 빛은 자연과 인간의 경계를 허뭅니다.
마당의 디딤돌을 하나씩 밟을 때마다 수많은 조상들의 발자취가 느껴집니다.
한국 전통 건축의 은은함과 고즈넉한 온기를 함께 느껴보세요.
바람이 바람개비를 돌리듯 마루 끝자락에 온기가 맴돕니다.
이제 고택의 문을 열고 옛 사람들의 숨결 속으로 들어갑니다.
온마루와 함께 떠나는 아름다운 한옥의 새벽 산책이 시작됩니다.`,
    playTime: '494',
    formattedDuration: '8:24',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
  },
  {
    tid: '1002',
    tlid: '1',
    stid: '2',
    stlid: '1',
    title: '담양 소쇄원: 바람과 물소리',
    audioTitle: '자연을 거스르지 않는 한국 전통 정원',
    speaker: '이소쇄 연구원',
    category: '정원/자연',
    distance: '1.2km',
    mapX: '127.0123',
    mapY: '35.3123',
    badgeText: '자연의 유산',
    locationName: '전남 담양군 소쇄원길',
    likesCount: 980,
    script: `담양 소쇄원은 조선 중기 정암 조광조의 제자 양산보가 지은 민간 정원입니다.
자연을 거스르지 않고 있는 그대로의 산수를 품어낸 한국 정원의 백미입니다.
계곡물이 대나무 관을 따라 흘러내리는 소리는 마음의 소음을 씻어줍니다.
광풍각 대청마루에 앉아 살랑이는 대나무 숲의 바람 소리에 귀를 기울여 보세요.
자연과 물아일체가 되는 순수한 평온함이 바로 이곳에 있습니다.
흙담과 이끼 낀 돌길 사이로 비치는 볕은 시간을 잊게 만듭니다.
조용히 소쇄원의 정취 속에서 나만의 온기를 만끽해 보세요.`,
    playTime: '902',
    formattedDuration: '15:02',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=nature-sound-relax-10905.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
  },
  {
    tid: '1003',
    tlid: '1',
    stid: '3',
    stlid: '1',
    title: '경복궁 자경전 십장생 굴뚝',
    audioTitle: '왕후의 온기와 십장생 문양의 장생 염원',
    speaker: '궁궐 해설사 이서아',
    category: '궁궐/유적',
    distance: '2.5km',
    mapX: '126.9770',
    mapY: '37.5796',
    badgeText: '보물 제810호',
    locationName: '서울 종로구 경복궁 자경전',
    likesCount: 2150,
    script: `자경전 굴뚝은 보물 제810호로 지정된 경복궁의 아름다운 꽃담 굴뚝입니다.
해, 산, 구름, 대나무, 소나무 등 불로장생을 상징하는 십장생이 조각되어 있습니다.
겨울철 아궁이에 불을 지피면 연기가 장생도를 따라 부드럽게 빠져나갔습니다.
조선 왕실 여성의 건강과 만수무강을 기원했던 정성스런 마음이 담겨있습니다.
기와와 황토벽이 만들어내는 따뜻한 체온을 온마루 오디오와 함께 들어봅니다.`,
    playTime: '520',
    formattedDuration: '8:40',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=relaxing-mountains-141316.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80',
  },
  {
    tid: '1004',
    tlid: '1',
    stid: '4',
    stlid: '1',
    title: '전주 경기전 대숲길 산책',
    audioTitle: '태조 이성계 어진을 품은 호젓한 대나무 숲',
    speaker: '박지훈 문화사학자',
    category: '도보/골목길',
    distance: '3.1km',
    mapX: '127.1498',
    mapY: '35.8150',
    badgeText: '역사의 숨결',
    locationName: '전북 전주시 완산구 경기전길',
    likesCount: 1890,
    script: `전주 경기전은 태조 이성계의 어진을 봉안하기 위해 창건되었습니다.
바람이 불 때마다 솟대와 대나무 잎이 서걱거리는 소리가 숲 전체를 울립니다.
한옥의 솟을대문을 지나면 깊은 역사 속 아침으로 시간 여행을 떠나는 듯합니다.
고즈넉한 전주 한옥마을의 전통 찻집에서 피어오르는 따스한 온기를 느껴보세요.`,
    playTime: '610',
    formattedDuration: '10:10',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_9bc5c07c1b.mp3?filename=ambient-piano-logo-165357.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=800&q=80',
  },
  {
    tid: '1005',
    tlid: '1',
    stid: '5',
    stlid: '1',
    title: '서촌 통인시장과 엽전 도시락',
    audioTitle: '조선 시전 상인의 인심이 흐르는 시장의 온기',
    speaker: '정온기 로컬 에디터',
    category: '시전/전통시장',
    distance: '1.8km',
    mapX: '126.9698',
    mapY: '37.5808',
    badgeText: '시장의 정',
    locationName: '서울 종로구 자하문로 통인시장',
    likesCount: 1320,
    script: `조선시대 육의전의 온기가 현대 시장으로 이어져 내려온 서촌 통인시장입니다.
엽전을 건네며 정겹게 건네는 덤과 따뜻한 덕담 속에 사람과 사람의 고운 정이 묻어납니다.
한옥의 처마 아래 늘어선 점포들에서 고소한 참기름 향과 훈훈한 김이 피어오릅니다.
정갈한 골목길을 거닐며 한국 시장만의 소박하고 넉넉한 인심을 오디오로 느껴보세요.`,
    playTime: '450',
    formattedDuration: '7:30',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_db65918a1e.mp3?filename=soft-piano-background-111153.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
  },
  {
    tid: '1006',
    tlid: '1',
    stid: '6',
    stlid: '1',
    title: '국립중앙박물관 사유의 방',
    audioTitle: '반가사유상의 조용한 미소와 서정적 번뇌',
    speaker: '최예술 큐레이터',
    category: '박물관/미술관',
    distance: '4.2km',
    mapX: '126.9800',
    mapY: '37.5240',
    badgeText: '국보 2종',
    locationName: '서울 용산구 국립중앙박물관',
    likesCount: 3400,
    script: `두 점의 반가사유상이 어두운 사유의 공간 속에서 깊은 묵상에 잠겨 있습니다.
오랜 세월을 뛰어넘은 은은한 미소는 보는 이의 마음에 깊은 평온을 안겨줍니다.
발끝에서부터 손가락 마디까지 흘러내리는 완벽한 금동 조형미의 극치를 감상해보세요.`,
    playTime: '580',
    formattedDuration: '9:40',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=800&q=80',
  },
  {
    tid: '1007',
    tlid: '1',
    stid: '7',
    stlid: '1',
    title: '남산골 한옥마을 천우각과 연못',
    audioTitle: '조선시대 한양 무관들의 호젓한 피서지',
    speaker: '남산 도슨트',
    category: '사람내음과 고운 정',
    distance: '2.1km',
    mapX: '126.9940',
    mapY: '37.5590',
    badgeText: '남산골 명소',
    locationName: '서울 중구 퇴계로 남산골한옥마을',
    likesCount: 1650,
    script: `남산 기슭 아래 계곡물이 흐르고 여름철 벼슬아치들이 시회를 열었던 천우각입니다.
전통 한옥 건물 5채가 보존되어 당시 한양 사람들의 삶과 온기를 느낄 수 있습니다.`,
    playTime: '420',
    formattedDuration: '7:00',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=nature-sound-relax-10905.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
  }
];
