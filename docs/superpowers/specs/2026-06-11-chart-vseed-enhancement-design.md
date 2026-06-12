# 图表组件增强：引入 VSeed 重构

**日期**：2026-06-11  
**目标**：用 `@visactor/vseed` 替换现有 `chart-spec.ts` 自建 spec 逻辑，扩展图表类型至 30+，引入主题系统并支持自定义色板，属性面板按图表类型动态展示专属配置。

## 背景

当前图表组件（`2026-05-28-chart-component-design.md`）基于 VChart 直接构建 spec，存在以下问题：

- **类型有限**：仅支持 point/line/bar/area/pie 共 5 种，变种 8 种
- **spec 构建硬编码**：`buildVChartSpec` 用 if 分支处理 5 种类型，扩展成本高
- **主题缺失**：只有一套硬编码色板 `['#2f6fed','#16a34a','#f59e0b','#ef4444','#8b5cf6']`
- **属性面板单一**：所有图表类型共享相同控件，无法按类型配置专属属性

## VSeed 简介

`@visactor/vseed` 是 VisActor 团队面向分析领域的 DSL，是 VChart + VTable 的精简子集，专为 LLM 生成和报表平台封装。核心特点：

- **给定数据集和图表类型即可直接出图**，每类图表有大量默认约定
- **内置 30+ 图表类型**：line/area/bar/column/pie/donut/rose/radar/funnel/dualAxis/scatter/heatmap/histogram/sankey/treemap/sunburst/boxPlot/circlePacking 等
- **内置数据处理**：dataReshape（聚合 sum/avg/count/min/max）、dataSelector（过滤/选择）
- **内置主题系统**：light/dark + tokenTheme，支持 token 级颜色覆盖
- **模块化属性**：dimensions/measures/encoding/markStyle/format/annotation/regressionLine
- **与 VChart 完全兼容**：VSeed 输出 VChart ISpec，现有 react-vchart 渲染层不变

**仓库**：`github.com/VisActor/VBI`  
**npm**：`@visactor/vseed ^0.5.6`

## 设计目标

- 用 VSeed DSL 替换 `buildVChartSpec`，消除 9 个自建 spec builder
- 支持 VSeed 全部图表类型（30+），属性面板按类型动态显隐
- 引入主题系统，支持内置主题（light/dark）+ 自定义色板（可增删改）
- 主题支持语义色覆盖（背景色/标题色/轴色/网格色/标签色）
- 属性面板按图表类型展示专属配置项（柱宽/线型/内外径/点形状/趋势线等）
- 不需要兼容旧模板，完全替换

## 非目标

- 不做图表交互分析、钻取、联动筛选
- 不做动画编排（VSeed 默认 animation: false）
- 不做非 JSON 数据源
- 不做 raceBar/raceLine 等动态排名动画类型（后续按需添加）

## 方案选择

### 方案 A：自建 spec builder（现有方案扩展）

为每种新类型手写 spec builder 文件（chart-spec-bar/line/pie/radar/funnel...），自建主题系统。

- 工作量：~14-21 天
- 维护成本：每种类型 50-100 行 builder，后续 VChart API 变更需同步更新

### 方案 B：引入 VSeed 作为中间层（推荐）

模板持有 VSeed 配置 → VSeed pipeline 生成 VChart ISpec → react-vchart 渲染。

- 工作量：~5-8 天（减少 60-70%）
- spec builder、主题、聚合、数据处理全部复用 VSeed
- 后续新增类型只需在属性面板暴露，VSeed 内部已支持

**结论**：采用方案 B。

## 组件模型重构

### ChartType 扩展

```typescript
// 从 VSeed 支持的类型中筛选报表常用类型
export type ChartType =
  // 折线/面积
  | 'line' | 'area' | 'areaPercent'
  // 柱状/条形
  | 'column' | 'columnParallel' | 'columnPercent'
  | 'bar' | 'barParallel' | 'barPercent'
  // 饼/环/玫瑰
  | 'pie' | 'donut' | 'rose'
  // 散点
  | 'scatter'
  // 雷达
  | 'radar'
  // 漏斗
  | 'funnel'
  // 双轴组合
  | 'dualAxis'
  // 热力/直方/箱线
  | 'heatmap' | 'histogram' | 'boxPlot'
  // 层级关系
  | 'sankey' | 'treeMap' | 'sunburst' | 'circlePacking';
```

