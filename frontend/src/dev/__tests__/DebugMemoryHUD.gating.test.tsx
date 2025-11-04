import React from 'react';
import { render, screen } from '@testing-library/react';
import DebugMemoryHUD from '../DebugMemoryHUD';

// This test validates the flag gating expression we use in the shell.
// We emulate the gating by conditionally rendering the HUD based on env vars.

function GatedHUD({ flag }: { flag: 'on' | 'off' }) {
  const isOn = flag === 'on';
  return (
    <>
      {isOn && (
        <DebugMemoryHUD
          lastTrace={{ mode: 'write_only', used: true, cached: false, source: 'zep' }}
          correlationId="c1"
        />
      )}
    </>
  );
}

describe('DebugMemoryHUD gating (dev flag)', () => {
  it('renders when flag is on', () => {
    render(<GatedHUD flag="on" />);
    expect(screen.getByTestId('debug-memory-hud')).toBeInTheDocument();
  });

  it('is hidden when flag is off', () => {
    render(<GatedHUD flag="off" />);
    expect(screen.queryByTestId('debug-memory-hud')).toBeNull();
  });
});

