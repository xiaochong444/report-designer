import React from 'react';
import { LeftPanel } from '../LeftPanel';
import { ReportTreeV2 } from '../tree/ReportTreeV2';

export const StimulsoftLeftPanel: React.FC = () => (
  <aside className="rd-left-panel" data-testid="designer-left-panel">
    <div className="rd-panel-title">Report Explorer</div>
    <div className="rd-left-panel-body">
      <div className="rd-report-tree-strip">
        <ReportTreeV2 />
      </div>
      <LeftPanel />
    </div>
  </aside>
);
