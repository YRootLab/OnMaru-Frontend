'use client';

// ============================================================
// 관리자 신고 처리 화면 (src/app/admin/reports/page.tsx)
// ============================================================

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { meok, palette } from '@/design-system/tokens';
import { StatusBadge } from '@/admin/components/StatusBadge';
import { ConfirmDialog } from '@/admin/components/ConfirmDialog';
import { Toast } from '@/admin/components/Toast';
import { EmptyState } from '@/admin/components/EmptyState';
import { ReportItem, ReportStatus } from '@/admin/types';
import { mockReports } from '@/admin/mock/reports.mock';
import {
  IoShieldOutline,
  IoEyeOffOutline,
  IoTrashOutline,
  IoCloseCircleOutline,
  IoPersonRemoveOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
} from 'react-icons/io5';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>(mockReports);
  const [activeTab, setActiveTab] = useState<ReportStatus>('PENDING');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // 탭별 건수 계산
  const pendingCount = useMemo(
    () => reports.filter((r) => r.status === 'PENDING').length,
    [reports]
  );
  const resolvedCount = useMemo(
    () => reports.filter((r) => r.status === 'RESOLVED').length,
    [reports]
  );
  const rejectedCount = useMemo(
    () => reports.filter((r) => r.status === 'REJECTED').length,
    [reports]
  );

  // 현재 활성 탭 목록
  const currentReports = useMemo(() => {
    return reports.filter((r) => r.status === activeTab);
  }, [reports, activeTab]);

  // 액션 핸들러들
  const handleHideReview = (report: ReportItem) => {
    setConfirmState({
      isOpen: true,
      title: '후기 숨김 처리',
      description: `[${report.review.place.name}] 후기를 숨김 상태로 전환하시겠습니까?\n일반 사용자 피드에서 즉시 비노출 처리됩니다.`,
      isDestructive: false,
      onConfirm: () => {
        setReports((prev) =>
          prev.map((item) =>
            item.id === report.id
              ? {
                  ...item,
                  status: 'RESOLVED',
                  resolvedAt: new Date().toISOString(),
                  resolvedBy: '관리자(본인)',
                  review: { ...item.review, status: 'HIDDEN' },
                }
              : item
          )
        );
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        setToastMessage('후기가 숨김 처리되고 신고가 해결 완료되었습니다.');
      },
    });
  };

  const handleDeleteReview = (report: ReportItem) => {
    setConfirmState({
      isOpen: true,
      title: '후기 영구 삭제',
      description: `이 후기를 완전히 삭제하시겠습니까?\n삭제된 내용은 복구할 수 없으며 작성자(${report.review.author.nickname})에게 경고 및 삭제 알림이 발송됩니다.`,
      isDestructive: true,
      onConfirm: () => {
        setReports((prev) =>
          prev.map((item) =>
            item.id === report.id
              ? {
                  ...item,
                  status: 'RESOLVED',
                  resolvedAt: new Date().toISOString(),
                  resolvedBy: '관리자(본인)',
                  review: { ...item.review, status: 'DELETED' },
                }
              : item
          )
        );
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        setToastMessage('후기가 영구 삭제되었으며 사용자에게 알림이 발송되었습니다.');
      },
    });
  };

  const handleRejectReport = (report: ReportItem) => {
    setConfirmState({
      isOpen: true,
      title: '신고 반려',
      description: `정상적인 이용 후기로 판단하여 이 신고를 반려하시겠습니까?\n해당 후기는 게시 상태를 유지합니다.`,
      isDestructive: false,
      onConfirm: () => {
        setReports((prev) =>
          prev.map((item) =>
            item.id === report.id
              ? {
                  ...item,
                  status: 'REJECTED',
                  resolvedAt: new Date().toISOString(),
                  resolvedBy: '관리자(본인)',
                }
              : item
          )
        );
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        setToastMessage('신고가 반려 처리되었습니다.');
      },
    });
  };

  const handleSuspendUser = (report: ReportItem) => {
    setConfirmState({
      isOpen: true,
      title: '작성자 이용 정지',
      description: `작성자 '${report.review.author.nickname}' 계정을 7일간 서비스 이용 정지하시겠습니까?\n신고 누적 횟수: ${report.reportedUserAccumReports}회`,
      isDestructive: true,
      onConfirm: () => {
        setReports((prev) =>
          prev.map((item) =>
            item.id === report.id
              ? {
                  ...item,
                  status: 'RESOLVED',
                  resolvedAt: new Date().toISOString(),
                  resolvedBy: '관리자(본인)',
                  review: { ...item.review, status: 'HIDDEN' },
                }
              : item
          )
        );
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        setToastMessage(`작성자 '${report.review.author.nickname}'의 계정이 정지 처리되었습니다.`);
      },
    });
  };

  // 사유별 뱃지 스타일
  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'ABUSE':
        return { bg: palette.danpung[50], color: palette.danpung[700], border: 'rgba(180, 50, 40, 0.2)' };
      case 'SPAM':
        return { bg: palette.hwanggeum[50], color: palette.hwanggeum[700], border: 'rgba(212, 175, 55, 0.2)' };
      case 'FALSE_INFO':
        return { bg: palette.juhong[50], color: palette.juhong[700], border: 'rgba(235, 94, 40, 0.2)' };
      default:
        return { bg: meok[100], color: meok[700], border: 'rgba(78, 89, 104, 0.15)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}

      {/* 상단 탭 바 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid rgba(78, 89, 104, 0.12)',
          paddingBottom: '2px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('PENDING')}
          style={{
            height: '42px',
            padding: '0 16px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            borderBottom: activeTab === 'PENDING' ? `3px solid ${palette.danpung[500]}` : '3px solid transparent',
            backgroundColor: activeTab === 'PENDING' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'PENDING' ? palette.danpung[500] : meok[500],
            fontSize: '14px',
            fontWeight: activeTab === 'PENDING' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.12s ease',
          }}
        >
          <span>처리 대기</span>
          <span
            style={{
              padding: '1px 8px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: pendingCount > 0 ? palette.danpung[500] : meok[200],
              color: '#FFFFFF',
            }}
          >
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('RESOLVED')}
          style={{
            height: '42px',
            padding: '0 16px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            borderBottom: activeTab === 'RESOLVED' ? `3px solid ${palette.cheongrok[500]}` : '3px solid transparent',
            backgroundColor: activeTab === 'RESOLVED' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'RESOLVED' ? palette.cheongrok[700] : meok[500],
            fontSize: '14px',
            fontWeight: activeTab === 'RESOLVED' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.12s ease',
          }}
        >
          <span>처리 완료</span>
          <span
            style={{
              padding: '1px 8px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: meok[200],
              color: meok[700],
            }}
          >
            {resolvedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('REJECTED')}
          style={{
            height: '42px',
            padding: '0 16px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            borderBottom: activeTab === 'REJECTED' ? `3px solid ${meok[700]}` : '3px solid transparent',
            backgroundColor: activeTab === 'REJECTED' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'REJECTED' ? meok[900] : meok[500],
            fontSize: '14px',
            fontWeight: activeTab === 'REJECTED' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.12s ease',
          }}
        >
          <span>반려됨</span>
          <span
            style={{
              padding: '1px 8px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: meok[200],
              color: meok[700],
            }}
          >
            {rejectedCount}
          </span>
        </button>
      </div>

      {/* 목록 리스트 */}
      {currentReports.length === 0 ? (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '40px 20px', border: '1px solid rgba(78, 89, 104, 0.08)' }}>
          <EmptyState
            title={activeTab === 'PENDING' ? '처리할 신고가 없습니다' : '해당 상태의 신고 내역이 없습니다'}
            description={
              activeTab === 'PENDING'
                ? '현재 접수된 모든 신고가 처리 완료되었거나 대기 중인 신고가 없습니다.'
                : '다른 탭을 선택하여 처리된 신고 기록을 확인해보세요.'
            }
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {currentReports.map((report) => {
            const reasonStyle = getReasonColor(report.reason);
            const isPending = report.status === 'PENDING';

            return (
              <div
                key={report.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  border: '1px solid rgba(78, 89, 104, 0.08)',
                  padding: '20px 24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                {/* 카드 상단: 사유 뱃지 + 시각 + 신고자 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: reasonStyle.bg,
                        color: reasonStyle.color,
                        border: `1px solid ${reasonStyle.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <IoShieldOutline size={13} />
                      {report.reasonLabel}
                    </span>
                    <StatusBadge status={report.status} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: meok[500] }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <IoTimeOutline size={14} />
                      <span>신고 접수: {new Date(report.createdAt).toLocaleString('ko-KR')}</span>
                    </div>
                    <span>
                      신고자: <strong>{report.reporter.nickname}</strong> ({report.reporter.email})
                    </span>
                  </div>
                </div>

                {/* 카드 중단: 신고된 후기 전문 (인용 블록) */}
                <div
                  style={{
                    borderLeft: `3px solid ${meok[200]}`,
                    padding: '14px 18px',
                    backgroundColor: 'rgba(78, 89, 104, 0.03)',
                    borderRadius: '0 8px 8px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: meok[900] }}>
                        {report.review.place.name}
                      </span>
                      <span style={{ fontSize: '12px', color: meok[500] }}>
                        ({report.review.place.region})
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: palette.hwanggeum[700], fontWeight: 600 }}>
                      평점: ★ {report.review.mood}.0
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '14px',
                      color: meok[700],
                      lineHeight: 1.6,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    &ldquo;{report.review.content}&rdquo;
                  </p>

                  {/* 첨부 이미지 있으면 렌더 */}
                  {report.review.images && report.review.images.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      {report.review.images.map((img, i) => (
                        <Image
                          key={i}
                          src={img}
                          alt="신고 후기 첨부 이미지"
                          width={64}
                          height={64}
                          unoptimized
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '6px',
                            objectFit: 'cover',
                            border: '1px solid rgba(78, 89, 104, 0.1)',
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {report.review.tags && report.review.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      {report.review.tags.map((tag, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '11px',
                            color: meok[500],
                            backgroundColor: '#FFFFFF',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid rgba(78, 89, 104, 0.1)',
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 카드 하단: 피신고자 정보 및 조치 액션 버튼 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    paddingTop: '6px',
                    borderTop: '1px solid rgba(78, 89, 104, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span style={{ color: meok[500] }}>작성자:</span>
                    <strong style={{ color: meok[900] }}>{report.review.author.nickname}</strong>
                    <span style={{ color: meok[500], fontSize: '12px' }}>({report.review.author.email})</span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor:
                          report.reportedUserAccumReports >= 3 ? palette.danpung[50] : meok[100],
                        color:
                          report.reportedUserAccumReports >= 3 ? palette.danpung[700] : meok[700],
                      }}
                    >
                      누적 신고 {report.reportedUserAccumReports}회
                    </span>
                  </div>

                  {isPending ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleHideReview(report)}
                        style={{
                          height: '32px',
                          padding: '0 12px',
                          borderRadius: '6px',
                          border: '1px solid rgba(78, 89, 104, 0.2)',
                          backgroundColor: '#FFFFFF',
                          color: meok[700],
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <IoEyeOffOutline size={14} />
                        <span>숨김 처리</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteReview(report)}
                        style={{
                          height: '32px',
                          padding: '0 12px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: palette.danpung[500],
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <IoTrashOutline size={14} />
                        <span>삭제</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectReport(report)}
                        style={{
                          height: '32px',
                          padding: '0 12px',
                          borderRadius: '6px',
                          border: '1px solid rgba(78, 89, 104, 0.15)',
                          backgroundColor: 'transparent',
                          color: meok[500],
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <IoCloseCircleOutline size={14} />
                        <span>반려</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSuspendUser(report)}
                        style={{
                          height: '32px',
                          padding: '0 12px',
                          borderRadius: '6px',
                          border: `1px solid ${palette.danpung[200]}`,
                          backgroundColor: palette.danpung[50],
                          color: palette.danpung[700],
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <IoPersonRemoveOutline size={14} />
                        <span>작성자 정지</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: meok[500] }}>
                      <IoCheckmarkCircleOutline size={16} color={palette.cheongrok[500]} />
                      <span>
                        처리 완료 ({report.resolvedAt ? new Date(report.resolvedAt).toLocaleDateString() : '-'}, {report.resolvedBy ?? '관리자'})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 작업 확인 모달 */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        description={confirmState.description}
        isDestructive={confirmState.isDestructive}
        confirmText="진행"
        cancelText="취소"
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
