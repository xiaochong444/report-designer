# 图表 VSeed 方案复盘与重构设计

**日期**: 2026-06-12  
**目标**: 复盘 2026-06-11 的图表 VSeed 增强方案和实现，修正 VSeed、VChart、报表设计器配置模型之间的边界，形成一套可落地的图表配置与渲染重构方案。

## 背景

昨天的方案将图表从少量自建 VChart spec builder 改为引入 `@visactor/vseed`。方向是合理的：VSeed 能降低图表类型扩展、数据 reshape 和基础 spec 生成成本。但当前实现把 VSeed 当作一次性 spec 生成器，之后又在 `chart-spec.ts` 中通过大量 post-process 修改标题、图例、标签、坐标轴、主题和 markStyle。

这会带来几个直接问题：

- 用户看到的配置项和最终 VChart spec 的真实结构没有稳定映射。
- 主题配置没有真正进入 VSeed token theme 或 custom theme 管线，导致浅色/深色、色板、轴色、标签色等配置容易不生效。
- 设计器配置不足，缺少标题、坐标轴、标签、图例等字体和颜色配置。
- 色板只能手输逗号分隔色号，交互不符合设计器产品形态。
- `PropertyEditor.tsx` 继续膨胀，图表属性逻辑和通用属性编辑器耦合过重。

## VSeed 文档与源码依据

VSeed 的公开 README 非常薄，包内 README 只有标题。可依赖依据如下：

- GitHub 仓库目录: `VisActor/VBI/packages/vseed`
- 本地锁定版本: `@visactor/vseed@0.5.6`
- 本地类型定义:
  - `dist/esm/index.d.ts`
  - `dist/esm/types/vseed.d.ts`
  - `dist/esm/types/advancedVSeed.d.ts`
  - `dist/esm/types/properties/theme/theme.d.ts`
  - `dist/esm/theme/tokenTheme.d.ts`
  - `dist/esm/types/properties/markStyle/markStyle.d.ts`

当前版本导出 `Builder`、`registerAll`、`registerLightTheme`、`registerDarkTheme`、`registerCustomTheme`、`createTokenThemeConfig`、`registerTokenTheme` 等能力。`Theme` 是 `light | dark | string`，自定义主题需要注册。token theme 支持 `colorScheme`、`linearColorScheme`、`fontFamily`、`axisLabelColor`、`axisTitleColor`、`axisGridColor`、`axisLineColor`、`labelColor`、`legendLabelColor` 等语义 token。

因此本方案不假设 VSeed 原生支持所有报表配置。设计原则是：VSeed 负责数据到基础图表 spec，报表设计器负责稳定配置模型，VChart patch 只处理 VSeed 未覆盖的细节。

## 当前实现问题

### 1. 抽象边界混乱

当前链路大致是：

```text
RenderChart -> buildVSeedConfig -> Builder.from().build() -> applyTitle/applyLegend/applyLabels/applyAxes/applyThemeToSpec/applyMarkStyle -> VChart
```

问题在于 `buildVSeedConfig` 只传入了非常薄的字段映射和 dataset，而标题、图例、标签、坐标轴、主题和 markStyle 又在生成后的 VChart spec 上手工修改。这相当于维护了三套配置语义：

- `ChartAppearance` 的报表配置语义
- VSeed config 的 DSL 语义
- VChart spec 的最终渲染语义

三者没有明确映射表和测试边界。

### 2. 主题未走 VSeed 主题管线

当前 `applyThemeToSpec` 设置 `spec.theme = theme.baseTheme`，再手动改 `spec.color.range`、`spec.background`、`spec.fontFamily`、`spec.axes` 和 `spec.title`。这不是 VSeed token theme 的用法。VSeed `0.5.6` 已提供 `createTokenThemeConfig` 和 `registerTokenTheme`，能通过 custom theme 把色板、字体、轴、标签、图例等 token 纳入基础 spec 生成。

当前主题不生效的风险主要来自：

