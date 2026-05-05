import { buildBandPlan, executeBandPlan } from '../band-planner';
import type { LogicalBandItem, RenderContextV2 } from '../band-planner';
import { layoutBand } from '../layout-engine/layout-band';
import type { RenderBandBox, RenderDocument, RenderPage } from '../render-document/types';
import type { ReportBandV2, ReportPageV2, ReportTemplateV2 } from '../template-model/v2-types';
import { applyPageNumberPass } from './page-number-pass';

export function renderReportV2(
  template: ReportTemplateV2,
  data: Record<string, Record<string, unknown>[]>,
): RenderDocument {
  const templatePage = template.pages[0];
  const plan = buildBandPlan(template);
  const logicalItems = executeBandPlan(plan, data);
  const pages = paginateV2(templatePage, plan.pageBands, logicalItems);
  return applyPageNumberPass({ pages });
}

export function paginateV2(
  templatePage: ReportPageV2,
  pageBands: ReturnType<typeof buildBandPlan>['pageBands'],
  logicalItems: LogicalBandItem[],
): RenderPage[] {
  const pages: RenderPage[] = [];
  const printableX = templatePage.margins.left;
  const printableWidth = templatePage.width - templatePage.margins.left - templatePage.margins.right;
  const footerHeight = pageBands.pageFooter.reduce((sum, band) => sum + band.height, 0);
  const pageBottomY = templatePage.height - templatePage.margins.bottom - footerHeight;
  const repeatedGroups: ReportBandV2[] = [];
  let currentPage: RenderPage | undefined;
  let cursorY = 0;

  const newPage = () => {
    currentPage = {
      id: `${templatePage.id}-${pages.length + 1}`,
      pageNumber: pages.length + 1,
      totalPages: 0,
      width: templatePage.width,
      height: templatePage.height,
      items: [],
    };
    pages.push(currentPage);
    cursorY = templatePage.margins.top;
    for (const header of pageBands.pageHeader) {
      placeBand(header, createEmptyContext(), true);
    }
    for (const groupHeader of repeatedGroups) {
      placeBand(groupHeader, createEmptyContext(), true);
    }
  };

  const ensurePage = () => {
    if (!currentPage) {
      newPage();
    }
  };

  const placeBand = (band: ReportBandV2, context: RenderContextV2, force = false): RenderBandBox => {
    ensurePage();
    const preview = layoutBand(band, { x: printableX, y: cursorY, width: printableWidth, context });
    if (!force && cursorY + preview.height > pageBottomY && currentPage!.items.length > 0) {
      newPage();
    }

    const box = layoutBand(band, { x: printableX, y: cursorY, width: printableWidth, context });
    currentPage!.items.push(box);
    cursorY += box.height;
    return box;
  };

  for (const item of logicalItems) {
    if (item.kind === 'pageBreak') {
      newPage();
      continue;
    }

    if (item.band.type === 'groupHeader' && item.band.behavior.printOnAllPages) {
      if (!repeatedGroups.some((band) => band.id === item.band.id)) {
        repeatedGroups.push(item.band);
      }
    }

    if (item.band.type === 'groupFooter') {
      const estimated = item.band.height;
      if (cursorY + estimated > pageBottomY && currentPage?.items.length) {
        newPage();
      }
    }

    placeBand(item.band, item.context);

    if (item.band.type === 'groupFooter') {
      const groupHeaderId = item.band.group?.groupHeaderId;
      const groupName = item.band.group?.name;
      const index = repeatedGroups.findIndex((band) => (
        groupHeaderId ? band.id === groupHeaderId : band.group?.name === groupName
      ));
      if (index >= 0) {
        repeatedGroups.splice(index, 1);
      }
    }
  }

  if (!currentPage) {
    newPage();
  }

  for (const page of pages) {
    for (const overlay of pageBands.overlay) {
      page.items.unshift(layoutBand(overlay, { x: printableX, y: templatePage.margins.top, width: printableWidth, context: createEmptyContext() }));
    }

    let footerY = templatePage.height - templatePage.margins.bottom - footerHeight;
    for (const footer of pageBands.pageFooter) {
      const box = layoutBand(footer, { x: printableX, y: footerY, width: printableWidth, context: createEmptyContext() });
      page.items.push(box);
      footerY += box.height;
    }
  }

  return pages;
}

function createEmptyContext(): RenderContextV2 {
  return {
    rowIndex: 0,
    groupValues: {},
  };
}
