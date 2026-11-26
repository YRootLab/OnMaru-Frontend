'use client';

import { useEffect, useState } from 'react';
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { isStale, type JourneyProgress, type JourneyProgressStep } from '../domain/journeyProgress';
import { getPreparingCopy, getStepCopy, getStepDoneCopy, getTerminalNotices, type TerminalNoticeInput } from '../domain/journeyStepCopy';

/** 지연 여부를 다시 계산하는 주기. 20초 기준을 최대 5초 늦게 반영한다. */
const STALE_CHECK_INTERVAL_MS = 5_000;
const RECONNECT_COPY = '연결을 다시 확인하고 있어요';

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const MARK: Record<JourneyProgressStep['state'], string> = {
  done: '✓',
  active: '',
  stopped: '–',
};

type Props = {
  progress: JourneyProgress;
  onToggle?: () => void;
};

export default function JourneyProgressTimeline({ progress, onToggle }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (progress.finished) return;
    const timer = setInterval(() => setNow(Date.now()), STALE_CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [progress.finished]);

  if (progress.finished) {
    return <FinishedView progress={progress} onToggle={onToggle} />;
  }

  const stale = progress.reconnecting || isStale(progress, now);
  const activeStep = progress.steps.find((step) => step.state === 'active');
  const activeLabel = activeStep ? getStepCopy(activeStep.stage)?.active : getPreparingCopy();

  return (
    <Wrap>
      <StepList aria-label="진행 단계">
        {progress.steps.map((step) => (
          <StepItem key={step.stage} step={step} />
        ))}
      </StepList>
      {stale && <StaleLine>{RECONNECT_COPY}</StaleLine>}
      {/* 단계가 바뀔 때만 읽히도록 현재 단계 문구만 live 영역에 둔다. */}
      <VisuallyHidden aria-live="polite">{stale ? RECONNECT_COPY : activeLabel}</VisuallyHidden>
    </Wrap>
  );
}

function FinishedView({ progress, onToggle }: { progress: JourneyProgress; onToggle?: () => void }) {
  const notices = getTerminalNotices({
    status: progress.status as TerminalNoticeInput['status'],
    outcome: progress.outcome,
    errorCode: progress.errorCode,
    retryAfterMs: progress.retryAfterMs,
    engine: progress.engine,
  });
  const expanded = !progress.collapsed;

  return (
    <Wrap>
      {progress.steps.length > 0 && (
        <ToggleButton type="button" aria-expanded={expanded} onClick={onToggle}>
          {expanded ? '정리 과정 접기' : '정리 과정 보기'}
        </ToggleButton>
      )}
      {expanded && (
        <StepList aria-label="진행 단계">
          {progress.steps.map((step) => (
            <StepItem key={step.stage} step={step} />
          ))}
        </StepList>
      )}
      {notices.map((notice) => (
        <Notice key={notice}>{notice}</Notice>
      ))}
    </Wrap>
  );
}

function StepItem({ step }: { step: JourneyProgressStep }) {
  const copy = getStepCopy(step.stage);
  const label = step.state === 'done' ? getStepDoneCopy(step.stage, step.count) : step.state === 'stopped' ? copy?.done : copy?.active;
  return (
    <StepRow data-state={step.state}>
      <StepMark aria-hidden data-spinning={step.state === 'active' ? 'true' : undefined}>
        {MARK[step.state]}
      </StepMark>
      <span>{label}</span>
    </StepRow>
  );
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: #555;

  [data-theme='dark'] & {
    color: rgba(216, 229, 255, 0.7);
  }
`;

const StepList = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StepRow = styled.li`
  display: flex;
  align-items: center;
  gap: 8px;

  &[data-state='stopped'] {
    color: #999;
  }
`;

const StepMark = styled.span`
  width: 14px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ff5500;
  font-size: 12px;
  font-weight: 700;

  &[data-spinning='true'] {
    border: 2px solid rgba(255, 85, 0, 0.25);
    border-top-color: #ff5500;
    border-radius: 50%;
    animation: ${spin} 0.9s linear infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    &[data-spinning='true'] {
      animation: none;
    }
  }
`;

const StaleLine = styled.p`
  margin: 0;
  color: #888;
`;

const ToggleButton = styled.button`
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: #ff5500;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
`;

const Notice = styled.p`
  margin: 0;
  color: #888;
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`;
