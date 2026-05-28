import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SuccessPage from './SuccessPage';

describe('SuccessPage', () => {
  it('SUC-1: renders the warehouseId when provided', () => {
    render(<SuccessPage warehouseId={1234} onStartOver={() => {}} />);
    expect(screen.getByText('Warehouse submitted')).toBeInTheDocument();
    expect(screen.getByText('1234')).toBeInTheDocument();
  });

  it('SUC-2: renders an em-dash placeholder when warehouseId is missing', () => {
    render(<SuccessPage onStartOver={() => {}} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('SUC-3: clicking the CTA invokes onStartOver', async () => {
    const onStartOver = vi.fn();
    const user = userEvent.setup();
    render(<SuccessPage warehouseId={1} onStartOver={onStartOver} />);
    await user.click(screen.getByRole('button', { name: /submit another warehouse/i }));
    expect(onStartOver).toHaveBeenCalledTimes(1);
  });
});
