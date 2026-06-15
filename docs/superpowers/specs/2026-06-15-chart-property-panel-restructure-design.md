# 图表属性面板重构设计

- 日期：2026-06-15
- 状态：待批准
- 范围：图表属性设置组件的整体重组、字体设置公共化、图表数据模型归一、渲染性能优化

## 背景与问题诊断

当前图表属性设置存在四个系统性问题：

### 问题 1：折叠面板全展开平铺，无主次

`ChartPropertyPanel.tsx:23` 写死 `DEFAULT_ACTIVE_KEYS` 包含全部 8 个子组，配合 `defaultActiveKey` 等于没有折叠——用户面对一整屏平铺的表单。该面板嵌套在外层 `PropertyEditor` 的 `chart` 折叠组内（`PropertyEditor.tsx:363`），形成"折叠面板套折叠面板"的双层结构，`chart` 包装层无实际作用。

### 问题 2：属性面板与图表类型基本无关联

`ChartType` 枚举有 23 种（`core/types.ts:117-136`，含 `sankey`），但 `chart-options.ts:317-327` 只暴露了 3 个分类辅助函数（`isBarLike/isLineLike/isPieLike`），仅覆盖其中 12 种。后果：

- `ChartAxesPanel`（`ChartAxesPanel.tsx:23`）只对 `isPieLike` 置灰，radar/funnel/treeMap/sunburst 等无笛卡尔坐标轴的类型仍显示完整 X/Y 轴配置。
- `ChartLegendPanel`、`ChartLabelPanel` 完全不接收 `chartType` 参数，对所有类型显示相同的图例/标签配置。
- `ChartTypeStylePanel`（`ChartTypeStylePanel.tsx:26-68`）只覆盖 bar/line/pie/scatter/heatmap 5 类，radar/funnel/dualAxis/histogram/boxPlot/treeMap/sunburst/circlePacking 选中后"类型样式"面板为空。

### 问题 3：数据模型双写

同一套样式在 `ChartComponent` 上存了两套并存的 schema：新结构（`title/legend/axes/labels/theme/plotOptions`）与旧结构（`appearance.{title, markStyle, ...}`）。`chart-options.ts:164-217` 的 `getChartXxx()` 函数做"新优先、旧兜底"合并；`ChartPropertyPanel.tsx:83-92` 的 `updateTitle` 把新值同时写回新旧两处；`chart-options.ts:219-315` 有近百行 `markStyleToPlotOptions`/`plotOptionsToMarkStyle` 双向转换代码。这是最大的维护负债。

### 问题 4：字体设置散落且能力不均

同一套"字体/颜色/字号/加粗斜体"设置内联在至少 6 处（`PropertyEditor.tsx:480-570`、`DesignerPropertyPanel.tsx:169-228` 及 `355-391`、`TextStyleLibraryDialog.tsx:541-544`、`PageSetupDialog.tsx:195-204`、图表各面板），实现各异。图表的字体能力最弱——全项目唯独图表没有字体下拉（family），没有加粗斜体；`ChartFontConfig` 类型定义了 `family/bold/italic` 字段（`types.ts:186`）但面板未暴露。

## 决策清单

1. **范围**：UI 重组 + 数据模型归一（动 core 类型，但不做判别联合）。
2. **布局风格**：保持右侧属性面板的单层 `Collapse` 折叠风格，取消 `chart` 包装层，图表子属性组扁平化为外层 Collapse 的兄弟项。
3. **核心机制**：引入图表类型能力矩阵作为"哪种类型显示哪些面板/字段"的单一事实来源；矩阵归属 core，designer/viewer 共享读取，避免两端各维护一份。
4. **数据归一**：不考虑兼容性，一次性删除 `appearance`/`markStyle`，四端联动改为只读写结构化字段。
5. **FontEditor**：新建公共组件，全项目迁移所有字体设置处。
6. **字体类型**：`ChartFontConfig` 统一为 core `FontConfig` 的别名。
7. **性能**：本轮做对策 A（store selector 按组拆分订阅）；React Compiler 接入列为后续独立任务（涉及 tsc→babel 构建管线改造，风险与本轮正交）。

## 第 1 章：图表类型能力矩阵

新增 `packages/core/src/chart/chart-capabilities.ts`，作为"每种 chartType 该显示哪些面板/字段/数据角色"的单一事实来源。

