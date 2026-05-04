import type {
  ReportTemplate, Page, Band, ReportComponent,
} from '../template-model/types';
import type {
  RenderTree, RenderedBand, RenderedComponent,
} from '../render-engine';
import { renderTemplate } from '../render-engine';

/** A page after pagination */
export interface PaginatedPage {
  id: string;
  width: number;
  height: number;
  bands: PaginatedBand[];
  pageNumber: number;
}

export interface PaginatedBand {
  id: string;
  type: string;
  /** Absolute Y position on the page */
  absoluteY: number;
  height: number;
  components: PaginatedComponent[];
}

export interface PaginatedComponent {
  id: string;
  type: string;
  absoluteX: number;
  absoluteY: number;
  width: number;
  height: number;
  content?: string;
  imageSrc?: string;
  barcodeValue?: string;
}

/**
 * Paginate a rendered render tree.
 * Splits bands across pages when they exceed the printable area.
 */
export function paginate(
  template: ReportTemplate,
  data: Record<string, any[]>,
): PaginatedPage[] {
  const renderTree = renderTemplate(template, data);
  const pages: PaginatedPage[] = [];
  let pageNum = 0;

  for (const renderedPage of renderTree.pages) {
    const templatePage = template.pages.find(p => p.id === renderedPage.id)!;
    const printableHeight = templatePage.height - templatePage.margins.top - templatePage.margins.bottom;
    const marginLeft = templatePage.margins.left;

    // Find page header band (repeated on every page)
    const headerBands = renderedPage.bands.filter(b => b.type === 'pageHeader');
    const headerHeight = headerBands.reduce((sum, b) => sum + b.height, 0);

    // Separate header, footer, and content bands
    const contentBands = renderedPage.bands.filter(
      b => b.type !== 'pageHeader' && b.type !== 'pageFooter',
    );

    // Split content bands across pages
    const pageGroups = splitBandsAcrossPages(contentBands, printableHeight - headerHeight);

    for (let i = 0; i < pageGroups.length; i++) {
      pageNum++;
      const group = pageGroups[i];
      const isFirst = i === 0;
      const isLast = i === pageGroups.length - 1;

      const bands: PaginatedBand[] = [];
      let currentY = 0;

      // Page header (on every page)
      for (const hb of headerBands) {
        bands.push({
          id: hb.id,
          type: hb.type,
          absoluteY: currentY,
          height: hb.height,
          components: hb.components.map(toPaginatedComponent(currentY, marginLeft)),
        });
        currentY += hb.height;
      }

      // Content bands for this page chunk
      for (const band of group) {
        bands.push({
          id: band.id,
          type: band.type,
          absoluteY: currentY,
          height: band.height,
          components: band.components.map(toPaginatedComponent(currentY, marginLeft)),
        });
        currentY += band.height;
      }

      // Page footer (on every page)
      const footerBands = renderedPage.bands.filter(b => b.type === 'pageFooter');
      for (const fb of footerBands) {
        bands.push({
          id: fb.id,
          type: fb.type,
          absoluteY: currentY,
          height: fb.height,
          components: fb.components.map(toPaginatedComponent(currentY, marginLeft)),
        });
        currentY += fb.height;
      }

      pages.push({
        id: `${renderedPage.id}_p${pageNum}`,
        width: templatePage.width,
        height: templatePage.height,
        bands,
        pageNumber: pageNum,
      });
    }
  }

  return pages;
}

/** Split bands into groups that fit within the printable height */
function splitBandsAcrossPages(
  bands: RenderedBand[],
  maxPageHeight: number,
): RenderedBand[][] {
  const groups: RenderedBand[][] = [];
  let currentGroup: RenderedBand[] = [];
  let currentHeight = 0;

  for (const band of bands) {
    if (currentHeight + band.height > maxPageHeight && currentGroup.length > 0) {
      // Start a new page
      groups.push(currentGroup);
      currentGroup = [band];
      currentHeight = band.height;
    } else {
      currentGroup.push(band);
      currentHeight += band.height;
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

function toPaginatedComponent(bandY: number, marginLeft: number) {
  return (comp: RenderedComponent): PaginatedComponent => ({
    id: comp.id,
    type: comp.type,
    absoluteX: comp.x + marginLeft,
    absoluteY: bandY + comp.y,
    width: comp.width,
    height: comp.height,
    content: comp.content,
    imageSrc: comp.imageSrc,
    barcodeValue: comp.barcodeValue,
  });
}

/** Compute total height of a paginated page */
export function paginatedPageHeight(page: PaginatedPage): number {
  return page.bands.reduce((sum, b) => sum + b.height, 0);
}
