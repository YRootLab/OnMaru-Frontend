


export function toHttps(url?: string | null): string | null {
  const s = String(url ?? '').trim();
  if (!s) return null;
  return s.startsWith('http://') ? `https://${s.slice(7)}` : s;
}




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




export function formatDistance(meters?: number | null): string {
  if (meters === null || meters === undefined || isNaN(meters)) return '';
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}








export function escapeHtml(raw?: string | null): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


export function safeImageUrl(url?: string | null): string {
  const s = String(url ?? '').trim();
  if (!/^https?:\/\//i.test(s)) return '';
  return escapeHtml(s);
}





export function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const time = date.getTime();
  if (isNaN(time)) return '';

  const diffMs = Date.now() - time;
  if (diffMs < 0) return '방금 전';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}주 전`;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}
