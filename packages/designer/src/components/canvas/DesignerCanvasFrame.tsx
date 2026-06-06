import React from 'react';
import { Viewer } from '@report-designer/viewer';
import type { ReportTemplate } from '@report-designer/core';
import { Canvas } from '../Canvas';
import { useDesignerStore } from '../../store/designer-store';
import { useDesignerI18n } from '../../i18n';
import { resolveExpressionCatalog, type ExpressionCatalogExtensions } from '../../expression/expression-catalog';

interface DesignerCanvasFrameProps {
  subreports?: Record<string, ReportTemplate>;
  expressionExtensions?: ExpressionCatalogExtensions;
}

export const DesignerCanvasFrame: React.FC<DesignerCanvasFrameProps> = ({ subreports, expressionExtensions }) => {
  const { locale } = useDesignerI18n();
  const mode = useDesignerStore(s => s.mode);
  const template = useDesignerStore(s => s.template);
  const dataSources = useDesignerStore(s => s.dataSources);
  const expressionFunctions = React.useMemo(
    () => resolveExpressionCatalog(expressionExtensions).runtimeFunctions,
    [expressionExtensions],
  );

  if (mode === 'preview') {
    return (
      <main className="rd-canvas-frame rd-canvas-frame-preview" data-testid="designer-canvas-frame">
        <div className="rd-preview-workspace">
          <Viewer
            template={template}
            data={dataSources}
            locale={locale}
            subreports={subreports}
            expressionFunctions={expressionFunctions}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="rd-canvas-frame" data-testid="designer-canvas-frame">
      <div className="rd-canvas-workspace">
        <Canvas />
      </div>
    </main>
  );
};