- `spec.color` 结构不一定是 `{ range }`。
- VChart 主题名和 VSeed custom theme 注册名不是一回事。
- 轴、标签、图例在不同图表类型下生成结构不同，后置 patch 容易漏。
- 背景色既存在组件 `backgroundColor`，又存在 `appearance.backgroundColor`，还存在 `theme.backgroundColor`，优先级不清楚。

### 3. 数据模型只覆盖简单图表

`ChartBinding` 当前主要是 `dimensions[0] + measures[0] + seriesField`。这能覆盖柱、线、面积、饼、散点的一部分场景，但不适合：

- `dualAxis`: 需要左/右轴度量和各自 mark 类型。
- `heatmap`: 需要 x/y 两个维度和颜色度量。
- `boxPlot`: 需要五数统计或原始样本字段。
- `sankey`: 需要 source/target/value。
- `treeMap/sunburst/circlePacking`: 需要层级路径和数值。

因此“支持 30+ 类型”的模型现在过于乐观。应该先开放字段模型能稳定表达的类型。

### 4. 属性面板不可持续

图表配置集中在 `PropertyEditor.tsx`，当前文件已经超过两千行。继续加入标题字体、图例字体、坐标轴样式、标签样式、色板编辑器、类型专属设置，会让通用属性面板难以维护和测试。

## 方案选择

### 方案 A: 回到纯 VChart spec builder

为每个图表类型手写 spec builder，完全绕开 VSeed。

优点是可控，缺点是维护成本高，图表类型增加后容易回到大量硬编码分支。这个方向不推荐。

### 方案 B: 继续当前 VSeed + 大量后置 patch

最少改动，但会继续放大主题不生效、配置映射不稳定和测试困难的问题。这个方向只适合作为短期止血，不适合继续扩展。

### 方案 C: 保留 VSeed，重构为报表 Chart DSL + compiler

模板保存报表自己的稳定图表配置；viewer 使用 compiler 将其转换为 VSeed config，再在必要时对 VChart spec 做小范围、可测试的 patch。设计器围绕报表 Chart DSL 构建分组面板。

这是推荐方案。它保留 VSeed 的收益，也避免把 VSeed 未覆盖的细节强行塞进 VSeed 字段。

## 推荐架构

```text
ChartComponent
  -> normalizeChartComponent
  -> layoutChart / RenderChart
  -> compileReportChart
     -> buildChartDataset
     -> buildVSeedInput
     -> register/resolve chart token theme
     -> Builder.from(vseedInput).build()
     -> applyReportChartSpecPatch
  -> VChart / chart snapshot / PDF
```

新增 viewer 模块：

```text
packages/viewer/src/renderers/chart/
  chart-compiler.ts
  chart-data.ts
  chart-vseed.ts
  chart-theme.ts
  chart-spec-patch.ts
  chart-type-capabilities.ts
```

职责划分：

- `chart-data.ts`: 从 `RenderChart` 生成各类型需要的 dataset。
- `chart-vseed.ts`: 生成 VSeed 输入，只包含已验证字段。
- `chart-theme.ts`: 解析主题、注册 token theme、生成主题名。
- `chart-spec-patch.ts`: 处理 VSeed 未覆盖但报表必须支持的 VChart 细节。
- `chart-type-capabilities.ts`: 定义图表类型能力、字段需求、面板显隐。

## 图表类型范围

第一阶段开放稳定类型：

```typescript
type StableChartType =
  | 'column' | 'columnParallel' | 'columnPercent'
  | 'bar' | 'barParallel' | 'barPercent'
  | 'line' | 'area' | 'areaPercent'
  | 'pie' | 'donut' | 'rose'
  | 'scatter'
  | 'radar'
  | 'funnel'
  | 'dualAxis'
  | 'heatmap';
```

暂不在设计器开放，但可保留内部类型：

```typescript
type AdvancedChartType =
  | 'histogram'
  | 'boxPlot'
  | 'sankey'
  | 'treeMap'
  | 'sunburst'
  | 'circlePacking';
```

这些类型需要独立字段模型和交互，不应只靠一个维度/一个度量暴露给用户。

## 配置模型

