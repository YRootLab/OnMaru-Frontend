'use client';

// ============================================================
// 관리자 온기(후기) 관리 (src/app/admin/reviews/page.tsx)
// ============================================================

import React, { useState, useMemo } from 'react';
import { meok, palette } from '@/design-system/tokens';
import { DataTable, ColumnDef } from '@/admin/components/DataTable';
import { StatusBadge } from '@/admin/components/StatusBadge';
import { ConfirmDialog } from '@/admin/components/ConfirmDialog';
import { Toast } from '@/admin/components/Toast';
import { WarmthReview, ReviewStatus } from '@/admin/types';
import { mockReviews } from '@/admin/mock/reviews.mock';
import {
  IoSearchOutline,
  IoRefreshOutline,
  IoCloseOutline,
  IoEllipsisHorizontal,
  IoShieldOutline,
  IoEyeOffOutline,
  IoTrashOutline,
  IoPersonRemoveOutline,
} from 'react-icons/io5';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<WarmthReview[]>(mockReviews);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReviewStatus>('ALL');
  const [moodFilter, setMoodFilter] = useState<string>('ALL');
  const [periodFilter, setPeriodFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'latest' | 'helpful' | 'report'>('latest');

  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedReview, setSelectedReview] = useState<WarmthReview | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    isDestructive?: boolean;
    action?: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
  });

  // 필터 초기화
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setMoodFilter('ALL');
    setPeriodFilter('ALL');
    setSortBy('latest');
    setCurrentPage(1);
  };

  // 필터링 및 정렬 연산
  const filteredReviews = useMemo(() => {
    return reviews
      .filter((rev) => {
        // 검색어 필터
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchAuthor = rev.author.nickname.toLowerCase().includes(q);
          const matchPlace = rev.place.name.toLowerCase().includes(q);
          const matchContent = rev.content.toLowerCase().includes(q);
          if (!matchAuthor && !matchPlace && !matchContent) return false;
        }

        // 상태 필터
        if (statusFilter !== 'ALL' && rev.status !== statusFilter) return false;

        // 무드 필터
        if (moodFilter !== 'ALL' && rev.mood !== Number(moodFilter)) return false;

        // 기간 필터 (모의)
        if (periodFilter === 'TODAY') {
          const isToday = new Date(rev.createdAt).toDateString() === new Date('2026-08-04').toDateString();
          if (!isToday) return false;
        } else if (periodFilter === '7D') {
          const diffDays =
            (new Date('2026-08-04').getTime() - new Date(rev.createdAt).getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7) return false;
        } else if (periodFilter === '30D') {
          const diffDays =
            (new Date('2026-08-04').getTime() - new Date(rev.createdAt).getTime()) / (1000 * 3600 * 24);
          if (diffDays > 30) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'helpful') return b.helpfulCount - a.helpfulCount;
        if (sortBy === 'report') return b.reportCount - a.reportCount;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [reviews, searchQuery, statusFilter, moodFilter, periodFilter, sortBy]);

  // 페이지네이션 슬라이스
  const totalPages = Math.ceil(filteredReviews.length / pageSize) || 1;
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReviews.slice(start, start + pageSize);
  }, [filteredReviews, currentPage, pageSize]);

  // 일괄 조치 핸들러
  const handleBulkHide = () => {
    setConfirmState({
      isOpen: true,
      title: '선택한 온기 숨김 처리',
      description: `선택하신 ${selectedRowKeys.length}건의 온기를 비공개(숨김) 처리하시겠습니까?\n숨김 처리된 온기는 서비스 페이지에서 노출되지 않습니다.`,
      isDestructive: false,
      action: () => {
        setReviews((prev) =>
          prev.map((r) => (selectedRowKeys.includes(r.id) ? { ...r, status: 'HIDDEN' } : r))
        );
        setSelectedRowKeys([]);
        setToastMessage(`${selectedRowKeys.length}건이 숨김 처리되었습니다.`);
      },
    });
  };

  const handleBulkDelete = () => {
    setConfirmState({
      isOpen: true,
      title: '선택한 온기 영구 삭제',
      description: `선택하신 ${selectedRowKeys.length}건의 온기를 영구 삭제하시겠습니까?\n삭제된 온기는 복구할 수 없으며 작성자에게 삭제 알림이 발송될 수 있습니다.`,
      isDestructive: true,
      action: () => {
        setReviews((prev) =>
          prev.map((r) => (selectedRowKeys.includes(r.id) ? { ...r, status: 'DELETED' } : r))
        );
        setSelectedRowKeys([]);
        setToastMessage(`${selectedRowKeys.length}건이 삭제되었습니다.`);
      },
    });
  };

  // 단일 후기 상태 변경
  const updateSingleStatus = (id: string, status: ReviewStatus) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    if (selectedReview && selectedReview.id === id) {
      setSelectedReview((prev) => (prev ? { ...prev, status } : null));
    }
    setToastMessage(`온기 상태가 '${status}'(으)로 변경되었습니다.`);
  };

  // 상대 시간 포맷팅
  const formatRelativeTime = (dateStr: string) => {
    const ref = new Date('2026-08-04T05:00:00Z').getTime();
    const diffHours = Math.floor((ref - new Date(dateStr).getTime()) / (1000 * 3600));
    if (diffHours < 1) return '방금 전';
    if (diffHours < 24) return `${diffHours}시간 전`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}일 전`;
  };

  // DataTable 컬럼 정의
  const columns: ColumnDef<WarmthReview>[] = [
    {
      key: 'author',
      label: '작성자',
      width: '130px',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontWeight: 600, color: meok[900] }}>{row.author.nickname}</span>
          <span style={{ fontSize: '11px', color: meok[400] }}>{row.author.email}</span>
        </div>
      ),
    },
    {
      key: 'place',
      label: '장소',
      width: '180px',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontWeight: 600, color: meok[900] }}>{row.place.name}</span>
          <span style={{ fontSize: '11px', color: meok[400] }}>{row.place.region}</span>
        </div>
      ),
    },
    {
      key: 'mood',
      label: '무드',
      width: '60px',
      align: 'center',
      render: (row) => (
        <span style={{ color: palette.hwanggeum[700], fontWeight: 700, fontSize: '12px' }}>
          ★ {row.mood}
        </span>
      ),
    },
    {
      key: 'content',
      label: '내용',
      render: (row) => (
        <div
          title={row.content}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.4,
            fontSize: '13px',
            color: meok[700],
          }}
        >
          {row.content}
        </div>
      ),
    },
    {
      key: 'tags',
      label: '태그',
      width: '150px',
      render: (row) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {row.tags.slice(0, 2).map((t, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: meok[100],
                color: meok[700],
              }}
            >
              #{t}
            </span>
          ))}
          {row.tags.length > 2 && (
            <span
              style={{
                fontSize: '10px',
                padding: '2px 4px',
                borderRadius: '4px',
                backgroundColor: meok[200],
                color: meok[500],
              }}
            >
              +{row.tags.length - 2}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'helpfulCount',
      label: '도움',
      width: '60px',
      align: 'center',
      render: (row) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', color: meok[700] }}>
          {row.helpfulCount}
        </span>
      ),
    },
    {
      key: 'reportCount',
      label: '신고',
      width: '60px',
      align: 'center',
      render: (row) => (
        <span
          style={{
            fontVariantNumeric: 'tabular-nums',
            fontWeight: row.reportCount > 0 ? 700 : 500,
            color: row.reportCount > 0 ? palette.danpung[500] : meok[400],
          }}
        >
          {row.reportCount}
        </span>
      ),
    },
    {
      key: 'status',
      label: '상태',
      width: '80px',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      label: '작성일',
      width: '90px',
      align: 'center',
      render: (row) => (
        <span title={new Date(row.createdAt).toLocaleString()} style={{ fontSize: '12px', color: meok[500] }}>
          {formatRelativeTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '관리',
      width: '70px',
      align: 'center',
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setSelectedReview(row)}
            title="상세 보기"
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              padding: '6px',
              cursor: 'pointer',
              color: meok[500],
              borderRadius: '6px',
            }}
          >
            <IoEllipsisHorizontal size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}

      {/* 상단 복합 필터 바 */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid rgba(78, 89, 104, 0.08)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        {/* 검색 입력 */}
        <div
          style={{
            width: '280px',
            height: '38px',
            borderRadius: '8px',
            border: '1px solid rgba(78, 89, 104, 0.15)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            gap: '8px',
            backgroundColor: '#FFFFFF',
          }}
        >
          <IoSearchOutline size={16} color={meok[400]} />
          <input
            type="text"
            placeholder="닉네임, 장소, 내용 검색"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '13px',
              color: meok[900],
            }}
          />
        </div>

        {/* 상태 셀렉트 */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as any);
            setCurrentPage(1);
          }}
          style={{
            height: '38px',
            padding: '0 12px',
            borderRadius: '8px',
            border: '1px solid rgba(78, 89, 104, 0.15)',
            fontSize: '13px',
            color: meok[700],
            outline: 'none',
            backgroundColor: '#FFFFFF',
          }}
        >
          <option value="ALL">상태: 전체</option>
          <option value="PUBLISHED">게시중</option>
          <option value="HIDDEN">숨김</option>
          <option value="DELETED">삭제됨</option>
        </select>

        {/* 무드 셀렉트 */}
        <select
          value={moodFilter}
          onChange={(e) => {
            setMoodFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            height: '38px',
            padding: '0 12px',
            borderRadius: '8px',
            border: '1px solid rgba(78, 89, 104, 0.15)',
            fontSize: '13px',
            color: meok[700],
            outline: 'none',
            backgroundColor: '#FFFFFF',
          }}
        >
          <option value="ALL">무드: 전체</option>
          <option value="5">★ 5점만</option>
          <option value="4">★ 4점만</option>
          <option value="3">★ 3점만</option>
          <option value="2">★ 2점만</option>
          <option value="1">★ 1점만</option>
        </select>

        {/* 기간 셀렉트 */}
        <select
          value={periodFilter}
          onChange={(e) => {
            setPeriodFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            height: '38px',
            padding: '0 12px',
            borderRadius: '8px',
            border: '1px solid rgba(78, 89, 104, 0.15)',
            fontSize: '13px',
            color: meok[700],
            outline: 'none',
            backgroundColor: '#FFFFFF',
          }}
        >
          <option value="ALL">기간: 전체</option>
          <option value="TODAY">오늘</option>
          <option value="7D">최근 7일</option>
          <option value="30D">최근 30일</option>
        </select>

        {/* 정렬 셀렉트 */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          style={{
            height: '38px',
            padding: '0 12px',
            borderRadius: '8px',
            border: '1px solid rgba(78, 89, 104, 0.15)',
            fontSize: '13px',
            color: meok[700],
            outline: 'none',
            backgroundColor: '#FFFFFF',
          }}
        >
          <option value="latest">최신순</option>
          <option value="helpful">도움순</option>
          <option value="report">신고 많은순</option>
        </select>

        {/* 초기화 버튼 */}
        <button
          type="button"
          onClick={handleResetFilters}
          style={{
            height: '38px',
            padding: '0 14px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: meok[500],
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
          }}
        >
          <IoRefreshOutline size={15} />
          <span>초기화</span>
        </button>

        {/* 검색 결과 건수 */}
        <div style={{ marginLeft: 'auto', fontSize: '12px', color: meok[500] }}>
          총 <strong style={{ color: meok[900] }}>{filteredReviews.length}</strong>건
        </div>
      </div>

      {/* 메인 DataTable */}
      <DataTable
        columns={columns}
        rows={paginatedReviews}
        rowKey={(row) => row.id}
        selectable
        selectedRowKeys={selectedRowKeys}
        onSelectRow={(id, checked) => {
          setSelectedRowKeys((prev) =>
            checked ? [...prev, id] : prev.filter((k) => k !== id)
          );
        }}
        onSelectAll={(checked) => {
          setSelectedRowKeys(checked ? paginatedReviews.map((r) => r.id) : []);
        }}
        onRowClick={(row) => setSelectedReview(row)}
        pagination={{
          currentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
      />

      {/* 하단 일괄 작업 바 (Sticky Bottom) */}
      {selectedRowKeys.length > 0 && (
        <div
          style={{
            position: 'sticky',
            bottom: '20px',
            backgroundColor: meok[900],
            color: '#FFFFFF',
            borderRadius: '12px',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
            zIndex: 90,
            animation: 'adminSlideUp 0.15s ease',
          }}
        >
          <style>{`
            @keyframes adminSlideUp {
              from { transform: translateY(20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>
            {selectedRowKeys.length}개 온기 선택됨
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleBulkHide}
              style={{
                height: '34px',
                padding: '0 14px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              숨기기
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              style={{
                height: '34px',
                padding: '0 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: palette.danpung[500],
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              삭제
            </button>
            <button
              type="button"
              onClick={() => setSelectedRowKeys([])}
              style={{
                height: '34px',
                padding: '0 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: meok[400],
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              선택 해제
            </button>
          </div>
        </div>
      )}

      {/* 우측 슬라이드 인 상세 패널 (400px) */}
      {selectedReview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(2px)',
            zIndex: 200,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setSelectedReview(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '420px',
              height: '100%',
              backgroundColor: '#FFFFFF',
              boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.12)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflowY: 'auto',
              animation: 'adminPanelSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <style>{`
              @keyframes adminPanelSlideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
            `}</style>

            <div>
              {/* 패널 상단 헤더 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '16px',
                  borderBottom: '1px solid rgba(78, 89, 104, 0.08)',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '17px', fontWeight: 700, color: meok[900] }}>
                    온기 상세 정보
                  </span>
                  <StatusBadge status={selectedReview.status} />
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReview(null)}
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    color: meok[500],
                    padding: '4px',
                  }}
                >
                  <IoCloseOutline size={22} />
                </button>
              </div>

              {/* 장소 및 작성자 메타 정보 */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: meok[100],
                  marginBottom: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: meok[500] }}>장소</span>
                  <span style={{ fontWeight: 600, color: meok[900] }}>
                    {selectedReview.place.name} ({selectedReview.place.region})
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: meok[500] }}>작성자</span>
                  <span style={{ fontWeight: 600, color: meok[900] }}>
                    {selectedReview.author.nickname} ({selectedReview.author.email})
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: meok[500] }}>무드 점수</span>
                  <span style={{ fontWeight: 700, color: palette.hwanggeum[700] }}>
                    ★ {selectedReview.mood}.0
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: meok[500] }}>작성 일시</span>
                  <span style={{ color: meok[700] }}>
                    {new Date(selectedReview.createdAt).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: meok[500] }}>신고 횟수</span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: selectedReview.reportCount > 0 ? palette.danpung[500] : meok[700],
                    }}
                  >
                    {selectedReview.reportCount}회
                  </span>
                </div>
              </div>

              {/* 후기 전문 */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: meok[500], marginBottom: '8px' }}>
                  후기 전문
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    color: meok[700],
                    lineHeight: 1.6,
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(78, 89, 104, 0.12)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedReview.content}
                </div>
              </div>

              {/* 첨부 이미지 */}
              {selectedReview.images.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: meok[500], marginBottom: '8px' }}>
                    첨부 이미지 ({selectedReview.images.length}장)
                  </div>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                    {selectedReview.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="후기 사진"
                        style={{
                          width: '100px',
                          height: '100px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid rgba(78, 89, 104, 0.10)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 태그 */}
              {selectedReview.tags.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: meok[500], marginBottom: '8px' }}>
                    등록 태그
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedReview.tags.map((t, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '12px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: meok[100],
                          color: meok[700],
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 하단 개별 조치 버튼 */}
            <div
              style={{
                paddingTop: '20px',
                borderTop: '1px solid rgba(78, 89, 104, 0.08)',
                display: 'flex',
                gap: '8px',
              }}
            >
              {selectedReview.status !== 'PUBLISHED' && (
                <button
                  type="button"
                  onClick={() => updateSingleStatus(selectedReview.id, 'PUBLISHED')}
                  style={{
                    flex: 1,
                    height: '40px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: palette.cheongrok[500],
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  게시 복구
                </button>
              )}

              {selectedReview.status !== 'HIDDEN' && (
                <button
                  type="button"
                  onClick={() => updateSingleStatus(selectedReview.id, 'HIDDEN')}
                  style={{
                    flex: 1,
                    height: '40px',
                    borderRadius: '8px',
                    border: '1px solid rgba(78, 89, 104, 0.15)',
                    backgroundColor: '#FFFFFF',
                    color: meok[700],
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <IoEyeOffOutline size={15} />
                  <span>숨김</span>
                </button>
              )}

              {selectedReview.status !== 'DELETED' && (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmState({
                      isOpen: true,
                      title: '온기 삭제',
                      description: '이 온기를 삭제하시겠습니까? 삭제 시 목록에서 제외됩니다.',
                      isDestructive: true,
                      action: () => updateSingleStatus(selectedReview.id, 'DELETED'),
                    });
                  }}
                  style={{
                    flex: 1,
                    height: '40px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: palette.danpung[500],
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <IoTrashOutline size={15} />
                  <span>삭제</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 확인/위험 모달 */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        description={confirmState.description}
        isDestructive={confirmState.isDestructive}
        onConfirm={() => {
          confirmState.action && confirmState.action();
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
