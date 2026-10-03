

const FILTER_LABELS: Record<string, string> = {
  '문': '성문과 누각',
  '한옥스테이': '한옥스테이',
  '서원·향교': '서원과 향교',
  '전통체험': '전통 체험',
  CULTURE_ART: '문화·예술',
  HANOK: '한옥',
  HANOK_EXPERIENCE: '한옥 체험',
  HANOK_STAY: '한옥스테이',
  HISTORIC_SITE: '역사 유적',
  LEISURE_ACTIVITY: '레저 활동',
  LOCAL_SCENE: '지역 생활',
};


export function filterLabel(value: string): string {
  return FILTER_LABELS[value] ?? value;
}
