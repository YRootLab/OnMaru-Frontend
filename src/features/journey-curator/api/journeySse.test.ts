import { describe, expect, it, vi } from 'vitest';
import { createJourneyRepository, type JourneyEventSourceFactory } from './journeyApi';
import type { JourneySseFrame } from './journeyContract';

type FakeListener = (event: { lastEventId?: string; data: string }) => void;

/** 브라우저 EventSource를 흉내 낸 테스트 더블. addEventListener로 등록된 핸들러를 emit()으로 직접 호출한다. */
class FakeEventSource {
  listeners = new Map<string, Set<FakeListener>>();
  closed = false;

  addEventListener(type: string, listener: FakeListener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: FakeListener) {
    this.listeners.get(type)?.delete(listener);
  }

  close() {
    this.closed = true;
  }

  emit(type: string, event: { lastEventId?: string; data: string }) {
    this.listeners.get(type)?.forEach((listener) => listener(event));
  }
}

describe('journey repository actions/SSE (FE #93)', () => {
  it('applies a PIN action with csrf and idempotency key', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = createJourneyRepository((async (path: string, options: unknown) => {
      calls.push({ path, options });
      return { schemaVersion: '1.2', id: 'exp-1', stateVersion: 3 };
    }) as never);

    await repository.applyAction({
      explorationId: 'exp-1',
      baseVersion: 2,
      action: { type: 'PIN', resourceRef: { type: 'PLACE', id: 'p-1' } },
      idempotencyKey: 'key-1',
    });

    expect(calls).toEqual([
      {
        path: '/explorations/exp-1/actions',
        options: {
          method: 'POST',
          body: {
            commandId: undefined,
            baseVersion: 2,
            action: { type: 'PIN', resourceRef: { type: 'PLACE', id: 'p-1' } },
          },
          csrf: true,
          idempotencyKey: 'key-1',
        },
      },
    ]);
  });

  it('subscribes to run events and decodes frames through the pure SSE parser', () => {
    const repository = createJourneyRepository();
    const fake = new FakeEventSource();
    const createEventSource: JourneyEventSourceFactory = () => fake as unknown as EventSource;

    const received: JourneySseFrame[] = [];
    const unsubscribe = repository.subscribeToRunEvents('exp-1', 'run-1', (frame) => received.push(frame), {
      createEventSource,
    });

    fake.emit('run.stage', { lastEventId: '1', data: JSON.stringify({ schemaVersion: '1.2', runId: 'run-1', sequence: 1, status: 'RUNNING', stage: 'RETRIEVING' }) });
    fake.emit('run.terminal', { lastEventId: '2', data: JSON.stringify({ schemaVersion: '1.2', runId: 'run-1', sequence: 2, status: 'COMPLETED', outcome: 'INITIAL_BOARD' }) });

    expect(received).toHaveLength(2);
    expect(received[0]).toMatchObject({ event: 'run.stage', data: { stage: 'RETRIEVING' } });
    expect(received[1]).toMatchObject({ event: 'run.terminal', data: { status: 'COMPLETED' } });

    unsubscribe();
    expect(fake.closed).toBe(true);
  });

  it('reports parse failures through onError instead of throwing into the caller', () => {
    const repository = createJourneyRepository();
    const fake = new FakeEventSource();
    const createEventSource: JourneyEventSourceFactory = () => fake as unknown as EventSource;
    const onError = vi.fn();

    repository.subscribeToRunEvents('exp-1', 'run-1', () => {}, { createEventSource, onError });

    fake.emit('run.stage', { lastEventId: '1', data: 'not json' });

    expect(onError).toHaveBeenCalledTimes(1);
  });
});
