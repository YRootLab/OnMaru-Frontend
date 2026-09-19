'use client';

// ============================================================
// 관리자 큐레이션 관리 화면 (src/app/admin/curation/page.tsx)
// ============================================================

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { meok, palette } from '@/design-system/tokens';
import { DataTable, ColumnDef } from '@/features/admin/components/DataTable';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { Toast } from '@/features/admin/components/Toast';
import {
  CurationItem,
  CurationCategory,
  HanokCurationType,
} from '@/features/admin/types';
import {
  mockVillages,
  mockStays,
  mockRoutes,
  CURATION_PRESET_BADGES,
} from '@/features/admin/mock/curation.mock';
import {
  Search,
  RotateCcw,
  X,
  Plus,
  ImageIcon,
  CloudUpload,
} from 'lucide-react';

export default function AdminCurationPage() {
  const [activeCategory, setActiveCategory] = useState<CurationCategory>('VILLAGE');

  // 데이터셋 상태
  const [villages, setVillages] = useState<CurationItem[]>(mockVillages);
  const [stays, setStays] = useState<CurationItem[]>(mockStays);
  const [routes, setRoutes] = useState<CurationItem[]>(mockRoutes);

  // 변경된 아이템 ID 세트 (미반영 상태)
  const [modifiedIds, setModifiedIds] = useState<Set<string>>(new Set());

  // 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | HanokCurationType>('ALL');
  const [includedFilter, setIncludedFilter] = useState<'ALL' | 'INCLUDED' | 'EXCLUDED'>('ALL');
  const [imageFilter, setImageFilter] = useState<'ALL' | 'HAS_IMAGE' | 'NO_IMAGE'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // 인라인 이름 편집 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // 뱃지 추가 팝오버 상태
  const [badgePopoverId, setBadgePopoverId] = useState<string | null>(null);
  const [customBadgeInput, setCustomBadgeInput] = useState('');

  // 알림 및 모달
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isApplyConfirmOpen, setIsApplyConfirmOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [lastAppliedTime, setLastAppliedTime] = useState('2026.08.04 04:00');

  // 현재 활성 카테고리의 원본 리스트
  const currentCategoryList = useMemo(() => {
    switch (activeCategory) {
      case 'VILLAGE':
        return villages;
      case 'STAY':
        return stays;
      case 'ROUTE':
        return routes;
    }
  }, [activeCategory, villages, stays, routes]);

  // 업데이트 헬퍼
  const updateItem = (id: string, updates: Partial<CurationItem>) => {
    const updater = (prev: CurationItem[]) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            ...updates,
            lastModifiedBy: '관리자(본인)',
            lastModifiedAt: '방금 전',
            isModifiedLocally: true,
          };
        }
        return item;
      });

    if (activeCategory === 'VILLAGE') setVillages(updater);
    else if (activeCategory === 'STAY') setStays(updater);
    else setRoutes(updater);

    setModifiedIds((prev) => new Set(prev).add(id));
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setIncludedFilter('ALL');
    setImageFilter('ALL');
    setCurrentPage(1);
  };

  // 필터링 적용 목록
  const filteredList = useMemo(() => {
    return currentCategoryList.filter((item) => {
      // 검색 필터
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchRegion = item.region.toLowerCase().includes(q);
        if (!matchName && !matchRegion) return false;
      }

      // 유형 필터
      if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;

      // 포함 필터
      if (includedFilter === 'INCLUDED' && !item.isIncluded) return false;
      if (includedFilter === 'EXCLUDED' && item.isIncluded) return false;

      // 이미지 필터
      if (imageFilter === 'HAS_IMAGE' && !item.thumbnail) return false;
      if (imageFilter === 'NO_IMAGE' && Boolean(item.thumbnail)) return false;

      return true;
    });
  }, [currentCategoryList, searchQuery, typeFilter, includedFilter, imageFilter]);

  // 페이지네이션 슬라이스
  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  // 변경사항 반영 실행
  const handleApplyChanges = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setIsApplyConfirmOpen(false);
      const count = modifiedIds.size;
      setModifiedIds(new Set());
      setLastAppliedTime(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
      setToastMessage(`변경사항 ${count}건이 서비스 데이터에 성공적으로 반영되었습니다.`);
    }, 1200);
  };

  // 뱃지 추가
  const handleAddBadge = (item: CurationItem, badge: string) => {
    if (!badge.trim() || item.badges.includes(badge.trim())) return;
    updateItem(item.id, { badges: [...item.badges, badge.trim()] });
    setCustomBadgeInput('');
  };

  // 뱃지 제거
  const handleRemoveBadge = (item: CurationItem, badgeToRemove: string) => {
    updateItem(item.id, { badges: item.badges.filter((b) => b !== badgeToRemove) });
  };

  // 이름 인라인 수정 저장
  const handleSaveName = (item: CurationItem) => {
    if (editingName.trim() && editingName !== item.name) {
      updateItem(item.id, { name: editingName.trim() });
    }
    setEditingId(null);
  };

  // 테이블 컬럼 정의
  const columns: ColumnDef<CurationItem>[] = [
    {
      key: 'modifiedIndicator',
      label: '',
      width: 24,
      align: 'center',
      render: (row) =>
        modifiedIds.has(row.id) ? (
          <div
            title="미반영 변경사항 있음"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: palette.juhong[500],
              margin: '0 auto',
            }}
          />
        ) : null,
    },
    {
      key: 'thumbnail',
      label: '썸네일',
      width: 64,
      align: 'center',
      render: (row) => (
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '6px',
            overflow: 'hidden',
            backgroundColor: meok[100],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
          }}
        >
          {row.thumbnail ? (
            <Image
              src={row.thumbnail}
              alt={row.name}
              width={44}
              height={44}
              unoptimized
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <ImageIcon size={20} color={meok[400]} strokeWidth={1.8} />
          )}
        </div>
      ),
    },
    {
      key: 'name',
      label: '이름 (별칭)',
      width: 210,
      render: (row) => {
        const isEditing = editingId === row.id;

        if (isEditing) {
          return (
            <input
              type="text"
              value={editingName}
              autoFocus
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={() => handleSaveName(row)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName(row);
                if (e.key === 'Escape') setEditingId(null);
              }}
              style={{
                width: '100%',
                height: '32px',
                padding: '0 8px',
                borderRadius: '6px',
                border: `1.5px solid ${palette.juhong[500]}`,
                fontSize: '13px',
                fontWeight: 600,
                color: meok[900],
                outline: 'none',
              }}
            />
          );
        }

        return (
          <div
            onClick={() => {
              setEditingId(row.id);
              setEditingName(row.name);
            }}
            title="클릭하여 명칭 수정"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600, color: meok[900] }}>
              {row.name}
            </span>
          </div>
        );
      },
    },
    {
      key: 'region',
      label: '지역',
      width: 110,
      render: (row) => (
        <span style={{ fontSize: '12px', color: meok[500] }}>{row.region}</span>
      ),
    },
    {
      key: 'type',
      label: '유형',
      width: 120,
      render: (row) => (
        <select
          value={row.type}
          onChange={(e) => updateItem(row.id, { type: e.target.value as HanokCurationType })}
          style={{
            height: '30px',
            padding: '0 8px',
            borderRadius: '6px',
            border: '1px solid rgba(78, 89, 104, 0.2)',
            backgroundColor: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 600,
            color: meok[700],
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="URBAN">도심형</option>
          <option value="CLAN">집성촌형</option>
          <option value="EXPERIENCE">체험형</option>
        </select>
      ),
    },
    {
      key: 'badges',
      label: '특징 뱃지',
      render: (row) => {
        const isPopoverOpen = badgePopoverId === row.id;

        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '4px',
              position: 'relative',
            }}
          >
            {row.badges.map((badge, idx) => (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 500,
                  backgroundColor: 'rgba(78, 89, 104, 0.08)',
                  color: meok[700],
                }}
              >
                <span>{badge}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveBadge(row, badge)}
                  title="뱃지 삭제"
                  style={{
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: meok[500],
                  }}
                >
                  <X size={12} strokeWidth={2} />
                </button>
              </span>
            ))}

            {/* 뱃지 추가 버튼 */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setBadgePopoverId(isPopoverOpen ? null : row.id)}
                title="뱃지 추가"
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '4px',
                  border: '1px dashed rgba(78, 89, 104, 0.3)',
                  backgroundColor: '#FFFFFF',
                  color: meok[500],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} strokeWidth={2} />
              </button>

              {/* 뱃지 추가 팝오버 */}
              {isPopoverOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '28px',
                    left: 0,
                    zIndex: 100,
                    width: '260px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                    border: '1px solid rgba(78, 89, 104, 0.12)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, color: meok[900] }}>
                    추천 뱃지 선택
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                    {CURATION_PRESET_BADGES.map((preset) => {
                      const hasIt = row.badges.includes(preset);
                      return (
                        <button
                          key={preset}
                          type="button"
                          disabled={hasIt}
                          onClick={() => handleAddBadge(row, preset)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid rgba(78, 89, 104, 0.15)',
                            backgroundColor: hasIt ? meok[100] : '#FFFFFF',
                            color: hasIt ? meok[400] : meok[700],
                            fontSize: '11px',
                            cursor: hasIt ? 'default' : 'pointer',
                          }}
                        >
                          {preset} {hasIt && '✓'}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    <input
                      type="text"
                      placeholder="직접 입력..."
                      value={customBadgeInput}
                      onChange={(e) => setCustomBadgeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddBadge(row, customBadgeInput);
                      }}
                      style={{
                        flex: 1,
                        height: '28px',
                        padding: '0 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(78, 89, 104, 0.2)',
                        fontSize: '11px',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddBadge(row, customBadgeInput)}
                      style={{
                        padding: '0 10px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: palette.juhong[500],
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      추가
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'isIncluded',
      label: '포함',
      width: 70,
      align: 'center',
      render: (row) => (
        <label
          style={{
            position: 'relative',
            display: 'inline-block',
            width: '36px',
            height: '20px',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={row.isIncluded}
            onChange={(e) => updateItem(row.id, { isIncluded: e.target.checked })}
            style={{ opacity: 0, width: 0, height: 0 }}
          />
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: row.isIncluded ? palette.cheongrok[500] : meok[200],
              borderRadius: '20px',
              transition: '0.2s',
            }}
          >
            <span
              style={{
                position: 'absolute',
                content: '""',
                height: '14px',
                width: '14px',
                left: row.isIncluded ? '19px' : '3px',
                bottom: '3px',
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: '0.2s',
              }}
            />
          </span>
        </label>
      ),
    },
    {
      key: 'lastModified',
      label: '최종 수정',
      width: 120,
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: meok[700] }}>
            {row.lastModifiedBy}
          </span>
          <span style={{ fontSize: '10px', color: meok[400] }}>
            {row.lastModifiedAt}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}

      {/* 상단 탭 및 우측 변경사항 반영 버튼 바 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid rgba(78, 89, 104, 0.12)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('VILLAGE');
              setCurrentPage(1);
            }}
            style={{
              height: '40px',
              padding: '0 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeCategory === 'VILLAGE' ? palette.juhong[500] : '#FFFFFF',
              color: activeCategory === 'VILLAGE' ? '#FFFFFF' : meok[700],
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: activeCategory === 'VILLAGE' ? '0 2px 6px rgba(235, 94, 40, 0.25)' : 'none',
              transition: 'all 0.12s ease',
            }}
          >
            한옥마을 {villages.length}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory('STAY');
              setCurrentPage(1);
            }}
            style={{
              height: '40px',
              padding: '0 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeCategory === 'STAY' ? palette.juhong[500] : '#FFFFFF',
              color: activeCategory === 'STAY' ? '#FFFFFF' : meok[700],
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: activeCategory === 'STAY' ? '0 2px 6px rgba(235, 94, 40, 0.25)' : 'none',
              transition: 'all 0.12s ease',
            }}
          >
            한옥숙소 172
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory('ROUTE');
              setCurrentPage(1);
            }}
            style={{
              height: '40px',
              padding: '0 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeCategory === 'ROUTE' ? palette.juhong[500] : '#FFFFFF',
              color: activeCategory === 'ROUTE' ? '#FFFFFF' : meok[700],
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: activeCategory === 'ROUTE' ? '0 2px 6px rgba(235, 94, 40, 0.25)' : 'none',
              transition: 'all 0.12s ease',
            }}
          >
            추천 루트 41
          </button>
        </div>

        {/* 우측 변경사항 반영 버튼 및 마지막 시각 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: meok[500] }}>
            마지막 반영: {lastAppliedTime}
          </span>

          <button
            type="button"
            disabled={modifiedIds.size === 0}
            onClick={() => setIsApplyConfirmOpen(true)}
            style={{
              height: '40px',
              padding: '0 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: modifiedIds.size > 0 ? palette.juhong[500] : meok[200],
              color: modifiedIds.size > 0 ? '#FFFFFF' : meok[500],
              fontSize: '13px',
              fontWeight: 700,
              cursor: modifiedIds.size > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: modifiedIds.size > 0 ? '0 2px 8px rgba(235, 94, 40, 0.3)' : 'none',
              transition: 'all 0.12s ease',
            }}
          >
            <CloudUpload size={16} strokeWidth={2} />
            <span>변경사항 반영</span>
            {modifiedIds.size > 0 && (
              <span
                style={{
                  backgroundColor: '#FFFFFF',
                  color: palette.juhong[700],
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 800,
                }}
              >
                {modifiedIds.size}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 필터 바 */}
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
            width: '240px',
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
            placeholder="명칭, 지역 검색..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              height: '38px',
              paddingLeft: '36px',
              paddingRight: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(78, 89, 104, 0.15)',
              fontSize: '13px',
              outline: 'none',
              color: meok[900],
            }}
          />
        </div>

        {/* 유형 필터 */}
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as 'ALL' | HanokCurationType);
            setCurrentPage(1);
          }}
          style={{
            height: '38px',
            padding: '0 12px',
            borderRadius: '8px',
            border: '1px solid rgba(78, 89, 104, 0.15)',
            fontSize: '13px',
            color: meok[700],
            backgroundColor: '#FFFFFF',
            outline: 'none',
          }}
        >
          <option value="ALL">유형: 전체</option>
          <option value="URBAN">도심형</option>
          <option value="CLAN">집성촌형</option>
          <option value="EXPERIENCE">체험형</option>
        </select>

        {/* 포함 여부 필터 */}
        <select
          value={includedFilter}
          onChange={(e) => {
            setIncludedFilter(e.target.value as 'ALL' | 'INCLUDED' | 'EXCLUDED');
            setCurrentPage(1);
          }}
          style={{
            height: '38px',
            padding: '0 12px',
            borderRadius: '8px',
            border: '1px solid rgba(78, 89, 104, 0.15)',
            fontSize: '13px',
            color: meok[700],
            backgroundColor: '#FFFFFF',
            outline: 'none',
          }}
        >
          <option value="ALL">포함: 전체</option>
          <option value="INCLUDED">포함만</option>
          <option value="EXCLUDED">제외만</option>
        </select>

        {/* 이미지 보유 여부 필터 */}
        <select
          value={imageFilter}
          onChange={(e) => {
            setImageFilter(e.target.value as 'ALL' | 'HAS_IMAGE' | 'NO_IMAGE');
            setCurrentPage(1);
          }}
          style={{
            height: '38px',
            padding: '0 12px',
            borderRadius: '8px',
            border: '1px solid rgba(78, 89, 104, 0.15)',
            fontSize: '13px',
            color: meok[700],
            backgroundColor: '#FFFFFF',
            outline: 'none',
          }}
        >
          <option value="ALL">이미지: 전체</option>
          <option value="HAS_IMAGE">이미지 있음</option>
          <option value="NO_IMAGE">이미지 없음</option>
        </select>

        <button
          type="button"
          onClick={handleResetFilters}
          style={{
            height: '38px',
            padding: '0 14px',
            borderRadius: '8px',
            border: '1px solid rgba(78, 89, 104, 0.15)',
            backgroundColor: 'transparent',
            color: meok[500],
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <RotateCcw size={15} strokeWidth={2} />
          <span>초기화</span>
        </button>
      </div>

      {/* 테이블 */}
      <DataTable
        columns={columns}
        rows={paginatedList}
        rowKey={(r) => r.id}
        pagination={{
          currentPage,
          totalPages,
          onPageChange: (p) => setCurrentPage(p),
        }}
      />

      {/* 변경사항 반영 확인 모달 */}
      <ConfirmDialog
        isOpen={isApplyConfirmOpen}
        title="큐레이션 변경사항 반영"
        description={`수정된 변경사항 ${modifiedIds.size}건을 서비스 데이터에 반영하시겠습니까?\n데이터 재빌드가 실행되며 3~5분 소요됩니다.`}
        confirmText="반영 및 재빌드"
        cancelText="취소"
        isLoading={isApplying}
        onConfirm={handleApplyChanges}
        onCancel={() => setIsApplyConfirmOpen(false)}
      />
    </div>
  );
}
