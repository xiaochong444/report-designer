import { buildBandPlan, executeBandPlan } from '../band-planner';
import type { LogicalBandItem, RenderContext } from '../band-planner';
import { layoutBand } from '../layout-engine/layout-band';
import type { RenderBandBox, RenderDocument, RenderPage } from '../render-document/types';
import type { Band, Page, ReportTemplate } from '../template-model/types';
import { normalizeTemplate } from '../template-model';
import { applyPageNumberPass } from './page-number-pass';

export function renderReport(
  template: ReportTemplate,
  data: Record<string, Record<string, unknown>[]>,
): RenderDocument {
  const normalizedTemplate = normalizeTemplate(template);
  const templatePage = normalizedTemplate.pages[0];
  const plan = buildBandPlan(normalizedTemplate);
  const logicalItems = executeBandPlan(plan, data);
  const pages = paginate(templatePage, plan.pageBands, logicalItems, data, normalizedTemplate.styles);
  return applyPageNumberPass({ pages });
}

export function paginate(
  templatePage: Page,
  pageBands: ReturnType<typeof buildBandPlan>['pageBands'],
  logicalItems: LogicalBandItem[],
  rowsByBand: Record<string, Record<string, unknown>[]> = {},
  styles: ReportTemplate['styles'] = [],
): RenderPage[] {
  const pages: RenderPage[] = [];
  const printableX = templatePage.margins.left;
  const printableWidth = templatePage.width - templatePage.margins.left - templatePage.margins.right;
  const footerHeight = pageBands.pageFooter.reduce((sum, band) => sum + band.height, 0);
  const pageBottomY = templatePage.height - templatePage.margins.bottom - footerHeight;
  const repeatedGroups: Band[] = [];
  const pageRows = new WeakMap<RenderPage, Record<string, Record<string, unknown>[]>>();
  let activeSectionRepeatBands: Band[] = [];
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
    pageRows.set(currentPage, {});
    cursorY = templatePage.margins.top;
    for (const header of pageBands.pageHeader) {
      placeBand(header, createEmptyContext(), true);
    }
    for (const groupHeader of repeatedGroups) {
      placeBand(groupHeader, createEmptyContext(), true);
    }
    for (const sectionBand of activeSectionRepeatBands) {
      placeBand(sectionBand, createEmptyContext(), true);
    }
  };

  const ensurePage = () => {
    if (!currentPage) {
      newPage();
    }
  };

  const placeBand = (band: Band, context: RenderContext, force = false): RenderBandBox => {
    ensurePage();
    const behavior = getBandBehavior(band);
    const currentPageRows = currentPage ? pageRows.get(currentPage) ?? {} : {};
    let preview = layoutBand(band, { x: printableX, y: cursorY, width: printableWidth, context, rowsByBand, pageRowsByBand: currentPageRows, styles });
    const breakIfLessThan = behavior.breakIfLessThan ?? 0;
    if (!force && breakIfLessThan > 0 && pageBottomY - cursorY < breakIfLessThan && currentPage!.items.length > 0) {
      newPage();
      preview = layoutBand(band, { x: printableX, y: cursorY, width: printableWidth, context, rowsByBand, pageRowsByBand: pageRows.get(currentPage!) ?? {}, styles });
    }

    if (!force && cursorY + preview.height > pageBottomY && currentPage!.items.length > 0) {
      newPage();
      preview = layoutBand(band, { x: printableX, y: cursorY, width: printableWidth, context, rowsByBand, pageRowsByBand: pageRows.get(currentPage!) ?? {}, styles });
    }

    const targetY = behavior.printAtBottom ? pageBottomY - preview.height : cursorY;
    const box = layoutBand(band, { x: printableX, y: targetY, width: printableWidth, context, rowsByBand, pageRowsByBand: pageRows.get(currentPage!) ?? {}, styles });
    currentPage!.items.push(box);
    collectPageRow(pageRows.get(currentPage!)!, band, context);
    cursorY = behavior.printAtBottom ? pageBottomY : cursorY + box.height;
    return box;
  };

  for (const item of logicalItems) {
    if (item.kind === 'pageBreak') {
      newPage();
      continue;
    }

    if (item.band.type === 'groupHeader' && getBandBehavior(item.band).printOnAllPages) {
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

    if (item.repeatOnPageBreakBefore) {
      activeSectionRepeatBands = item.repeatOnPageBreakBefore;
    }

    if (['footer', 'columnFooter', 'reportSummary', 'emptyData'].includes(item.band.type)) {
      activeSectionRepeatBands = [];
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
      page.items.unshift(layoutBand(overlay, { x: printableX, y: templatePage.margins.top, width: printableWidth, context: createEmptyContext(), rowsByBand, pageRowsByBand: pageRows.get(page) ?? {}, styles }));
    }

    let footerY = templatePage.height - templatePage.margins.bottom - footerHeight;
    for (const footer of pageBands.pageFooter) {
      const box = layoutBand(footer, { x: printableX, y: footerY, width: printableWidth, context: createEmptyContext(), rowsByBand, pageRowsByBand: pageRows.get(page) ?? {}, styles });
      page.items.push(box);
      footerY += box.height;
    }
  }

  return pages;
}

function collectPageRow(pageRows: Record<string, Record<string, unknown>[]>, band: Band, context: RenderContext): void {
  if (band.type !== 'data' && band.type !== 'hierarchicalData') return;
  if (!context.dataSourceId || !context.row) return;
  if (!pageRows[context.dataSourceId]) {
    pageRows[context.dataSourceId] = [];
  }
  pageRows[context.dataSourceId].push(context.row);
}

function createEmptyContext(): RenderContext {
  return {
    rowIndex: 0,
    groupValues: {},
  };
}

function getBandBehavior(band: Band): NonNullable<Band['behavior']> {
  return band.behavior ?? {
    enabled: true,
    printOn: 'allPages',
    printIfEmpty: true,
    printOnAllPages: band.type === 'pageHeader' || band.type === 'pageFooter' || band.type === 'groupHeader',
    keepTogether: false,
    canBreak: band.type === 'data' || band.type === 'child',
    printAtBottom: band.type === 'pageFooter',
  };
}