当前 viewer 已存在 `packages/viewer/src/renderers/chart/chart-type-capabilities.ts`，本轮不再保留 viewer 私有矩阵。改造后：

- core 导出 `CHART_CAPABILITIES`、`getChartCapabilities()`、`isBarLike/isLineLike/isPieLike/isCartesianChart`。
- designer 从 core 导入，用于属性面板显隐、字段槽位、标签内容过滤、类型样式过滤。
- viewer 从 core 导入，用于 VSeed 字段映射、稳定/高级图表判断、坐标/图例/数据 reshape。
- 删除 viewer 的 `chart-type-capabilities.ts`，或改为仅 re-export core 能力函数，不再维护独立数据表。

### 字段定义

```ts
export interface ChartCapabilities {
  axes: false | 'xy' | 'radial' | 'rightY';        // 决定 ChartAxesPanel 是否出现 + 内部分支
  legend: false | 'categorical' | 'continuous';     // 决定 ChartLegendPanel 是否出现 + 形态
  labelContent: Array<'name'|'value'|'percent'|'name-value'>;  // 过滤 ChartLabelPanel 的 content 下拉；空数组隐藏面板
  styleOptions: Array<keyof ChartPlotOptions>;      // 过滤 ChartTypeStylePanel 渲染哪些字段组；空数组隐藏面板
  series: false | 'measureNames';                    // 控制系列来源；删除 seriesField 后仅由多度量推导
  dimensions: 'single' | 'dual' | 'hierarchical';    // 控制 ChartDataPanel 的维度槽位数量与提示
  measures: 'single' | 'multi' | 'dualAxis';          // 控制度量槽位数量与 axis 字段
  grid: boolean;                                     // 仅 cartesian 图表显示网格开关
  stability: 'stable' | 'advanced';                  // viewer 原 STABLE/ADVANCED 分类迁入 core
}
```

9 个维度逐一对账现状代码（见诊断问题 2），无冗余。`series` 不再表示 `seriesField` 是否出现，而表示删除 `seriesField` 后 renderer 是否需要从多度量生成系列名称。

### 矩阵填充（23 种全覆盖）

按家族分组：

