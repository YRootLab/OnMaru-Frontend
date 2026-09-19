'use client';

// ============================================================
// 관리자 데이터 파이프라인 화면 (src/app/admin/data/page.tsx)
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { meok, palette } from '@/design-system/tokens';
import { Toast } from '@/features/admin/components/Toast';
import { EmptyState } from '@/features/admin/components/EmptyState';
import { useAdminAuth } from '@/features/admin/hooks/useAdminAuth';
import { mockPipelineStatus } from '@/features/admin/mock/pipeline.mock';
import {
  RefreshCw,
  AlertCircle,
  Download,
  CheckCircle2,
  Square,
  Gauge,
  Layers,
} from 'lucide-react';

export default function AdminDataPipelinePage() {
  const { isAdmin } = useAdminAuth();

  const [pipelineData, setPipelineData] = useState(mockPipelineStatus);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 수동 빌드 시뮬레이션 상태
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildType, setBuildType] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState('');
  const buildTimerRef = useRef<NodeJS.Timeout[]>([]);

  // 타이머 정리
  useEffect(() => {
    return () => {
      buildTimerRef.current.forEach(clearTimeout);
    };
  }, []);

  // 수동 빌드 시작
  const handleStartBuild = (type: string) => {
    setIsBuilding(true);
    setBuildType(type);
    setProgress(5);
    setCurrentStepText(`[${type}] 공공데이터포털 TourAPI 토큰 및 파라미터 검증 중...`);

    const t1 = setTimeout(() => {
      setProgress(25);
      setCurrentStepText(`[${type}] searchKeyword2 엔드포인트 목록 조회 중 (1/17)`);
    }, 600);

    const t2 = setTimeout(() => {
      setProgress(55);
      setCurrentStepText(`[${type}] detailCommon2 상세 정보 수집 중 (87/172)`);
    }, 1400);

    const t3 = setTimeout(() => {
      setProgress(85);
      setCurrentStepText(`[${type}] village-overrides 메타데이터 및 이미지 정합성 병합 중...`);
    }, 2200);

    const t4 = setTimeout(() => {
      setProgress(100);
      setCurrentStepText(`[${type}] 데이터 동기화 완료! 정적 캐시 갱신 중...`);

      setTimeout(() => {
        setIsBuilding(false);
        setPipelineData((prev) => ({
          ...prev,
          lastBuildAt: '방금 전 (성공)',
        }));
        setToastMessage(`[${type}] 데이터 파이프라인 수동 빌드가 성공적으로 완료되었습니다.`);
      }, 500);
    }, 3000);

    buildTimerRef.current = [t1, t2, t3, t4];
  };

  // 수동 빌드 중단
  const handleStopBuild = () => {
    buildTimerRef.current.forEach(clearTimeout);
    setIsBuilding(false);
    setProgress(0);
    setCurrentStepText('');
    setToastMessage('파이프라인 빌드 작업이 사용자에 의해 중단되었습니다.');
  };

  // 실패 로그 JSON 다운로드
  const handleDownloadLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(pipelineData.failureLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `onmaru_pipeline_failure_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setToastMessage('실패 로그 20건이 JSON 파일로 다운로드되었습니다.');
  };

  // 권한 체크: ADMIN 전용
  if (!isAdmin) {
    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
          border: '1px solid rgba(78, 89, 104, 0.08)',
        }}
      >
        <EmptyState
          title="접근 권한이 없습니다"
          description="데이터 파이프라인 및 API 호출 모니터링은 최고 관리자(ADMIN) 전용 메뉴입니다."
          icon={<AlertCircle size={48} color={palette.danpung[500]} strokeWidth={1.8} />}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}

      {/* 1. 상단 현황 카드 3구 그리드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid rgba(78, 89, 104, 0.08)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '13px', color: meok[500], fontWeight: 500 }}>
            마지막 빌드
          </span>
          <div style={{ fontSize: '20px', fontWeight: 700, color: meok[900] }}>
            {pipelineData.lastBuildAt}
          </div>
          <span style={{ fontSize: '12px', color: palette.cheongrok[700] }}>
            정상 주기 (매일 04:00 자동 실행)
          </span>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid rgba(78, 89, 104, 0.08)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '13px', color: meok[500], fontWeight: 500 }}>
            소요 시간
          </span>
          <div style={{ fontSize: '20px', fontWeight: 700, color: meok[900] }}>
            {pipelineData.duration}
          </div>
          <span style={{ fontSize: '12px', color: meok[500] }}>
            전체 230개 엔티티 병합
          </span>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid rgba(78, 89, 104, 0.08)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '13px', color: meok[500], fontWeight: 500 }}>
            결과 상태
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={24} color={palette.cheongrok[500]} strokeWidth={2} />
            <span style={{ fontSize: '20px', fontWeight: 700, color: palette.cheongrok[700] }}>
              성공
            </span>
            <span style={{ fontSize: '13px', color: palette.danpung[500], fontWeight: 600 }}>
              (실패 {pipelineData.failureCount}건)
            </span>
          </div>
          <span style={{ fontSize: '12px', color: meok[500] }}>
            실패 건은 이전 캐시 데이터 유지
          </span>
        </div>
      </div>

      {/* 2. 수동 실행 트리거 바 */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid rgba(78, 89, 104, 0.08)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: meok[900], margin: 0 }}>
              파이프라인 수동 즉시 동기화
            </h3>
            <p style={{ fontSize: '12px', color: meok[500], margin: '4px 0 0' }}>
              공공데이터포털(TourAPI) 원천 데이터를 즉시 조회하여 서비스 캐시를 재구축합니다.
            </p>
          </div>

          {!isBuilding ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleStartBuild('전체 빌드')}
                style={{
                  height: '38px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: palette.juhong[500],
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(235, 94, 40, 0.25)',
                }}
              >
                <RefreshCw size={16} strokeWidth={2} />
                <span>전체 빌드</span>
              </button>
              <button
                type="button"
                onClick={() => handleStartBuild('마을만')}
                style={{
                  height: '38px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(78, 89, 104, 0.2)',
                  backgroundColor: '#FFFFFF',
                  color: meok[700],
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                마을만
              </button>
              <button
                type="button"
                onClick={() => handleStartBuild('숙소만')}
                style={{
                  height: '38px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(78, 89, 104, 0.2)',
                  backgroundColor: '#FFFFFF',
                  color: meok[700],
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                숙소만
              </button>
              <button
                type="button"
                onClick={() => handleStartBuild('루트만')}
                style={{
                  height: '38px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(78, 89, 104, 0.2)',
                  backgroundColor: '#FFFFFF',
                  color: meok[700],
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                루트만
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStopBuild}
              style={{
                height: '38px',
                padding: '0 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: palette.danpung[500],
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Square size={16} strokeWidth={2} />
              <span>중단</span>
            </button>
          )}
        </div>

        {/* 진행률 바 및 텍스트 (실행 중일 때) */}
        {isBuilding && (
          <div
            style={{
              backgroundColor: 'rgba(78, 89, 104, 0.04)',
              borderRadius: '10px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ fontWeight: 600, color: palette.juhong[700] }}>
                {currentStepText}
              </span>
              <span style={{ fontWeight: 700, color: meok[900] }}>{progress}%</span>
            </div>
            <div
              style={{
                height: '8px',
                width: '100%',
                backgroundColor: meok[200],
                borderRadius: '9999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  backgroundColor: palette.juhong[500],
                  borderRadius: '9999px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. 2열 그리드: 수집 현황 테이블 vs API 쿼터 게이지 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
        }}
      >
        {/* 수집 현황 테이블 */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Layers size={18} color={palette.juhong[500]} strokeWidth={2} />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: meok[900], margin: 0 }}>
              콘텐츠 수집 현황
            </h3>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(78, 89, 104, 0.1)', height: '36px', color: meok[500] }}>
                <th>구분</th>
                <th style={{ textAlign: 'right' }}>건수</th>
                <th style={{ textAlign: 'right' }}>이미지 보유</th>
                <th style={{ textAlign: 'right' }}>마지막 갱신</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(78, 89, 104, 0.06)', height: '44px' }}>
                <td style={{ fontWeight: 600, color: meok[900] }}>한옥마을</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{pipelineData.villageCount} 개소</td>
                <td style={{ textAlign: 'right', color: palette.cheongrok[700], fontWeight: 600 }}>
                  {pipelineData.villageImageRate}%
                </td>
                <td style={{ textAlign: 'right', color: meok[500] }}>04:00</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(78, 89, 104, 0.06)', height: '44px' }}>
                <td style={{ fontWeight: 600, color: meok[900] }}>한옥숙소</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{pipelineData.stayCount} 개소</td>
                <td style={{ textAlign: 'right', color: palette.hwanggeum[700], fontWeight: 600 }}>
                  {pipelineData.stayImageRate}%
                </td>
                <td style={{ textAlign: 'right', color: meok[500] }}>04:00</td>
              </tr>
              <tr style={{ height: '44px' }}>
                <td style={{ fontWeight: 600, color: meok[900] }}>추천 루트</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{pipelineData.routeCount} 개 코스</td>
                <td style={{ textAlign: 'right', color: meok[400] }}>-</td>
                <td style={{ textAlign: 'right', color: meok[500] }}>04:00</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* API 호출 쿼터 게이지 */}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Gauge size={18} color={palette.cheongrok[500]} strokeWidth={2} />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: meok[900], margin: 0 }}>
                TourAPI 쿼터 현황 (금일)
              </h3>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: meok[500] }}>
              총합 {pipelineData.apiCallUsed} / {pipelineData.apiCallLimit}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {pipelineData.endpoints.map((ep) => {
              const ratio = ep.used / ep.limit;
              const isWarning = ratio >= 0.8;
              const barColor = isWarning ? palette.danpung[500] : palette.cheongrok[500];

              return (
                <div key={ep.endpoint} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {isWarning && <AlertCircle size={14} color={palette.danpung[500]} strokeWidth={2} />}
                      <span style={{ fontWeight: 600, color: isWarning ? palette.danpung[700] : meok[700] }}>
                        {ep.endpoint}
                      </span>
                    </div>
                    <span style={{ color: isWarning ? palette.danpung[700] : meok[500], fontWeight: isWarning ? 700 : 500 }}>
                      {ep.used} / {ep.limit} ({Math.round(ratio * 100)}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      width: '100%',
                      backgroundColor: meok[200],
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(ratio * 100, 100)}%`,
                        backgroundColor: barColor,
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. 실패 로그 테이블 */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid rgba(78, 89, 104, 0.08)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: meok[900], margin: 0 }}>
              최근 실패 로그 (최근 20건)
            </h3>
            <p style={{ fontSize: '12px', color: meok[500], margin: '4px 0 0' }}>
              수집 파이프라인 작동 중 비정상 응답 혹은 예외가 발생한 기록입니다.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadLogs}
            style={{
              height: '34px',
              padding: '0 14px',
              borderRadius: '6px',
              border: '1px solid rgba(78, 89, 104, 0.2)',
              backgroundColor: '#FFFFFF',
              color: meok[700],
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Download size={15} strokeWidth={2} />
            <span>전체 다운로드 (JSON)</span>
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ height: '36px', borderBottom: '1px solid rgba(78, 89, 104, 0.1)', color: meok[500] }}>
                <th style={{ width: '160px' }}>시각</th>
                <th style={{ width: '150px' }}>엔드포인트</th>
                <th style={{ width: '100px' }}>contentId</th>
                <th>에러 메시지</th>
              </tr>
            </thead>
            <tbody>
              {pipelineData.failureLogs.map((log) => (
                <tr
                  key={log.id}
                  style={{
                    height: '40px',
                    borderBottom: '1px solid rgba(78, 89, 104, 0.06)',
                  }}
                >
                  <td style={{ color: meok[500] }}>{log.timestamp}</td>
                  <td style={{ fontWeight: 600, color: meok[700] }}>{log.endpoint}</td>
                  <td style={{ color: palette.juhong[700], fontWeight: 600 }}>{log.contentId}</td>
                  <td style={{ color: palette.danpung[700] }}>{log.errorMessage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