### ChartVariant 废弃

VSeed 通过 `chartType` 直接区分变体（如 `column` vs `columnParallel` vs `columnPercent`），不再需要独立的 `variant` 字段。

### ChartBinding → VSeed Dimensions/Measures

```typescript
export interface ChartBinding {
  dataSourceId?: string;
  arrayPath?: string;

  // 维度（分类轴）
  dimensions?: ChartDimension[];
  // 度量（数值轴）
  measures?: ChartMeasure[];

  // 系列分组字段
  seriesField?: string;
  // 标签字段
  labelField?: string;

  // 聚合方式
  aggregate?: 'none' | 'sum' | 'avg' | 'count' | 'min' | 'max';

  // 排序
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;

  // 过滤表达式
  filterExpression?: string;
}

export interface ChartDimension {
  field: string;
  alias?: string;
}

export interface ChartMeasure {
  field: string;
  alias?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}
```

### ChartAppearance 重构

```typescript
export interface ChartAppearance {
  // --- 标题与图例 ---
  title?: string;
  subtitle?: string;
  showLegend?: boolean;
  legendPosition?: 'top' | 'right' | 'bottom' | 'left';
  showLabels?: boolean;
  labelType?: 'name' | 'value' | 'percent' | 'name-value';

  // --- 坐标轴 ---
  showAxes?: boolean;
  showGrid?: boolean;
  axisTitleX?: string;
  axisTitleY?: string;
  axisLabelRotation?: number;

  // --- 主题 ---
  theme?: ChartThemeConfig;

  // --- 类型专属样式 ---
  markStyle?: ChartMarkStyle;

  // --- 其他 ---
  backgroundColor?: string;
  padding?: Partial<Padding>;
  emptyMessage?: string;
}
```

### ChartThemeConfig（主题配置）

```typescript
export interface ChartThemeConfig {
  // 基础主题
  baseTheme: 'light' | 'dark';

  // 自定义色板（覆盖基础主题色板）
  customPalette?: string[];

  // 语义色覆盖（可选，不设置则跟随基础主题）
  backgroundColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  axisLabelColor?: string;
  axisLineColor?: string;
  gridColor?: string;
  labelColor?: string;
  fontFamily?: string;
}
```

### ChartMarkStyle（类型专属样式）

```typescript
export interface ChartMarkStyle {
  // --- 柱状图 ---
  barWidth?: number;          // 柱宽比例 0-1，默认 0.6
  cornerRadius?: number;      // 圆角半径(px)，默认 0
  barLabelPosition?: 'inside' | 'top' | 'outside';
  fillOpacity?: number;       // 透明度 0-1，默认 1
  lineWidth?: number;         // 边框宽度
  stroke?: string;            // 边框颜色

  // --- 折线图 ---
  curveType?: 'linear' | 'monotone' | 'step';
  showPoint?: boolean;        // 显示数据点
  pointSize?: number;         // 点半径(px)
  pointShape?: 'circle' | 'square' | 'triangle' | 'diamond';
  showArea?: boolean;         // 填充面积
  areaOpacity?: number;       // 面积透明度
  connectNulls?: boolean;     // 连接空值

  // --- 饼/环/玫瑰 ---
  innerRadius?: number;       // 内径比例 0-1
  outerRadius?: number;       // 外径比例 0-1
  startAngle?: number;        // 起始角度
  padAngle?: number;          // 扇区间距
  roseType?: 'radius' | 'area';

  // --- 散点图 ---
  showTrendLine?: boolean;    // 趋势线
  trendLineType?: 'linear' | 'polynomial' | 'exponential';

  // --- 雷达图 ---
  radarShape?: 'polygon' | 'circle';
  showRadarArea?: boolean;    // 填充区域
  radarAreaOpacity?: number;
  axisCount?: number;         // 同心轴数量

  // --- 漏斗图 ---
  funnelDirection?: 'vertical' | 'horizontal';
  funnelShape?: 'trapezoid' | 'triangle' | 'rect';
  showConversionRate?: boolean;
  funnelGap?: number;
  funnelMinSize?: number;
  funnelMaxSize?: number;

  // --- 双轴图 ---
  primaryType?: 'bar' | 'line';
  secondaryType?: 'bar' | 'line';
  yAxisRightTitle?: string;
}
```

