

const FILTER_LABELS: Record<string, string> = {
  '문': '성문과 누각',
  '한옥스테이': '한옥 숙소',
  '서원·향교': '서원과 향교',
  '전통체험': '전통 체험',
};


export function filterLabel(value: string): string {
  return FILTER_LABELS[value] ?? value;
}
