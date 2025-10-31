import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatMessage from '../ChatMessage';

describe('ChatMessage', () => {
  test('renders user message with default props', () => {
    render(<ChatMessage message="Hello world" isUser={true} />);
    const message = screen.getByText('Hello world');
    expect(message).toBeInTheDocument();
    expect(message).toHaveClass('bg-blue-600', 'text-white');
  });

  test('renders assistant message with default props', () => {
    render(<ChatMessage message="Hi there!" isUser={false} />);
    const message = screen.getByText('Hi there!');
    expect(message).toBeInTheDocument();
    expect(message).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  test('shows user avatar by default', () => {
    render(<ChatMessage message="Test" isUser={true} />);
    // Check for avatar container (user messages have avatar on the right)
    const avatars = screen.getAllByRole('img', { hidden: true });
    expect(avatars.length).toBeGreaterThan(0);
  });

  test('shows assistant avatar by default', () => {
    render(<ChatMessage message="Test" isUser={false} />);
    // Check for avatar container (assistant messages have avatar on the left)
    const avatars = screen.getAllByRole('img', { hidden: true });
    expect(avatars.length).toBeGreaterThan(0);
  });

  test('hides avatar when showAvatar is false', () => {
    render(<ChatMessage message="Test" isUser={true} showAvatar={false} />);
    const avatars = screen.queryAllByRole('img', { hidden: true });
    expect(avatars.length).toBe(0);
  });

  test('applies custom className', () => {
    render(<ChatMessage message="Test" className="custom-class" />);
    const container = screen.getByText('Test').closest('div');
    expect(container).toHaveClass('custom-class');
  });

  test('passes through additional props', () => {
    render(<ChatMessage message="Test" data-testid="chat-message" />);
    const message = screen.getByTestId('chat-message');
    expect(message).toBeInTheDocument();
  });
});