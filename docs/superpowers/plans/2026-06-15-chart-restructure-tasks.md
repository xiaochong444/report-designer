# 图表属性面板重构 — 执行任务清单

> 本文件供其他代理接手使用。规格文档见 `docs/superpowers/specs/2026-06-15-chart-property-panel-restructure-design.md`（已 commit 616458d，用户后续通过其它工具补充了第 4.1.1–4.1.4、第 5.1 扩展等内容，以该规格文档为唯一事实来源）。
>
> 已确认的关键决策（无需再问）：
> 1. UI 重组 + 数据模型归一（动 core 类型，不做判别联合）。
> 2. 保持右侧属性面板单层 Collapse 风格，取消 `chart` 包装层，图表子组扁平化为外层兄弟项。
> 3. 引入图表类型能力矩阵（**归 core，designer/viewer 共享**），23 种类型全覆盖。
> 4. 不考虑兼容性，**一次性删除** `appearance`/`markStyle`，四端联动改为只读写结构化字段。
> 5. 新建 FontEditor 公共组件，**全项目迁移**所有字体设置处（9 处）。
> 6. `ChartFontConfig` 统一为 core `FontConfig` 别名。
> 7. 性能本轮只做对策 A（store selector 按组拆分订阅）；React Compiler 列为后续独立任务（不改构建管线）。
>
> 约束：不要使用子代理（并发限制）。串行执行，每完成一项在下文标记 ✅。
> 命令环境为 Windows cmd.exe（无 `ls`/`head`/`tail`，用 `dir`/`findstr`）。

## 关键现状参考（已读过，无需重复探索）

- **能力矩阵现状**：viewer 已有 `packages/viewer/src/renderers/chart/chart-type-capabilities.ts`（旧私有线），本轮迁入 core 并删除 viewer 副本。
- **类型定义**：`packages/core/src/template-model/types.ts:117-399`（ChartType 枚举 23 种、ChartAppearance:383、ChartMarkStyle:340、ChartBinding:154 含 seriesField/labelField/aggregate）。
- **规范化**：`packages/core/src/template-model/normalize-template.ts:144-312`（normalizeChartAppearance + 6 个 normalizeChartXxx + normalizeChartPlotOptions）。
- **布局渲染**：`packages/core/src/layout-engine/layout-band.ts:746-1012`（layoutChart / buildChartData / aggregateChartPoints，读 appearance 兜底 + 拼 legacyMarkStyle）。
- **渲染类型**：`packages/core/src/render-document/types.ts:116`（RenderChart.markStyle 字段）。
- **viewer chart**：`packages/viewer/src/renderers/chart/`（chart-data.ts 读 seriesField、chart-vseed.ts 读 seriesField、chart-spec-patch.ts:248,312-369 convertMarkStyle）。
- **designer chart**：`packages/designer/src/components/chart/`（chart-options.ts 的 getChartXxx/markStyleToPlotOptions/plotOptionsToMarkStyle，ChartPropertyPanel.tsx 双层 Collapse + 全展开，各 ChartXxxPanel.tsx）。
- **designer 画布**：`packages/designer/src/components/Canvas.tsx:2754-2941`（读 appearance.theme/title/showGrid）。
- **字体散落处**：PropertyEditor.tsx:480-570、DesignerPropertyPanel.tsx:169-228/355-391、TextStyleLibraryDialog.tsx:541-544、PageSetupDialog.tsx:195-204。
- **测试**：phase-48-chart-property-panel.test.tsx:36/137/140/154、phase-48-chart-config-normalization.test.ts:42/203/260、phase-49-designer-render-performance.test.tsx（已存在，未跟踪）。

## 执行顺序（对应规格"实施顺序建议"，严格按序）

### 阶段一：FontEditor 公共组件（图表各面板依赖它）

- [ ] **T1** core `ChartFontConfig` 改为 `type ChartFontConfig = FontConfig` 别名（types.ts:186 附近）。确认 core 已导出 `FontConfig` 与 `ReportFontOption`、`getReportFontOptions`。
- [ ] **T2** 新建 `packages/designer/src/components/properties/FontEditor.tsx`，按规格第 2 章接口实现（value/onChange/reportFontOptions/fields 白名单/sizeRange/disabled）。加粗斜体等按钮组抽内部子组件。i18n 复用现有 fontFamily/fontSize/textColor/bold/italic/underline/strike 键。

### 阶段二：数据模型归一（core → viewer → designer，四端联动）

> 进度：core（T3-T6）+ viewer（T7）已完成并提交（commit 7cc6e7c）。designer 端（T12/T13）待做。

