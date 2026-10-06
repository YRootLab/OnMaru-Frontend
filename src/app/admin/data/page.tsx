'use client';

import React from 'react';
import { AlertCircleIcon, CheckmarkCircle01Icon, RefreshCwIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { meok, palette } from '@/design-system/tokens';
import { EmptyState } from '@/features/admin/components/EmptyState';
import { useAdminAuth } from '@/features/admin/hooks/useAdminAuth';
import { useAdminPipeline } from '@/features/admin/hooks/useAdminPipeline';
import { formatPipelineDuration, getAdminPipelineErrorPresentation, getPipelineStatusPresentation } from '@/features/admin/services/adminPipelinePresentation';

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid rgba(78, 89, 104, 0.08)', padding: '20px',
};

function formatDateTime(value: string | null): string {
  if (!value) return '이력 없음';
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul',
  }).format(new Date(value));
}

function LoadingConsole() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} aria-label="파이프라인 상태 로딩 중">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {[0, 1, 2].map((item) => <div key={item} style={{ ...cardStyle, height: '130px', boxSizing: 'border-box', backgroundColor: '#f5f5f4' }} />)}
      </div>
      <div style={{ ...cardStyle, height: '94px', boxSizing: 'border-box', backgroundColor: '#f5f5f4' }} />
      <div style={{ ...cardStyle, height: '220px', boxSizing: 'border-box', backgroundColor: '#f5f5f4' }} />
    </div>
  );
}

