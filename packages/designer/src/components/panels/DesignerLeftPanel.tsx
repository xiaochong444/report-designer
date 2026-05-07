import React from 'react';
import { LeftPanel } from '../LeftPanel';

export const DesignerLeftPanel: React.FC = () => (
  <aside className="rd-left-panel" data-testid="designer-left-panel">
    <div className="rd-panel-title">Report Explorer</div>
    <div className="rd-left-panel-body">
      <LeftPanel />
    </div>
  </aside>
);
