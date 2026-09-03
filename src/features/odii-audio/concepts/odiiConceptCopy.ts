import type { OdiiConcept } from './odiiConcept';

type ConceptCopy = {
  thesis: string;
  support: string;
  eyebrow?: undefined;
};

export const ODII_CONCEPT_COPY: Record<OdiiConcept, ConceptCopy> = {
  sori: {
    thesis: '한국의 마음은 소리로 남습니다',
    support: '한국관광공사 오디와 온마루가 오래 기억하고 싶은 장소의 목소리를 전합니다.',
  },
  hanji: {
    thesis: '한 장의 기록을 펼쳐 듣습니다',
    support: '한국관광공사 오디의 이야기와 온마루가 고른 장면을 천천히 넘겨보세요.',
  },
  studio: {
    thesis: '장소의 결까지 선명하게 듣다',
    support: '한국관광공사 오디와 온마루가 우리 문화의 표정과 소리를 한곳에 담았습니다.',
  },
};