```ts
export const CHART_CAPABILITIES: Record<ChartType, ChartCapabilities> = {
  // 柱状/条形家族
  column:         { axes:'xy', legend:'categorical', labelContent:['name','value','percent','name-value'], styleOptions:['bar'], series:'measureNames', dimensions:'single', measures:'multi', grid:true, stability:'stable' },
  columnParallel: { axes:'xy', legend:'categorical', labelContent:['name','value','name-value'],          styleOptions:['bar'], series:'measureNames', dimensions:'single', measures:'multi', grid:true, stability:'stable' },
  columnPercent:  { axes:'xy', legend:'categorical', labelContent:['name','percent','name-value'],        styleOptions:['bar'], series:'measureNames', dimensions:'single', measures:'multi', grid:true, stability:'stable' },
  bar:            { axes:'xy', legend:'categorical', labelContent:['name','value','percent','name-value'], styleOptions:['bar'], series:'measureNames', dimensions:'single', measures:'multi', grid:true, stability:'stable' },
  barParallel:    { axes:'xy', legend:'categorical', labelContent:['name','value','name-value'],          styleOptions:['bar'], series:'measureNames', dimensions:'single', measures:'multi', grid:true, stability:'stable' },
  barPercent:     { axes:'xy', legend:'categorical', labelContent:['name','percent','name-value'],        styleOptions:['bar'], series:'measureNames', dimensions:'single', measures:'multi', grid:true, stability:'stable' },

  // 折线/面积家族
  line:       { axes:'xy', legend:'categorical', labelContent:['name','value'],   styleOptions:['line'],        series:'measureNames', dimensions:'single', measures:'multi', grid:true, stability:'stable' },
  area:       { axes:'xy', legend:'categorical', labelContent:['name','value'],   styleOptions:['line','area'], series:'measureNames', dimensions:'single', measures:'multi', grid:true, stability:'stable' },
  areaPercent:{ axes:'xy', legend:'categorical', labelContent:['name','percent'], styleOptions:['line','area'], series:'measureNames', dimensions:'single', measures:'multi', grid:true, stability:'stable' },

  // 饼/环/玫瑰家族（无坐标轴、无网格）
  pie:   { axes:false, legend:'categorical', labelContent:['name','value','percent','name-value'], styleOptions:['pie'], series:false, dimensions:'single', measures:'single', grid:false, stability:'stable' },
  donut: { axes:false, legend:'categorical', labelContent:['name','value','percent','name-value'], styleOptions:['pie'], series:false, dimensions:'single', measures:'single', grid:false, stability:'stable' },
  rose:  { axes:false, legend:'categorical', labelContent:['name','value','percent','name-value'], styleOptions:['pie'], series:false, dimensions:'single', measures:'single', grid:false, stability:'stable' },

  // 散点（双维度）
  scatter: { axes:'xy', legend:false, labelContent:['name','value'], styleOptions:['scatter'], series:false, dimensions:'dual', measures:'single', grid:true, stability:'stable' },

  // 雷达（径向轴）
  radar: { axes:'radial', legend:'categorical', labelContent:['name','value'], styleOptions:['radar'], series:'measureNames', dimensions:'single', measures:'multi', grid:false, stability:'stable' },

  // 漏斗（无坐标轴）
  funnel: { axes:false, legend:'categorical', labelContent:['name','value','percent'], styleOptions:['funnel'], series:false, dimensions:'single', measures:'single', grid:false, stability:'stable' },

  // 双轴（右轴）
  dualAxis: { axes:'rightY', legend:'categorical', labelContent:['name','value'], styleOptions:['dualAxis'], series:'measureNames', dimensions:'single', measures:'dualAxis', grid:true, stability:'stable' },

  // 热力（连续色带图例、双维度）
  heatmap: { axes:false, legend:'continuous', labelContent:['value'], styleOptions:['heatmap'], series:false, dimensions:'dual', measures:'single', grid:false, stability:'stable' },

  // 直方（复用 bar 样式）
  histogram:{ axes:'xy', legend:false, labelContent:['value'], styleOptions:['bar'], series:false, dimensions:'single', measures:'single', grid:true, stability:'advanced' },

  // 箱线（暂不暴露样式、无标签）
  boxPlot: { axes:'xy', legend:'categorical', labelContent:[], styleOptions:[], series:false, dimensions:'single', measures:'multi', grid:true, stability:'advanced' },

  // 桑基（源/目标双维度 + 权重）
  sankey: { axes:false, legend:false, labelContent:['name','value'], styleOptions:[], series:false, dimensions:'dual', measures:'single', grid:false, stability:'advanced' },

  // 层级家族（层级维度、无坐标轴、无网格）
  treeMap:       { axes:false, legend:false, labelContent:['name','value'], styleOptions:[], series:false, dimensions:'hierarchical', measures:'single', grid:false, stability:'advanced' },
  sunburst:      { axes:false, legend:false, labelContent:['name','value'], styleOptions:[], series:false, dimensions:'hierarchical', measures:'single', grid:false, stability:'advanced' },
  circlePacking: { axes:false, legend:false, labelContent:['name','value'], styleOptions:[], series:false, dimensions:'hierarchical', measures:'single', grid:false, stability:'advanced' },
};
```

### 派生函数（收敛旧判断）

```ts
export const isBarLike  = (t: ChartType) => CHART_CAPABILITIES[t].styleOptions.includes('bar');
export const isLineLike = (t: ChartType) => CHART_CAPABILITIES[t].styleOptions.includes('line');
export const isPieLike  = (t: ChartType) => CHART_CAPABILITIES[t].axes === false && CHART_CAPABILITIES[t].styleOptions.includes('pie');
```

`chart-options.ts:317-327` 的旧 `isBarLike/isLineLike/isPieLike` 删除，引用处改从 `chart-capabilities` 导入。

## 第 2 章：FontEditor 公共组件

这是图表各面板依赖的前置组件，须先于图表面板改造完成。

### 组件位置

`packages/designer/src/components/properties/FontEditor.tsx`

### 接口设计

```ts
interface FontEditorProps {
  value: FontConfig;                          // 统一到 core 的 FontConfig
  onChange: (next: FontConfig) => void;
  reportFontOptions: ReportFontOption[];      // getReportFontOptions() 产物
  fields?: FontField[];                       // 白名单，默认全家桶
  sizeRange?: [number, number];               // 默认 [6,72]
  disabled?: boolean | ((field: FontField) => boolean);
}
type FontField = 'family' | 'size' | 'color' | 'bold' | 'italic' | 'underline' | 'strikethrough';
```

