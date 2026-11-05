import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { STATUS_ORDER } from '@/lib/status';
import { PaymentChip, StatusChip } from './Badge';
import { Money } from './Money';

describe('status and payment chips', () => {
  it('always carry a text label, so status never relies on color alone', () => {
    const labels = ['Received', 'Washing', 'Drying', 'Folding', 'Ready for Pickup', 'Completed'];
    STATUS_ORDER.forEach((status, index) => {
      const { unmount } = render(<StatusChip status={status} dot />);
      expect(screen.getByText(labels[index] as string)).toBeInTheDocument();
      unmount();
    });
  });

  it('shows the short label when space is tight', () => {
    render(<StatusChip status="ready_for_pickup" short />);
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('labels payment states', () => {
    render(<PaymentChip status="partial" suffix=" · ₱167.50 due" />);
    expect(screen.getByText('Partial · ₱167.50 due')).toBeInTheDocument();
  });
});

describe('Money', () => {
  it('formats centavos as pesos and warns only when something is due', () => {
    const { rerender } = render(<Money cents={16750} warnIfDue />);
    expect(screen.getByText('₱167.50')).toHaveClass('text-warn');
    rerender(<Money cents={0} warnIfDue />);
    expect(screen.getByText('₱0.00')).not.toHaveClass('text-warn');
  });
});
