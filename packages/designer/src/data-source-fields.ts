import type { DataField, DataSource } from '@report-designer/core';

export interface FieldPathTreeNode {
  key: string;
  label: string;
  path: string;
  searchText: string;
  sourceId: string;
  field?: DataField;
  children?: FieldPathTreeNode[];
}

export function formatDataFieldExpression(sourceId: string, fieldName: string): string {
  return `{${fieldName}}`;
}

export function formatDataFieldLabel(sourceId: string, fieldName: string): string {
  return sourceId === 'root' ? fieldName : `${sourceId}.${fieldName}`;
}

export function buildFieldPathTree(source: DataSource): FieldPathTreeNode[] {
  const roots: FieldPathTreeNode[] = [];
  const rootBySegment = new Map<string, FieldPathTreeNode>();

  for (const field of source.schema ?? source.fields ?? []) {
    const segments = field.name.split('.').filter(Boolean);
    if (segments.length === 0) {
      continue;
    }

    let siblings = roots;
    let siblingMap = rootBySegment;
    let currentPath = '';

    segments.forEach((segment, index) => {
      currentPath = currentPath ? `${currentPath}.${segment}` : segment;
      const isLeaf = index === segments.length - 1;
      const key = `${source.id}.${currentPath}`;
      let node = siblingMap.get(segment);

      if (!node) {
        node = {
          key,
          label: isLeaf ? field.label || segment : segment,
          path: currentPath,
          sourceId: source.id,
          searchText: `${source.id} ${source.name ?? ''} ${currentPath} ${field.label ?? ''} ${field.type ?? ''}`.toLowerCase(),
          children: isLeaf ? undefined : [],
        };
        siblings.push(node);
        siblingMap.set(segment, node);
      }

      if (isLeaf) {
        node.field = field;
        node.label = field.label || segment;
        node.searchText = `${source.id} ${source.name ?? ''} ${field.name} ${field.label ?? ''} ${field.type ?? ''}`.toLowerCase();
        return;
      }

      node.children ??= [];
      const map = new Map(node.children.map(child => [child.path.split('.').at(-1) ?? child.path, child]));
      siblingMap = map;
      siblings = node.children;
    });
  }

  return roots;
}