现有 `ChartAppearance` 应拆成更明确的对象。兼容期可以保留旧字段，但 normalize 时迁移到新结构。

```typescript
export interface ChartComponent extends ReportComponent {
  type: 'chart';
  chartType: ChartType;
  binding: ChartBinding;
  title?: ChartTitleConfig;
  legend?: ChartLegendConfig;
  axes?: ChartAxesConfig;
  labels?: ChartLabelConfig;
  theme?: ChartThemeConfig;
  plotOptions?: ChartPlotOptions;
  data?: ChartDataPoint[];
  emptyMessage?: string;
}
```

### 数据绑定

```typescript
export interface ChartBinding {
  dataSourceId?: string;
  arrayPath?: Expression;
  dimensions?: ChartDimension[];
  measures?: ChartMeasure[];
  seriesField?: string;
  colorField?: string;
  labelField?: string;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  filterExpression?: Expression;
}

export interface ChartMeasure {
  field: string;
  alias?: string;
  aggregation?: 'none' | 'sum' | 'avg' | 'count' | 'min' | 'max';
  axis?: 'left' | 'right';
}
```

规则：

- 普通笛卡尔图: `dimensions[0]` + `measures[0..n]`。
- 饼/环/玫瑰/漏斗: `dimensions[0]` 作为分类，`measures[0]` 作为值。
- 散点: `dimensions[0]` 可作为 x，`measures[0]` 作为 y；如果需要数值 x，可将 x 放在 `dimensions[0].field` 并按数值解析。
- 双轴: 至少两个 measure，`axis` 区分左右轴。
- 热力: `dimensions[0]`、`dimensions[1]`、`measures[0]`。

### 标题

```typescript
export interface ChartTitleConfig {
  visible: boolean;
  text?: string;
  subtitle?: string;
  position?: 'top' | 'bottom';
  align?: 'left' | 'center' | 'right';
  font?: ChartFontConfig;
  color?: string;
  subtitleFont?: ChartFontConfig;
  subtitleColor?: string;
  padding?: Partial<Padding>;
}
```

### 图例

```typescript
export interface ChartLegendConfig {
  visible: boolean;
  position: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  layout?: 'horizontal' | 'vertical';
  font?: ChartFontConfig;
  color?: string;
  markerShape?: 'circle' | 'square' | 'rect' | 'line' | 'diamond';
  maxRows?: number;
  maxColumns?: number;
}
```

### 坐标轴

```typescript
export interface ChartAxesConfig {
  x?: ChartAxisConfig;
  y?: ChartAxisConfig;
  rightY?: ChartAxisConfig;
}

export interface ChartAxisConfig {
  visible: boolean;
  title?: string;
  titleFont?: ChartFontConfig;
  titleColor?: string;
  labelFont?: ChartFontConfig;
  labelColor?: string;
  labelRotate?: number;
  lineVisible?: boolean;
  lineColor?: string;
  tickVisible?: boolean;
  tickColor?: string;
  gridVisible?: boolean;
  gridColor?: string;
  gridDash?: number[];
  min?: number;
  max?: number;
  nice?: boolean;
  format?: TextFormatConfig;
}
```

### 数据标签

```typescript
export interface ChartLabelConfig {
  visible: boolean;
  content: 'name' | 'value' | 'percent' | 'name-value' | 'custom';
  customTemplate?: string;
  position?: 'auto' | 'inside' | 'outside' | 'top' | 'bottom' | 'left' | 'right' | 'spider';
  font?: ChartFontConfig;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  showLeaderLine?: boolean;
  overlapStrategy?: 'hide' | 'shift' | 'none';
}
```

### 主题与色板

```typescript
export interface ChartThemeConfig {
  baseTheme: 'light' | 'dark';
  palettePresetId?: string;
  customPalette?: string[];
  linearPalette?: [string, string];
  backgroundColor?: string;
  fontFamily?: string;
  textPrimary?: string;
  textSecondary?: string;
  axisLabelColor?: string;
  axisTitleColor?: string;
  axisGridColor?: string;
  axisLineColor?: string;
  labelColor?: string;
  legendLabelColor?: string;
}
```