### ChartComponent 完整定义

```typescript
export interface ChartComponent extends ReportComponent {
  type: 'chart';
  chartType: ChartType;
  binding: ChartBinding;
  appearance: ChartAppearance;
  data?: ChartDataPoint[];
}
```

## 主题系统

### 基础主题

VSeed 内置 `light` 和 `dark` 两套主题，通过 `tokenTheme` 机制支持 token 级覆盖。

### 自定义色板

用户在属性面板通过 `ColorPicker[]` 控件自定义色板，覆盖基础主题的 palette。

**色板解析优先级**（高到低）：

```
appearance.theme.customPalette → 基础主题内置色板
```

### 语义色覆盖

用户可单独覆盖背景色、标题色、轴色等，不影响色板：

```
appearance.theme.backgroundColor → 覆盖主题背景
appearance.theme.titleColor → 覆盖标题颜色
...
```

### 色板预设（供用户快速选择）

```
默认蓝:   #2f6fed #16a34a #f59e0b #ef4444 #8b5cf6 #06b6d4 #ec4899 #14b8a6
海洋:     #0ea5e9 #0284c7 #0369a1 #38bdf8 #7dd3fc #06b6d4 #155e75 #67e8f9
森林:     #16a34a #15803d #22c55e #4ade80 #86efac #059669 #047857 #6ee7b7
日落:     #f97316 #ea580c #f59e0b #fbbf24 #ef4444 #dc2626 #fb923c #fcd34d
柔和:     #93c5fd #86efac #fde68a #fca5a5 #c4b5fd #a5f3fc #f9a8d4 #99f6e4
商务:     #1e40af #0f766e #b45309 #991b1b #5b21b6 #155e75 #9d174d #065f46
```

这些预设作为"快捷填充"，用户点击后填入 `customPalette`，再自行修改。

## 属性面板设计

### 配置组结构（可折叠 Accordion）

```
[基本信息]           -- 始终显示
[数据绑定]           -- 始终显示
[主题与色板]         -- 始终显示
[标题与图例]         -- 始终显示
[坐标轴]             -- 笛卡尔/雷达类型显示
[柱状图样式]         -- chartType ∈ {column, bar, columnParallel, barParallel, columnPercent, barPercent}
[折线/面积图样式]    -- chartType ∈ {line, area, areaPercent}
[饼/环/玫瑰样式]     -- chartType ∈ {pie, donut, rose}
[散点图样式]         -- chartType ∈ {scatter}
[雷达图样式]         -- chartType ∈ {radar}
[漏斗图样式]         -- chartType ∈ {funnel}
[双轴图样式]         -- chartType ∈ {dualAxis}
```

### [基本信息] — 始终显示

| 属性 | 控件 | 说明 |
|------|------|------|
| 图表类型 | `Select` | 常用 ~15 种，按分类分组 |
| 空数据提示 | `Input` | `emptyMessage` |

### [数据绑定] — 始终显示

| 属性 | 控件 | 说明 |
|------|------|------|
| 数据源 | `Select`(可搜索) | 报表数据源 |
| 维度字段 | `Input` + datalist | 分类轴（→ VSeed dimensions） |
| 度量字段 | `Input` + datalist | 数值轴（→ VSeed measures） |
| 系列字段 | `Input` + datalist | 分组 |
| 聚合方式 | `Select` | sum/avg/count/min/max |
| 排序 | `Select` | 升序/降序/无 |

### [主题与色板] — 始终显示

