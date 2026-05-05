import React from 'react';
import { Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useDesignerStore } from '../../store/designer-store';

export const ReportTreeV2: React.FC = () => {
  const template = useDesignerStore(s => s.template);
  const selectBand = useDesignerStore(s => s.selectBand);

  const treeData: DataNode[] = template.pages.map(page => ({
    key: page.id,
    title: page.id,
    children: page.bands.map(band => ({
      key: band.id,
      title: `${band.type}${band.dataSource ? ` (${band.dataSource})` : ''}`,
    })),
  }));

  return (
    <Tree
      treeData={treeData}
      defaultExpandAll
      onSelect={(keys) => selectBand(String(keys[0] ?? '') || null)}
    />
  );
};
