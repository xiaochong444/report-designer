import React from 'react';
import { buildReportFontCss, type RenderDocument, type RenderPage } from '@report-designer/core';
import { RenderComponent, MM_TO_PX } from './renderComponent';

interface RenderDocumentViewProps {
  document: RenderDocument;
  zoom: number;
  currentPage?: number;
}

export const RenderDocumentView: React.FC<RenderDocumentViewProps> = ({ document, zoom, currentPage }) => {
  const fontCss = React.useMemo(() => buildReportFontCss(document.fonts), [document.fonts]);
  const pageRefs = React.useRef(new Map<number, HTMLDivElement>());
  const previousPageRef = React.useRef<number | undefined>(currentPage);

  React.useEffect(() => {
    if (!currentPage || previousPageRef.current === currentPage) return;
    previousPageRef.current = currentPage;
    pageRefs.current.get(currentPage)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [currentPage]);

  return (
    <div data-testid="render-document" style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
      {fontCss ? <style data-report-font-registry>{fontCss}</style> : null}
      {document.pages.map((page) => (
        <RenderPageView
          key={page.id}
          page={page}
          zoom={zoom}
          ref={(node) => {
            if (node) {
              pageRefs.current.set(page.pageNumber, node);
            } else {
              pageRefs.current.delete(page.pageNumber);
            }
          }}
        />
      ))}
    </div>
  );
};

const RenderPageView = React.forwardRef<HTMLDivElement, { page: RenderPage; zoom: number }>(({ page, zoom }, ref) => {
  const scale = zoom / 100;
  return (
    <div
      ref={ref}
      data-testid="render-document-page"
      data-page-number={page.pageNumber}
      style={{
        width: page.width * MM_TO_PX * scale,
        height: page.height * MM_TO_PX * scale,
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        position: 'relative',
        flex: '0 0 auto',
      }}
    >
      {page.items.map((band) => (
        <div
          key={band.id}
          data-band-type={band.bandType}
          style={{
            position: 'absolute',
            left: band.x * MM_TO_PX * scale,
            top: band.y * MM_TO_PX * scale,
            width: band.width * MM_TO_PX * scale,
            height: band.height * MM_TO_PX * scale,
          }}
        >
          {band.components.map((component) => (
            <RenderComponent key={component.id} component={component} zoom={zoom} parentOriginX={band.x} parentOriginY={band.y} />
          ))}
        </div>
      ))}
    </div>
  );
});

RenderPageView.displayName = 'RenderPageView';