| 属性 | 控件 | 说明 |
|------|------|------|
| 基础主题 | `Radio` | light / dark |
| 色板预设 | `Select` + 色块预览 | 选择预设快速填充 |
| 自定义色板 | `ColorPicker[]` | 可增删改的色值列表 |
| 背景色 | `ColorPicker` | `theme.backgroundColor` |
| 标题颜色 | `ColorPicker` | `theme.titleColor` |
| 轴标签颜色 | `ColorPicker` | `theme.axisLabelColor` |
| 轴线/网格颜色 | `ColorPicker` | `theme.axisLineColor` |
| 数据标签颜色 | `ColorPicker` | `theme.labelColor` |
| 字体 | `Select` | `theme.fontFamily` |

**色板控件交互**：
- 点击色块 → 弹出 ColorPicker 面板修改色值
- 点击"+" → 添加新色块
- 右键色块 → 删除
- 选择预设 → 一键填充全部色值

### [标题与图例] — 始终显示

| 属性 | 控件 | 说明 |
|------|------|------|
| 标题 | `Input` | |
| 副标题 | `Input` | |
| 显示图例 | `Switch` | |
| 图例位置 | `Select` | top/right/bottom/left |
| 显示数据标签 | `Switch` | |
| 标签类型 | `Select` | name/value/percent/name-value |

### [坐标轴] — 笛卡尔 + 雷达

| 属性 | 控件 | 显示条件 |
|------|------|---------|
| 显示坐标轴 | `Switch` | 非 pie/donut/rose |
| 显示网格线 | `Switch` | 非 pie/donut/rose |
| X 轴标题 | `Input` | 笛卡尔类型 |
| Y 轴标题 | `Input` | 笛卡尔类型 |
| X 轴标签旋转 | `Slider` (-90~0) | 笛卡尔类型 |
| 雷达形状 | `Select` (polygon/circle) | 仅 radar |

### [柱状图样式] — column/bar 类

| 属性 | 控件 | 默认值 |
|------|------|--------|
| 方向 | `Radio` (竖向column/横向bar) | column |
| 堆叠模式 | `Radio` (分组parallel/堆叠/百分比percent) | 分组 |
| 柱宽比例 | `Slider` (0.1-1.0, step 0.05) | 0.6 |
| 圆角 | `InputNumber` (0-20) | 0 |
| 柱上标签 | `Switch` | false |
| 标签位置 | `Select` (inside/top/outside) | top |
| 透明度 | `Slider` (0-1) | 1 |
| 边框宽度 | `InputNumber` (0-5) | 0 |
| 边框颜色 | `ColorPicker` | 透明 |

### [折线/面积图样式] — line/area 类

| 属性 | 控件 | 默认值 |
|------|------|--------|
| 线型 | `Select` (直线/平滑/阶梯) | 直线 |
| 线宽 | `InputNumber` (1-10) | 2 |
| 显示数据点 | `Switch` | true |
| 点大小 | `InputNumber` (2-12) | 4 |
| 点形状 | `Select` (circle/square/triangle/diamond) | circle |
| 面积填充 | `Switch` | false(line)/true(area) |
| 填充透明度 | `Slider` (0-1) | 0.3 |
| 连接空值 | `Switch` | false |
| 堆叠模式 | `Radio` (普通/堆叠/百分比) | 普通 |

### [饼/环/玫瑰样式] — pie/donut/rose

| 属性 | 控件 | 默认值 |
|------|------|--------|
| 形态 | `Radio` (实心pie/环形donut/玫瑰rose) | pie |
| 内径比例 | `Slider` (0-0.9) | 0 / 0.55(donut) |
| 外径比例 | `Slider` (0.1-1.0) | 0.85 |
| 起始角度 | `InputNumber` (-360~360) | -90 |
| 扇区间距 | `Slider` (0-5) | 0 |
| 标签类型 | `Select` (名称/数值/百分比/名称+数值) | name |
| 标签位置 | `Select` (内部/外部/引导线) | 外部 |
| 玫瑰编码 | `Radio` (角度/面积) | radius，仅 rose |

### [散点图样式] — scatter

