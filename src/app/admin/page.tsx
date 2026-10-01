'use client';





import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { meok, palette } from '@/design-system/tokens';
import { StatCard } from '@/features/admin/components/StatCard';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { Toast } from '@/features/admin/components/Toast';
import { EmptyState } from '@/features/admin/components/EmptyState';
import { useAdminAuth } from '@/features/admin/hooks/useAdminAuth';
import { getDashboardSummary, runPipeline } from '@/features/admin/api/adminApi';
import type { DashboardSummary } from '@/features/admin/api/adminApi';
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, RefreshCwIcon, FlameIcon, ShieldAlertIcon } from '@hugeicons/core-free-icons'

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAdmin } = useAdminAuth();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    getDashboardSummary().then(setDashboardData).catch(() => {});
  }, []);

  const dashboardStats = dashboardData?.stats ?? [];
  const recentReviews = dashboardData?.recentReviews ?? [];
  const pendingReports = dashboardData?.pendingReports ?? [];
  const pipelineSummary = dashboardData?.pipeline ?? null;


  const handleStartRebuild = useCallback(() => {
    setIsConfirmOpen(false);
    setIsRebuilding(true);
    setProgress(10);
    setProgressText('파이프라인 실행 요청 중...');

    runPipeline('hanok')
      .then(() => {
        setProgress(100);
        setProgressText('파이프라인 갱신 완료!');
        setTimeout(() => {
          setIsRebuilding(false);
          setToastMessage('데이터 파이프라인이 성공적으로 갱신되었습니다.');
        }, 500);
      })
      .catch(() => {
        setIsRebuilding(false);
        setToastMessage('파이프라인 실행 중 오류가 발생했습니다.');
      });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}

      {}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
        }}
      >
        {dashboardStats.map((stat) => (
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

      {}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
        }}
      >
        {}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid rgba(78, 89, 104, 0.10)',
            padding: '28px 30px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HugeiconsIcon icon={FlameIcon} size={20} color={palette.juhong[500]} strokeWidth={2.2} />
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: meok[900], margin: 0 }}>
                최근 온기
              </h2>
            </div>
            <Link
              href="/admin/reviews"
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: palette.juhong[500],
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>전체보기</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentReviews.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => router.push('/admin/reviews')}
                style={{
                  minHeight: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: idx < recentReviews.length - 1 ? '1px solid rgba(78, 89, 104, 0.06)' : 'none',
                  cursor: 'pointer',
                  padding: '12px 10px',
                  borderRadius: '8px',
                  transition: 'background-color 0.12s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: meok[900] }}>
                    {item.nickname}
                  </span>
                  <span style={{ fontSize: '13px', color: meok[500] }}>
                    {item.placeName}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '14px', color: palette.hwanggeum[700], fontWeight: 700 }}>
                    ★ {item.mood}.0
                  </span>
                  <span style={{ fontSize: '12px', color: meok[400] }}>
                    {item.timeAgo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid rgba(78, 89, 104, 0.10)',
            padding: '28px 30px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HugeiconsIcon icon={ShieldAlertIcon} size={20} color={palette.danpung[500]} strokeWidth={2.2} />
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: meok[900], margin: 0 }}>
                처리 대기 신고
              </h2>
            </div>
            <Link
              href="/admin/reports"
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: palette.danpung[500],
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>처리하기</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2} />
            </Link>
          </div>

          {pendingReports.length === 0 ? (
            <EmptyState title="처리할 신고가 없습니다" description="현재 대기 중인 사용자 신고가 모두 처리되었습니다." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {pendingReports.map((rep, idx) => (
                <div
                  key={rep.id}
                  onClick={() => router.push('/admin/reports')}
                  style={{
                    minHeight: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: idx < pendingReports.length - 1 ? '1px solid rgba(78, 89, 104, 0.06)' : 'none',
                    cursor: 'pointer',
                    padding: '12px 10px',
                    borderRadius: '8px',
                    transition: 'background-color 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: palette.danpung[50],
                        color: palette.danpung[700],
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      {rep.reason}
                    </span>
                    <span style={{ fontSize: '14px', color: meok[900], fontWeight: 600 }}>
                      {rep.targetAuthor} ({rep.targetPlace})
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: meok[400] }}>
                    {rep.timeAgo}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {}
      <section
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid rgba(78, 89, 104, 0.10)',
          padding: '28px 32px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: meok[900], margin: 0, marginBottom: '6px' }}>
              데이터 파이프라인 현황
            </h2>
            <p style={{ fontSize: '13px', color: meok[500], margin: 0 }}>
              한국관광공사 TourAPI 공공데이터 동기화 및 큐레이션 빌드 통계
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={isRebuilding}
              style={{
                height: '40px',
                padding: '0 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: palette.juhong[500],
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: isRebuilding ? 'not-allowed' : 'pointer',
                opacity: isRebuilding ? 0.6 : 1,
                boxShadow: '0 2px 6px rgba(235, 94, 40, 0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              <HugeiconsIcon icon={RefreshCwIcon} size={16} strokeWidth={2} className={isRebuilding ? 'animate-spin' : ''} />
              <span>{isRebuilding ? '갱신 중...' : '지금 갱신하기'}</span>
            </button>
          )}
        </div>

        {}
        {isRebuilding && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: palette.juhong[50],
              border: `1px solid ${palette.juhong[200]}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
                fontWeight: 600,
                color: palette.juhong[700],
                marginBottom: '10px',
              }}
            >
              <span>{progressText}</span>
              <span>{progress}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(255, 85, 0, 0.15)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: palette.juhong[500],
                  borderRadius: '4px',
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
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(78, 89, 104, 0.03)',
              borderRadius: '12px',
              padding: '18px 20px',
              border: '1px solid rgba(78, 89, 104, 0.06)',
            }}
          >
            <div style={{ fontSize: '13px', color: meok[500], fontWeight: 500, marginBottom: '6px' }}>마지막 갱신</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: meok[800] }}>
              {pipelineSummary?.lastBuildAt ?? '-'}
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(78, 89, 104, 0.03)',
              borderRadius: '12px',
              padding: '18px 20px',
              border: '1px solid rgba(78, 89, 104, 0.06)',
            }}
          >
            <div style={{ fontSize: '13px', color: meok[500], fontWeight: 500, marginBottom: '6px' }}>수집 현황</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: meok[800] }}>
              마을 {pipelineSummary?.villageCount ?? 0} · 숙소 {pipelineSummary?.stayCount ?? 0} · 루트 {pipelineSummary?.routeCount ?? 0}
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(78, 89, 104, 0.03)',
              borderRadius: '12px',
              padding: '18px 20px',
              border: '1px solid rgba(78, 89, 104, 0.06)',
            }}
          >
            <div style={{ fontSize: '13px', color: meok[500], fontWeight: 500, marginBottom: '6px' }}>API 일일 호출</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: meok[800], fontVariantNumeric: 'tabular-nums' }}>
              {(pipelineSummary?.apiCallUsed ?? 0).toLocaleString()} / {(pipelineSummary?.apiCallLimit ?? 0).toLocaleString()}
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(78, 89, 104, 0.03)',
              borderRadius: '12px',
              padding: '18px 20px',
              border: '1px solid rgba(78, 89, 104, 0.06)',
            }}
          >
            <div style={{ fontSize: '13px', color: meok[500], fontWeight: 500, marginBottom: '6px' }}>실패 건수</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: (pipelineSummary?.failureCount ?? 0) > 0 ? palette.danpung[500] : meok[800],
                }}
              >
                {pipelineSummary?.failureCount ?? 0}건
              </span>
              {isAdmin && (pipelineSummary?.failureCount ?? 0) > 0 && (
                <Link
                  href="/admin/data"
                  style={{
                    fontSize: '13px',
                    color: palette.danpung[500],
                    textDecoration: 'underline',
                    fontWeight: 600,
                  }}
                >
                  보기
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {}
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