### 关键设计点

- `fields` 白名单解决能力差异：图表轴标签 `['size','color']`、主标题全家桶、水印 `['family','size']`。
- `value` 统一为 core `FontConfig`，`ChartFontConfig` 改为 `type ChartFontConfig = FontConfig` 别名。
- 加粗/斜体/下划线/删除线按钮组抽成内部子组件。
- 字号范围按场景传入：图表用 [6,48]，文本用 [6,72]。
- i18n 复用现有 `fontFamily/fontSize/textColor/bold/italic/underline/strike` 消息键。

### 全项目迁移清单

本轮 FontEditor 必须完成图表相关 4 处（表格单元格/表格行/样式库/水印 4 处为配套迁移，可并行但需与图表改造同批完成，避免新组件落地后又遗留旧内联代码）。9 处全部完成方算本轮 FontEditor 收口。

| 位置 | 替换内容 | `fields` |
|---|---|---|
| `PropertyEditor.tsx:480-570`（text 组件组） | 整个 font 折叠组 | 全家桶 |
| `DesignerPropertyPanel.tsx:169-228`（表格单元格） | 内联字体块 | 全家桶 |
| `DesignerPropertyPanel.tsx:355-391`（表格行） | 内联字体块 | 全家桶 |
| `TextStyleLibraryDialog.tsx:541-544`（样式库） | 按钮组部分 | flags only |
| `PageSetupDialog.tsx:195-204`（水印） | family+size | `['family','size']` |
| `ChartTitlePanel`（新建） | title font | 全家桶 |
| `ChartLegendPanel`（新建） | legend font | `['size','color']` |
| `ChartAxesPanel`（X/Y 的 title/label 共 4 处） | axis fonts | `['size','color','bold']` |
| `ChartLabelPanel`（新建） | data label font | `['size','color','bold']` |

## 第 3 章：主面板重组（取消 chart 包装层）

### 3.1 扁平化结构

取消 `PropertyEditor` 里 `key:'chart'` 的包装组（`PropertyEditor.tsx:363`），图表的子属性组直接作为外层 `Collapse.items` 的兄弟项，与 general/position/font/border/appearance/events 并列。

```
改造前（双层）：
Collapse
├─ general / position / behavior
├─ chart ◄── 包装层（无实际作用）
│   └─ StructuredChartPropertyPanel（内层 Collapse，全展开）
│       └─ basic / data / title / theme / axes / legend / labels / style
└─ font / border / appearance / events

改造后（扁平）：
Collapse
├─ general / position / behavior
├─ chartBasic / chartData / chartTitle / chartTheme
├─ chartAxes / chartLegend / chartLabels / chartStyle（按类型显隐）
└─ font / border / appearance / events
```

### 3.2 折叠组生成规则

`StructuredChartPropertyPanel` 不再渲染自己的 Collapse，改为返回一个 `CollapseProps['items']` 数组，由 `PropertyEditor` merge 进外层 items。数组按能力矩阵 `filter` 生成：

| 折叠组 | key | 显示条件 | 默认展开 |
|---|---|---|---|
| 基本 | `chartBasic` | 始终（图表类型 + 空数据提示） | ✅ |
| 数据绑定 | `chartData` | 始终 | ✅ |
| 标题 | `chartTitle` | 始终 | ❌ |
| 主题配色 | `chartTheme` | 始终 | ❌ |
| 坐标轴 | `chartAxes` | `capabilities.axes !== false` | ❌ |
| 图例 | `chartLegend` | `capabilities.legend !== false` | ❌ |
| 数据标签 | `chartLabels` | `capabilities.labelContent.length > 0` | ❌ |
| 类型样式 | `chartStyle` | `capabilities.styleOptions.length > 0` | ❌ |

对比现状（`DEFAULT_ACTIVE_KEYS` 全开 8 组）：现在只有 `chartBasic`+`chartData` 默认展开，其余默认折叠。无意义的组根本不出现在数组里（而非"出现但置灰/空白"）。

### 3.3 空数据提示去重

`emptyMessage` 现状在 `basic` 组（`ChartPropertyPanel.tsx:110`）和 `theme` 组（`ChartThemePanel.tsx:47`）都能改。改造后只保留在 `chartBasic` 组，`ChartThemePanel` 移除该项。

## 第 4 章：子面板字段补齐与类型适配

