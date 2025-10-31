import React from 'react';
import renderer from 'react-test-renderer';
import ChatMessage from '../ChatMessage';

describe('ChatMessage Snapshots', () => {
  test('renders user message', () => {
    const tree = renderer.create(
      <ChatMessage message="Hello from user" isUser={true} />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders assistant message', () => {
    const tree = renderer.create(
      <ChatMessage message="Hello from assistant" isUser={false} />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders user message without avatar', () => {
    const tree = renderer.create(
      <ChatMessage message="No avatar user" isUser={true} showAvatar={false} />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders assistant message without avatar', () => {
    const tree = renderer.create(
      <ChatMessage message="No avatar assistant" isUser={false} showAvatar={false} />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders with motion variants', () => {
    const tree = renderer.create(
      <ChatMessage
        message="Motion message"
        isUser={true}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});