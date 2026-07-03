# 온마루 디자인 시스템 (On-Maru Design System)

이 문서는 `src/design-system` 폴더 안에 있는 디자인 토큰과 테마 프로바이더, 그리고 공통 컴포넌트들을 **어떻게 프로젝트에서 실무적으로 사용하는지**에 대한 가이드라인입니다.

---

## 🎨 1. 컬러 토큰과 테마 사용하기 (`tokens.ts`)

`tokens.ts`는 온마루만의 색상(단청 주홍, 청화 코발트 등)을 정의하고, 라이트/다크 모드별 시맨틱(Semantic) 매핑을 제공합니다.

### ✅ 1-1. Styled Components 안에서 테마(`theme`) 값 가져다 쓰기
Emotion을 사용하면 컴포넌트 내부에서 `theme` 객체를 통해 언제든 현재 설정된 일관된 색상을 꺼내 쓸 수 있습니다.
- **장점:** 다크모드로 전환될 때 별다른 작업 없이 색상이 알아서 다크용(darkPalette, surface.dark 등)으로 전환됩니다!

```tsx
'use client';
import styled from '@emotion/styled';

// theme.colors.action.primary (단청 주홍 로직)
// theme.colors.bg.card (오프화이트 or 먹빛 카드 바탕)
const MyButton = styled.button`
  background-color: ${({ theme }) => theme.colors.action.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition: ${({ theme }) => theme.transition.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.action.primaryHover};
  }
`;

export default function ExamplePage() {
  return <MyButton>한옥 구경하기</MyButton>;
}
```

### ✅ 1-2. CSS Module (`.module.css`) 안에서 디자인 변수 쓰기
styled-components 밖인 일반 CSS 파일이나 CSS Module에서도 CSS Custom Properties(`var(--xxx)`)를 통해 똑똑하게 접근할 수 있습니다!

```css
/* my-page.module.css */
.card {
  /* 글로벌로 주입된 토큰을 사용 (globals.css 참조) */
  background-color: var(--color-bg-card);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
}

.title {
  color: var(--color-action-primary); /* 단청 주홍 포인트 컬러 */
}
```

---

## 🌓 2. 다크모드 제어하기 (`ThemeProvider.tsx`)

`OnmaruThemeProvider`는 시스템 설정(prefers-color-scheme)과 `localStorage`를 연동하여 다크/라이트 모드를 제어합니다. 컴포넌트 내에서 수동으로 이를 켜거나 끌 수 있습니다.

### ✅ 토글 버튼 만들기
`useOnmaruTheme()` 훅을 사용하여 현재 모드를 조회하고 토글할 수 있습니다.

```tsx
'use client';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';

export default function ThemeToggleButton() {
  const { mode, toggleMode, setMode } = useOnmaruTheme();

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <p>현재 테마: {mode === 'light' ? '☀️ 라이트' : '🌙 다크'}</p>

      {/* 테마 스위치 액션 */}
      <button onClick={toggleMode}>테마 전환하기</button>

      {/* 특정 모드로 고정하기 */}
      <button onClick={() => setMode('dark')}>강제 다크모드</button>
    </div>
  );
}
```

---

## 🧩 3. 공통 스타일 컴포넌트 (`components.tsx`)

미리 세팅해둔 Flex 레이아웃 래퍼나 타이포그래피 등의 스타일링 도구를 쉽게 가져다 쓸 수 있습니다.
(자주 쓰는 형태는 직접 `components.tsx`에 추가하면서 프로젝트를 키워나가면 좋습니다.)

### ✅ Box, Stack, Typography 활용 예시

```tsx
'use client';
import { Box, Stack, Text } from '@/design-system/components';

export default function CardComponent() {
  return (
    <Box 
      p={6}                  // theme.spacing[6] 만큼 패딩 적용
      bg="surface"           // theme.colors.bg.surface 배경
      borderRadius="lg"        // theme.borderRadius.lg 둥근 모서리
      boxShadow="sm"         // theme.shadow.sm 그림자 
    >
      <Stack dir="column" gap={2}>
        <Text as="h3" variant="h3" color="primary">
          경복궁 근정전
        </Text>
        <Text as="p" variant="body1" color="muted">
          조선 왕조의 으뜸 궁궐에 깃든 역사를 확인하세요.
        </Text>
      </Stack>
    </Box>
  );
}
```

---

## 📝 4. 타이포그래피 및 반응형 폰트 사이즈 (`tokens.ts`)

새롭게 추가된 기기별(Mobile / PC) 폰트 사이즈 토큰을 사용하여 반응형 디자인을 쉽게 구현할 수 있습니다. 피그마에 정의된 정확한 수치(`d1` ~ `inputField` 등)가 적용되어 있습니다.

### ✅ 타이포그래피 토큰 구조
```typescript
theme.typography.mobile.d1 // '56px'
theme.typography.pc.d1     // '92px'
// ...
theme.typography.mobile.headlineCaps // '14px'
```

### ✅ 미디어 쿼리(Media Query)를 활용한 반응형 텍스트 컴포넌트 예시
기본적으로 모바일 환경(`mobile`)을 베이스로 폰트 크기를 지정하고, 데스크탑 환경(`pc`)에서 폰트가 커지도록 분기 처리합니다.

```tsx
'use client';
import styled from '@emotion/styled';

export const ResponsiveHeadline = styled.h1`
  /* 1. 기본 폰트 크기 (모바일 기준) */
  font-size: ${({ theme }) => theme.typography.mobile.h1}; 

  /* 2. PC (Desktop) 환경 도달 시 폰트 크기 변경 */
  @media (min-width: 768px) {
    font-size: ${({ theme }) => theme.typography.pc.h1};
  }
`;
```

---

## ✨ 꿀팁 요약 (Best Practices)
1. **하드코딩 금지:** 직접 색상 번호(`#ff0000`)나 픽셀 수치(`16px`)를 적기보다는 가급적 `theme.colors`와 `theme.spacing`을 활용해 주세요!
2. **다크모드를 잊으세요:** `theme.colors.bg.card` 같은 의미론적(Semantic) 이름만 쓰면 다크모드는 `ThemeProvider`가 알아서 처리합니다. 
3. **새로운 공용 스타일이 필요할 때:** `components.tsx`에 새로운 재사용 가능 Styled Container를 추가하여 팀원과 공유해 보세요.
