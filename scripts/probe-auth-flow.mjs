// 온마루 백엔드 카카오 로그인 계약 탐침 스크립트 — BE/FE 원인 판별용
// 실행: npm run probe:auth
//       node --env-file=.env.local scripts/probe-auth-flow.mjs [백엔드 주소]
//
// 판별 규칙:
//   ✅ 이 스크립트가 모두 통과하는데 앱 로그인이 실패한다 → FE 문제 가능성 (브라우저 콘솔 확인)
//   ❌ 이 스크립트가 실패한다 → 백엔드(또는 환경·네트워크) 문제
//
// 검증 항목 (FE 카카오 로그인 연동 가이드 2026-09-21 기준):
//   1. GET /auth/csrf            → 200 {token, headerName} + 게스트 세션 쿠키
//   2. GET /auth/kakao/login     → 302 카카오 authorize (client_id·redirect_uri 포함)
//   3. GET /api/v1/members/me    → 비로그인 401 {code:"AUTH_REQUIRED"}
//   4. POST /api/v1/auth/logout  → CSRF 헤더로 호출 시 2xx
//   참고: 실제 카카오 로그인 왕복(동의 화면·code 교환)은 브라우저가 필요해 자동 검증 대상이 아니다.

const API = (
  process.argv[2] ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  ''
).replace(/\/+$/, '');

if (!API) {
  console.error(
    '❌ 백엔드 주소가 없습니다. `npm run probe:auth -- http://localhost:8080`처럼 넘기거나\n' +
      '   .env.local에 NEXT_PUBLIC_API_URL(또는 NEXT_PUBLIC_API_BASE_URL)을 설정해주세요.'
  );
  process.exit(1);
}

let failures = 0;
const jar = new Map(); // 간이 쿠키 저장소 (Set-Cookie 수집 → Cookie 헤더 재전송)

const ok = (label) => console.log(`  ✅ ${label}`);
const fail = (label, detail) => {
  failures += 1;
  console.error(`  ❌ ${label}\n     → ${detail}`);
};

function storeCookies(res) {
  const setCookies = res.headers.getSetCookie?.() ?? [];
  for (const raw of setCookies) {
    const [pair] = raw.split(';');
    const idx = pair.indexOf('=');
    if (idx > 0) jar.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
  }
}

const cookieHeader = () => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');

async function call(path, { method = 'GET', headers = {}, redirect = 'manual' } = {}) {
  const allHeaders = { Accept: 'application/json', ...headers };
  const cookies = cookieHeader();
  if (cookies) allHeaders.Cookie = cookies;
  return fetch(`${API}${path}`, { method, headers: allHeaders, redirect });
}

console.log(`\n🔍 온마루 백엔드 카카오 로그인 계약 탐침 — ${API}\n`);

// 1) CSRF 토큰 + 게스트 세션 발급 (가이드 §1-4)
let csrfTokenValue = '';
let csrfHeaderName = 'X-CSRF-TOKEN';
try {
  const res = await call('/auth/csrf', { redirect: 'follow' });
  storeCookies(res);
  const body = await res.json().catch(() => null);
  if (res.ok && typeof body?.token === 'string' && typeof body?.headerName === 'string') {
    csrfTokenValue = body.token;
    csrfHeaderName = body.headerName;
    ok(`GET /auth/csrf → 200 (헤더 ${csrfHeaderName}, 쿠키 ${jar.size}개 발급)`);
  } else {
    fail(
      'GET /auth/csrf',
      `status=${res.status} body=${JSON.stringify(body)?.slice(0, 120)} — CSRF 발급이 실패하면 로그아웃·탈퇴 등 unsafe 요청이 전부 실패합니다`
    );
  }
} catch (e) {
  fail('GET /auth/csrf', e.message);
}

// 2) 로그인 시작 → 카카오 302 (가이드 §1-1, §5)
try {
  const res = await call('/auth/kakao/login?returnTo=%2Fdiscover');
  storeCookies(res);
  const location = res.headers.get('location') ?? '';
  if (
    [301, 302, 303, 307].includes(res.status) &&
    location.startsWith('https://kauth.kakao.com/oauth/authorize')
  ) {
    const authorizeUrl = new URL(location);
    ok(`GET /auth/kakao/login → ${res.status} 카카오 authorize 리다이렉트`);
    if (!authorizeUrl.searchParams.get('client_id')) {
      fail('카카오 client_id', '인가 URL에 client_id가 없습니다 — 백엔드 카카오 앱 설정을 확인해주세요');
    }
    if (!authorizeUrl.searchParams.get('redirect_uri')) {
      fail('카카오 redirect_uri', '인가 URL에 redirect_uri가 없습니다 — 백엔드 카카오 앱 설정을 확인해주세요');
    }
  } else {
    fail(
      'GET /auth/kakao/login',
      `status=${res.status} location=${location || '(없음)'} — 카카오 authorize로 302되지 않으면 로그인 시작 자체가 불가능합니다 (백엔드 카카오 설정·외부망 접근 확인)`
    );
  }
} catch (e) {
  fail('GET /auth/kakao/login', e.message);
}

// 3) 비로그인 상태 판정 — 401 AUTH_REQUIRED (가이드 §1-3)
try {
  const res = await call('/api/v1/members/me');
  const body = await res.json().catch(() => null);
  if (res.status === 401 && body?.code === 'AUTH_REQUIRED') {
    ok('GET /api/v1/members/me (비로그인) → 401 AUTH_REQUIRED');
  } else if (res.ok && body?.id) {
    console.log(
      '  ⚠️ GET /api/v1/members/me → 200 — 이 환경에 이미 로그인 세션 쿠키가 있습니다. 비로그인 판정 검증은 로그아웃 후 다시 실행해주세요.'
    );
  } else {
    fail(
      'GET /api/v1/members/me (비로그인)',
      `status=${res.status} code=${body?.code ?? '(없음)'} — FE는 401+AUTH_REQUIRED만 비로그인으로 판정하므로 계약이 다르면 로그인 상태가 깨집니다`
    );
  }
} catch (e) {
  fail('GET /api/v1/members/me (비로그인)', e.message);
}

// 4) 로그아웃 — CSRF 헤더 필요 (가이드 §1-4, §1-5)
try {
  const res = await call('/api/v1/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', [csrfHeaderName]: csrfTokenValue },
    body: '{}',
  });
  if (res.ok) {
    ok(`POST /api/v1/auth/logout → ${res.status}`);
  } else if (res.status === 401) {
    ok(`POST /api/v1/auth/logout → 401 (로그인 세션이 없는 상태 — 허용)`);
  } else if (res.status === 403) {
    const body = await res.json().catch(() => null);
    fail(
      'POST /api/v1/auth/logout',
      `403 ${JSON.stringify(body)} — CSRF 검증 실패. FE의 로그아웃·탈퇴가 전부 실패하게 됩니다 (/auth/csrf 응답의 headerName·token 계약 확인)`
    );
  } else {
    fail('POST /api/v1/auth/logout', `status=${res.status}`);
  }
} catch (e) {
  fail('POST /api/v1/auth/logout', e.message);
}

console.log('');
if (failures === 0) {
  console.log('✅ 백엔드 계약 정상. 앱 로그인이 여전히 실패한다면 FE 문제 가능성이 높습니다');
  console.log('   (브라우저 개발자 도구 네트워크 탭에서 GET /auth/kakao/login 요청과 응답을 확인해주세요).');
  process.exit(0);
} else {
  console.error(`❌ 백엔드 계약 검증 ${failures}건 실패 — 로그인 장애의 원인이 백엔드/환경일 가능성이 높습니다.`);
  process.exit(1);
}
