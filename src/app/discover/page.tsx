import { redirect } from 'next/navigation';

// 여정 탐색은 홈(/)으로 옮겼다. 예전 링크와 북마크가 끊기지 않도록 남겨 둔다.
export default function DiscoverPage() {
  redirect('/');
}
