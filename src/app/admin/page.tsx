'use client';

// ============================================================
// 관리자 대시보드 (src/app/admin/page.tsx)
// ============================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { meok, palette } from '@/design-system/tokens';
import { StatCard } from '@/admin/components/StatCard';
import { ConfirmDialog } from '@/admin/components/ConfirmDialog';
import { Toast } from '@/admin/components/Toast';
import { EmptyState } from '@/admin/components/EmptyState';
import { useAdminAuth } from '@/admin/hooks/useAdminAuth';
import {
  mockDashboardStats,
  mockRecentReviews,
  mockPendingReports,
  mockPipelineSummary,
} from '@/admin/mock/dashboard.mock';
import {
  ArrowRight,
  RefreshCw,
  Flame,
  ShieldAlert,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAdmin } = useAdminAuth();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 파이프라인 수동 갱신 시뮬레이션
  const handleStartRebuild = () => {
    setIsConfirmOpen(false);
    setIsRebuilding(true);
    setProgress(15);
    setProgressText('TourAPI 데이터 수집 요청 준비 중...');

    setTimeout(() => {
      setProgress(45);
      setProgressText('한옥마을 및 숙소 메타데이터 수집 중 (87/172)');
    }, 800);

    setTimeout(() => {
      setProgress(85);
      setProgressText('이미지 및 오버라이드 데이터 병합 중...');
    }, 1600);

    setTimeout(() => {
      setProgress(100);
      setProgressText('파이프라인 갱신 완료!');
      setTimeout(() => {
        setIsRebuilding(false);
        setToastMessage('데이터 파이프라인이 성공적으로 갱신되었습니다.');
      }, 500);
    }, 2400);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}

      {/* 상단 4구 지표 카드 */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}
      >
        {mockDashboardStats.map((stat) => (
          <StatCard
            key={stat.key}
            label={stat.label}
            value={stat.value}
            delta={stat.delta}
            deltaType={stat.deltaType}
            highlight={stat.highlight}
            comparisonText={stat.comparisonText}
            onClick={() => {
              if (stat.key === 'today_reviews') router.push('/admin/reviews');
              if (stat.key === 'pending_reports') router.push('/admin/reports');
              if (stat.key === 'new_users' || stat.key === 'total_users') {
                if (isAdmin) router.push('/admin/users');
              }
            }}
          />
        ))}
      </section>

      {/* 중단 그리드: 최근 온기 5건 vs 처리 대기 신고 */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
        }}
      >
        {/* 최근 온기 5건 */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid rgba(78, 89, 104, 0.08)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flame size={18} color={palette.juhong[500]} strokeWidth={2} />
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: meok[900], margin: 0 }}>
                최근 온기
              </h2>
            </div>
            <Link
              href="/admin/reviews"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: palette.juhong[500],
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>전체보기</span>
              <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {mockRecentReviews.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => router.push('/admin/reviews')}
                style={{
                  height: '52px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: idx < mockRecentReviews.length - 1 ? '1px solid rgba(78, 89, 104, 0.06)' : 'none',
                  cursor: 'pointer',
                  padding: '0 4px',
                  transition: 'background-color 0.12s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: meok[900] }}>
                    {item.nickname}
                  </span>
                  <span style={{ fontSize: '12px', color: meok[500] }}>
                    {item.placeName}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: palette.hwanggeum[700], fontWeight: 600 }}>
                    ★ {item.mood}.0
                  </span>
                  <span style={{ fontSize: '11px', color: meok[400] }}>
                    {item.timeAgo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 처리 대기 신고 */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid rgba(78, 89, 104, 0.08)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={18} color={palette.danpung[500]} strokeWidth={2} />
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: meok[900], margin: 0 }}>
                처리 대기 신고
              </h2>
            </div>
            <Link
              href="/admin/reports"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: palette.danpung[500],
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>처리하기</span>
              <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </div>

          {mockPendingReports.length === 0 ? (
            <EmptyState title="처리할 신고가 없습니다" description="현재 대기 중인 사용자 신고가 모두 처리되었습니다." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {mockPendingReports.map((rep, idx) => (
                <div
                  key={rep.id}
                  onClick={() => router.push('/admin/reports')}
                  style={{
                    height: '52px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: idx < mockPendingReports.length - 1 ? '1px solid rgba(78, 89, 104, 0.06)' : 'none',
                    cursor: 'pointer',
                    padding: '0 4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: palette.danpung[50],
                        color: palette.danpung[700],
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {rep.reason}
                    </span>
                    <span style={{ fontSize: '13px', color: meok[900], fontWeight: 500 }}>
                      {rep.targetAuthor} ({rep.targetPlace})
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: meok[400] }}>
                    {rep.timeAgo}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 하단 — 데이터 파이프라인 요약 */}
      <section
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid rgba(78, 89, 104, 0.08)',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: meok[900], margin: 0, marginBottom: '4px' }}>
              데이터 파이프라인 현황
            </h2>
            <p style={{ fontSize: '12px', color: meok[500], margin: 0 }}>
              한국관광공사 TourAPI 공공데이터 동기화 및 큐레이션 빌드 통계
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={isRebuilding}
              style={{
                height: '36px',
                padding: '0 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: palette.juhong[500],
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: isRebuilding ? 'not-allowed' : 'pointer',
                opacity: isRebuilding ? 0.6 : 1,
              }}
            >
              <RefreshCw size={15} strokeWidth={2} className={isRebuilding ? 'animate-spin' : ''} />
              <span>{isRebuilding ? '갱신 중...' : '지금 갱신하기'}</span>
            </button>
          )}
        </div>

        {/* 진행률 바 (갱신 중일 때 노출) */}
        {isRebuilding && (
          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: palette.juhong[50],
              border: `1px solid ${palette.juhong[200]}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                fontWeight: 600,
                color: palette.juhong[700],
                marginBottom: '8px',
              }}
            >
              <span>{progressText}</span>
              <span>{progress}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'rgba(255, 85, 0, 0.15)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: palette.juhong[500],
                  borderRadius: '3px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(78, 89, 104, 0.06)',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: meok[400], marginBottom: '4px' }}>마지막 갱신</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: meok[700] }}>
              {mockPipelineSummary.lastBuildAt}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: meok[400], marginBottom: '4px' }}>수집 현황</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: meok[700] }}>
              마을 {mockPipelineSummary.villageCount} · 숙소 {mockPipelineSummary.stayCount} · 루트 {mockPipelineSummary.routeCount}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: meok[400], marginBottom: '4px' }}>API 일일 호출</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: meok[700], fontVariantNumeric: 'tabular-nums' }}>
              {mockPipelineSummary.apiCallUsed.toLocaleString()} / {mockPipelineSummary.apiCallLimit.toLocaleString()}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: meok[400], marginBottom: '4px' }}>실패 건수</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: mockPipelineSummary.failureCount > 0 ? palette.danpung[500] : meok[700],
                }}
              >
                {mockPipelineSummary.failureCount}건
              </span>
              {isAdmin && mockPipelineSummary.failureCount > 0 && (
                <Link
                  href="/admin/data"
                  style={{
                    fontSize: '11px',
                    color: palette.danpung[500],
                    textDecoration: 'underline',
                    fontWeight: 500,
                  }}
                >
                  보기
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 파이프라인 갱신 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="데이터 파이프라인 수동 갱신"
        description={`한국관광공사 TourAPI를 호출하여 마을, 숙소, 루트 데이터를 전면 재수집하고 정적 데이터셋을 다시 빌드합니다.\n\n실행 시 약 2~4분의 시간이 소요되며, 기존 캐시 데이터가 덮어씌워집니다. 진행하시겠습니까?`}
        confirmText="지금 갱신하기"
        cancelText="취소"
        onConfirm={handleStartRebuild}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
