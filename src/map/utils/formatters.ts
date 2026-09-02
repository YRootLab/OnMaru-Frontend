/**
 * 문자열을 안전한 HTTPS URL로 변환합니다.
 */
export function toHttps(url?: string | null): string | null {
  const s = String(url ?? '').trim();
  if (!s) return null;
  return s.startsWith('http://') ? `https://${s.slice(7)}` : s;
}

/**
 * HTML 태그 제거 및 특수문자 디코딩 정제 유틸리티
 */
export function sanitizeHtml(raw?: string | null): string {
  if (!raw) return '';
  return raw
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * 광역 시/도 명칭을 친근하고 읽기 쉽게 축약합니다.
 * 예: 전북특별자치도 완산구 -> 전북 완산구, 대전광역시 중구 -> 대전 중구
 */
export function formatRegionAddress(r1?: string, r2?: string): string {
  if (!r1 && !r2) return '대한민국';
  let shortR1 = r1 ?? '';
  shortR1 = shortR1
    .replace(/^전북특별자치도|^전라북도/, '전북')
    .replace(/^전남특별자치도|^전라남도/, '전남')
    .replace(/^경북특별자치도|^경상북도/, '경북')
    .replace(/^경남특별자치도|^경상남도/, '경남')
    .replace(/^충북특별자치도|^충청북도/, '충북')
    .replace(/^충남특별자치도|^충청남도/, '충남')
    .replace(/^강원특별자치도|^강원도/, '강원')
    .replace(/^제주특별자치도|^제주도/, '제주')
    .replace(/^서울특별시/, '서울')
    .replace(/^부산광역시/, '부산')
    .replace(/^대구광역시/, '대구')
    .replace(/^인천광역시/, '인천')
    .replace(/^광주광역시/, '광주')
    .replace(/^대전광역시/, '대전')
    .replace(/^울산광역시/, '울산')
    .replace(/^세종특별자치시/, '세종');

  return [shortR1, r2].filter(Boolean).join(' ');
}

/**
 * 미터(m) 거리를 사용자 친화적인 포맷(m / km)으로 변환합니다.
 */
export function formatDistance(meters?: number | null): string {
  if (meters === null || meters === undefined || isNaN(meters)) return '';
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
