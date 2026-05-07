/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { GroupWizardDialog } from '../components/dialogs/GroupWizardDialog';
import { useDesignerStore } from '../store/designer-store';

describe('Phase 5 group wizard', () => {
  beforeEach(() => {
    const template = createDefaultTemplate('Group Wizard');
    template.dataSources = [{
      id: 'employees',
      name: 'employees',
      type: 'json',
      schema: [
        { name: 'department', type: 'string' },
        { name: 'salary', type: 'number' },
      ],
    }];
    template.pages[0].bands.find((band) => band.type === 'data')!.dataBand = { dataSourceId: 'employees' };
    useDesignerStore.getState().loadTemplate(template);
  });

  it('adds group header/footer totals and sort metadata for a selected field', () => {
    render(<GroupWizardDialog open onClose={() => {}} />);

    fireEvent.mouseDown(screen.getByText('employees.department'));
    fireEvent.click(screen.getByRole('button', { name: 'Create group' }));

    const bands = useDesignerStore.getState().template.pages[0].bands;
    expect(bands.find((band) => band.type === 'groupHeader')?.group?.name).toBe('department');
    expect(bands.find((band) => band.type === 'groupFooter')?.components.map((component: any) => component.text).join(' ')).toContain('SUM("employees"');
    expect(bands.find((band) => band.type === 'data')?.dataBand?.sort?.[0]).toMatchObject({ field: 'department', direction: 'asc' });
  });
});
