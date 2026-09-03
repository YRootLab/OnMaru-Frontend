export const ODII_CONCEPTS = ['sori', 'hanji', 'studio'] as const;

export type OdiiConcept = (typeof ODII_CONCEPTS)[number];

export const ODII_CONCEPT_META = {
  sori: { title: '소리로 듣는 한국', note: '장소와 지도를 따라 듣는 온마루의 대표안' },
  hanji: { title: '디지털 한지 아카이브', note: '기록지가 펼쳐지는 듯한 조용한 편집안' },
  studio: { title: '프리미엄 오디오 스튜디오', note: '사진과 재생 경험에 집중한 현대적 청음안' },
} as const;

export function isOdiiConcept(value: string): value is OdiiConcept {
  return ODII_CONCEPTS.includes(value as OdiiConcept);
}

export function getOdiiConceptMeta(concept: OdiiConcept) {
  return ODII_CONCEPT_META[concept];
}
