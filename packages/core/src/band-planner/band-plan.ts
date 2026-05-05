import type { ReportBandV2 } from '../template-model/v2-types';

export interface BandPlan {
  pageBands: {
    pageHeader: ReportBandV2[];
    pageFooter: ReportBandV2[];
    overlay: ReportBandV2[];
  };
  reportBands: {
    reportTitle: ReportBandV2[];
    reportSummary: ReportBandV2[];
  };
  dataSections: DataSectionPlan[];
}

export interface DataSectionPlan {
  dataBand: ReportBandV2;
  headers: ReportBandV2[];
  groupPairs: Array<{ header: ReportBandV2; footer?: ReportBandV2 }>;
  columnHeaders: ReportBandV2[];
  columnFooters: ReportBandV2[];
  childBands: ReportBandV2[];
  footers: ReportBandV2[];
  emptyDataBands: ReportBandV2[];
}

export interface RenderContextV2 {
  row?: Record<string, unknown>;
  rowIndex: number;
  dataSourceId?: string;
  groupValues: Record<string, unknown>;
  parentRow?: Record<string, unknown>;
}

export type LogicalBandItem =
  | { kind: 'band'; band: ReportBandV2; context: RenderContextV2 }
  | { kind: 'pageBreak'; reason: string };
