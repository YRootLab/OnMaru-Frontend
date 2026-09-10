/*
  필터 값 → 화면에 보일 이름.

  필터 문자열은 라벨이 아니라 데이터 값이다. `village.type`, `village.badges`와
  글자 하나까지 같아야 필터가 걸리므로, 값을 바꾸면 필터가 조용히 아무것도 못 거른다.

  그래서 값은 그대로 두고 보이는 이름만 여기서 갈아 끼운다.
  유형 바와 태그 바가 같은 것을 다르게 부르던 문제를 이 표 하나로 맞춘다.

    유형 바      태그 바   →  화면
    궁궐·누각     궁궐         궁궐
    고택·종택     고택         고택
    한옥스테이     —           고택 스테이   (스테이 섹션과 같은 이름)
*/

const FILTER_LABELS: Record<string, string> = {
  '궁궐·누각': '궁궐',
  '고택·종택': '고택',
  '한옥스테이': '고택 스테이',
};

/** 필터 값에 붙은 화면 이름. 표에 없으면 값을 그대로 쓴다. */
export function filterLabel(value: string): string {
  return FILTER_LABELS[value] ?? value;
}
