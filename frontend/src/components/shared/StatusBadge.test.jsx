import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusBadge from './StatusBadge';

describe('StatusBadge Component', () => {
  it('renders active status correctly with glowing dot', () => {
    render(<StatusBadge status="active" />);
    
    // Check if the text "Aktif" is rendered
    expect(screen.getByText('Aktif')).toBeDefined();
    
    // Check if it has the correct color classes
    const spanElement = screen.getByText('Aktif');
    expect(spanElement.className).toContain('text-green-400');
    expect(spanElement.className).toContain('bg-green-500/10');
  });

  it('renders down status correctly', () => {
    render(<StatusBadge status="down" />);
    expect(screen.getByText('Down')).toBeDefined();
    const spanElement = screen.getByText('Down');
    expect(spanElement.className).toContain('text-red-400');
  });

  it('handles unknown status by rendering the text directly', () => {
    render(<StatusBadge status="unknown_state" />);
    expect(screen.getByText('unknown_state')).toBeDefined();
  });
});
