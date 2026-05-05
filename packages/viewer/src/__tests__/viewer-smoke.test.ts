import { describe, expect, it } from 'vitest';
import { Viewer } from '../components/Viewer';
import { exportToPDF, printReport } from '../export';

describe('Viewer package smoke test', () => {
  it('exports the viewer and report actions', () => {
    expect(typeof Viewer).toBe('function');
    expect(typeof exportToPDF).toBe('function');
    expect(typeof printReport).toBe('function');
  });
});