主题优先级：

```text
组件显式配置 > customPalette/palettePresetId > baseTheme 默认 token
```

实现规则：

- 对每个有效主题配置生成稳定 hash，例如 `rd-chart-light-a1b2c3`。
- 使用 `registerTokenTheme(themeName, tokens, { ensureRegisterAll: false })` 注册。
- `buildVSeedInput` 使用 `theme: themeName`。
- 只有 VSeed 主题无法表达的项才进入 `chart-spec-patch.ts`。

### 类型专属配置

```typescript
export interface ChartPlotOptions {
  bar?: ChartBarOptions;
  line?: ChartLineOptions;
  area?: ChartAreaOptions;
  pie?: ChartPieOptions;
  scatter?: ChartScatterOptions;
  radar?: ChartRadarOptions;
  funnel?: ChartFunnelOptions;
  dualAxis?: ChartDualAxisOptions;
  heatmap?: ChartHeatmapOptions;
}
```

示例：

```typescript
export interface ChartBarOptions {
  barWidth?: number;
  cornerRadius?: number;
  fillOpacity?: number;
  borderColor?: string;
  borderWidth?: number;
  labelPosition?: 'inside' | 'top' | 'outside';
}

export interface ChartLineOptions {
  curveType?: 'linear' | 'monotone' | 'step';
  lineWidth?: number;
  showPoint?: boolean;
  pointSize?: number;
  pointShape?: 'circle' | 'square' | 'triangle' | 'diamond';
  connectNulls?: boolean;
}

export interface ChartPieOptions {
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  padAngle?: number;
  roseType?: 'radius' | 'area';
}
```

## 设计器属性面板

从 `PropertyEditor.tsx` 拆出图表子模块：

```text
packages/designer/src/components/chart/
  ChartPropertyPanel.tsx
  ChartDataPanel.tsx
  ChartTitlePanel.tsx
  ChartLegendPanel.tsx
  ChartAxesPanel.tsx
  ChartLabelPanel.tsx
  ChartThemePanel.tsx
  ChartTypeStylePanel.tsx
  ColorPaletteEditor.tsx
  chart-options.ts
```

属性面板分组：

- 基本信息: 图表类型、空数据提示。
- 数据绑定: 数据源、数组路径、维度、度量、系列、排序、聚合。
- 主题与色板: 基础主题、预设色板、自定义色板、背景、全局字体、语义色。
- 标题: 标题/副标题、位置、对齐、字体、颜色。
- 图例: 显示、位置、布局、字体、颜色、图例标记。
- 坐标轴: X/Y/右 Y 轴标题、标签、线、刻度、网格、范围、格式。
- 数据标签: 显示、内容、位置、字体、颜色、背景、避让。
- 类型样式: 根据 chartType 显示柱、线、饼、散点、雷达、漏斗、双轴、热力配置。

### 色板编辑器

`ColorPaletteEditor` 不能再用手输字符串。交互如下：

- 色板预设下拉，展示名称和色块预览。
- 自定义色块列表，点击色块打开 `ColorPicker`。
- 支持添加、删除、排序。
- 支持“一键应用预设”和“恢复主题默认”。
- 保存结构始终是 `string[]`，不保存逗号字符串。
- 对无效色值不写入模板，并在控件旁显示校验状态。

内置预设：

```typescript
export const CHART_PALETTE_PRESETS = [
  { id: 'business', name: '商务', colors: ['#1E40AF', '#0F766E', '#B45309', '#991B1B', '#5B21B6', '#155E75'] },
  { id: 'vivid', name: '鲜明', colors: ['#5B8FF9', '#5AD8A6', '#F6BD16', '#E8684A', '#6DC8EC', '#9270CA'] },
  { id: 'soft', name: '柔和', colors: ['#93C5FD', '#86EFAC', '#FDE68A', '#FCA5A5', '#C4B5FD', '#A5F3FC'] },
  { id: 'ocean', name: '海洋', colors: ['#0EA5E9', '#0284C7', '#0369A1', '#38BDF8', '#06B6D4', '#155E75'] },
  { id: 'forest', name: '森林', colors: ['#16A34A', '#15803D', '#22C55E', '#4ADE80', '#059669', '#047857'] },
  { id: 'sunset', name: '日落', colors: ['#F97316', '#EA580C', '#F59E0B', '#FBBF24', '#EF4444', '#DC2626'] },
];
```