| 属性 | 控件 | 默认值 |
|------|------|--------|
| 点大小 | `InputNumber` (2-20) | 6 |
| 点形状 | `Select` | circle |
| 透明度 | `Slider` (0-1) | 0.8 |
| 趋势线 | `Switch` | false |
| 趋势线类型 | `Select` (linear/polynomial/exponential) | linear |

### [雷达图样式] — radar

| 属性 | 控件 | 默认值 |
|------|------|--------|
| 雷达形状 | `Select` (polygon/circle) | polygon |
| 填充区域 | `Switch` | true |
| 填充透明度 | `Slider` (0-1) | 0.2 |
| 线宽 | `InputNumber` (1-6) | 2 |
| 显示数据点 | `Switch` | true |
| 点大小 | `InputNumber` (2-10) | 4 |
| 同心轴数量 | `InputNumber` (3-10) | 5 |

### [漏斗图样式] — funnel

| 属性 | 控件 | 默认值 |
|------|------|--------|
| 方向 | `Select` (vertical/horizontal) | vertical |
| 形状 | `Select` (trapezoid/triangle/rect) | trapezoid |
| 显示转化率 | `Switch` | false |
| 层间距 | `InputNumber` (0-20) | 2 |
| 最小宽度比例 | `Slider` (0-0.5) | 0.1 |
| 最大宽度比例 | `Slider` (0.5-1.0) | 1.0 |

### [双轴图样式] — dualAxis

| 属性 | 控件 | 默认值 |
|------|------|--------|
| 左轴类型 | `Select` (bar/line) | bar |
| 右轴类型 | `Select` (bar/line) | line |
| 左轴度量字段 | `Input` + datalist | — |
| 右轴度量字段 | `Input` + datalist | — |
| 右轴标题 | `Input` | '' |

## 渲染链路

### 现有链路

```
ChartComponent → normalize → layout-band(buildRenderChart) → buildVChartSpec → VChart
```

### 新链路

```
ChartComponent → normalize → layout-band(buildRenderChart) → buildVSeedSpec → VSeed pipeline → VChart ISpec → react-vchart 渲染
```

### 具体变化

1. **normalize**：`normalizeChartAppearance` 改为处理新的 `theme`/`markStyle` 结构
2. **layout-band**：`buildRenderChart` 透传 `theme`/`markStyle` 到 `RenderChart`
3. **chart-spec.ts**：替换 `buildVChartSpec` 为调用 VSeed pipeline
4. **chart-snapshot.ts**：不变，仍调用 buildVChartSpec（内部已换实现）
5. **renderComponent.tsx**：不变

### VSeed spec 构建

```typescript
import { createVSeedSpec } from '@visactor/vseed';

export function buildVChartSpec(chart: RenderChart, size?: ChartSpecSize): ISpec {
  const vseedSpec = buildVSeedConfig(chart);
  // VSeed pipeline 将 VSeed DSL 转换为 VChart ISpec
  return createVSeedSpec(vseedSpec, { width: size?.width, height: size?.height });
}

function buildVSeedConfig(chart: RenderChart) {
  return {
    chartType: chart.chartType,
    dataset: chart.data,
    dimensions: chart.binding.dimensions,
    measures: chart.binding.measures,
    encoding: { seriesField: chart.binding.seriesField },
    theme: buildVSeedTheme(chart.appearance.theme),
    markStyle: chart.appearance.markStyle,
    title: chart.appearance.title,
    // ...
  };
}
```

## 数据流

```
模板 ChartComponent
    ↓ normalize
标准化 ChartComponent (补默认值)
    ↓ layout-band
RenderChart (含 theme/markStyle/binding)
    ↓ buildVSeedConfig
VSeed DSL spec
    ↓ VSeed pipeline
    ├── dataReshape (聚合/排序/过滤)
    ├── theme resolve (light/dark + customPalette + tokens)
    └── markStyle apply
    ↓
VChart ISpec
    ├── preview: react-vchart 渲染
    ├── print: chart-snapshot → 位图
    └── PDF: chart-snapshot → 位图嵌入
```

