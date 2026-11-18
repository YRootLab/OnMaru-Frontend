import { describe, expect, it } from 'vitest';
import { shouldShowJourneyConversation } from './homeConversationMode';

describe('shouldShowJourneyConversation', () => {
  it('opens the conversational journey after a valid home query', () => {
    expect(shouldShowJourneyConversation({ requested: true, explorationId: null })).toBe(true);
  });

  it('keeps the discovery home visible before a query', () => {
    expect(shouldShowJourneyConversation({ requested: false, explorationId: null })).toBe(false);
  });

  it('opens a conversation selected from the URL', () => {
    expect(shouldShowJourneyConversation({ requested: false, explorationId: 'exploration-1' })).toBe(true);
  });
});
