'use client';





import React from 'react';
import { meok, palette } from '@/design-system/tokens';
import { TableSkeleton } from './TableSkeleton';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  label: string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedRowKeys?: string[];
  onSelectRow?: (id: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  loading?: boolean;
  empty?: React.ReactNode;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  selectable = false,
  selectedRowKeys = [],
  onSelectRow,
  onSelectAll,
  loading = false,
  empty,
  pagination,
  sortColumn,
  sortDirection,
  onSort,
  className,
}: DataTableProps<T>) {
  const isAllSelected = rows.length > 0 && rows.every((r) => selectedRowKeys.includes(rowKey(r)));
  const isSomeSelected =
    rows.some((r) => selectedRowKeys.includes(rowKey(r))) && !isAllSelected;

  return (
    <div
      className={className}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid rgba(78, 89, 104, 0.08)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
          }}
        >
          <thead>
            <tr
              style={{
                height: '44px',
                backgroundColor: 'rgba(78, 89, 104, 0.03)',
                fontSize: '12px',
                fontWeight: 600,
                color: meok[500],
                borderBottom: '1px solid rgba(78, 89, 104, 0.08)',
                userSelect: 'none',
              }}
            >
              {selectable && (
                <th
                  style={{
                    width: '40px',
                    padding: '0 12px 0 16px',
                    textAlign: 'center',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                    aria-label="전체 행 선택"
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                      accentColor: palette.juhong[500],
                    }}
                  />
                </th>
              )}

              {columns.map((col) => {
                const isSorted = sortColumn === col.key;
                return (
                  <th
                    key={col.key}
                    aria-sort={
                      isSorted
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                    onClick={() => col.sortable && onSort && onSort(col.key)}
                    style={{
                      width: col.width,
                      padding: '0 16px',
                      textAlign: col.align || 'left',
                      cursor: col.sortable ? 'pointer' : 'default',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: isSorted ? meok[900] : meok[500],
                      }}
                    >
                      <span>{col.label}</span>
                      {col.sortable && isSorted && (
                        <span style={{ display: 'inline-flex' }}>
                          {sortDirection === 'asc' ? (
                            <ChevronUp size={12} strokeWidth={2.2} />
                          ) : (
                            <ChevronDown size={12} strokeWidth={2.2} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  style={{ padding: 0 }}
                >
                  <TableSkeleton rowCount={8} colCount={columns.length} />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  style={{ padding: '20px 0' }}
                >
                  {empty || <EmptyState />}
                </td>
              </tr>
            ) : (
              rows.map((row, rIdx) => {
                const id = rowKey(row);
                const isSelected = selectedRowKeys.includes(id);

                return (
                  <tr
                    key={id}
                    onClick={() => onRowClick && onRowClick(row)}
                    style={{
                      height: '64px',
                      borderBottom: '1px solid rgba(78, 89, 104, 0.06)',
                      backgroundColor: isSelected
                        ? 'rgba(255, 85, 0, 0.02)'
                        : '#FFFFFF',
                      cursor: onRowClick ? 'pointer' : 'default',
                      transition: 'background-color 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor =
                          'rgba(78, 89, 104, 0.02)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                      }
                    }}
                  >
                    {selectable && (
                      <td
                        style={{
                          width: '40px',
                          padding: '0 12px 0 16px',
                          textAlign: 'center',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) =>
                            onSelectRow && onSelectRow(id, e.target.checked)
                          }
                          aria-label={`행 ${rIdx + 1} 선택`}
                          style={{
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer',
                            accentColor: palette.juhong[500],
                          }}
                        />
                      </td>
                    )}

                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{
                          width: col.width,
                          padding: '0 16px',
                          textAlign: col.align || 'left',
                          fontSize: '13px',
                          color: meok[700],
                        }}
                      >
                        {col.render
                          ? col.render(row, rIdx)
                          : ((row as any)[col.key] ?? '-')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && !loading && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}
