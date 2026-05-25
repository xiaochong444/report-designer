/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { RenderDocumentView } from '../renderers/dom/RenderDocumentView';
import { MM_TO_PX } from '../renderers/dom/renderComponent';
import { makeRenderDocument } from './phase-4-helpers';

describe('Phase 32 page appearance rendering', () => {
  it('renders preview watermark and page border without changing page content layout', () => {
    const document = makeRenderDocument();
    document.pages[0].watermark = {
      enabled: true,
      text: 'Internal',
      fontFamily: 'SimSun',
      fontSize: 36,
      color: '#ff4d4f',
      opacity: 0.25,
      angle: -30,
      horizontalAlign: 'center',
      verticalAlign: 'middle',
      showBehind: true,
    };
    document.pages[0].pageBorder = {
      enabled: true,
      style: 'dashed',
      width: 0.4,
      color: '#1677ff',
      sides: { top: true, right: false, bottom: true, left: true },
      offset: 5,
    };

    const { container } = render(<RenderDocumentView document={document} zoom={100} />);

    const watermark = screen.getByTestId('rd-page-watermark');
    const border = screen.getByTestId('rd-page-border');
    const band = container.querySelector('[data-band-type="data"]') as HTMLElement;

    expect(watermark).toHaveTextContent('Internal');
    expect(watermark).toHaveStyle({
      color: 'rgb(255, 77, 79)',
      opacity: '0.25',
      transform: 'rotate(-30deg)',
      pointerEvents: 'none',
      zIndex: '1',
      fontFamily: 'SimSun',
    });
    expect(Number.parseFloat(watermark.style.fontSize)).toBeCloseTo(36 * MM_TO_PX, 3);
    expect(border).toHaveStyle({
      borderTop: `${0.4 * MM_TO_PX}px dashed #1677ff`,
      borderBottom: `${0.4 * MM_TO_PX}px dashed #1677ff`,
      borderLeft: `${0.4 * MM_TO_PX}px dashed #1677ff`,
      borderRightStyle: 'none',
      pointerEvents: 'none',
      zIndex: '4',
    });
    expect(Number.parseFloat(border.style.inset)).toBeCloseTo(5 * MM_TO_PX, 3);
    expect(band).toHaveStyle({
      left: `${20 * MM_TO_PX}px`,
      top: `${20 * MM_TO_PX}px`,
    });
  });

  it('can render a foreground watermark above page items', () => {
    const document = makeRenderDocument();
    document.pages[0].watermark = {
      enabled: true,
      text: 'Approved',
      fontSize: 20,
      color: '#52c41a',
      opacity: 0.4,
      angle: 15,
      horizontalAlign: 'right',
      verticalAlign: 'bottom',
      showBehind: false,
    };

    render(<RenderDocumentView document={document} zoom={75} />);

    expect(screen.getByTestId('rd-page-watermark')).toHaveStyle({
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      zIndex: '3',
      transform: 'rotate(15deg)',
    });
  });
});
