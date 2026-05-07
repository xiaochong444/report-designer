/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { JsonDataSourceDialog } from '../components/dialogs/JsonDataSourceDialog';
import { useDesignerStore } from '../store/designer-store';

describe('Phase 5 JSON data source dialog', () => {
  beforeEach(() => {
    useDesignerStore.getState().loadTemplate(createDefaultTemplate('Dialog Test'));
  });

  it('previews pasted JSON and adds inferred JSON data sources', () => {
    render(<JsonDataSourceDialog open onClose={() => {}} />);

    fireEvent.change(screen.getByLabelText('JSON'), {
      target: { value: '{ "employees": [{ "name": "Alice", "department": "Engineering", "salary": 100 }] }' },
    });

    expect(screen.getByText('employees')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add data sources' }));

    const template = useDesignerStore.getState().template;
    expect(template.dataSources[0]).toMatchObject({ id: 'employees', type: 'json' });
    expect((template.dataSources[0].schema ?? []).map((field) => field.name)).toEqual(['name', 'department', 'salary']);
  });
});
