import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createDefaultTemplate } from '@report-designer/core';
import { describe, expect, it, vi } from 'vitest';
import { Designer } from '../components/Designer';

describe('Phase 50 designer save callback', () => {
  it('calls host onSave from the built-in quick access save button', async () => {
    const template = createDefaultTemplate('Callback Save');
    const onSave = vi.fn();

    render(<Designer template={template} locale="en-US" onSave={onSave} />);

    await waitFor(() => {
      expect(screen.getByTestId('designer-quick-access')).toHaveTextContent('Callback Save');
    });
    const quickAccess = screen.getByTestId('designer-quick-access');
    const saveButton = quickAccess.querySelector('button');
    expect(saveButton).toBeTruthy();

    fireEvent.click(saveButton as HTMLButtonElement);

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].name).toBe('Callback Save');
  });
});
