import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Chip from '../Chip';

describe('Chip', () => {
  test('renders with default props', () => {
    render(<Chip>Default Chip</Chip>);
    const chip = screen.getByText('Default Chip');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveClass('bg-gray-100');
  });

  test('renders with different variants', () => {
    const { rerender } = render(<Chip variant="primary">Primary</Chip>);
    expect(screen.getByText('Primary')).toHaveClass('bg-blue-100');

    rerender(<Chip variant="success">Success</Chip>);
    expect(screen.getByText('Success')).toHaveClass('bg-green-100');

    rerender(<Chip variant="danger">Danger</Chip>);
    expect(screen.getByText('Danger')).toHaveClass('bg-red-100');
  });

  test('renders with different sizes', () => {
    const { rerender } = render(<Chip size="sm">Small</Chip>);
    expect(screen.getByText('Small')).toHaveClass('px-2', 'py-1');

    rerender(<Chip size="lg">Large</Chip>);
    expect(screen.getByText('Large')).toHaveClass('px-4', 'py-2');
  });

  test('renders removable chip with remove button', () => {
    const handleRemove = jest.fn();
    render(<Chip removable onRemove={handleRemove}>Removable</Chip>);
    const removeButton = screen.getByRole('button');
    expect(removeButton).toBeInTheDocument();
    fireEvent.click(removeButton);
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });

  test('does not render remove button when not removable', () => {
    render(<Chip>Non-removable</Chip>);
    const removeButton = screen.queryByRole('button');
    expect(removeButton).not.toBeInTheDocument();
  });

  test('applies custom className', () => {
    render(<Chip className="custom-class">Custom</Chip>);
    const chip = screen.getByText('Custom');
    expect(chip).toHaveClass('custom-class');
  });
});