## 兼容与迁移

不需要长期兼容旧图表模型，但要让现有示例和测试能平滑迁移。

normalize 迁移规则：

- `appearance.title/subtitle` -> `title.text/subtitle`
- `appearance.showLegend/legendPosition` -> `legend.visible/position`
- `appearance.showAxes/showGrid/axisTitleX/axisTitleY/axisLabelRotation` -> `axes.x/axes.y`
- `appearance.showLabels/labelType` -> `labels.visible/content`
- `appearance.theme` -> `theme`
- `appearance.markStyle` -> `plotOptions`
- `appearance.backgroundColor` -> `theme.backgroundColor`，组件 `backgroundColor` 仍作为外层容器背景。

迁移后新模板应优先写新字段；旧 `appearance` 仅作为读取兼容。

## 错误处理

- VSeed build 异常: 返回空图 spec，并在开发环境输出诊断。
- 字段缺失: 设计器显示绑定警告，viewer 渲染空数据提示。
- 主题注册失败: 回退到 `light`，保留自定义色板 patch。
- 图表类型不支持当前绑定: 设计器禁用预览并提示需要的字段。
- patch 无法应用: 不抛出到 UI，记录诊断，保留基础 VSeed 图表。

## 测试策略

Core:

- normalize 旧字段到新字段。
- `ChartTypeCapabilities` 返回正确字段需求和面板显隐。
- 绑定解析、排序、聚合、空数据。

Viewer:

- `chart-theme.ts`: token theme 生成、hash 稳定、色板和语义色映射。
- `chart-vseed.ts`: 每类稳定图表生成合法 VSeed 输入。
- `chart-spec-patch.ts`: 标题、图例、坐标轴、标签字体和颜色 patch 生效。
- `buildVChartSpec`: 稳定图表类型不崩溃，VSeed 异常可降级。

Designer:

- 图表属性面板从通用 `PropertyEditor` 正确挂载。
- 色板预设、色块增删改、恢复默认。
- 标题/轴/标签/图例字体和颜色配置能写入模板。
- 图表类型切换后只显示对应配置组。

Regression:

- `business-dashboard`、`store-daily-sales` 等示例预览不崩溃。
- print/PDF chart snapshot 继续可用。

## 交付切片

1. **模型与能力表**
   - 新增 chart config 类型。
   - 新增 chart type capabilities。
   - normalize 旧 `appearance` 到新模型。

2. **viewer compiler**
   - 拆分 `chart-spec.ts`。
   - 新增 `chart-data.ts`、`chart-vseed.ts`、`chart-theme.ts`、`chart-spec-patch.ts`。
   - 接入 VSeed token theme。

3. **设计器面板拆分**
   - 从 `PropertyEditor.tsx` 提取 `ChartPropertyPanel`。
   - 先覆盖基础信息、数据绑定、主题与色板、标题、图例、坐标轴、标签。

4. **类型专属配置**
   - 实现柱/线/面积/饼/散点/雷达/漏斗/双轴/热力配置。
   - 每个配置项必须有 renderer 测试证明生效或明确降级。

5. **示例与回归**
   - 更新示例模板。
   - 补齐 designer、core、viewer 测试。
   - 验证预览、打印快照和 PDF。

## 验收标准

- 用户不再需要手输逗号色号配置色板。
- 浅色/深色主题切换对背景、文字、轴、网格、标签、图例有可观察效果。
- 标题、坐标轴、图例、标签均支持字体和颜色配置。
- `PropertyEditor.tsx` 不再承载图表细节面板。
- 每个开放图表类型都有明确字段需求和配置面板。
- VSeed 使用边界清晰：基础 spec 生成走 VSeed，报表细节走可测试 patch。
- 旧示例模板能通过 normalize 或显式迁移继续渲染。

