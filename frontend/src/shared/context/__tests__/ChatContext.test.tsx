import React from 'react';
import { render, act } from '@testing-library/react';
import { ChatProvider, useChat } from '../ChatContext';

describe('ChatContext realtime envelope handling', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      // @ts-expect-error restore
      delete global.fetch;
    }
    jest.clearAllMocks();
  });

  const setup = () => {
    let context: ReturnType<typeof useChat> | null = null;
    const Capture: React.FC = () => {
      context = useChat();
      return null;
    };

    render(
      <ChatProvider>
        <Capture />
      </ChatProvider>
    );

    if (!context) throw new Error('Context not initialized');
    return context;
  };

  test('test_resolves_pending_on_in_reply_to', async () => {
    const context = setup();

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 202,
      json: async () => ({ ok: true, thread_id: 'thread-123' }),
    });
    global.fetch = fetchMock as any;

    const uuidSpy = global.crypto && 'randomUUID' in global.crypto
      ? jest.spyOn(global.crypto, 'randomUUID').mockReturnValue('client-msg-1')
      : undefined;

    await act(async () => {
      context.setConnectionStatus('connected');
      context.setInput('Hello there');
      await context.send();
    });

    const frame = {
      type: 'chat_message',
      event: 'assistant_message',
      thread_id: 'thread-123',
      payload: { text: 'Hi from server', rich: {} },
      meta: { in_reply_to: 'client-msg-1', queued_message_id: 'assistant-1' },
    } as any;

    act(() => {
      context.pushAssistantMessage(frame);
    });

    const ids = context.messages.map((m) => m.id);
    expect(ids).toContain('client-msg-1');
    expect(ids).toContain('assistant-1');

    const pendingUser = context.messages.find((m) => m.id === 'client-msg-1');
    expect(pendingUser?.pending).toBe(false);

    const assistant = context.messages.find((m) => m.id === 'assistant-1');
    expect(assistant?.inReplyTo).toBe('client-msg-1');
    expect(assistant?.text).toBe('Hi from server');

    uuidSpy?.mockRestore();
  });

  test('test_ignores_frame_missing_in_reply_to', () => {
    const context = setup();
    const initialLength = context.messages.length;

    const invalidFrame = {
      type: 'chat_message',
      event: 'assistant_message',
      thread_id: 'thread-123',
      payload: { text: 'No meta', rich: {} },
      meta: {},
    } as any;

    act(() => {
      context.pushAssistantMessage(invalidFrame);
    });

    expect(context.messages.length).toBe(initialLength);
  });
});
