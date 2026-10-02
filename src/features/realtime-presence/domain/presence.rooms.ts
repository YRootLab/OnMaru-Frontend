// 형식 규칙: 소문자·숫자·언더스코어·하이픈, 최대 64자
// 백엔드는 이 형식 규칙 + 방 개수 상한으로 검증한다 (프론트에 허용 목록 없음)
const ROOM_ID_MAX_LEN = 64;

/** 한옥 목록 전체 페이지 roomId */
export const ROOM_ID_HANOK_ARCHIVE = 'hanok_archive';

/**
 * 한옥 개별 ID → presence roomId 변환.
 * 모든 roomId는 이 함수 한 곳에서만 생성한다.
 */
export function getHanokRoomId(hanokId: string): string {
  return `hanok_${hanokId}`
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, ROOM_ID_MAX_LEN);
}
