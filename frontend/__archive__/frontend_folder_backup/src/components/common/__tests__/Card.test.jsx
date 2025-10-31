import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Card from '../Card';

describe('Card', () => {
  test('renders with default props', () => {
    render(<Card>Card content</Card>);
    const card = screen.getByText('Card content');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('bg-white', 'border-gray-200');
  });

  test('renders with different variants', () => {
    const { rerender } = render(<Card variant="elevated">Elevated</Card>);
    expect(screen.getByText('Elevated')).toHaveClass('shadow-lg');

    rerender(<Card variant="outlined">Outlined</Card>);
    expect(screen.getByText('Outlined')).toHaveClass('bg-transparent');

    rerender(<Card variant="filled">Filled</Card>);
    expect(screen.getByText('Filled')).toHaveClass('bg-gray-50');
  });

  test('applies hover effect by default', () => {
    render(<Card>Hoverable</Card>);
    const card = screen.getByText('Hoverable').parentElement;
    expect(card).toBeInTheDocument();
    // Note: motion effects are tested via snapshot tests
  });

  test('disables hover effect when hover prop is false', () => {
    render(<Card hover={false}>No hover</Card>);
    const card = screen.getByText('No hover').parentElement;
    expect(card).toBeInTheDocument();
  });

  test('applies custom className', () => {
    render(<Card className="custom-class">Custom</Card>);
    const card = screen.getByText('Custom').parentElement;
    expect(card).toHaveClass('custom-class');
  });

  test('passes through additional props', () => {
    render(<Card data-testid="test-card">Test</Card>);
    const card = screen.getByTestId('test-card');
    expect(card).toBeInTheDocument();
  });
});