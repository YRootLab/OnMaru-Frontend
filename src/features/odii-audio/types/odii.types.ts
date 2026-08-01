export interface OdiiStoryItem {
  tid: string;          // 관광지 ID (예: "1001")
  tlid: string;         // 관광지 언어 ID
  stid: string;         // 이야기 ID
  stlid: string;        // 이야기 언어 ID
  title: string;        // 관광지/스토리 대표 제목 (예: "북촌 한옥마을의 새벽")
  audioTitle: string;   // 오디오 세부 제목 (예: "The Story of the High-Family Home")
  speaker?: string;     // 해설자 / 성우 (예: "prof kim")
  category: string;     // 카테고리 태그 (예: "사람내음과 고운 정", "자연의 소리", "한옥의 미학", "역사와 서사")
  distance?: string;    // 위치 거리 (예: "300m")
  mapX: string;         // 경도
  mapY: string;         // 위도
  script: string;       // 전체 대본 (자막)
  parsedScript?: ScriptLine[]; // 시간차 싱크 대본 라인 목록
  playTime: string;     // 재생 시간 (초 단위)
  formattedDuration?: string; // 재생 시간 (예: "8:24", "15:02")
  audioUrl: string;     // 오디오 MP3 스트리밍 URL
  imageUrl: string;     // 앨범아트 / 섬네일 이미지 URL
  badgeText?: string;   // 에디토리얼 뱃지 (예: "EP.04 Narrative Audio", "고택의 비밀")
  locationName?: string; // 상세 장소명 (예: "서울 종로구 북촌로 11길")
}

export interface ScriptLine {
  id: number;
  timeSec: number;
  text: string;
}

export type OdiiCategory = '전체' | '사람내음과 고운 정' | '자연의 소리' | '한옥의 미학' | '역사와 서사';