- [x] **T3** core `types.ts`：删除 `ChartAppearance`(383-399)、`ChartMarkStyle`(340-381)；删除 `ChartComponent.appearance` 字段(543)；删除 `ChartBinding.seriesField/labelField/aggregate`；`ChartDataPoint` 补 `measureKey/axis/source/target/path` 字段（按规格 4.1.2）。✅
- [x] **T4** core `normalize-template.ts`：删 `normalizeChartAppearance`/`normalizeChartTitle/Legend/Axes/Labels`/`normalizeChartPlotOptions`(178-312)；chart 规范化简化为只校验 chartType + 填默认值；binding 规范化删 seriesField/labelField/aggregate，按能力矩阵裁剪维度/度量数量。✅
- [x] **T5** core `layout-band.ts`：`layoutChart`(746-863) 改纯读结构化字段，删所有 `?? appearance.xxx` 兜底与 legacyMarkStyle 拼装(753-826)、`compactChartMarkStyle`(865-867)；`buildChartData`(900-943) 删 seriesField/labelField/aggregate 读取，按规格 4.1.2 reshape（flatMap 多度量展开，scatter/heatmap/sankey/hierarchical 分支）；聚合改由 resolveChartAggregate 从 measure.aggregation 推导。✅（附修了 applyChartSort 传 options→options.context 的预存类型错误）
- [x] **T6** core `render-document/types.ts:116`：删 `RenderChart.markStyle` 字段，清理 import。✅
- [x] **T7** viewer：删 `chart-spec-patch.ts` convertMarkStyle(312-369)，248 行改 `chart.plotOptions ?? {}`；`chart-data.ts` 删 seriesField 分支；`chart-vseed.ts` 删 seriesField→colorField 分支，改为按 point.series 判断。✅
- [x] **T1** core `ChartFontConfig` 改为 `type ChartFontConfig = FontConfig` 别名（随 T3 完成）。✅

### 阶段四：设计器面板与画布（chart-options 清理 + Canvas）

- [ ] **T12** designer `chart-options.ts`：删 `getChartXxx` appearance 兜底(164-217)，简化为直接读结构化字段；删 `markStyleToPlotOptions`(219-278)、`plotOptionsToMarkStyle`(280-315)；删旧 isBarLike/isLineLike/isPieLike(317-327) 改用 core（T10 并入）。
- [ ] **T13** designer `Canvas.tsx:2754-2941`：palette 改读 `chart.theme?.customPalette`、title 改读 `chart.title?.text`、showGrid 改读 `chart.axes?.x?.gridVisible ?? true`。

### 阶段三：能力矩阵（归 core）

- [x] **T8** 新建 `packages/core/src/chart/chart-capabilities.ts`（注意：core 可能无 chart 目录，需新建），按规格第 1 章 23 种类型填充 `CHART_CAPABILITIES` + `getChartCapabilities` + `isBarLike/isLineLike/isPieLike/isCartesianChart` 派生函数（9 维度：axes/legend/labelContent/styleOptions/series/dimensions/measures/grid/stability）。
- [x] **T9** core 导出 chart-capabilities（确认 `packages/core/src/index.ts` 或 template-model index 有 re-export）。
- [x] **T10** designer 迁移：删 `chart-options.ts:317-327` 旧 isBarLike/isLineLike/isPieLike，引用改从 core 导入。（注：designer chart-options 整体在 T12 重写，T10 并入 T12）
- [x] **T11** viewer 迁移：`chart-type-capabilities.ts` 改为 re-export core 的 isXxxLike/isCartesianChart/mapVSeedChartType（加 Chart 后缀别名），保留 CHART_TYPE_CAPABILITIES/getChartTypeCapability（字段槽位矩阵，compiler 用）；chart-spec-patch/chart-vseed 已改用 core。

### 阶段四：设计器面板与画布（chart-options 清理 + Canvas）

- [ ] **T12** designer `chart-options.ts`：删 `getChartXxx` appearance 兜底(164-217)，简化为直接读结构化字段；删 `markStyleToPlotOptions`(219-278)、`plotOptionsToMarkStyle`(280-315)。
- [ ] **T13** designer `Canvas.tsx:2754-2941`：palette 改读 `chart.theme?.customPalette`、title 改读 `chart.title?.text`、showGrid 改读 `chart.axes?.x?.gridVisible ?? true`。

### 阶段五：主面板重组（规格第 3 章）

