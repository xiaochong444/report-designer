import type { Band } from '../template-model/types';

export interface BandPlan {
  pageBands: {
    pageHeader: Band[];
    pageFooter: Band[];
    overlay: Band[];
  };
  reportBands: {
    reportTitle: Band[];
    reportSummary: Band[];
  };
  dataSections: DataSectionPlan[];
}

export interface DataSectionPlan {
  dataBand: Band;
  headers: Band[];
  groupPairs: Array<{ header: Band; footer?: Band }>;
  columnHeaders: Band[];
  columnFooters: Band[];
  childBands: Band[];
  footers: Band[];
  emptyDataBands: Band[];
}

export interface RenderContext {
  row?: Record<string, unknown>;
  rowIndex: number;
  dataSourceId?: string;
  groupValues: Record<string, unknown>;
  parentRow?: Record<string, unknown>;
  rowsByBand?: Record<string, Record<string, unknown>[]>;
  parameters?: Record<string, unknown>;
}

export type LogicalBandItem =
  | {
      kind: 'band';
      band: Band;
      context: RenderContext;
      repeatOnPageBreakBefore?: Band[];
    }
  | { kind: 'pageBreak'; reason: string };
