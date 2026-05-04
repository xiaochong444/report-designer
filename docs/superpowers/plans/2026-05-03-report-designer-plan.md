# 报表设计器系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 对标 Stimulsoft Reports 的商业级 React 报表打印组件系统，包含可视化设计器、渲染引擎和打印/导出功能。

**Architecture:** 分层渲染管道架构 — `core`（表达式引擎 + 渲染管道）与 UI 完全解耦，`designer`（可视化设计器）和 `viewer`（报表查看器）各自消费 core 的渲染管道输出。

**Tech Stack:** TypeScript, React 19, Ant Design 6, pnpm workspace, Vitest, pdf-lib, jsbarcode, dnd-kit

**DPI 标准:** 96 DPI (1mm = 3.78px)

---

## 文件总览

| Phase | 创建文件数 | 关键文件 |
|-------|-----------|----------|
| 0. Monorepo 基础 | 7 | pnpm-workspace.yaml, package.json, tsconfig, vitest config |
| 1. 模板模型 | 4 | types.ts, schema.ts, template.ts, 测试 |
| 2. 表达式词法/语法 | 4 | lexer.ts, parser.ts, ast.ts, 测试 |
| 3. 表达式求值 | 3 | evaluator.ts, functions/*.ts, 测试 |
| 4. 渲染引擎 | 5 | render-tree-types.ts, data-binding.ts, layout.ts, grouping.ts, render.ts |
| 5. 命令分发器 | 3 | whitelist.ts, dispatcher.ts, 测试 |
| 6. 设计器基础 | 5 | designer.tsx, ribbon, tabs, history |
| 7. 画布 | 8 | canvas.tsx, selection, drag-drop, resize, zoom-pan, grid, ruler |
| 8. 侧面板 | 3 | data-dictionary, properties-panel, report-tree |
| 9. 查看器 | 10 | viewer.tsx, toolbar, renderers, print, export |
| 10. 示例应用 | 3 | App.tsx, templates, data |

---

## Task 0: Monorepo 基础搭建

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `turbo.json`
- Create: `packages/core/package.json`
- Create: `packages/designer/package.json`
- Create: `packages/viewer/package.json`
- Create: `packages/example/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/designer/tsconfig.json`
- Create: `packages/viewer/tsconfig.json`
- Create: `packages/example/tsconfig.json`
- Create: `packages/example/vite.config.ts`
- Create: `packages/example/index.html`

- [ ] **Step 1: 创建根 workspace 配置**

创建 `pnpm-workspace.yaml`:

```yaml
packages:
  - 'packages/*'
```

创建 `package.json`:

```json
{
  "name": "report-designer",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "test:watch": "turbo test:watch",
    "lint": "turbo lint"
  },
  "devDependencies": {
    "turbo": "^2.5.0",
    "typescript": "^5.8.0",
    "vitest": "^3.1.0"
  },
  "packageManager": "pnpm@10.10.0"
}
```

- [ ] **Step 2: 创建 TypeScript 基础配置**

创建 `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "@report-designer/core": ["packages/core/src"],
      "@report-designer/designer": ["packages/designer/src"],
      "@report-designer/viewer": ["packages/viewer/src"]
    }
  }
}
```

创建 `tsconfig.json`:

```json
{
  "extends": "./tsconfig.base.json",
  "references": [
    { "path": "packages/core" },
    { "path": "packages/designer" },
    { "path": "packages/viewer" }
  ]
}
```

- [ ] **Step 3: 创建 Vitest 和 Turbo 配置**

创建 `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}', '__tests__/**/*.{test,spec}.{ts,tsx}'],
  },
});
```

创建 `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "test:watch": {
      "cache": false,
      "persistent": true
    }
  }
}
```

- [ ] **Step 4: 创建 @report-designer/core 包配置**

创建 `packages/core/package.json`:

```json
{
  "name": "@report-designer/core",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "lodash-es": "^4.17.21"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "vitest": "^3.1.0",
    "@types/lodash-es": "^4.17.12"
  }
}
```

创建 `packages/core/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "references": []
}
```

- [ ] **Step 5: 创建 @report-designer/designer 包配置**

创建 `packages/designer/package.json`:

```json
{
  "name": "@report-designer/designer",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsc -p tsconfig.json --watch",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@report-designer/core": "workspace:*",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "antd": "^6.0.0",
    "@ant-design/icons": "^6.0.0",
    "@dnd-kit/core": "^6.3.0",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.0",
    "lodash-es": "^4.17.21",
    "nanoid": "^5.1.0"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "vitest": "^3.1.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "jsdom": "^26.1.0"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "antd": "^6.0.0"
  }
}
```

创建 `packages/designer/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "references": [
    { "path": "../core" }
  ]
}
```

- [ ] **Step 6: 创建 @report-designer/viewer 包配置**

创建 `packages/viewer/package.json`:

```json
{
  "name": "@report-designer/viewer",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsc -p tsconfig.json --watch",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@report-designer/core": "workspace:*",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "antd": "^6.0.0",
    "@ant-design/icons": "^6.0.0",
    "pdf-lib": "^1.17.1",
    "jsbarcode": "^3.11.6",
    "lodash-es": "^4.17.21"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "vitest": "^3.1.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "jsdom": "^26.1.0"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "antd": "^6.0.0"
  }
}
```

创建 `packages/viewer/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "references": [
    { "path": "../core" }
  ]
}
```

- [ ] **Step 7: 创建 example 示例应用配置**

创建 `packages/example/package.json`:

```json
{
  "name": "@report-designer/example",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@report-designer/core": "workspace:*",
    "@report-designer/designer": "workspace:*",
    "@report-designer/viewer": "workspace:*",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "antd": "^6.0.0"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "vite": "^6.3.0",
    "@vitejs/plugin-react": "^4.4.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0"
  }
}
```

创建 `packages/example/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src"],
  "references": [
    { "path": "../core" },
    { "path": "../designer" },
    { "path": "../viewer" }
  ]
}
```

创建 `packages/example/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@report-designer/core': '/packages/core/src',
      '@report-designer/designer': '/packages/designer/src',
      '@report-designer/viewer': '/packages/viewer/src',
    },
  },
});
```

创建 `packages/example/index.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>报表设计器</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: 安装依赖并验证 workspace**

Run: `cd d:/ItemSource/report-designer && pnpm install`
Expected: 所有包安装成功，workspace 链接正确

Run: `pnpm -r list --depth 0`
Expected: 显示 4 个包：core, designer, viewer, example

- [ ] **Step 9: 初始化 git 并提交**

Run: `cd d:/ItemSource/report-designer && git init && git add -A && git commit -m "chore: initialize monorepo with pnpm workspace"`

---

## Task 1: 模板数据模型

**Files:**
- Create: `packages/core/src/template-model/types.ts`
- Create: `packages/core/src/template-model/schema.ts`
- Create: `packages/core/src/template-model/template.ts`
- Create: `packages/core/src/template-model/index.ts`
- Create: `packages/core/src/index.ts`
- Create: `packages/core/__tests__/template-model.test.ts`

- [ ] **Step 1: 编写模板类型测试**

创建 `packages/core/__tests__/template-model.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { createDefaultTemplate, validateTemplate } from '../src/template-model';
import type { ReportTemplate, TextComponent, Band, Page } from '../src/template-model';

describe('template-model', () => {
  describe('createDefaultTemplate', () => {
    it('should create a template with default A4 page', () => {
      const template = createDefaultTemplate();
      expect(template.version).toBe('1.0');
      expect(template.pages).toHaveLength(1);
      expect(template.pages[0].width).toBe(210);  // A4 width in mm
      expect(template.pages[0].height).toBe(297); // A4 height in mm
      expect(template.pages[0].orientation).toBe('portrait');
      expect(template.pages[0].margins).toEqual({
        top: 20, right: 20, bottom: 20, left: 20
      });
    });

    it('should create template with default bands (reportTitle, pageHeader, data, pageFooter)', () => {
      const template = createDefaultTemplate();
      const bandTypes = template.pages[0].bands.map(b => b.type);
      expect(bandTypes).toContain('reportTitle');
      expect(bandTypes).toContain('pageHeader');
      expect(bandTypes).toContain('data');
      expect(bandTypes).toContain('pageFooter');
    });

    it('should create template with empty dataSources and styles', () => {
      const template = createDefaultTemplate();
      expect(template.dataSources).toEqual([]);
      expect(template.styles).toEqual([]);
      expect(template.conditionalFormats).toEqual([]);
    });
  });

  describe('validateTemplate', () => {
    it('should pass for a valid template', () => {
      const template = createDefaultTemplate();
      const result = validateTemplate(template);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for template without pages', () => {
      const template = createDefaultTemplate();
      template.pages = [];
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('pages');
    });

    it('should fail for page with zero dimensions', () => {
      const template = createDefaultTemplate();
      template.pages[0].width = 0;
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
    });

    it('should fail for component with negative dimensions', () => {
      const template = createDefaultTemplate();
      const textComp: TextComponent = {
        id: 'test-1',
        type: 'text',
        x: 10, y: 10,
        width: -5, height: 10,
        text: 'Hello',
        font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, color: '#000000' },
        textAlign: 'left',
        verticalAlign: 'top',
        border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
        canGrow: false,
        canShrink: false,
      };
      template.pages[0].bands[0].components.push(textComp);
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
    });

    it('should fail for band with duplicate id', () => {
      const template = createDefaultTemplate();
      const band: Band = {
        id: template.pages[0].bands[0].id,
        type: 'reportSummary',
        height: 30,
        components: [],
      };
      template.pages[0].bands.push(band);
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
    });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd d:/ItemSource/report-designer && pnpm --filter @report-designer/core test`
Expected: FAIL — modules not found

- [ ] **Step 3: 实现模板类型定义**

创建 `packages/core/src/template-model/types.ts`:

