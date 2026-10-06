'use client';





import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { meok, palette } from '@/design-system/tokens';
import { StatCard } from '@/features/admin/components/StatCard';
import { EmptyState } from '@/features/admin/components/EmptyState';
import { useAdminAuth } from '@/features/admin/hooks/useAdminAuth';
import { getDashboardSummary } from '@/features/admin/api/adminApi';
import type { DashboardSummary } from '@/features/admin/api/adminApi';
import { getPipelineStatusPresentation } from '@/features/admin/services/adminPipelinePresentation';
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, FlameIcon, ShieldAlertIcon } from '@hugeicons/core-free-icons'

function formatPipelineDate(value: string | null | undefined): string {
  if (!value) return '성공 이력 없음';
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value));
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAdmin } = useAdminAuth();

  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    getDashboardSummary().then(setDashboardData).catch(() => {});
  }, []);

  const dashboardStats = dashboardData?.stats ?? [];
  const recentReviews = dashboardData?.recentReviews ?? [];
  const pendingReports = dashboardData?.pendingReports ?? [];
  const pipelineSummary = dashboardData?.pipeline ?? null;
  const pipelineState = pipelineSummary
    ? getPipelineStatusPresentation(pipelineSummary.status)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
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
            <Link
              href="/admin/data"
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
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(235, 94, 40, 0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              <span>상태 보기</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
            </Link>
          )}
        </div>

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
              {formatPipelineDate(pipelineSummary?.lastSuccessAt)}
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
            <div style={{ fontSize: '13px', color: meok[500], fontWeight: 500, marginBottom: '6px' }}>현재 상태</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: meok[800] }}>
              {pipelineState?.label ?? '상태 확인 필요'}
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
            <div style={{ fontSize: '13px', color: meok[500], fontWeight: 500, marginBottom: '6px' }}>최근 실행 실패 항목</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: meok[800], fontVariantNumeric: 'tabular-nums' }}>
              {pipelineSummary ? `${pipelineSummary.failureCount.toLocaleString()}건` : '집계 준비 중'}
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
            <div style={{ fontSize: '13px', color: meok[500], fontWeight: 500, marginBottom: '6px' }}>누적 실패 실행</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: (pipelineSummary?.cumulativeFailureRunCount ?? 0) > 0 ? palette.danpung[500] : meok[800],
                }}
              >
                {pipelineSummary ? `${pipelineSummary.cumulativeFailureRunCount.toLocaleString()}회` : '집계 준비 중'}
              </span>
              {isAdmin && pipelineSummary && pipelineSummary.failureCount > 0 && (
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

    </div>
  );
}
