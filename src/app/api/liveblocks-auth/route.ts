import { NextRequest, NextResponse } from 'next/server';
import { Liveblocks } from '@liveblocks/node';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY ?? '',
});

export async function POST(req: NextRequest) {
  // 1. 요청 바디에서 room ID 추출 및 UUID 검증
  const body = await req.json().catch(() => ({}));
  const room = typeof body.room === 'string' ? body.room : null;

  if (!room || !UUID_RE.test(room)) {
    return NextResponse.json({ error: 'invalid_room' }, { status: 400 });
  }

  // 2. 세션 쿠키를 Spring 백엔드에 포워딩해 로그인 여부 확인
  //    LIVEBLOCKS_SKIP_BACKEND_AUTH=true 이면 백엔드 없이 mock 유저로 통과 (개발 전용)
  let me: { id: string; displayName: string };

  if (process.env.LIVEBLOCKS_SKIP_BACKEND_AUTH === 'true') {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'mock_not_allowed_in_prod' }, { status: 403 });
    }
    me = { id: `dev-${crypto.randomUUID().slice(0, 8)}`, displayName: '개발자' };
  } else {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBase) {
      return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
    }

    const meRes = await fetch(`${apiBase}/api/v1/members/me`, {
      headers: { cookie: req.headers.get('cookie') ?? '' },
      cache: 'no-store',
    });

    if (!meRes.ok) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    me = await meRes.json() as { id: string; displayName: string };
  }

  // 3. Liveblocks 세션 준비 — userId는 내부 ID, userInfo만 presence에 노출
  const session = liveblocks.prepareSession(me.id, {
    userInfo: { nickname: me.displayName },
  });

  // 4. 이 사용자가 초대받은 방에만 접근 허용 (room = 초대 링크의 UUID)
  session.allow(`map-collab-${room}`, session.FULL_ACCESS);

  const { status, body: token } = await session.authorize();
  return new NextResponse(token, { status });
}