## 文件修改清单

| 包 | 文件 | 修改内容 |
|----|------|---------|
| core | `template-model/types.ts` | ChartType 扩展，ChartBinding/Appearance/MarkStyle/Theme 重构，废弃 ChartVariant |
| core | `render-document/types.ts` | RenderChart 新增 theme/markStyle 字段 |
| core | `template-model/normalize-template.ts` | normalize 适配新结构，提供安全默认值 |
| core | `layout-engine/layout-band.ts` | buildRenderChart 透传 theme/markStyle |
| viewer | `package.json` | 新增 `@visactor/vseed` 依赖 |
| viewer | `renderers/chart/chart-spec.ts` | 替换为调用 VSeed pipeline |
| viewer | `renderers/chart/chart-themes.ts` | 新增色板预设定义 |
| viewer | `renderers/chart/chart-snapshot.ts` | 不变（调用 buildVChartSpec） |
| viewer | `renderers/dom/renderComponent.tsx` | 不变 |
| designer | `components/PropertyEditor.tsx` | 重构图表属性面板为 Accordion 配置组 |
| designer | `components/chart/` | 新增 `ThemePanel.tsx`, `BarStylePanel.tsx`, `LineStylePanel.tsx`, `PieStylePanel.tsx`, `ScatterStylePanel.tsx`, `RadarStylePanel.tsx`, `FunnelStylePanel.tsx`, `DualAxisStylePanel.tsx`, `ColorPaletteEditor.tsx` |
| example | `templates/charts.ts` | 更新为 VSeed 配置格式，新增雷达/漏斗/双轴示例 |

## 校验与错误处理

- VSeed 版本锁定 `^0.5.6`，CI 中验证兼容性
- 数据源缺失 → 显示 `emptyMessage` 占位
- 字段不存在 → VSeed 内部降级为空数据，不崩溃
- 非法 chartType → fallback 到 `column`
- 主题 token 缺失 → 回退到 light 主题默认值
- VSeed pipeline 异常 → 降级为空图 + 控制台 error log

## 测试策略

| 层级 | 覆盖内容 |
|------|---------|
| core 单元测试 | normalize 默认值、ChartType 合法性、theme/markStyle 透传不丢失 |
| viewer spec 测试 | VSeed pipeline 输出有效 ISpec、customPalette 覆盖、markStyle 映射 |
| viewer DOM 测试 | 各类型渲染成功、空数据 placeholder |
| designer 测试 | 类型切换后配置组动态显隐、色板增删改、主题切换色板预览 |
| 回归 | 所有 ChartType 渲染不崩溃、旧模板（如果有）兼容降级 |

## 交付切片

| 切片 | 内容 | 预估 |
|------|------|------|
| 1 | 安装 `@visactor/vseed`，验证基本 API 和包体积 | 0.5 天 |
| 2 | core 类型重构：ChartType/Binding/Appearance/MarkStyle/Theme | 1 天 |
| 3 | viewer 渲染层：替换 `chart-spec.ts` 为 VSeed pipeline | 1 天 |
| 4 | 主题系统：chart-themes.ts + 色板预设 + tokenTheme 集成 | 1 天 |
| 5 | designer 属性面板：基本信息/数据绑定/主题色板/标题图例/坐标轴 | 2 天 |
| 6 | designer 类型专属面板：柱/线/饼/散点/雷达/漏斗/双轴 | 2 天 |
| 7 | example 示例更新 + 测试覆盖 | 1 天 |

**总计**：~8.5 天

## 风险与注意事项

1. **VSeed 版本较新**（0.5.6）：API 可能不稳定，需锁定版本并在 CI 中监控
2. **包体积**：需验证 `@visactor/vseed` gzip 后大小，预期 <200KB
3. **深度定制受限**：极少数 VSeed 未暴露的 VChart 细粒度配置，可能需要 post-process ISpec
4. **文档不足**：VSeed 独立使用文档较少，需参考源码和 VBI demo
5. **PDF/Print 回归**：替换 spec 构建后需验证截图输出正常
