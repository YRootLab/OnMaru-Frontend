import type { JourneySseFrame } from '../api/journeyContract';

type RawFrame = {
  id?: string;
  event: string;
  data: string;
};

function parseData(data: string): unknown {
  try {
    return JSON.parse(data);
  } catch {
    throw new Error('Invalid journey SSE data');
  }
}

function requireReplayId(event: string, id?: string): string {
  if (!id || !/^[1-9][0-9]*$/.test(id)) {
    throw new Error(`Invalid journey SSE id for ${event}`);
  }
  return id;
}

export function parseJourneySseFrame(input: RawFrame): JourneySseFrame {
  const data = parseData(input.data);

  switch (input.event) {
    case 'run.stage':
      return { id: requireReplayId(input.event, input.id), event: input.event, data } as JourneySseFrame;
    case 'run.terminal':
      return { id: requireReplayId(input.event, input.id), event: input.event, data } as JourneySseFrame;
    case 'heartbeat':
      return { id: requireReplayId(input.event, input.id), event: input.event, data } as JourneySseFrame;
    case 'reset':
      return { event: input.event, data } as JourneySseFrame;
    default:
      throw new Error('Unsupported journey SSE event');
  }
}