### 4.1 ChartDataPanel —— 按维度结构适配绑定槽位

现状 `ChartDataPanel:108-128` 永远渲染 seriesField/labelField，且 measures/dimensions 都只取 `[0]`。按 `capabilities` 改造：

| `capabilities` | 维度槽 | 度量槽 | 系列槽 | 说明 |
|---|---|---|---|---|
| `dimensions:'single'` & `series:'measureNames'` | 1 个（类目） | 多个（多系列） | 隐藏（系列由多度量推导） | column/line/area/radar |
| `dimensions:'single'` & `series:false` | 1 个 | 1 个 | 隐藏 | pie/donut/rose/funnel |
| `dimensions:'dual'` | 2 个（X、Y / source、target） | 1 个（值） | 隐藏 | scatter/heatmap/sankey |
| `dimensions:'hierarchical'` | 层级路径（多字段父子） | 1 个（size/value） | 隐藏 | treeMap/sunburst/circlePacking |

**多度量绑定**：把 `measures` 从单选改为可添加多行的度量列表（每行 field+alias+aggregation+axis）。`ChartBinding.seriesField` 字段删除——系列概念由多度量推导（每个度量即一个系列）。渲染端按 `measures` 数组长度生成系列。需同步删除 `chart-options.ts`/`layout-band.ts`/`chart-data.ts`/`chart-vseed.ts`/`chart-spec-patch.ts` 中对 `seriesField` 的读取。

### 4.1.1 删除 seriesField 后的数据契约

`ChartBinding` 目标形态：

```ts
export interface ChartBinding {
  dataSourceId?: string;
  arrayPath?: Expression;
  dimensions?: ChartDimension[];
  measures?: ChartMeasure[];
  sort?: Array<{ field: string; direction: ChartSortDirection }>;
  filterExpression?: Expression;
}
```

删除 `seriesField` 与 `labelField`。标签文案统一由 `ChartLabelConfig` 决定：`name` 读分类/维度名，`value` 读度量值，`percent` 由渲染端按图表类型计算，`custom` 后续再引入模板表达式，本轮不保留独立 `labelField`。

`ChartMeasure.axis` 保留，用于 `dualAxis`。规则：

- `measures:'single'`：只允许 1 个 measure，保存时裁剪多余项。
- `measures:'multi'`：允许 1-N 个 measure；每个 measure 的 `alias || field` 是系列名。
- `measures:'dualAxis'`：至少 2 个 measure；第一个默认 `axis:'left'`，第二个默认 `axis:'right'`；UI 允许调整 axis，但保存时必须至少有一个 left 和一个 right。

### 4.1.2 RenderChart.data reshape 规则

`layout-band.ts` 的 `buildChartData` 不再产出来自 `seriesField` 的 `point.series`。改为按能力矩阵生成标准中间数据：

| 图表能力 | 输入 binding | RenderChart.data 输出 |
|---|---|---|
| single + single | `dimensions[0]` + `measures[0]` | 每行 1 个 point：`category/value/raw` |
| single + multi | `dimensions[0]` + `measures[]` | 每个原始行按 measure 展开为 N 个 point：`category/value/series/measureKey/raw`，`series = measure.alias || measure.field` |
| dual + single（scatter） | `dimensions[0]` + `measures[0]` | 每行 1 个 point：`x/value/y/raw`，`x` 读第一维度，`y` 读第一度量 |
| dual + single（heatmap） | `dimensions[0]` + `dimensions[1]` + `measures[0]` | 每行 1 个 point：`category/series/value/raw`，`category = x dimension`，`series = y dimension` |
| dual + single（sankey） | `dimensions[0]` + `dimensions[1]` + `measures[0]` | 每行 1 个 edge point：`source/target/value/raw`；若继续复用 `ChartDataPoint`，需新增可选 `source/target` 字段 |
| hierarchical + single | `dimensions[]` + `measures[0]` | 每行保留完整层级路径：`path: string[]` + `value/raw`；若继续复用 `ChartDataPoint`，需新增可选 `path` 字段 |
| single + dualAxis | `dimensions[0]` + left/right measures | 每个原始行按 measure 展开为 N 个 point：`category/value/series/axis/measureKey/raw` |

因此 `ChartDataPoint` 需要补充：

