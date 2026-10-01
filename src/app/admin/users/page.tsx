'use client';





import React, { useState, useMemo } from 'react';
import { meok, palette } from '@/design-system/tokens';
import { DataTable, ColumnDef } from '@/features/admin/components/DataTable';
import { StatusBadge } from '@/features/admin/components/StatusBadge';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { Toast } from '@/features/admin/components/Toast';
import { EmptyState } from '@/features/admin/components/EmptyState';
import { useAdminAuth } from '@/features/admin/hooks/useAdminAuth';
import { useAdminUsers } from '@/features/admin/hooks/useAdminUsers';
import { AdminUser, AdminRole } from '@/features/admin/types';
import { createSanction } from '@/features/admin/api/adminApi';
import {
  Search,
  RotateCcw,
  UserX,
  X,
  Info,
  AlertCircle,
} from 'lucide-react';

export default function AdminUsersPage() {
  const { user: currentUser, isAdmin } = useAdminAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | AdminRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DELETING'>('ALL');
  const [sortBy, setSortBy] = useState<'latest' | 'reviews' | 'reports'>('latest');

  const serverStatus = statusFilter === 'ALL' ? undefined : statusFilter;

  const {
    items: users,
    setItems: setUsers,
    isLoading,
    error: usersError,
    pageNumber,
    hasNext,
    hasPrev,
    goToNextPage,
    goToPrevPage,
    resetAndRefetch,
  } = useAdminUsers({
    status: serverStatus,
    limit: 20,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    user: AdminUser;
    newRole: AdminRole;
  } | null>(null);

  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null);
  const [suspendPeriod, setSuspendPeriod] = useState<'3일' | '7일' | '30일' | '영구'>('7일');
  const [suspendReason, setSuspendReason] = useState('');

  const [activityTarget, setActivityTarget] = useState<AdminUser | null>(null);

  const [unsuspendTarget, setUnsuspendTarget] = useState<AdminUser | null>(null);

  const handleResetFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setSortBy('latest');
  };

  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNick = u.nickname.toLowerCase().includes(q);
          const matchEmail = u.email.toLowerCase().includes(q);
          if (!matchNick && !matchEmail) return false;
        }

        if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'reviews') return b.reviewCount - a.reviewCount;
        if (sortBy === 'reports') return b.reportCount - a.reportCount;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [users, searchQuery, roleFilter, sortBy]);

  const handleConfirmRoleChange = () => {
    if (!roleChangeTarget) return;
    const { user, newRole } = roleChangeTarget;

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
    );
    setToastMessage(`'${user.nickname}' 사용자의 역할이 '${newRole}'(으)로 변경되었습니다.`);
    setRoleChangeTarget(null);
  };

  const handleConfirmSuspend = () => {
    if (!suspendTarget || !suspendReason.trim()) return;

    const durationMap: Record<string, number | undefined> = { '3일': 3, '7일': 7, '30일': 30, '영구': undefined };
    createSanction(suspendTarget.id, {
      type: suspendPeriod === '영구' ? 'PERMANENT_BAN' : 'SUSPENSION',
      reason: suspendReason.trim(),
      durationDays: durationMap[suspendPeriod],
    })
      .then(() => resetAndRefetch())
      .catch(() => {});

    setUsers((prev) =>
      prev.map((u) =>
        u.id === suspendTarget.id
          ? {
              ...u,
              status: 'SUSPENDED',
              suspendReason: suspendReason.trim(),
              suspendedUntil: suspendPeriod === '영구' ? '영구 정지' : `${suspendPeriod} 정지`,
            }
          : u
      )
    );
    setToastMessage(`'${suspendTarget.nickname}' 사용자가 ${suspendPeriod} 정지되었습니다.`);
    setSuspendTarget(null);
    setSuspendReason('');
  };


  const handleConfirmUnsuspend = () => {
    if (!unsuspendTarget) return;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === unsuspendTarget.id
          ? {
              ...u,
              status: 'ACTIVE',
              suspendReason: undefined,
              suspendedUntil: undefined,
            }
          : u
      )
    );
    setToastMessage(`'${unsuspendTarget.nickname}' 사용자의 정지가 해제되었습니다.`);
    setUnsuspendTarget(null);
  };


  if (!isAdmin) {
    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
          border: '1px solid rgba(78, 89, 104, 0.08)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
        }}
      >
        <EmptyState
          title="접근 권한이 없습니다"
          description="사용자 권한 관리 및 제재 화면은 최고 관리자(ADMIN)만 접근할 수 있습니다."
          icon={<AlertCircle size={48} color={palette.danpung[500]} strokeWidth={1.8} />}
        />
      </div>
    );
  }


  const columns: ColumnDef<AdminUser>[] = [
    {
      key: 'nickname',
      label: '닉네임',
      width: 180,
      minWidth: 180,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: row.role === 'ADMIN' ? 'rgba(255, 85, 0, 0.1)' : '#F3F4F6',
              color: row.role === 'ADMIN' ? palette.juhong[600] : meok[700],
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              flexShrink: 0,
            }}
          >
            {row.nickname.slice(0, 1)}
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: meok[900] }}>
            {row.nickname}
          </span>
        </div>
      ),
    },
    {
      key: 'email',
      label: '이메일',
      width: 220,
      minWidth: 200,
      render: (row) => (
        <span style={{ fontSize: '12px', color: meok[600], whiteSpace: 'nowrap' }}>{row.email}</span>
      ),
    },
    {
      key: 'role',
      label: '역할 (권한)',
      width: 120,
      minWidth: 120,
      render: (row) => {
        const isSelf = row.id === currentUser?.id;

        return (
          <select
            value={row.role}
            disabled={isSelf}
            title={isSelf ? '본인 역할은 직접 변경할 수 없습니다' : '클릭하여 역할 변경'}
            onChange={(e) =>
              setRoleChangeTarget({ user: row, newRole: e.target.value as AdminRole })
            }
            style={{
              height: '32px',
              padding: '0 10px',
              borderRadius: '8px',
              border: '1px solid rgba(78, 89, 104, 0.18)',
              backgroundColor: isSelf ? '#F9FAFB' : '#FFFFFF',
              color: isSelf ? meok[400] : meok[900],
              fontSize: '12px',
              fontWeight: 600,
              cursor: isSelf ? 'not-allowed' : 'pointer',
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
            }}
          >
            <option value="ADMIN">ADMIN</option>
            <option value="EDITOR">EDITOR</option>
            <option value="USER">USER</option>
          </select>
        );
      },
    },
    {
      key: 'status',
      label: '상태',
      width: 100,
      minWidth: 100,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'reviewCount',
      label: '작성 온기',
      width: 90,
      minWidth: 90,
      align: 'right',
      render: (row) => (
        <span style={{ fontSize: '13px', fontWeight: 600, color: meok[700], whiteSpace: 'nowrap' }}>
          {row.reviewCount}건
        </span>
      ),
    },
    {
      key: 'reportCount',
      label: '받은 신고',
      width: 90,
      minWidth: 90,
      align: 'right',
      render: (row) => (
        <span
          style={{
            fontSize: '13px',
            fontWeight: row.reportCount > 0 ? 700 : 500,
            color: row.reportCount > 0 ? palette.danpung[500] : meok[400],
            whiteSpace: 'nowrap',
          }}
        >
          {row.reportCount}건
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: '가입일',
      width: 120,
      minWidth: 120,
      render: (row) => (
        <span style={{ fontSize: '12px', color: meok[500], whiteSpace: 'nowrap' }}>
          {new Date(row.createdAt).toLocaleDateString('ko-KR')}
        </span>
      ),
    },
    {
      key: 'lastLoginAt',
      label: '최근 접속',
      width: 120,
      minWidth: 120,
      render: (row) => (
        <span style={{ fontSize: '12px', color: meok[500], whiteSpace: 'nowrap' }}>
          {new Date(row.lastLoginAt).toLocaleDateString('ko-KR')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '관리',
      width: 150,
      minWidth: 150,
      align: 'center',
      render: (row) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center', whiteSpace: 'nowrap' }}>
          <button
            type="button"
            onClick={() => setActivityTarget(row)}
            title="활동 내역 조회"
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(78, 89, 104, 0.18)',
              backgroundColor: '#FFFFFF',
              color: meok[700],
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
            }}
          >
            내역
          </button>

          {row.status === 'ACTIVE' ? (
            <button
              type="button"
              disabled={row.id === currentUser?.id}
              onClick={() => {
                setSuspendTarget(row);
                setSuspendPeriod('7일');
                setSuspendReason('');
              }}
              title={row.id === currentUser?.id ? '본인 계정은 정지할 수 없습니다' : '이용 정지'}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: row.id === currentUser?.id ? '#F3F4F6' : 'rgba(239, 68, 68, 0.08)',
                color: row.id === currentUser?.id ? meok[400] : '#DC2626',
                fontSize: '12px',
                fontWeight: 600,
                cursor: row.id === currentUser?.id ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              정지
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setUnsuspendTarget(row)}
              title="정지 해제"
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                color: '#059669',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              해제
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}
      {usersError && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#fff0f0', color: '#c0392b', fontSize: '13px', border: '1px solid #f5c6cb' }}>
          회원 목록 불러오기 실패: {usersError.message || `${usersError.status} ${usersError.code ?? ''}`}
        </div>
      )}

      {/* Filter Toolbar */}
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
        <div
          style={{
            position: 'relative',
            width: '260px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Search
            size={16}
            color={meok[400]}
            strokeWidth={2}
            style={{ position: 'absolute', left: '12px' }}
          />
          <input
            type="text"
            placeholder="닉네임 또는 이메일 검색"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            style={{
              width: '100%',
              height: '38px',
              paddingLeft: '36px',
              paddingRight: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(78, 89, 104, 0.18)',
              fontSize: '13px',
              outline: 'none',
              color: meok[900],
            }}
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as 'ALL' | AdminRole);
          }}
          style={{
            height: '38px',
            padding: '0 12px',
            borderRadius: '8px',
            border: '1px solid rgba(78, 89, 104, 0.18)',
            fontSize: '13px',
            color: meok[700],
            backgroundColor: '#FFFFFF',
            outline: 'none',
          }}
        >
          <option value="ALL">전체 역할</option>
          <option value="ADMIN">ADMIN (관리자)</option>
          <option value="EDITOR">EDITOR (에디터)</option>
          <option value="USER">USER (일반)</option>
        </select>

        {/* Status Filter (Server Filter) */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'DELETING');
          }}
          style={{
            height: '38px',
            padding: '0 12px',
            borderRadius: '8px',
            border: '1px solid rgba(78, 89, 104, 0.18)',
            fontSize: '13px',
            color: meok[700],
            backgroundColor: '#FFFFFF',
            outline: 'none',
          }}
        >
          <option value="ALL">전체 상태</option>
          <option value="ACTIVE">정상 (ACTIVE)</option>
          <option value="DELETING">탈퇴 진행 (DELETING)</option>
        </select>

        {/* Sort Filter */}
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as 'latest' | 'reviews' | 'reports');
          }}
          style={{
            height: '38px',
            padding: '0 12px',
            borderRadius: '8px',
            border: '1px solid rgba(78, 89, 104, 0.18)',
            fontSize: '13px',
            color: meok[700],
            backgroundColor: '#FFFFFF',
            outline: 'none',
          }}
        >
          <option value="latest">최신 가입순</option>
          <option value="reviews">온기 작성순</option>
          <option value="reports">신고 누적순</option>
        </select>

        <button
          type="button"
          onClick={handleResetFilters}
          style={{
            height: '38px',
            padding: '0 14px',
            borderRadius: '8px',
            border: '1px solid rgba(78, 89, 104, 0.18)',
            backgroundColor: '#FFFFFF',
            color: meok[600],
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background-color 0.15s ease',
          }}
        >
          <RotateCcw size={15} strokeWidth={2} />
          <span>초기화</span>
        </button>

        <div style={{ marginLeft: 'auto', fontSize: '13px', color: meok[500] }}>
          조회 <strong style={{ color: meok[900] }}>{filteredUsers.length}</strong>명
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        rows={filteredUsers}
        rowKey={(u) => u.id}
        loading={isLoading}
        pagination={{
          isCursor: true,
          currentPage: pageNumber,
          hasNext,
          hasPrev,
          onNext: goToNextPage,
          onPrev: goToPrevPage,
        }}
      />

      {}
      <ConfirmDialog
        isOpen={Boolean(roleChangeTarget)}
        title="사용자 역할 변경"
        description={`'${roleChangeTarget?.user.nickname}' 사용자의 역할을 '${roleChangeTarget?.newRole}'(으)로 변경하시겠습니까?\n역할에 따라 관리자 콘솔 접근 범위가 즉시 변경됩니다.`}
        confirmText="역할 변경"
        cancelText="취소"
        onConfirm={handleConfirmRoleChange}
        onCancel={() => setRoleChangeTarget(null)}
      />

      {}
      <ConfirmDialog
        isOpen={Boolean(unsuspendTarget)}
        title="사용자 정지 해제"
        description={`'${unsuspendTarget?.nickname}' 사용자의 정지를 해제하고 정상 상태로 복구하시겠습니까?`}
        confirmText="정지 해제"
        cancelText="취소"
        onConfirm={handleConfirmUnsuspend}
        onCancel={() => setUnsuspendTarget(null)}
      />

      {}
      {suspendTarget && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSuspendTarget(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserX size={20} color={palette.danpung[500]} strokeWidth={2} />
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: meok[900], margin: 0 }}>
                  사용자 이용 정지
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSuspendTarget(null)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: meok[400] }}
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            <div style={{ fontSize: '13px', color: meok[700] }}>
              대상: <strong>{suspendTarget.nickname}</strong> ({suspendTarget.email})
            </div>

            {}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: meok[700] }}>
                정지 기간
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {(['3일', '7일', '30일', '영구'] as const).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setSuspendPeriod(period)}
                    style={{
                      height: '36px',
                      borderRadius: '8px',
                      border:
                        suspendPeriod === period
                          ? `2px solid ${palette.danpung[500]}`
                          : '1px solid rgba(78, 89, 104, 0.2)',
                      backgroundColor:
                        suspendPeriod === period ? palette.danpung[50] : '#FFFFFF',
                      color:
                        suspendPeriod === period ? palette.danpung[700] : meok[700],
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: meok[700] }}>
                정지 사유 (필수)
              </label>
              <textarea
                placeholder="상세 제재 사유를 입력하세요 (이용자에게 고지됩니다)..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={3}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(78, 89, 104, 0.2)',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  outline: 'none',
                  resize: 'none',
                  color: meok[900],
                }}
              />
            </div>

            {}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setSuspendTarget(null)}
                style={{
                  height: '38px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(78, 89, 104, 0.2)',
                  backgroundColor: '#FFFFFF',
                  color: meok[700],
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                type="button"
                disabled={!suspendReason.trim()}
                onClick={handleConfirmSuspend}
                style={{
                  height: '38px',
                  padding: '0 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: suspendReason.trim() ? palette.danpung[500] : meok[200],
                  color: suspendReason.trim() ? '#FFFFFF' : meok[400],
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: suspendReason.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                정지 적용
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {activityTarget && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setActivityTarget(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '500px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={20} color={palette.juhong[500]} strokeWidth={2} />
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: meok[900], margin: 0 }}>
                  사용자 활동 상세
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivityTarget(null)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: meok[400] }}
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(78, 89, 104, 0.04)',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: meok[500] }}>닉네임</span>
                <strong style={{ color: meok[900] }}>{activityTarget.nickname}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: meok[500] }}>이메일</span>
                <span style={{ color: meok[700] }}>{activityTarget.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: meok[500] }}>현재 권한 / 상태</span>
                <span>
                  <strong style={{ color: meok[900], marginRight: '6px' }}>{activityTarget.role}</strong>
                  <StatusBadge status={activityTarget.status} />
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: meok[500] }}>작성 온기(후기)</span>
                <strong style={{ color: palette.cheongrok[700] }}>{activityTarget.reviewCount} 건</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: meok[500] }}>피신고 누적 횟수</span>
                <strong style={{ color: activityTarget.reportCount > 0 ? palette.danpung[500] : meok[700] }}>
                  {activityTarget.reportCount} 건
                </strong>
              </div>
              {activityTarget.suspendReason && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(78, 89, 104, 0.1)' }}>
                  <div style={{ color: palette.danpung[700], fontWeight: 600, fontSize: '12px' }}>
                    정지 사유: {activityTarget.suspendReason}
                  </div>
                  <div style={{ color: meok[500], fontSize: '11px', marginTop: '2px' }}>
                    기간: {activityTarget.suspendedUntil}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setActivityTarget(null)}
                style={{
                  height: '38px',
                  padding: '0 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: palette.juhong[500],
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
