import { ScriptLine } from '../types/odii.types';

export function parseScriptToLines(script: string, totalPlayTimeSec: number): ScriptLine[] {
  const rawLines = (script || '').split('\n').filter((l) => l.trim().length > 0);
  if (rawLines.length === 0) return [];

  const step = Math.max(1, totalPlayTimeSec / rawLines.length);
  return rawLines.map((text, idx) => ({
    id: idx + 1,
    timeSec: Math.floor(idx * step),
    text: text.trim(),
  }));
}