```ts
export interface ChartDataPoint {
  category: string;
  value: number | null;
  measureValues?: Record<string, number | null>;
  measureKey?: string;
  series?: string;
  axis?: 'left' | 'right';
  label?: string;
  x?: number | null;
  y?: number | null;
  source?: string;
  target?: string;
  path?: string[];
  raw: Record<string, unknown>;
}
```

### 4.1.3 VSeed 字段映射规则

viewer 的 `buildChartDataset()` 和 `buildVSeedInput()` 按能力矩阵而不是 `seriesField` 分支：

- 单维单度量：dataset 字段为 `{ category, value }`，VSeed 使用 `xField/categoryField = 'category'`、`yField/angleField = 'value'`。
- 单维多度量：dataset 展开为 `{ category, series, value }`，VSeed 使用 `colorField = 'series'`。
- dualAxis：dataset 展开为 `{ category, series, value, axis }`，VSeed 使用 `xField = 'category'`、`yField = 'value'`，并由 `axis` 或 measure 配置把左右轴系列分配到 `yField/yField2`；如果 VSeed 必须宽表，则在 viewer 内把 left/right measure pivot 成 `{ category, leftValue, rightValue }`，不回写到模板模型。
- heatmap：dataset 字段为 `{ x, y, value }`，VSeed 使用 `xField = 'x'`、`yField = 'y'`、`valueField = 'value'`，不设置 `colorField`。
- sankey：dataset 字段为 `{ source, target, value }`，VSeed 使用 `sourceField = 'source'`、`targetField = 'target'`、`valueField = 'value'`。
- hierarchical：dataset 字段为 `{ path, value }`；如果 VSeed 需要扁平字段，viewer 根据 `path` 生成 `level0/level1/...` 临时字段，不回写模板模型。

### 4.1.4 聚合与排序规则

聚合从 `ChartBinding.aggregate` 迁移到每个 `ChartMeasure.aggregation`。兼容性不考虑，因此删除 binding 顶层 `aggregate`；新建图表默认第一度量 `aggregation:'sum'`。排序仍保留 `binding.sort`，但排序字段必须来自 `dimensions[].field` 或 `measures[].field`。

渲染聚合规则：

- 未设置 `measure.aggregation` 或为 `none`：按原始行输出 point。
- 设置聚合：按所有参与分类的维度分组；多度量时每个 measure 独立聚合并展开为系列。
- 百分比图：先按常规聚合得到分组值，再由 viewer 计算百分比，不把百分比写回 `RenderChart.data.value`。

**层级维度**：treeMap/sunburst/circlePacking 用"层级字段顺序"编辑器（可增删排序的字段列表），写入 `binding.dimensions` 为有序数组，渲染端按数组顺序构建父子层级。

### 4.2 ChartAxesPanel —— 按轴形态分支

| `axes` | 渲染内容 |
|---|---|
| `false` | 面板不出现 |
| `'xy'` | X 轴 + Y 轴两套，补 min/max/format/labelRotate |
| `'radial'` | 雷达专属：轴数量(axisCount)、形状(polygon/circle)，不渲染笛卡尔 min/max |
| `'rightY'` | dualAxis 专属：X + 左 Y + 右 Y（rightY）|

**字段补齐**（每个轴新增）：`min`/`max`（刻度范围）、`format`（数字/百分比/千分位）、`labelRotate`（标签旋转）——均为 schema 已有但面板未暴露的字段。

**字体**：每个轴的 title 和 label 用 `FontEditor`（`fields:['size','color','bold']`）。

### 4.3 ChartLegendPanel —— 按图例形态分支

| `legend` | 渲染内容 |
|---|---|
| `false` | 面板不出现 |
| `'categorical'` | 现状字段 + 补 `markerShape`/`layout`/`maxRows`/`maxColumns` |
| `'continuous'` | heatmap 专属：色带起止色、刻度数（复用 theme 的 linearPalette）|

字体用 `FontEditor`（`fields:['size','color']`）。

### 4.4 ChartLabelPanel —— 按 labelContent 过滤

content 下拉项 = `capabilities.labelContent`。补齐字段：`position`（含 spider 饼图蜘蛛线）、`showLeaderLine`（引导线）、`overlapStrategy`（防重叠）。字体用 `FontEditor`（`fields:['size','color','bold']`）。

### 4.5 ChartTypeStylePanel —— 按 styleOptions 渲染字段组