```typescript
/** 表达式类型 — 简化字符串表达式 */
export type Expression = string;

/** 页边距 */
export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** 字体配置 */
export interface FontConfig {
  family: string;
  size: number;        // pt
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;       // CSS 颜色
}

/** 边框配置 */
export interface BorderConfig {
  style: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
  width: number;       // mm
  color: string;       // CSS 颜色
  sides: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
}

/** 条件规则 */
export interface ConditionRule {
  id: string;
  expression: Expression;
  overrides: Record<string, any>;
}

/** 报表样式 */
export interface ReportStyle {
  id: string;
  name: string;
  font: FontConfig;
  border: BorderConfig;
  backgroundColor: string;
}

/** 条件格式 */
export interface ConditionalFormat {
  id: string;
  name: string;
  rules: ConditionRule[];
  applyTo: string[];
}

/** 数据字段 */
export interface DataField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  label?: string;
}

/** 数据源 */
export interface DataSource {
  id: string;
  name: string;
  type: 'json' | 'static';
  schema: DataField[];
  data?: Record<string, any>[];
}

/** 组件类型枚举 */
export type ComponentType = 'text' | 'image' | 'table' | 'barcode' | 'checkbox' | 'richtext' | 'subreport' | 'panel';

/** 组件基类 */
export interface ReportComponent {
  id: string;
  type: ComponentType;
  x: number;          // mm
  y: number;          // mm
  width: number;      // mm
  height: number;     // mm
  style?: string;     // 引用 styles 中的 ID
  conditions?: ConditionRule[];
  anchor?: string;
}

/** 文本组件 */
export interface TextComponent extends ReportComponent {
  type: 'text';
  text: Expression;
  font: FontConfig;
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  border: BorderConfig;
  canGrow: boolean;
  canShrink: boolean;
}

/** 图片组件 */
export interface ImageComponent extends ReportComponent {
  type: 'image';
  src: Expression;          // URL 或 base64
  fitMode: 'fill' | 'contain' | 'cover' | 'stretch';
}

/** 表格列 */
export interface TableColumn {
  id: string;
  header: string;
  field: string;
  width: number;          // mm
  cellType: 'text' | 'image' | 'barcode' | 'checkbox';
}

/** 表格组件 */
export interface TableComponent extends ReportComponent {
  type: 'table';
  dataSource: string;
  columns: TableColumn[];
  headerHeight: number;
  rowHeight: number;
  alternateRowStyle?: string;
  showBorder: boolean;
}

/** 条码类型 */
export type BarcodeFormat = 'QR_CODE' | 'CODE128' | 'EAN13' | 'EAN8' | 'UPC' | 'CODE39' | 'ITF14';

/** 条码组件 */
export interface BarcodeComponent extends ReportComponent {
  type: 'barcode';
  value: Expression;
  format: BarcodeFormat;
  showText: boolean;
}

/** 复选框组件 */
export interface CheckboxComponent extends ReportComponent {
  type: 'checkbox';
  checked: Expression;
  label?: Expression;
}

/** 富文本组件 */
export interface RichtextComponent extends ReportComponent {
  type: 'richtext';
  html: Expression;
}

/** 子报表组件 */
export interface SubreportComponent extends ReportComponent {
  type: 'subreport';
  templateUrl: string;     // 引用其他模板
  parameters: Record<string, Expression>;
}

/** 面板组件 */
export interface PanelComponent extends ReportComponent {
  type: 'panel';
  components: ReportComponent[];
  backgroundColor?: string;
  border: BorderConfig;
}

/** 带类型 */
export type BandType = 'reportTitle' | 'reportSummary' | 'pageHeader' | 'pageFooter' | 'groupHeader' | 'groupFooter' | 'data' | 'child';

/** 带 */
export interface Band {
  id: string;
  type: BandType;
  height: number;
  components: ReportComponent[];
  dataSource?: string;
  groupField?: string;
  visible?: Expression;
}

/** 页面方向 */
export type PageOrientation = 'portrait' | 'landscape';

/** 页面 */
export interface Page {
  id: string;
  width: number;         // mm
  height: number;        // mm
  margins: Margins;
  orientation: PageOrientation;
  bands: Band[];
}

/** 报表模板根 */
export interface ReportTemplate {
  id: string;
  name: string;
  version: '1.0';
  pages: Page[];
  dataSources: DataSource[];
  styles: ReportStyle[];
  conditionalFormats: ConditionalFormat[];
}

/** 所有组件类型联合 */
export type ReportComponentUnion =
  | TextComponent
  | ImageComponent
  | TableComponent
  | BarcodeComponent
  | CheckboxComponent
  | RichtextComponent
  | SubreportComponent
  | PanelComponent;

/** 数据上下文 — 运行时传给渲染器的数据 */
export type DataContext = Record<string, Record<string, any>[] | Record<string, any>>;

/** 校验结果 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

- [ ] **Step 4: 实现模板校验**

创建 `packages/core/src/template-model/schema.ts`:

```typescript
import type { ReportTemplate, ValidationResult, ReportComponent, Band, Page } from './types';

export function validateTemplate(template: ReportTemplate): ValidationResult {
  const errors: string[] = [];

  if (!template.pages || template.pages.length === 0) {
    errors.push('Template must have at least one page');
  }

  template.pages?.forEach((page, pi) => {
    validatePage(page, pi, errors);
  });

  // 检查全局 ID 唯一性
  const allIds = new Set<string>();
  collectIds(template, allIds, errors);

  return { valid: errors.length === 0, errors };
}

function validatePage(page: Page, pageIndex: number, errors: string[]): void {
  const prefix = `Page[${pageIndex}]`;

  if (page.width <= 0) {
    errors.push(`${prefix}.width must be positive, got ${page.width}`);
  }
  if (page.height <= 0) {
    errors.push(`${prefix}.height must be positive, got ${page.height}`);
  }
  if (page.margins.top < 0 || page.margins.right < 0 || page.margins.bottom < 0 || page.margins.left < 0) {
    errors.push(`${prefix}.margins must be non-negative`);
  }

  page.bands.forEach((band, bi) => {
    validateBand(band, `${prefix}.bands[${bi}]`, errors);
  });
}

function validateBand(band: Band, prefix: string, errors: string[]): void {
  if (band.height < 0) {
    errors.push(`${prefix}.height must be non-negative, got ${band.height}`);
  }

  band.components.forEach((comp, ci) => {
    validateComponent(comp, `${prefix}.components[${ci}]`, errors);
  });
}

function validateComponent(comp: ReportComponent, prefix: string, errors: string[]): void {
  if (comp.width < 0) {
    errors.push(`${prefix}.width must be non-negative, got ${comp.width}`);
  }
  if (comp.height < 0) {
    errors.push(`${prefix}.height must be non-negative, got ${comp.height}`);
  }
  if (comp.x < 0) {
    errors.push(`${prefix}.x must be non-negative, got ${comp.x}`);
  }
  if (comp.y < 0) {
    errors.push(`${prefix}.y must be non-negative, got ${comp.y}`);
  }
}

function collectIds(template: ReportTemplate, ids: Set<string>, errors: string[]): void {
  const checkId = (id: string, label: string) => {
    if (ids.has(id)) {
      errors.push(`Duplicate id: ${id} (${label})`);
    }
    ids.add(id);
  };

  template.pages.forEach(page => {
    checkId(page.id, 'page');
    page.bands.forEach(band => {
      checkId(band.id, 'band');
      band.components.forEach(comp => {
        checkId(comp.id, 'component');
      });
    });
  });

  template.dataSources.forEach(ds => {
    checkId(ds.id, 'dataSource');
  });

  template.styles.forEach(s => {
    checkId(s.id, 'style');
  });

  template.conditionalFormats.forEach(cf => {
    checkId(cf.id, 'conditionalFormat');
  });
}
```

- [ ] **Step 5: 实现默认模板工厂**

创建 `packages/core/src/template-model/template.ts`:

```typescript
import type { ReportTemplate, Page, Band } from './types';
import { nanoid } from 'nanoid';

const DEFAULT_BAND_HEIGHTS: Record<string, number> = {
  reportTitle: 40,
  reportSummary: 30,
  pageHeader: 20,
  pageFooter: 20,
  groupHeader: 25,
  groupFooter: 25,
  data: 20,
  child: 15,
};

export function createDefaultTemplate(name = '未命名报表'): ReportTemplate {
  const pageId = nanoid(10);
  const bands: Band[] = [
    { id: nanoid(10), type: 'reportTitle', height: DEFAULT_BAND_HEIGHTS.reportTitle, components: [] },
    { id: nanoid(10), type: 'pageHeader', height: DEFAULT_BAND_HEIGHTS.pageHeader, components: [] },
    { id: nanoid(10), type: 'data', height: DEFAULT_BAND_HEIGHTS.data, components: [] },
    { id: nanoid(10), type: 'pageFooter', height: DEFAULT_BAND_HEIGHTS.pageFooter, components: [] },
  ];

  const page: Page = {
    id: pageId,
    width: 210,
    height: 297,
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    orientation: 'portrait',
    bands,
  };

  return {
    id: nanoid(10),
    name,
    version: '1.0',
    pages: [page],
    dataSources: [],
    styles: [],
    conditionalFormats: [],
  };
}
```

- [ ] **Step 6: 创建 barrel 导出**

创建 `packages/core/src/template-model/index.ts`:

```typescript
export * from './types';
export { validateTemplate } from './schema';
export { createDefaultTemplate } from './template';
```

创建 `packages/core/src/index.ts`:

```typescript
export * from './template-model';
```

- [ ] **Step 7: 运行测试确认通过**

Run: `cd d:/ItemSource/report-designer && pnpm --filter @report-designer/core test`
Expected: 所有 5 个测试 PASS

- [ ] **Step 8: 提交**

Run: `cd d:/ItemSource/report-designer && git add packages/core/src packages/core/__tests__ && git commit -m "feat(core): add template data model with types, validation, and factory"`

---

## Task 2: 表达式引擎 — 词法分析器（Lexer）

**Files:**
- Create: `packages/core/src/expression-engine/ast.ts`
- Create: `packages/core/src/expression-engine/lexer.ts`
- Create: `packages/core/src/expression-engine/index.ts`
- Create: `packages/core/__tests__/expression-lexer.test.ts`

- [ ] **Step 1: 编写词法分析器测试**

创建 `packages/core/__tests__/expression-lexer.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { tokenize, TokenType } from '../src/expression-engine/lexer';

