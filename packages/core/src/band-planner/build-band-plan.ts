import type { ReportBandV2, ReportTemplateV2 } from '../template-model/v2-types';
import type { BandPlan, DataSectionPlan } from './band-plan';

interface PendingBands {
  headers: ReportBandV2[];
  groupHeaders: ReportBandV2[];
  columnHeaders: ReportBandV2[];
  emptyDataBands: ReportBandV2[];
}

export function buildBandPlan(template: ReportTemplateV2): BandPlan {
  const plan: BandPlan = {
    pageBands: { pageHeader: [], pageFooter: [], overlay: [] },
    reportBands: { reportTitle: [], reportSummary: [] },
    dataSections: [],
  };

  for (const page of template.pages) {
    const pending = createPendingBands();
    let currentSection: DataSectionPlan | undefined;

    for (const band of page.bands) {
      switch (band.type) {
        case 'pageHeader':
          plan.pageBands.pageHeader.push(band);
          break;
        case 'pageFooter':
          plan.pageBands.pageFooter.push(band);
          break;
        case 'overlay':
          plan.pageBands.overlay.push(band);
          break;
        case 'reportTitle':
          plan.reportBands.reportTitle.push(band);
          break;
        case 'reportSummary':
          plan.reportBands.reportSummary.push(band);
          break;
        case 'header':
          pending.headers.push(band);
          break;
        case 'groupHeader':
          pending.groupHeaders.push(band);
          break;
        case 'columnHeader':
          pending.columnHeaders.push(band);
          break;
        case 'data':
        case 'hierarchicalData':
          currentSection = createDataSection(band, pending);
          plan.dataSections.push(currentSection);
          resetPendingBands(pending);
          break;
        case 'groupFooter':
          if (currentSection) {
            attachGroupFooter(currentSection, band);
          }
          break;
        case 'footer':
          currentSection?.footers.push(band);
          break;
        case 'columnFooter':
          currentSection?.columnFooters.push(band);
          break;
        case 'child':
          currentSection?.childBands.push(band);
          break;
        case 'emptyData':
          if (currentSection) {
            currentSection.emptyDataBands.push(band);
          } else {
            pending.emptyDataBands.push(band);
          }
          break;
      }
    }
  }

  return plan;
}

function createDataSection(dataBand: ReportBandV2, pending: PendingBands): DataSectionPlan {
  return {
    dataBand,
    headers: [...pending.headers],
    groupPairs: pending.groupHeaders.map((header) => ({ header })),
    columnHeaders: [...pending.columnHeaders],
    columnFooters: [],
    childBands: [],
    footers: [],
    emptyDataBands: [...pending.emptyDataBands],
  };
}

function attachGroupFooter(section: DataSectionPlan, footer: ReportBandV2): void {
  const groupName = footer.group?.name;
  const pair = [...section.groupPairs]
    .reverse()
    .find((candidate) => !candidate.footer && (!groupName || candidate.header.group?.name === groupName));

  if (pair) {
    pair.footer = footer;
  }
}

function createPendingBands(): PendingBands {
  return { headers: [], groupHeaders: [], columnHeaders: [], emptyDataBands: [] };
}

function resetPendingBands(pending: PendingBands): void {
  pending.headers = [];
  pending.groupHeaders = [];
  pending.columnHeaders = [];
  pending.emptyDataBands = [];
}