遍历 `capabilities.styleOptions`，每个 key 渲染对应字段组。补齐缺失家族：radar（shape/showArea/areaOpacity/lineWidth/showPoint/pointSize/axisCount）、funnel（direction/shape/showConversionRate/gap/minSize/maxSize）、dualAxis（primaryType/secondaryType）。

### 4.6 ChartTitlePanel / ChartThemePanel 补齐

- **Title**：补副标题字体/颜色（`subtitleFont`/`subtitleColor`），主标题字体用 `FontEditor` 全家桶。
- **Theme**：补 `linearPalette`（线性渐变色板，heatmap 专用）；移除 `emptyMessage`（去重）；`customPalette` 保留离散色板。

## 第 5 章：数据模型归一（一次性，无兼容层）

### 5.1 类型层（core/types.ts）——破坏性删除

- 删除 `ChartAppearance` 接口（383-399）。
- 删除 `ChartMarkStyle` 接口（340-381）——字段已被 `ChartPlotOptions` 完整覆盖。
- 删除 `ChartComponent.appearance` 字段（543 行）。
- 删除 `RenderChart.markStyle` 字段（render-document/types.ts:116）。
- 删除 `ChartBinding.seriesField`、`ChartBinding.labelField`、`ChartBinding.aggregate`，系列由多度量推导，聚合下沉到 `ChartMeasure.aggregation`。
- `ChartDataPoint` 补 `measureKey/axis/source/target/path`，支撑多度量、双轴、桑基和层级图 reshape。
- `ChartFontConfig = FontConfig`（别名）。

目标形态：

```ts
interface ChartComponent {
  chartType: ChartType;
  binding: ChartBinding;
  emptyMessage?: string;
  title?: ChartTitleConfig;
  legend?: ChartLegendConfig;
  axes?: ChartAxesConfig;
  labels?: ChartLabelConfig;
  theme?: ChartThemeConfig;
  plotOptions?: ChartPlotOptions;
}
```

### 5.2 规范化层（core/normalize-template.ts）——大幅瘦身

- 删除 `normalizeChartAppearance`（178-192）。
- 删除 `normalizeChartTitle/Legend/Axes/Labels`（198-252）。
- 删除 `normalizeChartPlotOptions`（253-310）。
- chart 规范化简化为：只校验 `chartType` 合法性 + 填充 `binding/emptyMessage` 默认值。
- binding 规范化按 `getChartCapabilities(chartType)` 裁剪维度/度量数量：`single` 保留 1 个维度，`dual` 保留 2 个维度，`hierarchical` 保留全部有序维度；`single` 度量保留 1 个，`multi` 保留 1-N 个，`dualAxis` 至少补齐 left/right 两个度量。
- 删除顶层 `binding.aggregate` 规范化，默认聚合写入第一条 `binding.measures[0].aggregation`。

### 5.3 渲染层（core/layout-band.ts + viewer/chart-spec-patch.ts）

- `buildRenderChart`（layout-band.ts:839-857）改为纯读结构化字段，删除所有 `?? appearance.xxx` 兜底。
- 删除 `compactChartMarkStyle`（865-866）和 `legacyMarkStyle` 拼装（754,857）。
- `buildChartData` 删除 `seriesField/labelField/aggregate` 读取，按第 4.1.2 节 reshape；`aggregate` 参数改由每个 measure 自己的 `aggregation` 决定。
- viewer 的 `chart-data.ts`、`chart-vseed.ts` 删除 `binding.seriesField` 分支，按第 4.1.3 节使用固定临时字段名。
- `chart-spec-patch.ts:248` 改为 `const plotOptions = chart.plotOptions ?? {}`。
- 删除 `convertMarkStyle`（312-369）。

### 5.4 设计器画布（designer/Canvas.tsx）

- `2754-2755` palette 改读 `chart.theme?.customPalette`。
- `2760` title 改读 `chart.title?.text`。
- `2890-2941` showGrid 改读 `chart.axes?.x?.gridVisible ?? true`。

### 5.5 设计器面板（chart-options.ts + ChartPropertyPanel.tsx）

- 删除 `getChartXxx()` 的 appearance 兜底分支（164-217），简化为直接读结构化字段。
- 删除 `markStyleToPlotOptions`（219-278）、`plotOptionsToMarkStyle`（280-315）。
- 删除 `updateTitle` 双写逻辑（ChartPropertyPanel.tsx:83-92）。
- 删除 6 个 useMemo 的 appearance 依赖项（46-69）。

