import React from 'react';
import { useDesignerStore } from '../../store/designer-store';
import { PropertyEditor } from '../PropertyEditor';

export const StimulsoftPropertyGrid: React.FC = () => {
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const selectedComponentIds = useDesignerStore(s => s.selectedComponentIds);
  const selectedBandId = useDesignerStore(s => s.selectedBandId);

  const selectedType = React.useMemo(() => {
    if (selectedComponentIds.length === 1) {
      const page = template.pages.find(p => p.id === currentPageId);
      const component = page?.bands.flatMap(b => b.components).find(c => c.id === selectedComponentIds[0]);
      return component ? `${component.type} component` : 'Component';
    }
    if (selectedComponentIds.length > 1) return `${selectedComponentIds.length} components`;
    if (selectedBandId) return 'Band';
    return 'Properties';
  }, [currentPageId, selectedBandId, selectedComponentIds, template]);

  return (
    <aside className="rd-property-grid" data-testid="designer-property-grid">
      <div className="rd-panel-title">{selectedType}</div>
      <div className="rd-property-grid-body">
        <PropertyEditor />
      </div>
    </aside>
  );
};
