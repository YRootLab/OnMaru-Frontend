# FE 로컬·스테이징·운영 환경 안내

온마루 FE는 API 기준 주소로 `NEXT_PUBLIC_API_URL` 하나만 사용한다. 네트워크 호출마다 개발·스테이징·운영 분기를 추가하지 않는다.

## 환경 구성

| FE 실행 환경 | API 환경 | `NEXT_PUBLIC_API_URL` |
| --- | --- | --- |
| 개발자 로컬 | AWS 스테이징 | `https://staging-api.onmaru.site` |
| Vercel Production | AWS 운영 | `https://api.onmaru.site` |

Vercel Preview는 현재 필수 개발 절차에 포함하지 않는다.

## 로컬 최초 설정

OnMaruFE 루트의 `.env.local`에 다음 값을 설정한다.

```dotenv
NEXT_PUBLIC_API_URL=https://staging-api.onmaru.site
```

`.env.local`은 Git에 커밋하지 않는다. 지도용 `NEXT_PUBLIC_KAKAO_MAP_KEY` 등 기존 기능에 필요한 값은 그대로 유지한다.

다음 이전 API 주소 키가 로컬 파일에 남아 있다면 삭제한다.

```text
NEXT_PUBLIC_API_BASE_URL
NEXT_PUBLIC_API_URL_INTERNAL
STAGING_API_BASE_URL
```

## 스테이징 서버 실행

최초 한 번 개인 SSH 키를 생성한다.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/onmaru-staging -C 'onmaru-staging-fe'
chmod 600 ~/.ssh/onmaru-staging
cat ~/.ssh/onmaru-staging.pub
```

마지막 명령이 출력한 `.pub` 공개키 한 줄만 운영자에게 전달한다. `~/.ssh/onmaru-staging` 개인키는 공유하지 않는다.

운영자가 공개키를 등록한 뒤 스테이징을 시작한다.

```bash
ssh -i ~/.ssh/onmaru-staging onmaru-staging-operator@staging-api.onmaru.site start
npm run dev
```

상태 확인과 종료 명령은 다음과 같다.

```bash
ssh -i ~/.ssh/onmaru-staging onmaru-staging-operator@staging-api.onmaru.site status
ssh -i ~/.ssh/onmaru-staging onmaru-staging-operator@staging-api.onmaru.site stop
```

스테이징은 시작 후 2시간이 지나면 자동으로도 종료된다. 테스트가 끝나면 자동 종료를 기다리지 않고 `stop`을 실행한다.

## Vercel Production 설정

Vercel 프로젝트의 **Settings → Environment Variables**에서 Production 범위에 다음 Config를 둔다.

```dotenv
NEXT_PUBLIC_API_URL=https://api.onmaru.site
```

`NEXT_PUBLIC_API_URL`은 브라우저에 공개되는 서버 주소이므로 비밀번호나 인증 token이 아니다. `NEXT_PUBLIC_` 변수에는 실제 secret을 저장하지 않는다.

Vercel에 다음 이전 키가 남아 있다면 삭제한다.

```text
NEXT_PUBLIC_API_BASE_URL
NEXT_PUBLIC_API_URL_INTERNAL
STAGING_API_BASE_URL
```

환경변수 변경 후에는 Production을 다시 배포해야 새 브라우저 bundle에 반영된다.

## GitHub Actions Secret 전환

모든 workflow는 다음 Repository Secret 하나를 사용한다.

```text
NEXT_PUBLIC_API_URL=https://api.onmaru.site
```

FE #276 PR이 `develop`에 병합되고 새 workflow가 반영된 것을 확인한 다음 이전 Secret을 삭제한다.

```text
삭제: NEXT_PUBLIC_API_BASE_URL
유지: NEXT_PUBLIC_API_URL
```

병합 전에 이전 Secret을 먼저 삭제하면 현재 `develop`의 workflow build가 API 주소를 받지 못할 수 있다.

## 코드 규칙

API 주소는 항상 다음 키에서만 읽는다.

```ts
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

환경별 URL 상수나 다음과 같은 분기를 추가하지 않는다.

```ts
// 사용하지 않는 방식
const apiUrl = isStaging ? STAGING_API_URL : PROD_API_URL;
```

로컬과 운영의 차이는 코드가 아니라 `.env.local`과 Vercel Production 환경변수 값으로 결정한다.

## 확인 체크리스트

- [ ] `.env.local`의 `NEXT_PUBLIC_API_URL`이 스테이징 API를 가리킨다.
- [ ] 이전 API 주소 키를 로컬과 Vercel에서 제거했다.
- [ ] 스테이징 시작 후 `http://localhost:3000`에서 API 기능을 확인했다.
- [ ] 브라우저 Network의 API host가 `staging-api.onmaru.site`다.
- [ ] 테스트가 끝난 뒤 스테이징을 중지했다.
- [ ] Vercel Production의 `NEXT_PUBLIC_API_URL`은 운영 API를 가리킨다.
- [ ] FE #276 병합 후 GitHub의 이전 `NEXT_PUBLIC_API_BASE_URL` Secret을 삭제했다.
