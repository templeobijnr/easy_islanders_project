import React from 'react';
import { render, screen } from '@testing-library/react';
import DebugMemoryHUD from '../DebugMemoryHUD';

describe('DebugMemoryHUD (component)', () => {
  it('renders with provided trace', () => {
    render(
      <DebugMemoryHUD
        lastTrace={{ mode: 'read_write', used: true, cached: false, took_ms: 12, source: 'zep', client_ids: { user: 'u', assistant: 'a' } }}
        correlationId="corr-123"
      />
    );
    expect(screen.getByTestId('debug-memory-hud')).toBeInTheDocument();
    expect(screen.getByText('read_write')).toBeInTheDocument();
  });

  it('returns null when no trace provided', () => {
    const { container } = render(<DebugMemoryHUD lastTrace={null} correlationId={null} />);
    expect(container.firstChild).toBeNull();
  });
});

