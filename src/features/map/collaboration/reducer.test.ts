import { describe, it, expect } from 'vitest';
import { reducer, INITIAL_STATE } from './MapCollabProvider';
import type { CollabPin } from './types';

const pin1: CollabPin = {
  pinId: 'pin-1',
  placeId: 'p-test-place',
  placeName: '테스트',
  lat: 36.3,
  lng: 127.7,
  addedBy: 'member-1',
  addedAt: '2026-11-09T03:00:00Z',
  order: 1,
};

const welcomeBase = () =>
  reducer(INITIAL_STATE, {
    type: 'WELCOME',
    payload: {
      room: { id: 'room-1', status: 'ACTIVE', expiresAt: '2026-11-12T03:00:00Z' },
      myMemberId: 'member-1',
      myDisplayName: '승현',
      members: [{ memberId: 'member-1', displayName: '승현' }],
      pins: [],
      lastSeq: 42,
    },
  });

describe('collabReducer', () => {
  it('WELCOME sets room state and sorts pins by order', () => {
    const pin2: CollabPin = { ...pin1, pinId: 'pin-2', order: 0 };
    const state = reducer(INITIAL_STATE, {
      type: 'WELCOME',
      payload: {
        room: { id: 'room-1', status: 'ACTIVE', expiresAt: '2026-11-12T03:00:00Z' },
        myMemberId: 'member-1',
        myDisplayName: '승현',
        members: [{ memberId: 'member-1', displayName: '승현' }],
        pins: [pin1, pin2],
        lastSeq: 42,
      },
    });
    expect(state.wsStatus).toBe('connected');
    expect(state.myMemberId).toBe('member-1');
    expect(state.pins[0].pinId).toBe('pin-2');
    expect(state.lastSeq).toBe(42);
  });

  it('PIN_ADDED adds pin and advances seq', () => {
    const base = welcomeBase();
    const s = reducer(base, { type: 'PIN_ADDED', seq: 43, pin: pin1 });
    expect(s.pins).toHaveLength(1);
    expect(s.pins[0].placeId).toBe('p-test-place');
    expect(s.lastSeq).toBe(43);
  });

  it('PIN_ADDED with duplicate seq is no-op (ACK+EVENT dedup)', () => {
    const base = welcomeBase();
    const s1 = reducer(base, { type: 'PIN_ADDED', seq: 43, pin: pin1 });
    const s2 = reducer(s1, { type: 'PIN_ADDED', seq: 43, pin: pin1 });
    expect(s2.pins).toHaveLength(1);
    expect(s2).toBe(s1);
  });

  it('PIN_ADDED with same pinId but new seq only bumps seq', () => {
    const base = welcomeBase();
    const s1 = reducer(base, { type: 'PIN_ADDED', seq: 43, pin: pin1 });
    const s2 = reducer(s1, { type: 'PIN_ADDED', seq: 44, pin: pin1 });
    expect(s2.pins).toHaveLength(1);
    expect(s2.lastSeq).toBe(44);
  });

  it('PIN_REMOVED removes pin and advances seq', () => {
    const base = { ...welcomeBase(), pins: [pin1], lastSeq: 42 };
    const s = reducer(base, { type: 'PIN_REMOVED', seq: 44, pinId: 'pin-1' });
    expect(s.pins).toHaveLength(0);
    expect(s.lastSeq).toBe(44);
  });

  it('PIN_REMOVED with stale seq is no-op', () => {
    const base = { ...welcomeBase(), pins: [pin1], lastSeq: 44 };
    const s = reducer(base, { type: 'PIN_REMOVED', seq: 43, pinId: 'pin-1' });
    expect(s).toBe(base);
  });

  it('PRESENCE toggles member online status', () => {
    const base = reducer(INITIAL_STATE, {
      type: 'WELCOME',
      payload: {
        room: { id: 'r', status: 'ACTIVE', expiresAt: '' },
        myMemberId: 'm1',
        myDisplayName: 'A',
        members: [{ memberId: 'm1', displayName: 'A' }],
        pins: [],
        lastSeq: 0,
      },
    });
    const s = reducer(base, { type: 'PRESENCE', memberId: 'm1', online: false });
    expect(s.members[0].online).toBe(false);
  });

  it('SNAPSHOT replaces state with new pins and members', () => {
    const base = welcomeBase();
    const s = reducer(base, {
      type: 'SNAPSHOT',
      payload: {
        pins: [pin1],
        lastSeq: 99,
        room: { id: 'room-1', status: 'ACTIVE', expiresAt: '2026-11-12T03:00:00Z' },
        members: [{ memberId: 'm2', displayName: 'B', role: 'OWNER', joinedAt: '', online: true }],
      },
    });
    expect(s.pins).toHaveLength(1);
    expect(s.lastSeq).toBe(99);
    expect(s.members[0].displayName).toBe('B');
  });
});
