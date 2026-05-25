import React from 'react';
import { buildReportFontCss, type PageBorder, type PageWatermark, type RenderDocument, type RenderPage } from '@report-designer/core';
import { RenderComponent, MM_TO_PX } from './renderComponent';

interface RenderDocumentViewProps {
  document: RenderDocument;
  zoom: number;
  currentPage?: number;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
}

export const RenderDocumentView: React.FC<RenderDocumentViewProps> = ({ document, zoom, currentPage, scrollContainerRef }) => {
  const fontCss = React.useMemo(() => buildReportFontCss(document.fonts), [document.fonts]);
  const pageRefs = React.useRef(new Map<number, HTMLDivElement>());
  const previousPageRef = React.useRef<number | undefined>(currentPage);

  React.useEffect(() => {
    if (!currentPage || previousPageRef.current === currentPage) return;
    previousPageRef.current = currentPage;
    const pageNode = pageRefs.current.get(currentPage);
    if (!pageNode) return;
    const scrollContainer = scrollContainerRef?.current;
    if (scrollContainer?.scrollTo) {
      const pageRect = pageNode.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      scrollContainer.scrollTo({
        top: scrollContainer.scrollTop + pageRect.top - containerRect.top,
        behavior: 'smooth',
      });
      return;
    }
    pageNode.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [currentPage, scrollContainerRef]);

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
        background: page.backgroundColor ?? '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        position: 'relative',
        flex: '0 0 auto',
      }}
    >
      <PageWatermarkView watermark={page.watermark} scale={scale} zIndex={page.watermark?.showBehind === false ? 3 : 1} />
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
            zIndex: 2,
          }}
        >
          {band.components.map((component) => (
            <RenderComponent key={component.id} component={component} zoom={zoom} parentOriginX={band.x} parentOriginY={band.y} />
          ))}
        </div>
      ))}
      <PageBorderView pageBorder={page.pageBorder} scale={scale} />
    </div>
  );
});

RenderPageView.displayName = 'RenderPageView';

const PageWatermarkView: React.FC<{ watermark?: PageWatermark; scale: number; zIndex: number }> = ({ watermark, scale, zIndex }) => {
  if (!watermark?.enabled || !watermark.text) return null;

  return (
    <div
      data-testid="rd-page-watermark"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        justifyContent: horizontalAlignToFlex(watermark.horizontalAlign),
        alignItems: verticalAlignToFlex(watermark.verticalAlign),
        color: watermark.color,
        opacity: watermark.opacity,
        fontFamily: watermark.fontFamily,
        fontSize: watermark.fontSize * MM_TO_PX * scale,
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: 'pre-wrap',
        textAlign: watermark.horizontalAlign,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex,
      }}
    >
      <span
        className="rd-page-watermark-text"
        style={{
          display: 'inline-block',
          transform: `rotate(${watermark.angle}deg)`,
          transformOrigin: 'center',
        }}
      >
        {watermark.text}
      </span>
    </div>
  );
};

const PageBorderView: React.FC<{ pageBorder?: PageBorder; scale: number }> = ({ pageBorder, scale }) => {
  if (!pageBorder?.enabled || pageBorder.style === 'none' || pageBorder.width <= 0) return null;
  const border = `${pageBorder.width * MM_TO_PX * scale}px ${pageBorder.style} ${pageBorder.color}`;

  return (
    <div
      data-testid="rd-page-border"
      style={{
        position: 'absolute',
        inset: pageBorder.offset * MM_TO_PX * scale,
        boxSizing: 'border-box',
        borderTop: pageBorder.sides.top ? border : undefined,
        borderRight: pageBorder.sides.right ? border : undefined,
        borderBottom: pageBorder.sides.bottom ? border : undefined,
        borderLeft: pageBorder.sides.left ? border : undefined,
        borderTopStyle: pageBorder.sides.top ? pageBorder.style : 'none',
        borderRightStyle: pageBorder.sides.right ? pageBorder.style : 'none',
        borderBottomStyle: pageBorder.sides.bottom ? pageBorder.style : 'none',
        borderLeftStyle: pageBorder.sides.left ? pageBorder.style : 'none',
        pointerEvents: 'none',
        zIndex: 4,
      }}
    />
  );
};

function horizontalAlignToFlex(value: PageWatermark['horizontalAlign']): React.CSSProperties['justifyContent'] {
  if (value === 'center') return 'center';
  if (value === 'right') return 'flex-end';
  return 'flex-start';
}

function verticalAlignToFlex(value: PageWatermark['verticalAlign']): React.CSSProperties['alignItems'] {
  if (value === 'middle') return 'center';
  if (value === 'bottom') return 'flex-end';
  return 'flex-start';
}