- [ ] **T14** `ChartPropertyPanel.tsx`：改为返回 `CollapseProps['items']` 数组（不再渲染自己的 Collapse），按能力矩阵 filter 生成 8 组（chartBasic/chartData/chartTitle/chartTheme/chartAxes/chartLegend/chartLabels/chartStyle），默认只展开 chartBasic+chartData。
- [ ] **T15** `PropertyEditor.tsx`：取消 `key:'chart'` 包装组(363)，把图表 items 数组 spread 进外层 Collapse.items；删 StructuredChartPropertyPanel 的内层 Collapse。
- [ ] **T16** `ChartThemePanel.tsx`：移除 emptyMessage（去重，仅保留在 chartBasic）。

### 阶段六：子面板字段补齐（规格第 4 章）

- [ ] **T17** `ChartDataPanel.tsx`：按 dimensions/measures 能力适配槽位（single/multi/dualAxis/hierarchical），多度量列表，删 seriesField/labelField UI，层级维度编辑器。
- [ ] **T18** `ChartAxesPanel.tsx`：按 axes 形态分支（xy/radial/rightY/false），补 min/max/format/labelRotate，rightY 渲染，字体接 FontEditor。
- [ ] **T19** `ChartLegendPanel.tsx`：按 legend 形态分支（categorical/continuous/false），补 markerShape/layout/maxRows/maxColumns，字体接 FontEditor。
- [ ] **T20** `ChartLabelPanel.tsx`：content 下拉按 capabilities.labelContent 过滤，补 position/showLeaderLine/overlapStrategy，字体接 FontEditor。
- [ ] **T21** `ChartTypeStylePanel.tsx`：遍历 capabilities.styleOptions 渲染字段组，补 radar/funnel/dualAxis 家族。
- [ ] **T22** `ChartTitlePanel.tsx`：补 subtitleFont/subtitleColor，主标题字体接 FontEditor。
- [ ] **T23** `ChartThemePanel.tsx`：补 linearPalette（heatmap 用），customPalette 保留。

### 阶段七：FontEditor 全项目迁移（非图表处）

- [ ] **T24** `PropertyEditor.tsx:480-570`（text 组件字体组）→ FontEditor 全家桶。
- [ ] **T25** `DesignerPropertyPanel.tsx:169-228`（表格单元格）→ FontEditor 全家桶。
- [ ] **T26** `DesignerPropertyPanel.tsx:355-391`（表格行）→ FontEditor 全家桶。
- [ ] **T27** `TextStyleLibraryDialog.tsx:541-544`（样式库按钮组）→ FontEditor flags only。
- [ ] **T28** `PageSetupDialog.tsx:195-204`（水印）→ FontEditor `['family','size']`。

### 阶段八：性能（规格第 6 章）

- [ ] **T29** ChartPropertyPanel 各 group 改为从 store 按 selector 取字段切片（对策 A）；items 拆稳定引用子组件；父级回调 useCallback 稳定化。
- [ ] **T30** 完善 `phase-49-designer-render-performance.test.tsx`：断言改单字段只触发对应 group render。

### 阶段九：示例与测试收口

- [ ] **T31** 全项目搜索示例模板中的 chart 组件，从 `appearance:{...}` 改为结构化字段（title/legend/axes/theme/plotOptions）。搜索方式：`rg "appearance" --glob "!**/dist/**" -g "*.ts" -g "*.tsx"`。
- [ ] **T32** `phase-48-chart-property-panel.test.tsx`：appearance.title 断言改 title.text，删"双写"测试用例(140 行)。
- [ ] **T33** `phase-48-chart-config-normalization.test.ts`：markStyle 规范化测试删除或重写为 plotOptions 默认值测试。

### 阶段十：全量验证

- [ ] **T34** `pnpm -w build`（turbo build）通过，tsc 无错。
- [ ] **T35** `pnpm -w test`（turbo test）通过，vitest 全绿。
- [ ] **T36** 提交（按用户要求，完成的工作标记完成；commit message 用 `refactor(chart):` 前缀）。

## 接手说明

- 任何一步遇到规格未覆盖的细节，以规格文档为准；规格与现状冲突时，规格优先（用户已确认一次性破坏性改）。
- T4 与 T8 有循环依赖（normalize 要用能力矩阵裁剪 binding，能力矩阵要放 core）。建议先做 T8（建能力矩阵），再做 T4。
- 阶段二（T3-T7）是破坏性改动，中途 tsc 会大面积报错属正常，需四端改完才能编译通过。建议 T3→T6→T5→T4→T7→T12→T13 顺序，最后一起编译。
- 每完成一项，把上面 `[ ]` 改成 `[x]` 并提交本文件，方便其他代理看进度。
