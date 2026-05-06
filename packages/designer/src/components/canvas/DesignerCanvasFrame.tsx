import React from 'react';
import { Viewer } from '@report-designer/viewer';
import { Canvas } from '../Canvas';
import { useDesignerStore } from '../../store/designer-store';

export const DesignerCanvasFrame: React.FC = () => {
  const mode = useDesignerStore(s => s.mode);
  const template = useDesignerStore(s => s.template);
  const dataSources = useDesignerStore(s => s.dataSources);

  if (mode === 'preview') {
    return (
      <main className="rd-canvas-frame rd-canvas-frame-preview" data-testid="designer-canvas-frame">
        <div className="rd-preview-workspace">
          <Viewer template={template} data={dataSources} />
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