export default function AdminDataPipelinePage() {
  const { isAdmin } = useAdminAuth();
  const pipeline = useAdminPipeline();

  if (!isAdmin) {
    return (
      <div style={{ ...cardStyle, padding: '48px 24px', textAlign: 'center' }}>
        <EmptyState title="접근 권한이 없습니다" description="데이터 파이프라인 모니터링은 최고 관리자(ADMIN) 전용 메뉴입니다." icon={<HugeiconsIcon icon={AlertCircleIcon} size={48} color={palette.danpung[500]} strokeWidth={1.8} />} />
      </div>
    );
  }
  if (pipeline.loading) return <LoadingConsole />;
  if (!pipeline.status) {
    const message = pipeline.error ? getAdminPipelineErrorPresentation(pipeline.error) : { title: '파이프라인 상태를 불러오지 못했어요.', description: '잠시 후 다시 시도해 주세요.' };
    return (
      <div style={{ ...cardStyle, padding: '48px 24px', textAlign: 'center' }}>
        <EmptyState title={message.title} description={message.description} icon={<HugeiconsIcon icon={AlertCircleIcon} size={48} color={palette.danpung[500]} strokeWidth={1.8} />} />
        <button type="button" onClick={pipeline.refresh} style={{ marginTop: '18px', height: '38px', padding: '0 16px' }}>다시 시도</button>
      </div>
    );
  }

  const { status, run } = pipeline;
  const state = getPipelineStatusPresentation(run?.status ?? status.status);
  const statusColor = state.tone === 'danger' ? palette.danpung[700] : state.tone === 'success' ? palette.cheongrok[700] : meok[700];
  const errorMessage = pipeline.error ? getAdminPipelineErrorPresentation(pipeline.error) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', color: meok[900] }}>데이터 파이프라인 상태</h2>
          <p style={{ margin: '6px 0 0', color: meok[500], fontSize: '13px' }}>수집은 Backend scheduler가 관리합니다. 이 화면에서는 저장된 실행 이력만 조회합니다.</p>
        </div>
        <button type="button" onClick={pipeline.refresh} disabled={pipeline.refreshing} aria-label="상태 새로고침" style={{ height: '38px', padding: '0 14px', borderRadius: '8px', border: '1px solid rgba(78, 89, 104, 0.18)', backgroundColor: '#FFFFFF', color: meok[700], fontWeight: 600, cursor: pipeline.refreshing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <HugeiconsIcon icon={RefreshCwIcon} size={16} strokeWidth={2} />
          {pipeline.refreshing ? '확인 중...' : '상태 새로고침'}
        </button>
      </div>

      {errorMessage && <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#f5f5f4', color: meok[700], fontSize: '13px' }}><strong>{errorMessage.title}</strong> {errorMessage.description}</div>}

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '13px', color: meok[500], marginBottom: '8px' }}>마지막 성공</div>
          <div style={{ fontSize: '19px', fontWeight: 700, color: meok[900] }}>{formatDateTime(status.lastSuccessAt)}</div>
          <div style={{ fontSize: '12px', color: meok[500], marginTop: '8px' }}>dataset: {status.dataset}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '13px', color: meok[500], marginBottom: '8px' }}>최근 실행 소요 시간</div>
          <div style={{ fontSize: '19px', fontWeight: 700, color: meok[900] }}>{run ? formatPipelineDuration(run.durationSeconds) : '실행 이력 없음'}</div>
          <div style={{ fontSize: '12px', color: meok[500], marginTop: '8px' }}>{run?.startedAt ? `${formatDateTime(run.startedAt)} 시작` : '시작 시각 없음'}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '13px', color: meok[500], marginBottom: '8px' }}>최근 실행 결과</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={22} color={statusColor} strokeWidth={2} />
            <span style={{ fontSize: '19px', fontWeight: 700, color: statusColor }}>{state.label}</span>
            <span style={{ fontSize: '13px', color: status.failureCount > 0 ? palette.danpung[600] : meok[500] }}>실패 항목 {status.failureCount}건</span>
          </div>
          <div style={{ fontSize: '12px', color: meok[500], marginTop: '8px' }}>누적 실패 실행 {status.cumulativeFailureRunCount}회</div>
        </div>
      </section>

      {run?.progress && (
        <section style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: meok[700] }}>
            <strong>{run.progress.currentStage ?? '처리 중'}</strong>
            <span>{run.progress.total === null ? `${run.progress.completed}건 처리` : `${run.progress.completed} / ${run.progress.total}`}</span>
          </div>
          {run.progress.percent !== null && <div style={{ height: '8px', marginTop: '12px', borderRadius: '999px', backgroundColor: '#e5e5e3', overflow: 'hidden' }}><div style={{ width: `${Math.min(100, run.progress.percent)}%`, height: '100%', backgroundColor: palette.cheongrok[500] }} /></div>}
        </section>
      )}

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: '15px', color: meok[900] }}>콘텐츠 수집 현황</h3>
          {status.contentStats == null ? <div style={{ padding: '42px 0', textAlign: 'center', color: meok[500], fontSize: '13px' }}>집계 준비 중</div> : <div style={{ marginTop: '20px', display: 'grid', gap: '10px', fontSize: '13px' }}><div>한옥마을 <strong>{status.contentStats.villageCount ?? '집계되지 않음'}</strong></div><div>한옥숙소 <strong>{status.contentStats.stayCount ?? '집계되지 않음'}</strong></div><div>추천 루트 <strong>{status.contentStats.routeCount ?? '집계되지 않음'}</strong></div></div>}
        </div>
        <div style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: '15px', color: meok[900] }}>TourAPI 쿼터 현황</h3>
          {status.apiUsage == null ? <div style={{ padding: '42px 0', textAlign: 'center', color: meok[500], fontSize: '13px' }}>계측 준비 중</div> : <div style={{ marginTop: '20px', color: meok[700], fontSize: '13px' }}>사용량 {status.apiUsage.used ?? '계측되지 않음'} / {status.apiUsage.limit ?? '한도 미제공'}</div>}
        </div>
      </section>

      <section style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div><h3 style={{ margin: 0, fontSize: '15px', color: meok[900] }}>최근 실행 실패 로그</h3><p style={{ margin: '4px 0 0', fontSize: '12px', color: meok[500] }}>최근 실행 실패 {pipeline.failureTotalCount}건 · Backend가 정제한 진단 정보만 표시합니다.</p></div>
        {run === null ? <div style={{ padding: '34px 0', textAlign: 'center', color: meok[500], fontSize: '13px' }}>실행 이력이 없습니다.</div> : pipeline.failureTotalCount === 0 ? <div style={{ padding: '34px 0', textAlign: 'center', color: meok[500], fontSize: '13px' }}>최근 실행에서 기록된 실패가 없습니다.</div> : pipeline.failures.length === 0 ? <div style={{ padding: '34px 0', textAlign: 'center', color: meok[500], fontSize: '13px' }}>실패 상세 기록을 불러오지 못했습니다.</div> : (
          <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}><thead><tr style={{ height: '36px', borderBottom: '1px solid rgba(78, 89, 104, 0.1)', color: meok[500] }}><th>시각</th><th>오류 코드</th><th>엔드포인트</th><th>contentId</th><th>메시지</th><th>재시도</th></tr></thead><tbody>{pipeline.failures.map((failure) => <tr key={failure.id} style={{ height: '44px', borderBottom: '1px solid rgba(78, 89, 104, 0.06)' }}><td style={{ color: meok[500], whiteSpace: 'nowrap' }}>{formatDateTime(failure.occurredAt)}</td><td style={{ color: palette.danpung[700], fontWeight: 600 }}>{failure.errorCode}</td><td>{failure.endpoint ?? '근거 없음'}</td><td>{failure.contentId ?? '근거 없음'}</td><td>{failure.message}</td><td>{failure.retryable ? '가능' : '불가'}</td></tr>)}</tbody></table></div>
        )}
        {pipeline.hasNextFailures && <button type="button" onClick={pipeline.loadMoreFailures} disabled={pipeline.loadingMore} style={{ alignSelf: 'center', height: '36px', padding: '0 16px', borderRadius: '8px', border: '1px solid #d9d9d7', backgroundColor: '#FFFFFF' }}>{pipeline.loadingMore ? '불러오는 중...' : '실패 로그 더 보기'}</button>}
      </section>
    </div>
  );
}
