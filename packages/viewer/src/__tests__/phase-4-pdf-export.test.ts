import { describe, expect, it } from 'vitest';
import { exportRenderDocumentToPDF } from '../export/pdf/export-render-document';
import { makeRenderDocument } from './phase-4-helpers';

describe('Phase 4 PDF export', () => {
  it('exports a RenderDocument PDF byte array', async () => {
    const bytes = await exportRenderDocumentToPDF(makeRenderDocument());

    expect(bytes.byteLength).toBeGreaterThan(500);
  });
});