### 5.6 示例与测试一并更新

- **示例模板**：所有示例 chart 组件从 `appearance:{...}` 改为 `title:{...}/legend:{...}/axes:{...}/theme:{...}/plotOptions:{...}`。
- `phase-48-chart-property-panel.test.tsx:36,137,140,154`：`appearance.title` 断言改为 `title.text`；删除"双写"测试用例（140 行，前提已不存在）。
- `phase-48-chart-config-normalization.test.ts:42,203,260`：markStyle 规范化测试整体删除或重写为 plotOptions 默认值测试。

## 第 6 章：渲染性能（本轮：对策 A）

### 6.1 诊断：三个性能热点

1. **props 粒度过粗**：`ChartPropertyPanel` 收到整个 `chart` 对象，6 个 useMemo（46-69）依赖项混入多个 `chart.xxx`，改一个字段触发多个 memo 失效。
2. **items 数组每次重建**：`items` useMemo（94-175）依赖 19 项，任一变化整张折叠面板重建。
3. **回调引用不稳**：父级 `handleChange`/`handleChangeMany`（PropertyEditor.tsx:126-137）每次渲染是新函数，子面板 `React.memo` 失效。

### 6.2 对策 A：store selector 按组拆分订阅

`ChartPropertyPanel` 不再收整个 `chart`，每个 group 组件从 store 按 selector 取自己需要的字段切片：

```ts
const ChartTitleGroup = () => {
  const title = useDesignerStore(s => selectedChart(s)?.title);
  // 只依赖 title，改 axes 不触发这里
};
```

收益：改标题字号时，只有 `ChartTitleGroup` 重渲染，`ChartAxesGroup`/`ChartLegendGroup` 不动。配合：

- `items` 拆分为稳定引用的子组件，items 只做"按能力矩阵决定包含哪些 key + label"的轻量计算，children 为组件引用，不随字段值变化重建。
- `getPanelsForChartType(chartType)` 返回 key 列表用 `useMemo([chartType])`，只在切类型时重算。
- 父级回调 `useCallback` 包裹，依赖项只放 `[currentPageId, bandId, component.id]`，用 ref 取最新值。

### 6.3 React Compiler（后续独立任务，未纳入本轮）

React Compiler 自动补上 memo/useCallback/useMemo。但 designer 包当前用纯 `tsc` 编译，无 babel 管线，接入 Compiler 需先引入 babel 构建层（`@babel/preset-typescript` + `babel-plugin-react-compiler`）。此改造涉及构建管线，风险与本轮图表重构正交，列为后续独立任务。

接入后分工：Compiler 接管组件内 memo/回调稳定，对策 A 继续负责跨 store 订阅粒度（Compiler 无法优化此项）。

### 6.4 验证基线

新增 `phase-49-designer-render-performance.test.tsx`（git status 显示已存在）作为性能回归基线。验证目标：

- 改单个字段（如标题字号）时，只有对应 group 组件 render，其它 group 的 render 计数为 0。
- 切换 chartType 时，items 列表重算一次，已展开的 group 不重复 render。

用渲染计数断言，不用时间阈值。

## 实施顺序建议

1. **第 2 章 FontEditor**：先做公共组件 + core `ChartFontConfig` 别名（图表各面板依赖它）。
2. **第 5 章 数据模型归一**：改 core 类型 → 改 normalize-template → 改 layout-band → 改 viewer chart-spec-patch → 改 Canvas → 改示例 → 改测试。四端联动，需整体推进。
3. **第 1 章 能力矩阵**：新建 core `chart-capabilities.ts`，迁移 designer/viewer 旧 isXxxLike 与 chart-type-capabilities 引用。
4. **第 3 章 + 第 4 章 主面板重组与子面板补齐**：扁平化结构、按能力矩阵显隐、补齐字段、接入 FontEditor。
5. **第 6 章 性能**：对策 A selector 拆分，加性能测试。

## 不做（YAGNI）

- 不做 `ChartComponent` 判别联合（23 种 union 过重，超出范围）。
- 不保留 `appearance`/`markStyle` 兼容层（用户明确一次性改）。
- 不本轮接入 React Compiler（构建管线改造，拆为后续任务）。
- 不引入虚拟滚动（折叠面板按需展开，DOM 量可控）。