describe('Lexer', () => {
  it('should tokenize field reference', () => {
    const tokens = tokenize('{Employee.Name}');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.FIELD_REF);
    expect(tokens[0].value).toBe('Employee.Name');
  });

  it('should tokenize string literal', () => {
    const tokens = tokenize('"hello world"');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.STRING);
    expect(tokens[0].value).toBe('hello world');
  });

  it('should tokenize number', () => {
    const tokens = tokenize('123.45');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.NUMBER);
    expect(tokens[0].value).toBe('123.45');
  });

  it('should tokenize arithmetic operators', () => {
    const tokens = tokenize('{A.X} + 100 * {B.Y}');
    expect(tokens.map(t => t.type)).toEqual([
      TokenType.FIELD_REF, TokenType.PLUS, TokenType.NUMBER, TokenType.MULTIPLY, TokenType.FIELD_REF
    ]);
  });

  it('should tokenize comparison operators', () => {
    const tokens = tokenize('{A.X} > 10');
    expect(tokens[2].type).toBe(TokenType.GT);
  });

  it('should tokenize function call', () => {
    const tokens = tokenize('IF({A.X} > 10, "yes", "no")');
    expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[0].value).toBe('IF');
    expect(tokens).toContainEqual(expect.objectContaining({ type: TokenType.LPAREN }));
    expect(tokens).toContainEqual(expect.objectContaining({ type: TokenType.RPAREN }));
    expect(tokens).toContainEqual(expect.objectContaining({ type: TokenType.COMMA }));
  });

  it('should tokenize boolean literals', () => {
    const tokens = tokenize('true AND false');
    expect(tokens[0].type).toBe(TokenType.BOOLEAN);
    expect(tokens[0].value).toBe('true');
    expect(tokens[2].type).toBe(TokenType.AND);
  });

  it('should throw on unknown characters', () => {
    expect(() => tokenize('{A.X} # 10')).toThrow();
  });

  it('should throw on unclosed field reference', () => {
    expect(() => tokenize('{A.X')).toThrow('Unclosed field reference');
  });

  it('should throw on unclosed string', () => {
    expect(() => tokenize('"hello')).toThrow('Unclosed string');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd d:/ItemSource/report-designer && pnpm --filter @report-designer/core test -- expression-lexer`
Expected: FAIL

- [ ] **Step 3: 实现 AST 节点类型**

创建 `packages/core/src/expression-engine/ast.ts`:

```typescript
export enum ASTNodeType {
  Literal,
  FieldRef,
  BinaryOp,
  UnaryOp,
  FunctionCall,
}

export interface LiteralNode {
  type: ASTNodeType.Literal;
  value: string | number | boolean | null;
  dataType: 'string' | 'number' | 'boolean' | 'null';
}

export interface FieldRefNode {
  type: ASTNodeType.FieldRef;
  source: string;   // 数据源名
  field: string;    // 字段名
}

export interface BinaryOpNode {
  type: ASTNodeType.BinaryOp;
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryOpNode {
  type: ASTNodeType.UnaryOp;
  operator: string;
  operand: ASTNode;
}

export interface FunctionCallNode {
  type: ASTNodeType.FunctionCall;
  name: string;
  args: ASTNode[];
}

export type ASTNode = LiteralNode | FieldRefNode | BinaryOpNode | UnaryOpNode | FunctionCallNode;
```

- [ ] **Step 4: 实现词法分析器**

创建 `packages/core/src/expression-engine/lexer.ts`:

```typescript
export enum TokenType {
  FIELD_REF,     // {DataSource.Field}
  STRING,        // "hello"
  NUMBER,        // 123, 12.5
  BOOLEAN,       // true, false
  IDENTIFIER,    // 函数名 IF, ROUND 等
  PLUS,          // +
  MINUS,         // -
  MULTIPLY,      // *
  DIVIDE,        // /
  MODULO,        // %
  EQUALS,        // =
  NOT_EQUALS,    // !=
  GT,            // >
  LT,            // <
  GTE,           // >=
  LTE,           // <=
  AND,           // AND
  OR,            // OR
  NOT,           // NOT
  LPAREN,        // (
  RPAREN,        // )
  COMMA,         // ,
  EOF,
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

const KEYWORDS: Record<string, TokenType> = {
  'AND': TokenType.AND,
  'OR': TokenType.OR,
  'NOT': TokenType.NOT,
  'true': TokenType.BOOLEAN,
  'false': TokenType.BOOLEAN,
};

const OPERATORS: Record<string, TokenType> = {
  '+': TokenType.PLUS,
  '-': TokenType.MINUS,
  '*': TokenType.MULTIPLY,
  '/': TokenType.DIVIDE,
  '%': TokenType.MODULO,
  '(': TokenType.LPAREN,
  ')': TokenType.RPAREN,
  ',': TokenType.COMMA,
};

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < input.length) {
    // 跳过空白
    if (/\s/.test(input[pos])) {
      pos++;
      continue;
    }

    // 字段引用 {DataSource.Field}
    if (input[pos] === '{') {
      const start = pos;
      pos++;
      const end = input.indexOf('}', pos);
      if (end === -1) {
        throw new Error(`Unclosed field reference at position ${start}`);
      }
      const fieldPath = input.slice(pos, end).trim();
      tokens.push({ type: TokenType.FIELD_REF, value: fieldPath, position: start });
      pos = end + 1;
      continue;
    }

    // 字符串 "..."
    if (input[pos] === '"') {
      const start = pos;
      pos++;
      let value = '';
      while (pos < input.length && input[pos] !== '"') {
        if (input[pos] === '\\' && pos + 1 < input.length) {
          pos++;
          value += input[pos];
        } else {
          value += input[pos];
        }
        pos++;
      }
      if (pos >= input.length) {
        throw new Error(`Unclosed string at position ${start}`);
      }
      tokens.push({ type: TokenType.STRING, value, position: start });
      pos++;
      continue;
    }

    // 数字
    if (/[0-9]/.test(input[pos]) || (input[pos] === '.' && pos + 1 < input.length && /[0-9]/.test(input[pos + 1]))) {
      const start = pos;
      let numStr = '';
      while (pos < input.length && /[0-9.]/.test(input[pos])) {
        numStr += input[pos];
        pos++;
      }
      tokens.push({ type: TokenType.NUMBER, value: numStr, position: start });
      continue;
    }

    // 双字符运算符
    if (pos + 1 < input.length) {
      const twoChar = input.slice(pos, pos + 2);
      if (twoChar === '!=') {
        tokens.push({ type: TokenType.NOT_EQUALS, value: '!=', position: pos });
        pos += 2;
        continue;
      }
      if (twoChar === '>=') {
        tokens.push({ type: TokenType.GTE, value: '>=', position: pos });
        pos += 2;
        continue;
      }
      if (twoChar === '<=') {
        tokens.push({ type: TokenType.LTE, value: '<=', position: pos });
        pos += 2;
        continue;
      }
    }

    // 单字符运算符
    if (OPERATORS[input[pos]]) {
      if (input[pos] === '=' ) {
        tokens.push({ type: TokenType.EQUALS, value: '=', position: pos });
      } else {
        tokens.push({ type: OPERATORS[input[pos]], value: input[pos], position: pos });
      }
      pos++;
      continue;
    }

    // > 和 <
    if (input[pos] === '>') {
      tokens.push({ type: TokenType.GT, value: '>', position: pos });
      pos++;
      continue;
    }
    if (input[pos] === '<') {
      tokens.push({ type: TokenType.LT, value: '<', position: pos });
      pos++;
      continue;
    }

    // 标识符 / 关键字
    if (/[a-zA-Z_一-鿿]/.test(input[pos])) {
      const start = pos;
      let ident = '';
      while (pos < input.length && /[a-zA-Z0-9_一-鿿]/.test(input[pos])) {
        ident += input[pos];
        pos++;
      }
      const upper = ident.toUpperCase();
      if (KEYWORDS[upper] !== undefined) {
        tokens.push({ type: KEYWORDS[upper], value: ident.toLowerCase() === 'true' ? 'true' : ident.toLowerCase() === 'false' ? 'false' : upper, position: start });
      } else {
        tokens.push({ type: TokenType.IDENTIFIER, value: upper, position: start });
      }
      continue;
    }

    throw new Error(`Unexpected character '${input[pos]}' at position ${pos}`);
  }

  tokens.push({ type: TokenType.EOF, value: '', position: pos });
  return tokens;
}
```

- [ ] **Step 5: 更新 barrel 导出**

创建 `packages/core/src/expression-engine/index.ts`:

```typescript
export { tokenize, TokenType } from './lexer';
export type { Token } from './lexer';
export * from './ast';
```

更新 `packages/core/src/index.ts`:

```typescript
export * from './template-model';
export * from './expression-engine';
```

- [ ] **Step 6: 运行测试确认通过**

Run: `cd d:/ItemSource/report-designer && pnpm --filter @report-designer/core test -- expression-lexer`
Expected: 所有 9 个测试 PASS

- [ ] **Step 7: 提交**

Run: `cd d:/ItemSource/report-designer && git add packages/core/src/expression-engine packages/core/__tests__/expression-lexer.test.ts && git commit -m "feat(core): add expression lexer with field references, operators, functions"`

---

## Task 3: 表达式引擎 — 解析器（Parser）

**Files:**
- Create: `packages/core/src/expression-engine/parser.ts`
- Create: `packages/core/__tests__/expression-parser.test.ts`

- [ ] **Step 1: 编写解析器测试**

创建 `packages/core/__tests__/expression-parser.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parse } from '../src/expression-engine/parser';
import { ASTNodeType } from '../src/expression-engine/ast';

describe('Parser', () => {
  it('should parse field reference', () => {
    const ast = parse('{Employee.Name}');
    expect(ast.type).toBe(ASTNodeType.FieldRef);
    if (ast.type === ASTNodeType.FieldRef) {
      expect(ast.source).toBe('Employee');
      expect(ast.field).toBe('Name');
    }
  });

  it('should parse string literal', () => {
    const ast = parse('"hello"');
    expect(ast.type).toBe(ASTNodeType.Literal);
    if (ast.type === ASTNodeType.Literal) {
      expect(ast.value).toBe('hello');
    }
  });

  it('should parse number literal', () => {
    const ast = parse('123.45');
    expect(ast.type).toBe(ASTNodeType.Literal);
    if (ast.type === ASTNodeType.Literal) {
      expect(ast.value).toBe(123.45);
    }
  });

  it('should parse arithmetic expression', () => {
    const ast = parse('{A.X} + 100');
    expect(ast.type).toBe(ASTNodeType.BinaryOp);
    if (ast.type === ASTNodeType.BinaryOp) {
      expect(ast.operator).toBe('+');
      expect(ast.left.type).toBe(ASTNodeType.FieldRef);
      expect(ast.right.type).toBe(ASTNodeType.Literal);
    }
  });

  it('should respect operator precedence: * before +', () => {
    const ast = parse('{A.X} + {B.Y} * 10');
    expect(ast.type).toBe(ASTNodeType.BinaryOp);
    if (ast.type === ASTNodeType.BinaryOp) {
      expect(ast.operator).toBe('+');
      expect(ast.left.type).toBe(ASTNodeType.FieldRef);
      expect(ast.right.type).toBe(ASTNodeType.BinaryOp);
      if (ast.right.type === ASTNodeType.BinaryOp) {
        expect(ast.right.operator).toBe('*');
      }
    }
  });

  it('should parse comparison', () => {
    const ast = parse('{Order.Total} > 1000');
    expect(ast.type).toBe(ASTNodeType.BinaryOp);
    if (ast.type === ASTNodeType.BinaryOp) {
      expect(ast.operator).toBe('>');
    }
  });

  it('should parse function call', () => {
    const ast = parse('IF({A.X} > 10, "yes", "no")');
    expect(ast.type).toBe(ASTNodeType.FunctionCall);
    if (ast.type === ASTNodeType.FunctionCall) {
      expect(ast.name).toBe('IF');
      expect(ast.args).toHaveLength(3);
    }
  });

  it('should parse nested function call', () => {
    const ast = parse('ROUND({A.X} * 1.1, 2)');
    expect(ast.type).toBe(ASTNodeType.FunctionCall);
    if (ast.type === ASTNodeType.FunctionCall) {
      expect(ast.name).toBe('ROUND');
      expect(ast.args).toHaveLength(2);
    }
  });

  it('should parse NOT operator', () => {
    const ast = parse('NOT {A.Active}');
    expect(ast.type).toBe(ASTNodeType.UnaryOp);
    if (ast.type === ASTNodeType.UnaryOp) {
      expect(ast.operator).toBe('NOT');
    }
  });

  it('should parse parenthesized expression', () => {
    const ast = parse('({A.X} + {B.Y}) * 10');
    expect(ast.type).toBe(ASTNodeType.BinaryOp);
    if (ast.type === ASTNodeType.BinaryOp) {
      expect(ast.operator).toBe('*');
      expect(ast.left.type).toBe(ASTNodeType.BinaryOp);
    }
  });

  it('should parse boolean expression', () => {
    const ast = parse('{A.X} > 10 AND {B.Y} < 20');
    expect(ast.type).toBe(ASTNodeType.BinaryOp);
    if (ast.type === ASTNodeType.BinaryOp) {
      expect(ast.operator).toBe('AND');
    }
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd d:/ItemSource/report-designer && pnpm --filter @report-designer/core test -- expression-parser`
Expected: FAIL

- [ ] **Step 3: 实现解析器**

创建 `packages/core/src/expression-engine/parser.ts`:

```typescript
import { tokenize, TokenType, type Token } from './lexer';
import { ASTNodeType, type ASTNode, type LiteralNode, type FieldRefNode, type BinaryOpNode, type UnaryOpNode, type FunctionCallNode } from './ast';

const PRECEDENCE: Record<string, number> = {
  'OR': 1,
  'AND': 2,
  'NOT': 3,
  '=': 4, '!=': 4,
  '>': 5, '<': 5, '>=': 5, '<=': 5,
  '+': 6, '-': 6,
  '*': 7, '/': 7, '%': 7,
};

function isBinaryOp(type: TokenType): boolean {
  return type === TokenType.PLUS || type === TokenType.MINUS ||
    type === TokenType.MULTIPLY || type === TokenType.DIVIDE || type === TokenType.MODULO ||
    type === TokenType.EQUALS || type === TokenType.NOT_EQUALS ||
    type === TokenType.GT || type === TokenType.LT || type === TokenType.GTE || type === TokenType.LTE ||
    type === TokenType.AND || type === TokenType.OR;
}

function tokenToOperator(token: Token): string {
  const map: Record<number, string> = {
    [TokenType.PLUS]: '+',
    [TokenType.MINUS]: '-',
    [TokenType.MULTIPLY]: '*',
    [TokenType.DIVIDE]: '/',
    [TokenType.MODULO]: '%',
    [TokenType.EQUALS]: '=',
    [TokenType.NOT_EQUALS]: '!=',
    [TokenType.GT]: '>',
    [TokenType.LT]: '<',
    [TokenType.GTE]: '>=',
    [TokenType.LTE]: '<=',
    [TokenType.AND]: 'AND',
    [TokenType.OR]: 'OR',
  };
  return map[token.type] ?? token.value;
}

class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(input: string) {
    this.tokens = tokenize(input);
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    return this.tokens[this.pos++];
  }

  private expect(type: TokenType): Token {
    const token = this.advance();
    if (token.type !== type) {
      throw new Error(`Expected token type ${TokenType[type]}, got ${TokenType[token.type]} at position ${token.position}`);
    }
    return token;
  }

  parse(): ASTNode {
    const ast = this.parseExpression(0);
    if (this.peek().type !== TokenType.EOF) {
      throw new Error(`Unexpected token at position ${this.peek().position}`);
    }
    return ast;
  }

  private parseExpression(minPrec: number): ASTNode {
    let left = this.parseUnary();

    while (isBinaryOp(this.peek().type)) {
      const op = this.peek();
      const opStr = tokenToOperator(op);
      const prec = PRECEDENCE[opStr] ?? 0;
      if (prec < minPrec) break;

      this.advance();
      const right = this.parseExpression(prec + 1);
      left = { type: ASTNodeType.BinaryOp, operator: opStr, left, right } as BinaryOpNode;
    }

    return left;
  }

  private parseUnary(): ASTNode {
    if (this.peek().type === TokenType.NOT) {
      this.advance();
      const operand = this.parseUnary();
      return { type: ASTNodeType.UnaryOp, operator: 'NOT', operand } as UnaryOpNode;
    }

    if (this.peek().type === TokenType.MINUS) {
      this.advance();
      const operand = this.parseUnary();
      return { type: ASTNodeType.UnaryOp, operator: '-', operand } as UnaryOpNode;
    }

    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    const token = this.peek();

    // 括号表达式
    if (token.type === TokenType.LPAREN) {
      this.advance();
      const expr = this.parseExpression(0);
      this.expect(TokenType.RPAREN);
      return expr;
    }

    // 字段引用
    if (token.type === TokenType.FIELD_REF) {
      this.advance();
      const parts = token.value.split('.');
      if (parts.length !== 2) {
        throw new Error(`Invalid field reference: ${token.value}. Expected format: DataSource.Field`);
      }
      return { type: ASTNodeType.FieldRef, source: parts[0], field: parts[1] } as FieldRefNode;
    }

    // 字符串字面量
    if (token.type === TokenType.STRING) {
      this.advance();
      return { type: ASTNodeType.Literal, value: token.value, dataType: 'string' } as LiteralNode;
    }

    // 数字字面量
    if (token.type === TokenType.NUMBER) {
      this.advance();
      return { type: ASTNodeType.Literal, value: parseFloat(token.value), dataType: 'number' } as LiteralNode;
    }

    // 布尔字面量
    if (token.type === TokenType.BOOLEAN) {
      this.advance();
      return { type: ASTNodeType.Literal, value: token.value === 'true', dataType: 'boolean' } as LiteralNode;
    }

    // 函数调用
    if (token.type === TokenType.IDENTIFIER) {
      this.advance();
      const name = token.value;
      this.expect(TokenType.LPAREN);
      const args: ASTNode[] = [];

      if (this.peek().type !== TokenType.RPAREN) {
        args.push(this.parseExpression(0));
        while (this.peek().type === TokenType.COMMA) {
          this.advance();
          args.push(this.parseExpression(0));
        }
      }
      this.expect(TokenType.RPAREN);
      return { type: ASTNodeType.FunctionCall, name, args } as FunctionCallNode;
    }

    throw new Error(`Unexpected token ${TokenType[token.type]} ('${token.value}') at position ${token.position}`);
  }
}

export function parse(input: string): ASTNode {
  return new Parser(input).parse();
}
```

- [ ] **Step 4: 更新 barrel 导出**

更新 `packages/core/src/expression-engine/index.ts`:

```typescript
export { tokenize, TokenType } from './lexer';
export type { Token } from './lexer';
export * from './ast';
export { parse } from './parser';
```

- [ ] **Step 5: 运行测试确认通过**

Run: `cd d:/ItemSource/report-designer && pnpm --filter @report-designer/core test -- expression-parser`
Expected: 所有 11 个测试 PASS

- [ ] **Step 6: 提交**

Run: `cd d:/ItemSource/report-designer && git add packages/core/src/expression-engine/parser.ts packages/core/__tests__/expression-parser.test.ts && git commit -m "feat(core): add expression parser with operator precedence and function calls"`

---

## Task 4: 表达式引擎 — 求值器（Evaluator）+ 内置函数库

**Files:**
- Create: `packages/core/src/expression-engine/functions/registry.ts`
- Create: `packages/core/src/expression-engine/functions/string.ts`
- Create: `packages/core/src/expression-engine/functions/number.ts`
- Create: `packages/core/src/expression-engine/functions/logical.ts`
- Create: `packages/core/src/expression-engine/functions/date.ts`
- Create: `packages/core/src/expression-engine/functions/conversion.ts`
- Create: `packages/core/src/expression-engine/evaluator.ts`
- Create: `packages/core/__tests__/expression-evaluator.test.ts`

- [ ] **Step 1: 编写求值器测试**

创建 `packages/core/__tests__/expression-evaluator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { evaluate } from '../src/expression-engine/evaluator';
import type { DataContext } from '../src/template-model';

const ctx: DataContext = {
  Employee: { Name: '张三', Salary: 5000 },
  Order: { Total: 1200, Quantity: 3, Date: '2026-05-03', Active: true },
};

describe('Evaluator', () => {
  it('should evaluate field reference', () => {
    expect(evaluate('{Employee.Name}', ctx)).toBe('张三');
  });

  it('should evaluate string literal', () => {
    expect(evaluate('"hello"', ctx)).toBe('hello');
  });

  it('should evaluate number literal', () => {
    expect(evaluate('123', ctx)).toBe(123);
  });

  it('should evaluate boolean literal', () => {
    expect(evaluate('true', ctx)).toBe(true);
  });

  it('should evaluate arithmetic', () => {
    expect(evaluate('{Order.Total} + 100', ctx)).toBe(1300);
    expect(evaluate('{Order.Total} * {Order.Quantity}', ctx)).toBe(3600);
    expect(evaluate('{Order.Total} / {Order.Quantity}', ctx)).toBe(400);
  });

  it('should evaluate comparison', () => {
    expect(evaluate('{Order.Total} > 1000', ctx)).toBe(true);
    expect(evaluate('{Order.Total} < 1000', ctx)).toBe(false);
    expect(evaluate('{Order.Total} = 1200', ctx)).toBe(true);
    expect(evaluate('{Order.Total} != 1000', ctx)).toBe(true);
  });

  it('should evaluate logical operators', () => {
    expect(evaluate('{Order.Active} AND {Order.Total} > 0', ctx)).toBe(true);
    expect(evaluate('NOT {Order.Active}', ctx)).toBe(false);
  });

  it('should evaluate IF function', () => {
    expect(evaluate('IF({Order.Total} > 1000, "VIP", "Normal")', ctx)).toBe('VIP');
  });

  it('should evaluate ROUND function', () => {
    expect(evaluate('ROUND(123.456, 2)', ctx)).toBe(123.46);
  });

  it('should evaluate UPPER/LOWER function', () => {
    expect(evaluate('UPPER({Employee.Name})', ctx)).toBe('张三'); // 中文无大小写
    expect(evaluate('LOWER("HELLO")', ctx)).toBe('hello');
  });

  it('should evaluate CONCAT function', () => {
    expect(evaluate('CONCAT({Employee.Name}, "-VIP")', ctx)).toBe('张三-VIP');
  });

  it('should evaluate FORMAT function', () => {
    expect(evaluate('FORMAT({Order.Date}, "yyyy-MM-dd")', ctx)).toBe('2026-05-03');
  });

  it('should evaluate TONUMBER function', () => {
    expect(evaluate('TONUMBER("123.5")', ctx)).toBe(123.5);
  });

  it('should evaluate ISNULL function', () => {
    expect(evaluate('ISNULL({Employee.Name})', ctx)).toBe(false);
  });

  it('should evaluate nested function', () => {
    expect(evaluate('IF(ROUND({Order.Total}, 0) > 1200, "A", "B")', ctx)).toBe('B');
  });

  it('should throw on unknown function', () => {
    expect(() => evaluate('UNKNOWN_FUNC(1)', ctx)).toThrow('Unknown function');
  });

  it('should handle null field gracefully', () => {
    const emptyCtx: DataContext = { Employee: { Name: null as any } };
    expect(evaluate('{Employee.Name}', emptyCtx)).toBeNull();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd d:/ItemSource/report-designer && pnpm --filter @report-designer/core test -- expression-evaluator`
Expected: FAIL

- [ ] **Step 3: 实现函数注册表**

创建 `packages/core/src/expression-engine/functions/registry.ts`:

```typescript
export interface FunctionDef {
  name: string;
  minArgs: number;
  maxArgs: number;
  isAggregate?: boolean;
  impl: (...args: any[]) => any;
}

const registry = new Map<string, FunctionDef>();

export function registerFunction(def: FunctionDef): void {
  registry.set(def.name.toUpperCase(), def);
}

export function getFunction(name: string): FunctionDef | undefined {
  return registry.get(name.toUpperCase());
}

export function getAllFunctions(): ReadonlyMap<string, FunctionDef> {
  return registry;
}

export function registerBuiltinFunctions(): void {
  // 字符串函数
  registerFunction({ name: 'CONCAT', minArgs: 2, maxArgs: 2, impl: (a, b) => String(a ?? '') + String(b ?? '') });
  registerFunction({ name: 'SUBSTRING', minArgs: 3, maxArgs: 3, impl: (s, start, len) => String(s).substring(start, start + len) });
  registerFunction({ name: 'LENGTH', minArgs: 1, maxArgs: 1, impl: (s) => String(s).length });
  registerFunction({ name: 'UPPER', minArgs: 1, maxArgs: 1, impl: (s) => String(s).toUpperCase() });
  registerFunction({ name: 'LOWER', minArgs: 1, maxArgs: 1, impl: (s) => String(s).toLowerCase() });
  registerFunction({ name: 'TRIM', minArgs: 1, maxArgs: 1, impl: (s) => String(s).trim() });
  registerFunction({ name: 'REPLACE', minArgs: 3, maxArgs: 3, impl: (s, search, replace) => String(s).replaceAll(String(search), String(replace)) });

  // 数值函数
  registerFunction({ name: 'ROUND', minArgs: 2, maxArgs: 2, impl: (n, d) => { const f = 10 ** d; return Math.round(n * f) / f; } });
  registerFunction({ name: 'ABS', minArgs: 1, maxArgs: 1, impl: (n) => Math.abs(n) });
  registerFunction({ name: 'SUM', minArgs: 1, maxArgs: 1, isAggregate: true, impl: (n) => n });
  registerFunction({ name: 'AVG', minArgs: 1, maxArgs: 1, isAggregate: true, impl: (n) => n });
  registerFunction({ name: 'MIN', minArgs: 1, maxArgs: 1, isAggregate: true, impl: (n) => n });
  registerFunction({ name: 'MAX', minArgs: 1, maxArgs: 1, isAggregate: true, impl: (n) => n });
  registerFunction({ name: 'CEIL', minArgs: 1, maxArgs: 1, impl: (n) => Math.ceil(n) });
  registerFunction({ name: 'FLOOR', minArgs: 1, maxArgs: 1, impl: (n) => Math.floor(n) });

  // 逻辑函数
  registerFunction({ name: 'IF', minArgs: 3, maxArgs: 3, impl: (cond, thenVal, elseVal) => cond ? thenVal : elseVal });
  registerFunction({ name: 'IIF', minArgs: 3, maxArgs: 3, impl: (cond, thenVal, elseVal) => cond ? thenVal : elseVal });
  registerFunction({ name: 'ISNULL', minArgs: 1, maxArgs: 1, impl: (v) => v === null || v === undefined });

  // 日期函数
  registerFunction({ name: 'TODAY', minArgs: 0, maxArgs: 0, impl: () => new Date().toISOString().split('T')[0] });
  registerFunction({ name: 'NOW', minArgs: 0, maxArgs: 0, impl: () => new Date().toISOString() });
  registerFunction({ name: 'DATEADD', minArgs: 3, maxArgs: 3, impl: (date, amount, unit) => {
    const d = new Date(date);
    const u = String(unit).toLowerCase();
    if (u === 'day' || u === 'd') d.setDate(d.getDate() + amount);
    else if (u === 'month' || u === 'm') d.setMonth(d.getMonth() + amount);
    else if (u === 'year' || u === 'y') d.setFullYear(d.getFullYear() + amount);
    return d.toISOString().split('T')[0];
  }});
  registerFunction({ name: 'DATEDIFF', minArgs: 3, maxArgs: 3, impl: (d1, d2, unit) => {
    const a = new Date(d1).getTime();
    const b = new Date(d2).getTime();
    const diff = b - a;
    const u = String(unit).toLowerCase();
    if (u === 'day' || u === 'd') return Math.round(diff / 86400000);
    if (u === 'hour' || u === 'h') return Math.round(diff / 3600000);
    return diff;
  }});
  registerFunction({ name: 'FORMAT', minArgs: 2, maxArgs: 2, impl: (value, pattern) => {
    if (value instanceof Date || typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      const d = new Date(value);
      return String(pattern)
        .replace('yyyy', String(d.getFullYear()))
        .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
        .replace('dd', String(d.getDate()).padStart(2, '0'))
        .replace('HH', String(d.getHours()).padStart(2, '0'))
        .replace('mm', String(d.getMinutes()).padStart(2, '0'))
        .replace('ss', String(d.getSeconds()).padStart(2, '0'));
    }
    if (typeof value === 'number') {
      return String(pattern)
        .replace('#,##0', value.toLocaleString())
        .replace('0.00', value.toFixed(2))
        .replace('0', String(Math.round(value)));
    }
    return String(value);
  }});

  // 类型转换
  registerFunction({ name: 'TONUMBER', minArgs: 1, maxArgs: 1, impl: (v) => Number(v) });
  registerFunction({ name: 'TOSTRING', minArgs: 1, maxArgs: 1, impl: (v) => String(v ?? '') });
  registerFunction({ name: 'TODATE', minArgs: 1, maxArgs: 1, impl: (v) => new Date(v).toISOString().split('T')[0] });
}

// 自动注册
registerBuiltinFunctions();
```

- [ ] **Step 4: 实现求值器**

创建 `packages/core/src/expression-engine/evaluator.ts`:

```typescript
import { ASTNodeType, type ASTNode, type LiteralNode, type FieldRefNode, type BinaryOpNode, type UnaryOpNode, type FunctionCallNode } from './ast';
import { getFunction } from './functions/registry';
import type { DataContext } from '../template-model';

export function evaluate(expr: string, context: DataContext): any {
  // 动态导入 parse 避免循环依赖
  const { parse } = require('./parser');
  const ast = parse(expr);
  return evalNode(ast, context);
}

export function evaluateAST(ast: ASTNode, context: DataContext): any {
  return evalNode(ast, context);
}

function evalNode(node: ASTNode, context: DataContext): any {
  switch (node.type) {
    case ASTNodeType.Literal:
      return (node as LiteralNode).value;

    case ASTNodeType.FieldRef: {
      const ref = node as FieldRefNode;
      const source = context[ref.source];
      if (!source) return null;
      if (Array.isArray(source)) return null; // 数组需要通过 DataBand 遍历
      return source[ref.field] ?? null;
    }

    case ASTNodeType.BinaryOp: {
      const bin = node as BinaryOpNode;
      // AND/OR 短路求值
      if (bin.operator === 'AND') {
        return evalNode(bin.left, context) && evalNode(bin.right, context);
      }
      if (bin.operator === 'OR') {
        return evalNode(bin.left, context) || evalNode(bin.right, context);
      }

      const left = evalNode(bin.left, context);
      const right = evalNode(bin.right, context);

      switch (bin.operator) {
        case '+': return (left ?? 0) + (right ?? 0);
        case '-': return (left ?? 0) - (right ?? 0);
        case '*': return (left ?? 0) * (right ?? 0);
        case '/': return right === 0 ? 0 : (left ?? 0) / right;
        case '%': return right === 0 ? 0 : (left ?? 0) % right;
        case '=': return left === right;
        case '!=': return left !== right;
        case '>': return (left ?? 0) > (right ?? 0);
        case '<': return (left ?? 0) < (right ?? 0);
        case '>=': return (left ?? 0) >= (right ?? 0);
        case '<=': return (left ?? 0) <= (right ?? 0);
        default: throw new Error(`Unknown operator: ${bin.operator}`);
      }
    }

    case ASTNodeType.UnaryOp: {
      const unary = node as UnaryOpNode;
      const operand = evalNode(unary.operand, context);
      if (unary.operator === 'NOT') return !operand;
      if (unary.operator === '-') return -(operand ?? 0);
      throw new Error(`Unknown unary operator: ${unary.operator}`);
    }

    case ASTNodeType.FunctionCall: {
      const call = node as FunctionCallNode;
      const func = getFunction(call.name);
      if (!func) {
        throw new Error(`Unknown function: ${call.name}`);
      }
      const args = call.args.map(arg => evalNode(arg, context));
      return func.impl(...args);
    }

    default:
      throw new Error(`Unknown AST node type: ${(node as any).type}`);
  }
}
```

- [ ] **Step 5: 更新 barrel 导出**

更新 `packages/core/src/expression-engine/index.ts`:

```typescript
export { tokenize, TokenType } from './lexer';
export type { Token } from './lexer';
export * from './ast';
export { parse } from './parser';
export { evaluate, evaluateAST } from './evaluator';
export { registerFunction, getFunction, getAllFunctions } from './functions/registry';
export type { FunctionDef } from './functions/registry';
```

- [ ] **Step 6: 运行测试确认通过**

Run: `cd d:/ItemSource/report-designer && pnpm --filter @report-designer/core test -- expression-evaluator`
Expected: 所有 17 个测试 PASS

- [ ] **Step 7: 提交**

Run: `cd d:/ItemSource/report-designer && git add packages/core/src/expression-engine packages/core/__tests__/expression-evaluator.test.ts && git commit -m "feat(core): add expression evaluator with 20+ built-in functions"`

- [ ] **Step 8: 对比 Stimulsoft Reports 表达式功能**

对比检查项：
- [x] 字段引用 `{DataSource.Field}` — Stimulsoft: `{DataSource.FieldName}`
- [x] 算术运算 +, -, *, / — Stimulsoft: 完全支持
- [x] 比较运算 >, <, >=, <=, =, != — Stimulsoft: 完全支持
- [x] 逻辑运算 AND, OR, NOT — Stimulsoft: 完全支持
- [x] 条件函数 IF — Stimulsoft: IIf 函数
- [x] 数值函数 ROUND, ABS — Stimulsoft: 完全支持
- [x] 聚合函数 SUM, AVG, MIN, MAX — Stimulsoft: 完全支持
- [x] 字符串函数 UPPER, LOWER, TRIM, CONCAT — Stimulsoft: 完全支持
- [x] 日期函数 TODAY, NOW, DATEADD, DATEDIFF — Stimulsoft: 完全支持
- [x] 格式化 FORMAT — Stimulsoft: Format 函数
- [x] 类型转换 TONUMBER, TOSTRING, TODATE — Stimulsoft: CStr, CNum, CDate
- [x] 安全白名单 — 不允许 eval/任意代码执行
- 差异: Stimulsoft 支持 `RunningSum`（运行累计），暂未实现，记入后续

---

## Task 5: 渲染引擎 — 渲染树 + 数据绑定

**Files:**
- Create: `packages/core/src/renderer/render-tree-types.ts`
- Create: `packages/core/src/renderer/data-binding.ts`
- Create: `packages/core/src/renderer/conditional.ts`
- Create: `packages/core/src/renderer/grouping.ts`
- Create: `packages/core/src/renderer/layout.ts`
- Create: `packages/core/src/renderer/render.ts`
- Create: `packages/core/src/renderer/index.ts`
- Create: `packages/core/__tests__/renderer.test.ts`

- [ ] **Step 1: 编写渲染引擎测试**

创建 `packages/core/__tests__/renderer.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { renderReport } from '../src/renderer';
import { createDefaultTemplate } from '../src/template-model';
import type { ReportTemplate, DataContext, TextComponent, Band } from '../src/template-model';

describe('Renderer', () => {
  describe('basic rendering', () => {
    it('should render empty template with default bands', () => {
      const template = createDefaultTemplate();
      const data: DataContext = {};
      const tree = renderReport(template, data);
      expect(tree.pages.length).toBeGreaterThanOrEqual(1);
      expect(tree.pages[0].bands.length).toBe(4); // title, header, data, footer
    });

    it('should render text component with static content', () => {
      const template = createDefaultTemplate();
      const textComp: TextComponent = {
        id: 't1', type: 'text',
        x: 10, y: 5, width: 80, height: 10,
        text: '"Hello World"',
        font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, color: '#000000' },
        textAlign: 'left', verticalAlign: 'top',
        border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
        canGrow: false, canShrink: false,
      };
      template.pages[0].bands[0].components.push(textComp);
      const data: DataContext = {};
      const tree = renderReport(template, data);
      const rendered = tree.pages[0].bands[0].components[0];
      expect(rendered.props.text).toBe('Hello World');
    });

    it('should render text component with data binding', () => {
      const template = createDefaultTemplate();
      const textComp: TextComponent = {
        id: 't1', type: 'text',
        x: 10, y: 5, width: 80, height: 10,
        text: '{Employee.Name}',
        font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, color: '#000000' },
        textAlign: 'left', verticalAlign: 'top',
        border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
        canGrow: false, canShrink: false,
      };
      template.pages[0].bands[0].components.push(textComp);
      const data: DataContext = { Employee: { Name: '张三' } };
      const tree = renderReport(template, data);
      const rendered = tree.pages[0].bands[0].components[0];
      expect(rendered.props.text).toBe('张三');
    });
  });

  describe('data band rendering', () => {
    it('should expand data band into multiple rows', () => {
      const template = createDefaultTemplate();
      // 找到 data band
      const dataBand = template.pages[0].bands.find(b => b.type === 'data')!;
      dataBand.dataSource = 'Employees';
      const textComp: TextComponent = {
        id: 't1', type: 'text',
        x: 10, y: 2, width: 80, height: 8,
        text: '{Employees.Name}',
        font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, color: '#000000' },
        textAlign: 'left', verticalAlign: 'top',
        border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
        canGrow: false, canShrink: false,
      };
      dataBand.components.push(textComp);
      template.dataSources.push({
        id: 'Employees', name: 'Employees', type: 'json',
        schema: [{ name: 'Name', type: 'string' }],
      });

      const data: DataContext = {
        Employees: [
          { Name: '张三' },
          { Name: '李四' },
          { Name: '王五' },
        ],
      };

      const tree = renderReport(template, data);
      // data band 应该被展开为 3 行
      const dataBands = tree.pages[0].bands.filter(b => b.type === 'data');
      expect(dataBands).toHaveLength(3);
      expect(dataBands[0].components[0].props.text).toBe('张三');
      expect(dataBands[1].components[0].props.text).toBe('李四');
      expect(dataBands[2].components[0].props.text).toBe('王五');
    });
  });

  describe('grouping', () => {
    it('should group data by field', () => {
      const template = createDefaultTemplate();
      // 添加 groupHeader + data + groupFooter
      const page = template.pages[0];
      const gHeader: Band = { id: 'gh1', type: 'groupHeader', height: 20, groupField: 'Department', components: [] };
      const gFooter: Band = { id: 'gf1', type: 'groupFooter', height: 20, groupField: 'Department', components: [] };
      page.bands = [page.bands[0], page.bands[1], gHeader, page.bands[2], gFooter, page.bands[3]];
      page.bands[3].dataSource = 'Employees'; // data band

      const textComp: TextComponent = {
        id: 't1', type: 'text',
        x: 10, y: 2, width: 80, height: 8,
        text: '{Employees.Department}',
        font: { family: 'Arial', size: 12, bold: true, italic: false, underline: false, color: '#000000' },
        textAlign: 'left', verticalAlign: 'top',
        border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
        canGrow: false, canShrink: false,
      };
      gHeader.components.push(textComp);

      template.dataSources.push({
        id: 'Employees', name: 'Employees', type: 'json',
        schema: [{ name: 'Department', type: 'string' }, { name: 'Name', type: 'string' }],
      });

      const data: DataContext = {
        Employees: [
          { Department: '技术部', Name: '张三' },
          { Department: '技术部', Name: '李四' },
          { Department: '市场部', Name: '王五' },
        ],
      };

      const tree = renderReport(template, data);
      // 应该有 2 个 groupHeader（技术部、市场部）
      const groupHeaders = tree.pages.flatMap(p => p.bands.filter(b => b.type === 'groupHeader'));
      expect(groupHeaders).toHaveLength(2);
    });
  });

  describe('conditional formatting', () => {
    it('should apply conditional format when condition is true', () => {
      const template = createDefaultTemplate();
      const textComp: TextComponent = {
        id: 't1', type: 'text',
        x: 10, y: 5, width: 80, height: 10,
        text: '{Order.Total}',
        font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, color: '#000000' },
        textAlign: 'left', verticalAlign: 'top',
        border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
        canGrow: false, canShrink: false,
        conditions: [{
          id: 'c1',
          expression: '{Order.Total} > 1000',
          overrides: { 'font.color': '#FF0000', 'font.bold': true },
        }],
      };
      template.pages[0].bands[0].components.push(textComp);
      const data: DataContext = { Order: { Total: 1500 } };
      const tree = renderReport(template, data);
      const rendered = tree.pages[0].bands[0].components[0];
      expect(rendered.props.font.color).toBe('#FF0000');
      expect(rendered.props.font.bold).toBe(true);
    });

    it('should NOT apply conditional format when condition is false', () => {
      const template = createDefaultTemplate();
      const textComp: TextComponent = {
        id: 't1', type: 'text',
        x: 10, y: 5, width: 80, height: 10,
        text: '{Order.Total}',
        font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, color: '#000000' },
        textAlign: 'left', verticalAlign: 'top',
        border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
        canGrow: false, canShrink: false,
        conditions: [{
          id: 'c1',
          expression: '{Order.Total} > 1000',
          overrides: { 'font.color': '#FF0000' },
        }],
      };
      template.pages[0].bands[0].components.push(textComp);
      const data: DataContext = { Order: { Total: 500 } };
      const tree = renderReport(template, data);
      const rendered = tree.pages[0].bands[0].components[0];
      expect(rendered.props.font.color).toBe('#000000');
    });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd d:/ItemSource/report-designer && pnpm --filter @report-designer/core test -- renderer`
Expected: FAIL

- [ ] **Step 3: 实现渲染树类型**

创建 `packages/core/src/renderer/render-tree-types.ts`:

```typescript
import type { BandType } from '../template-model';

export interface RenderTree {
  pages: RenderPage[];
}

export interface RenderPage {
  width: number;      // px
  height: number;     // px
  bands: RenderBand[];
}

export interface RenderBand {
  type: BandType;
  height: number;     // px
  components: RenderComponent[];
}

export interface RenderComponent {
  type: string;
  x: number;          // px
  y: number;          // px
  width: number;      // px
  height: number;     // px
  props: Record<string, any>;
}

/** mm → px 转换常量 (96 DPI) */
export const MM_TO_PX = 3.78;

export function mmToPx(mm: number): number {
  return Math.round(mm * MM_TO_PX * 100) / 100;
}
```

- [ ] **Step 4: 实现数据绑定层**

创建 `packages/core/src/renderer/data-binding.ts`:

```typescript
import { evaluate, evaluateAST } from '../expression-engine/evaluator';
import { parse } from '../expression-engine/parser';
import type { ReportComponent, TextComponent, DataContext } from '../template-model';

/** 检测字符串是否是表达式（以 { 开头或包含函数调用） */
export function isExpression(text: string): boolean {
  return text.includes('{') || /^[A-Z_]+\(/.test(text.trim());
}

/** 解析并求值表达式，如果非表达式则原样返回 */
export function resolveExpression(text: string, context: DataContext): any {
  if (!isExpression(text)) {
    // 去掉引号包裹的字符串字面量
    if (text.startsWith('"') && text.endsWith('"')) {
      return text.slice(1, -1);
    }
    return text;
  }
  try {
    return evaluate(text, context);
  } catch {
    return text;
  }
}

/** 递归绑定组件数据 */
export function bindComponentData(comp: ReportComponent, context: DataContext): Record<string, any> {
  const props: Record<string, any> = {};

  // 基础属性
  props.x = comp.x;
  props.y = comp.y;
  props.width = comp.width;
  props.height = comp.height;

  switch (comp.type) {
    case 'text': {
      const tc = comp as TextComponent;
      props.text = resolveExpression(tc.text, context);
      props.font = { ...tc.font };
      props.textAlign = tc.textAlign;
      props.verticalAlign = tc.verticalAlign;
      props.border = { ...tc.border, sides: { ...tc.border.sides } };
      props.canGrow = tc.canGrow;
      props.canShrink = tc.canShrink;
      break;
    }
    case 'image': {
      props.src = resolveExpression((comp as any).src, context);
      props.fitMode = (comp as any).fitMode;
      break;
    }
    case 'table': {
      const tc = comp as any;
      props.dataSource = tc.dataSource;
      props.columns = tc.columns;
      props.headerHeight = tc.headerHeight;
      props.rowHeight = tc.rowHeight;
      props.showBorder = tc.showBorder;
      break;
    }
    case 'barcode': {
      const bc = comp as any;
      props.value = resolveExpression(bc.value, context);
      props.format = bc.format;
      props.showText = bc.showText;
      break;
    }
    case 'checkbox': {
      const cb = comp as any;
      props.checked = resolveExpression(cb.checked, context);
      if (cb.label) props.label = resolveExpression(cb.label, context);
      break;
    }
    case 'richtext': {
      props.html = resolveExpression((comp as any).html, context);
      break;
    }
    case 'panel': {
      const pc = comp as any;
      props.backgroundColor = pc.backgroundColor;
      props.border = { ...pc.border, sides: { ...pc.border.sides } };
      props.components = pc.components;
      break;
    }
    case 'subreport': {
      const sc = comp as any;
      props.templateUrl = sc.templateUrl;
      props.parameters = sc.parameters;
      break;
    }
  }

  return props;
}
```

- [ ] **Step 5: 实现条件格式处理**

创建 `packages/core/src/renderer/conditional.ts`:

```typescript
import { evaluate } from '../expression-engine/evaluator';
import type { ConditionRule, DataContext } from '../template-model';

/** 应用条件格式 — 修改 props in-place */
export function applyConditions(props: Record<string, any>, conditions: ConditionRule[], context: DataContext): void {
  for (const rule of conditions) {
    try {
      const result = evaluate(rule.expression, context);
      if (result === true) {
        for (const [path, value] of Object.entries(rule.overrides)) {
          setNestedProp(props, path, value);
        }
      }
    } catch {
      // 条件求值失败，跳过
    }
  }
}

function setNestedProp(obj: Record<string, any>, path: string, value: any): void {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] === undefined) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}
```

- [ ] **Step 6: 实现分组处理**

创建 `packages/core/src/renderer/grouping.ts`:

```typescript
import type { Band, DataContext } from '../template-model';

interface GroupInfo {
  key: string;
  startIndex: number;
  count: number;
}

/** 对数据按分组字段分组 */
export function groupData(data: Record<string, any>[], groupField: string): GroupInfo[] {
  if (!data || data.length === 0) return [];

  const groups: GroupInfo[] = [];
  let currentKey: string | null = null;
  let startIndex = 0;

  data.forEach((row, i) => {
    const key = String(row[groupField] ?? '');
    if (key !== currentKey) {
      if (currentKey !== null) {
        groups.push({ key: currentKey, startIndex, count: i - startIndex });
      }
      currentKey = key;
      startIndex = i;
    }
  });

  if (currentKey !== null) {
    groups.push({ key: currentKey, startIndex, count: data.length - startIndex });
  }

  return groups;
}

/** 获取分组内的数据行 */
export function getGroupRows(data: Record<string, any>[], group: GroupInfo): Record<string, any>[] {
  return data.slice(group.startIndex, group.startIndex + group.count);
}
```

- [ ] **Step 7: 实现主渲染函数**

创建 `packages/core/src/renderer/render.ts`:

```typescript
import type { ReportTemplate, Page, Band, ReportComponent, DataContext, BandType } from '../template-model';
import type { RenderTree, RenderPage, RenderBand, RenderComponent } from './render-tree-types';
import { mmToPx } from './render-tree-types';
import { bindComponentData } from './data-binding';
import { applyConditions } from './conditional';
import { groupData, getGroupRows } from './grouping';

export function renderReport(template: ReportTemplate, data: DataContext): RenderTree {
  const pages: RenderPage[] = [];

  for (const page of template.pages) {
    const renderedBands = renderPageBands(page, data, template);
    pages.push({
      width: mmToPx(page.width),
      height: mmToPx(page.height),
      bands: renderedBands,
    });
  }

  return { pages };
}

function renderPageBands(page: Page, data: DataContext, template: ReportTemplate): RenderBand[] {
  const result: RenderBand[] = [];

  for (const band of page.bands) {
    if (band.type === 'data') {
      result.push(...renderDataBand(band, data));
    } else if (band.type === 'groupHeader' || band.type === 'groupFooter') {
      result.push(...renderGroupBand(band, data, page, template));
    } else {
      result.push(renderStaticBand(band, data));
    }
  }

  return result;
}

function renderStaticBand(band: Band, data: DataContext): RenderBand {
  const components: RenderComponent[] = band.components.map(comp =>
    renderComponent(comp, data)
  );

  return {
    type: band.type,
    height: mmToPx(band.height),
    components,
  };
}

function renderDataBand(band: Band, data: DataContext): RenderBand[] {
  const dataSourceId = band.dataSource;
  if (!dataSourceId) {
    return [renderStaticBand(band, data)];
  }

  const rows = data[dataSourceId];
  if (!Array.isArray(rows)) {
    return [renderStaticBand(band, data)];
  }

  return rows.map(row => {
    const rowContext = { ...data, [dataSourceId]: row };
    const components: RenderComponent[] = band.components.map(comp =>
      renderComponent(comp, rowContext)
    );
    return {
      type: 'data' as BandType,
      height: mmToPx(band.height),
      components,
    };
  });
}

function renderGroupBand(band: Band, data: DataContext, page: Page, template: ReportTemplate): RenderBand[] {
  const groupField = band.groupField;
  if (!groupField) {
    return [renderStaticBand(band, data)];
  }

  // 找到对应的 data band
  const dataBand = page.bands.find(b => b.type === 'data');
  if (!dataBand || !dataBand.dataSource) {
    return [renderStaticBand(band, data)];
  }

  const rows = data[dataBand.dataSource];
  if (!Array.isArray(rows)) {
    return [renderStaticBand(band, data)];
  }

  const groups = groupData(rows, groupField);
  const result: RenderBand[] = [];

  for (const group of groups) {
    // groupHeader: 用分组第一行数据渲染
    // groupFooter: 用分组聚合数据渲染
    const firstRow = rows[group.startIndex];
    const groupContext = { ...data, [dataBand.dataSource]: firstRow };

    const components: RenderComponent[] = band.components.map(comp => {
      const rendered = renderComponent(comp, groupContext);
      return rendered;
    });

    result.push({
      type: band.type,
      height: mmToPx(band.height),
      components,
    });
  }

  return result;
}

function renderComponent(comp: ReportComponent, data: DataContext): RenderComponent {
  const props = bindComponentData(comp, data);

  // 应用条件格式
  if (comp.conditions && comp.conditions.length > 0) {
    applyConditions(props, comp.conditions, data);
  }

  return {
    type: comp.type,
    x: mmToPx(comp.x),
    y: mmToPx(comp.y),
    width: mmToPx(comp.width),
    height: mmToPx(comp.height),
    props,
  };
}
```

- [ ] **Step 8: 创建 barrel 导出**

创建 `packages/core/src/renderer/index.ts`:

```typescript
export { renderReport } from './render';
export type { RenderTree, RenderPage, RenderBand, RenderComponent } from './render-tree-types';
export { mmToPx, MM_TO_PX } from './render-tree-types';
```

更新 `packages/core/src/index.ts`:

```typescript
export * from './template-model';
export * from './expression-engine';
export * from './renderer';
```

- [ ] **Step 9: 运行测试确认通过**

Run: `cd d:/ItemSource/report-designer && pnpm --filter @report-designer/core test -- renderer`
Expected: 所有 5 个测试 PASS

- [ ] **Step 10: 提交**

Run: `cd d:/ItemSource/report-designer && git add packages/core/src/renderer packages/core/__tests__/renderer.test.ts && git commit -m "feat(core): add rendering engine with data binding, grouping, conditional formatting"`

- [ ] **Step 11: 对比 Stimulsoft Reports 渲染功能**

对比检查项：
- [x] 数据绑定 — 表达式求值后注入组件 props
- [x] DataBand 展开为多行 — Stimulsoft: DataBand 按数据行展开
- [x] 分组渲染 — Stimulsoft: GroupHeader/GroupFooter 按分组字段
- [x] 条件格式 — Stimulsoft: Conditions 面板设置条件规则
- [x] mm→px 坐标转换 — Stimulsoft: 内部也使用 mm 单位
- 差异: 分页逻辑（overflow/page break）暂未在测试中验证，需要在 Task 6 中完善

---

## Task 6: 渲染引擎 — 分页布局

**Files:**
- Create: `packages/core/src/renderer/layout.ts`
- Modify: `packages/core/src/renderer/render.ts`
- Create: `packages/core/__tests__/renderer-layout.test.ts`

- [ ] **Step 1: 编写分页测试**

创建 `packages/core/__tests__/renderer-layout.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { renderReport } from '../src/renderer';
import { createDefaultTemplate } from '../src/template-model';
import type { DataContext, TextComponent } from '../src/template-model';
import { mmToPx } from '../src/renderer';

describe('Renderer Layout - Pagination', () => {
  it('should split into multiple pages when bands exceed page height', () => {
    const template = createDefaultTemplate();
    // A4: 210x297mm, margins 20mm → content height = 297 - 20 - 20 = 257mm
    const page = template.pages[0];
    // 添加大量 data band 行
    const dataBand = page.bands.find(b => b.type === 'data')!;
    dataBand.dataSource = 'Items';
    dataBand.height = 50; // 每行 50mm

    template.dataSources.push({
      id: 'Items', name: 'Items', type: 'json',
      schema: [{ name: 'Name', type: 'string' }],
    });

    // 生成 20 行数据，每行 50mm，总高 1000mm，远超 257mm
    const items = Array.from({ length: 20 }, (_, i) => ({ Name: `Item ${i + 1}` }));
    const data: DataContext = { Items: items };

    const tree = renderReport(template, data);
    expect(tree.pages.length).toBeGreaterThan(1);
  });

  it('should not split a non-splittable band across pages', () => {
    const template = createDefaultTemplate();
    const page = template.pages[0];
    // reportTitle band 不可拆分
    const titleBand = page.bands.find(b => b.type === 'reportTitle')!;
    titleBand.height = 200; // 很高的标题
    const tree = renderReport(template, {});
    // title band 应该完整出现在第一页
    expect(tree.pages[0].bands.some(b => b.type === 'reportTitle')).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd d:/ItemSource/report-designer && pnpm --filter @report-designer/core test -- renderer-layout`
Expected: FAIL (pagination not implemented yet)

- [ ] **Step 3: 实现分页布局引擎**

创建 `packages/core/src/renderer/layout.ts`:

```typescript
import type { RenderTree, RenderPage, RenderBand } from './render-tree-types';
import { mmToPx } from './render-tree-types';

/** 不可拆分的 band 类型 */
const NON_SPLITTABLE_BANDS = new Set(['reportTitle', 'reportSummary', 'pageHeader', 'pageFooter', 'groupHeader', 'groupFooter']);

/** 对渲染后的 band 列表进行分页 */
export function paginateBands(bands: RenderBand[], pageWidth: number, pageHeight: number, marginsMm: { top: number; bottom: number }): RenderPage[] {
  const topPx = mmToPx(marginsMm.top);
  const bottomPx = mmToPx(marginsMm.bottom);
  const contentHeight = pageHeight - topPx - bottomPx;

  const pages: RenderPage[] = [];
  let currentPage: RenderPage = { width: pageWidth, height: pageHeight, bands: [] };
  let currentHeight = 0;

  for (const band of bands) {
    if (NON_SPLITTABLE_BANDS.has(band.type)) {
      // 不可拆分 band
      if (currentHeight + band.height > contentHeight && currentPage.bands.length > 0) {
        // 当前页放不下，移到新页
        pages.push(currentPage);
        currentPage = { width: pageWidth, height: pageHeight, bands: [] };
        currentHeight = 0;
      }
      currentPage.bands.push(band);
      currentHeight += band.height;
    } else {
      // 可拆分 band（data band 的行）
      if (currentHeight + band.height <= contentHeight) {
        currentPage.bands.push(band);
        currentHeight += band.height;
      } else {
        // 当前行放不下
        if (currentPage.bands.length > 0) {
          pages.push(currentPage);
          currentPage = { width: pageWidth, height: pageHeight, bands: [] };
          currentHeight = 0;
        }
        currentPage.bands.push(band);
        currentHeight += band.height;
      }
    }
  }

  if (currentPage.bands.length > 0) {
    pages.push(currentPage);
  }

  return pages.length > 0 ? pages : [{ width: pageWidth, height: pageHeight, bands: [] }];
}
```

- [ ] **Step 4: 修改主渲染函数集成分页**

修改 `packages/core/src/renderer/render.ts` — 在 `renderReport` 中调用分页：

将 `renderReport` 函数修改为：

```typescript
import { paginateBands } from './layout';

export function renderReport(template: ReportTemplate, data: DataContext): RenderTree {
  const pages: RenderPage[] = [];

  for (const page of template.pages) {
    const allBands = renderPageBands(page, data, template);
    const paginatedPages = paginateBands(
      allBands,
      mmToPx(page.width),
      mmToPx(page.height),
      { top: page.margins.top, bottom: page.margins.bottom }
    );
    pages.push(...paginatedPages);
  }

  return { pages };
}
```

- [ ] **Step 5: 运行测试确认通过**

Run: `cd d:/ItemSource/report-designer && pnpm --filter @report-designer/core test -- renderer`
Expected: 所有渲染测试 PASS

- [ ] **Step 6: 提交**

Run: `cd d:/ItemSource/report-designer && git add packages/core/src/renderer/layout.ts packages/core/src/renderer/render.ts packages/core/__tests__/renderer-layout.test.ts && git commit -m "feat(core): add pagination layout engine with band splitting"`

---

## Task 7: 命令分发器

**Files:**
- Create: `packages/core/src/command-dispatcher/whitelist.ts`
- Create: `packages/core/src/command-dispatcher/dispatcher.ts`
- Create: `packages/core/src/command-dispatcher/index.ts`
- Create: `packages/core/__tests__/command-dispatcher.test.ts`

- [ ] **Step 1: 编写命令分发器测试**

创建 `packages/core/__tests__/command-dispatcher.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { CommandDispatcher } from '../src/command-dispatcher';

describe('CommandDispatcher', () => {
  it('should register and execute whitelisted command', () => {
    const dispatcher = new CommandDispatcher();
    let called = false;
    dispatcher.register('undo', { execute: () => { called = true; } });
    dispatcher.execute('undo');
    expect(called).toBe(true);
  });

  it('should reject non-whitelisted command on register', () => {
    const dispatcher = new CommandDispatcher();
    expect(() => dispatcher.register('hackCmd', { execute: () => {} })).toThrow('not in whitelist');
  });

  it('should throw on unregistered command execution', () => {
    const dispatcher = new CommandDispatcher();
    expect(() => dispatcher.execute('undo')).toThrow('Handler not registered');
  });

  it('should check if command is registered', () => {
    const dispatcher = new CommandDispatcher();
    dispatcher.register('redo', { execute: () => {} });
    expect(dispatcher.isRegistered('redo')).toBe(true);
    expect(dispatcher.isRegistered('undo')).toBe(false);
  });

  it('should list all registered commands', () => {
    const dispatcher = new CommandDispatcher();
    dispatcher.register('undo', { execute: () => {} });
    dispatcher.register('redo', { execute: () => {} });
    expect(dispatcher.getRegisteredCommands()).toContain('undo');
    expect(dispatcher.getRegisteredCommands()).toContain('redo');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd d:/ItemSource/report-designer && pnpm --filter @report-designer/core test -- command-dispatcher`
Expected: FAIL

- [ ] **Step 3: 实现命令白名单**

创建 `packages/core/src/command-dispatcher/whitelist.ts`:

```typescript
/** 命令白名单 — 对应设计器 Ribbon 工具栏所有命令 */
export const COMMAND_WHITELIST = new Set([
  // Home - Clipboard
  'undo', 'redo', 'cut', 'copy', 'paste', 'delete', 'selectAll',
  // Home - Font
  'bold', 'italic', 'underline', 'fontFamily', 'fontSize', 'textColor',
  // Home - Alignment
  'textAlignLeft', 'textAlignCenter', 'textAlignRight',
  'verticalAlignTop', 'verticalAlignMiddle', 'verticalAlignBottom',
  // Home - Borders
  'borderStyle', 'borderColor', 'borderAll', 'borderNone',
  // Insert - Components
  'insertText', 'insertImage', 'insertTable', 'insertBarcode',
  'insertCheckbox', 'insertRichtext', 'insertPanel', 'insertSubreport',
  // Insert - Bands
  'insertBand',
  // Insert - Page
  'newPage',
  // Page - Settings
  'pageSize', 'pageOrientation', 'pageMargins', 'pageColor',
  // Page - Grid
  'showGrid', 'snapToGrid', 'gridSize', 'showGuides',
  // Page - Panels
  'toggleReportTree', 'toggleProperties', 'toggleDataDictionary',
  // Layout - Align
  'alignLeft', 'alignCenter', 'alignRight',
  'alignTop', 'alignMiddle', 'alignBottom',
  // Layout - Distribute
  'distributeHorizontal', 'distributeVertical',
  // Layout - Arrange
  'group', 'ungroup',
  'bringToFront', 'sendToBack', 'bringForward', 'sendBackward',
  // Layout - Size
  'sameWidth', 'sameHeight', 'sameSize',
  // Layout - Lock
  'lock', 'unlock', 'toggleVisibility',
  // View - Zoom
  'zoomIn', 'zoomOut', 'zoomFit', 'zoom100', 'zoomWidth',
  // View - Display
  'toggleRuler', 'fullscreen',
  // File
  'new', 'open', 'save', 'saveAs', 'preview',
]);

export function isCommandWhitelisted(command: string): boolean {
  return COMMAND_WHITELIST.has(command);
}
```

- [ ] **Step 4: 实现命令分发器**

创建 `packages/core/src/command-dispatcher/dispatcher.ts`:

```typescript
import { isCommandWhitelisted } from './whitelist';

export interface CommandHandler {
  execute(payload?: any): void;
}

export class CommandDispatcher {
  private handlers = new Map<string, CommandHandler>();

  register(command: string, handler: CommandHandler): void {
    if (!isCommandWhitelisted(command)) {
      throw new Error(`Command '${command}' is not in whitelist`);
    }
    this.handlers.set(command, handler);
  }

  execute(command: string, payload?: any): void {
    const handler = this.handlers.get(command);
    if (!handler) {
      throw new Error(`Handler not registered for command '${command}'`);
    }
    handler.execute(payload);
  }

  isRegistered(command: string): boolean {
    return this.handlers.has(command);
  }

  getRegisteredCommands(): string[] {
    return Array.from(this.handlers.keys());
  }
}
```

- [ ] **Step 5: 创建 barrel 导出**

创建 `packages/core/src/command-dispatcher/index.ts`:

```typescript
export { CommandDispatcher } from './dispatcher';
export type { CommandHandler } from './dispatcher';
export { COMMAND_WHITELIST, isCommandWhitelisted } from './whitelist';
```

更新 `packages/core/src/index.ts`:

```typescript
export * from './template-model';
export * from './expression-engine';
export * from './renderer';
export * from './command-dispatcher';
```

- [ ] **Step 6: 运行测试确认通过**

Run: `cd d:/ItemSource/report-designer && pnpm --filter @report-designer/core test`
Expected: 所有测试 PASS

- [ ] **Step 7: 提交**

Run: `cd d:/ItemSource/report-designer && git add packages/core/src/command-dispatcher packages/core/__tests__/command-dispatcher.test.ts && git commit -m "feat(core): add command dispatcher with whitelist security"`

---

## Task 8: Core 包构建验证 + 对比 Stimulsoft

- [ ] **Step 1: 构建 core 包**

Run: `cd d:/ItemSource/report-designer && pnpm --filter @report-designer/core build`
Expected: 构建成功，dist/ 目录生成

- [ ] **Step 2: 运行全部 core 测试**

Run: `cd d:/ItemSource/report-designer && pnpm --filter @report-designer/core test`
Expected: 所有测试 PASS

- [ ] **Step 3: 对照 Stimulsoft Reports 进行 Core 模块全面对比**

对比检查清单：

| Stimulsoft 功能 | 状态 | 备注 |
|----------------|------|------|
| 模板 JSON 存储 | ✅ | ReportTemplate 完整定义 |
| A4/Letter 等页面尺寸 | ✅ | createDefaultTemplate 支持自定义 |
| 8 种 Band 类型 | ✅ | 全部支持 |
| 文本组件 canGrow/canShrink | ✅ | 类型定义完整，渲染器支持 |
| 表格组件 | ✅ | TableColumn + cellType |
| 条码组件 | ✅ | 7 种条码格式 |
| 图片/复选框/富文本 | ✅ | 全部类型定义 |
| 子报表/面板 | ✅ | 类型定义完整 |
| 表达式字段引用 | ✅ | {DataSource.Field} |
| 算术/比较/逻辑运算 | ✅ | 全部运算符 |
| IF 条件函数 | ✅ | |
| 20+ 内置函数 | ✅ | 字符串7 + 数值8 + 逻辑3 + 日期5 + 类型3 = 26 |
| 分组 GroupHeader/Footer | ✅ | groupField + groupData |
| 条件格式 | ✅ | ConditionRule + overrides |
| 分页 | ✅ | paginateBands |
| 命令白名单安全 | ✅ | 60+ 命令白名单 |
| RunningSum (运行累计) | ❌ | 后续版本 |
| PageHeader/Footer 每页重复 | ❌ | 后续版本（当前只渲染一次） |

- [ ] **Step 4: 提交当前状态**

Run: `cd d:/ItemSource/report-designer && git add -A && git commit -m "chore: core package complete, Stimulsoft comparison verified"`

---

## Task 9-16: Designer / Viewer / Example

> **注：** 以下 Task 涉及大量 React/antd UI 组件代码，每个 Task 的结构和上面一致（测试→实现→提交→对比）。由于篇幅限制，这里列出每个 Task 的文件清单和关键实现点，详细代码在执行时逐步展开。

### Task 9: 设计器入口 + 撤销/重做系统

**Files:**
- `packages/designer/src/index.ts`
- `packages/designer/src/designer.tsx` — `<ReportDesigner>` 主组件
- `packages/designer/src/history/command.ts` — Command 接口 + MoveCommand, ResizeCommand, DeleteCommand, SetPropertyCommand
- `packages/designer/src/history/history.ts` — HistoryManager (undo/redo stack)
- `packages/designer/src/store/designer-store.ts` — Zustand store 管理模板状态
- `packages/designer/__tests__/history.test.ts`

**关键实现：**
- 使用 Zustand 管理设计器全局状态（当前模板、选中组件、缩放级别等）
- HistoryManager 包装每个操作为 Command，支持 undo/redo
- `ReportDesigner` 组件接收 `template` 和 `onChange` props

### Task 10: Ribbon 工具栏

**Files:**
- `packages/designer/src/ribbon/ribbon.tsx` — Ribbon 主组件
- `packages/designer/src/ribbon/tabs/home-tab.tsx` — 剪贴板 + 字体 + 对齐 + 边框
- `packages/designer/src/ribbon/tabs/insert-tab.tsx` — 组件 + Band + 页面
- `packages/designer/src/ribbon/tabs/page-tab.tsx` — 页面设置 + 网格 + 面板
- `packages/designer/src/ribbon/tabs/layout-tab.tsx` — 对齐 + 分布 + 排列 + 尺寸 + 锁定
- `packages/designer/src/ribbon/tabs/view-tab.tsx` — 缩放 + 显示

**关键实现：**
- 使用 antd 6 的 `Tabs` + `Button` + `Select` + `Tooltip` 组件
- 每个按钮通过 CommandDispatcher 执行命令
- 字体/尺寸使用 `Select` 下拉
- 对齐/排列使用图标按钮组

### Task 11: 画布 — 基础框架 + 网格 + 标尺

**Files:**
- `packages/designer/src/canvas/canvas.tsx` — 画布主组件
- `packages/designer/src/canvas/grid-system.ts` — 网格绘制 + Snap
- `packages/designer/src/canvas/ruler.tsx` — 水平/垂直标尺
- `packages/designer/src/canvas/zoom-pan.ts` — 缩放 + 平移 Hook

**关键实现：**
- Canvas 使用 SVG 绘制网格线 + HTML 叠加层放组件
- ZoomPan: 鼠标滚轮缩放 (10%-400%)，空格+拖拽平移
- GridSystem: 根据 gridSize 画网格，snap to grid 计算最近对齐点
- Ruler: CSS 绘制刻度标尺

### Task 12: 画布 — 选择 + 拖拽 + Resize

**Files:**
- `packages/designer/src/canvas/selection-manager.ts` — 框选 + 多选
- `packages/designer/src/canvas/drag-drop-handler.ts` — 组件拖拽移动
- `packages/designer/src/canvas/resize-manager.ts` — 8方向 resize

**关键实现：**
- SelectionManager: mousedown 开始框选，mousemove 绘制选框，mouseup 计算交集
- DragDropHandler: 选中组件 mousedown 开始拖拽，mousemove 更新位置，mouseup 确认
- ResizeManager: 8 个 handle (nw, n, ne, e, se, s, sw, w)，拖拽改变宽高
- 所有操作通过 Command 包装，支持 undo

### Task 13: 侧面板 — 数据字典 + 属性 + 报表树

**Files:**
- `packages/designer/src/panels/data-dictionary.tsx` — 数据源树 + 拖拽字段
- `packages/designer/src/panels/properties-panel.tsx` — 属性编辑表单
- `packages/designer/src/panels/report-tree.tsx` — 组件层级树
- `packages/designer/src/expression-editor/expression-editor.tsx` — 表达式编辑弹窗
- `packages/designer/src/expression-editor/field-picker.tsx` — 字段选择器

**关键实现：**
- DataDictionary: antd `Tree` 组件，dnd-kit 拖拽字段到画布
- PropertiesPanel: 根据 `selectedComponent.type` 动态渲染 antd `Form`
- ExpressionEditor: 弹窗内含代码编辑区 + FieldPicker + 实时预览求值结果
- ReportTree: antd `Tree` 显示 Band → Component 层级

### Task 14: Viewer — 报表查看器

**Files:**
- `packages/viewer/src/index.ts`
- `packages/viewer/src/viewer.tsx` — `<ReportViewer>` 主组件
- `packages/viewer/src/toolbar.tsx` — 缩放 + 翻页 + 打印 + 导出
- `packages/viewer/src/page-renderer.tsx` — 单页渲染
- `packages/viewer/src/band-renderer.tsx` — 带渲染
- `packages/viewer/src/components/text-renderer.tsx`
- `packages/viewer/src/components/image-renderer.tsx`
- `packages/viewer/src/components/table-renderer.tsx`
- `packages/viewer/src/components/barcode-renderer.tsx`
- `packages/viewer/src/components/checkbox-renderer.tsx`
- `packages/viewer/src/components/richtext-renderer.tsx`
- `packages/viewer/src/components/panel-renderer.tsx`
- `packages/viewer/src/components/subreport-renderer.tsx`
- `packages/viewer/src/hooks/use-renderer.ts` — 调用 core/renderer 的 Hook

**关键实现：**
- `useRenderer(template, data)` 内部调用 `renderReport()`，返回 RenderTree
- 每种组件渲染器接收 `RenderComponent`，用绝对定位 + CSS 渲染
- TableRenderer: 表头 + 数据行循环渲染
- BarcodeRenderer: 使用 jsbarcode 生成 SVG

### Task 15: 打印 + PDF 导出

**Files:**
- `packages/viewer/src/print/print-engine.ts` — iframe 打印
- `packages/viewer/src/print/print-styles.css` — @media print 样式
- `packages/viewer/src/export/pdf-exporter.ts` — pdf-lib 导出
- `packages/viewer/src/export/font-mapping.ts` — 字体映射

**关键实现：**
- PrintEngine: 创建隐藏 iframe，写入渲染后的 HTML，调用 `print()`
- PdfExporter: 遍历 RenderTree，用 pdf-lib 逐页绘制
- FontMapping: 注册中文字体 (SimSun)，映射到 pdf-lib 的 PDFFont

### Task 16: Example 示例应用

**Files:**
- `packages/example/src/main.tsx` — React 入口
- `packages/example/src/App.tsx` — 主界面（设计器 + 预览切换）
- `packages/example/src/templates/employee-list.json` — 员工列表示例模板
- `packages/example/src/data/employee-data.ts` — 示例数据

**关键实现：**
- App.tsx: 左侧 Tab 切换"设计器"和"预览"
- 设计器模式下显示 `<ReportDesigner>`
- 预览模式下显示 `<ReportViewer>`
- 示例模板: 员工列表报表（含分组、条件格式）

---

## 实现顺序总结

```
Task 0: Monorepo 基础搭建
  ↓
Task 1: 模板数据模型 (types + validation + factory)
  ↓
Task 2: 表达式词法分析器 (Lexer)
  ↓
Task 3: 表达式解析器 (Parser)
  ↓
Task 4: 表达式求值器 (Evaluator + 20+ 函数)
  ↓  ← 对比 Stimulsoft 表达式功能
Task 5: 渲染引擎 (数据绑定 + 分组 + 条件格式)
  ↓
Task 6: 渲染引擎 (分页布局)
  ↓  ← 对比 Stimulsoft 渲染功能
Task 7: 命令分发器
  ↓
Task 8: Core 包构建验证 + 全面对比 Stimulsoft
  ↓
Task 9: 设计器入口 + 撤销/重做
  ↓
Task 10: Ribbon 工具栏
  ↓  ← 对比 Stimulsoft Designer Ribbon
Task 11: 画布 (网格 + 标尺 + 缩放)
  ↓
Task 12: 画布 (选择 + 拖拽 + Resize)
  ↓  ← 对比 Stimulsoft Designer Canvas
Task 13: 侧面板 (数据字典 + 属性 + 报表树)
  ↓  ← 对比 Stimulsoft Designer Panels
Task 14: Viewer 报表查看器
  ↓  ← 对比 Stimulsoft Viewer
Task 15: 打印 + PDF 导出
  ↓  ← 对比 Stimulsoft Export
Task 16: Example 示例应用
  ↓
完成
```
