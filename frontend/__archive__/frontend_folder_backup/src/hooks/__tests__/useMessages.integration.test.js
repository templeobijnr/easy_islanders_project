import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useMessages, useUnreadCount } from '../useMessages';
import { http } from '../../api';

// Mock the API client
jest.mock('../../api', () => ({
  http: {
    get: jest.fn(),
  },
}));

// Test component that uses the hooks
const TestComponent = ({ threadId }) => {
  const { messages, isLoading, error, hasMore, loadMoreMessages } = useMessages(threadId);
  const { unreadCount, isLoading: unreadLoading } = useUnreadCount();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="unread-loading">{unreadLoading ? 'unread-loading' : 'unread-not-loading'}</div>
      <div data-testid="error">{error ? error.message : 'no-error'}</div>
      <div data-testid="has-more">{hasMore ? 'has-more' : 'no-more'}</div>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="messages-count">{messages.length}</div>
      <button onClick={loadMoreMessages} data-testid="load-more">Load More</button>
      {messages.map((msg, idx) => (
        <div key={idx} data-testid={`message-${idx}`}>{msg.content}</div>
      ))}
    </div>
  );
};

describe('useMessages Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('loads and displays messages for authenticated user', async () => {
    // Set up authenticated state
    localStorage.setItem('token', 'fake-token');

    const mockMessages = [
      { id: 1, content: 'Hello from assistant', type: 'assistant' },
      { id: 2, content: 'How can I help?', type: 'assistant' },
    ];

    http.get
      .mockResolvedValueOnce({ data: { unread_count: 3 } }) // unread count
      .mockResolvedValueOnce({ // messages
        data: { results: mockMessages, next: null },
      });

    render(<TestComponent threadId="thread-123" />);

    // Check initial loading states
    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    expect(screen.getByTestId('unread-loading')).toHaveTextContent('unread-loading');

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      expect(screen.getByTestId('unread-loading')).toHaveTextContent('unread-not-loading');
    });

    // Check data is displayed
    expect(screen.getByTestId('messages-count')).toHaveTextContent('2');
    expect(screen.getByTestId('unread-count')).toHaveTextContent('3');
    expect(screen.getByTestId('message-0')).toHaveTextContent('Hello from assistant');
    expect(screen.getByTestId('message-1')).toHaveTextContent('How can I help?');
    expect(screen.getByTestId('has-more')).toHaveTextContent('no-more');
  });

  test('handles pagination correctly', async () => {
    localStorage.setItem('token', 'fake-token');

    const firstPage = [
      { id: 1, content: 'First message', type: 'assistant' },
    ];
    const secondPage = [
      { id: 2, content: 'Second message', type: 'assistant' },
    ];

    http.get
      .mockResolvedValueOnce({ data: { unread_count: 0 } })
      .mockResolvedValueOnce({ // first page
        data: { results: firstPage, next: 'next-url' },
      })
      .mockResolvedValueOnce({ // second page
        data: { results: secondPage, next: null },
      });

    render(<TestComponent threadId="thread-123" />);

    await waitFor(() => {
      expect(screen.getByTestId('messages-count')).toHaveTextContent('1');
    });

    // Click load more
    fireEvent.click(screen.getByTestId('load-more'));

    await waitFor(() => {
      expect(screen.getByTestId('messages-count')).toHaveTextContent('2');
      expect(screen.getByTestId('has-more')).toHaveTextContent('no-more');
    });

    expect(screen.getByTestId('message-0')).toHaveTextContent('First message');
    expect(screen.getByTestId('message-1')).toHaveTextContent('Second message');
  });

  test('handles API errors gracefully', async () => {
    localStorage.setItem('token', 'fake-token');

    http.get
      .mockRejectedValueOnce(new Error('Network error')) // unread count fails
      .mockRejectedValueOnce(new Error('Messages fetch failed')); // messages fail

    render(<TestComponent threadId="thread-123" />);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Messages fetch failed');
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    // Should still show 0 messages and handle gracefully
    expect(screen.getByTestId('messages-count')).toHaveTextContent('0');
  });

  test('shows 0 unread count when not authenticated', async () => {
    // No token set
    http.get.mockResolvedValue({ data: { unread_count: 5 } }); // This shouldn't be called

    render(<TestComponent threadId="thread-123" />);

    await waitFor(() => {
      expect(screen.getByTestId('unread-loading')).toHaveTextContent('unread-not-loading');
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    });

    // Should not have called the API
    expect(http.get).not.toHaveBeenCalled();
  });
});