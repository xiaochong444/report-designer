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

- [x] **T1** core `ChartFontConfig` 改为 `type ChartFontConfig = FontConfig` 别名（types.ts:186 附近）。确认 core 已导出 `FontConfig` 与 `ReportFontOption`、`getReportFontOptions`。✅
- [x] **T2** 新建 `packages/designer/src/components/properties/FontEditor.tsx`，按规格第 2 章接口实现（value/onChange/reportFontOptions/fields 白名单/sizeRange/disabled）。加粗斜体等按钮组抽内部子组件。i18n 复用现有 fontFamily/fontSize/textColor/bold/italic/underline/strike 键。✅

### 阶段二：数据模型归一（core → viewer → designer，四端联动）

> 进度：core（T3-T6）+ viewer（T7）已完成并提交（commit 7cc6e7c）；designer 端（T12/T13）已完成。

- [x] **T3** core `types.ts`：删除 `ChartAppearance`(383-399)、`ChartMarkStyle`(340-381)；删除 `ChartComponent.appearance` 字段(543)；删除 `ChartBinding.seriesField/labelField/aggregate`；`ChartDataPoint` 补 `measureKey/axis/source/target/path` 字段（按规格 4.1.2）。✅
- [x] **T4** core `normalize-template.ts`：删 `normalizeChartAppearance`/`normalizeChartTitle/Legend/Axes/Labels`/`normalizeChartPlotOptions`(178-312)；chart 规范化简化为只校验 chartType + 填默认值；binding 规范化删 seriesField/labelField/aggregate，按能力矩阵裁剪维度/度量数量。✅
- [x] **T5** core `layout-band.ts`：`layoutChart`(746-863) 改纯读结构化字段，删所有 `?? appearance.xxx` 兜底与 legacyMarkStyle 拼装(753-826)、`compactChartMarkStyle`(865-867)；`buildChartData`(900-943) 删 seriesField/labelField/aggregate 读取，按规格 4.1.2 reshape（flatMap 多度量展开，scatter/heatmap/sankey/hierarchical 分支）；聚合改由 resolveChartAggregate 从 measure.aggregation 推导。✅（附修了 applyChartSort 传 options→options.context 的预存类型错误）
- [x] **T6** core `render-document/types.ts:116`：删 `RenderChart.markStyle` 字段，清理 import。✅
- [x] **T7** viewer：删 `chart-spec-patch.ts` convertMarkStyle(312-369)，248 行改 `chart.plotOptions ?? {}`；`chart-data.ts` 删 seriesField 分支；`chart-vseed.ts` 删 seriesField→colorField 分支，改为按 point.series 判断。✅
- [x] **T1** core `ChartFontConfig` 改为 `type ChartFontConfig = FontConfig` 别名（随 T3 完成）。✅

### 阶段四：设计器面板与画布（chart-options 清理 + Canvas）

- [x] **T12** designer `chart-options.ts`：删 `getChartXxx` appearance 兜底(164-217)，简化为直接读结构化字段；删 `markStyleToPlotOptions`(219-278)、`plotOptionsToMarkStyle`(280-315)；删旧 isBarLike/isLineLike/isPieLike(317-327) 改用 core（T10 并入）。✅
- [x] **T13** designer `Canvas.tsx:2754-2941`：palette 改读 `chart.theme?.customPalette`、title 改读 `chart.title?.text`、showGrid 改读 `chart.axes?.x?.gridVisible ?? true`。✅

### 阶段三：能力矩阵（归 core）

- [x] **T8** 新建 `packages/core/src/chart/chart-capabilities.ts`（注意：core 可能无 chart 目录，需新建），按规格第 1 章 23 种类型填充 `CHART_CAPABILITIES` + `getChartCapabilities` + `isBarLike/isLineLike/isPieLike/isCartesianChart` 派生函数（9 维度：axes/legend/labelContent/styleOptions/series/dimensions/measures/grid/stability）。
- [x] **T9** core 导出 chart-capabilities（确认 `packages/core/src/index.ts` 或 template-model index 有 re-export）。
- [x] **T10** designer 迁移：删 `chart-options.ts:317-327` 旧 isBarLike/isLineLike/isPieLike，引用改从 core 导入。（注：designer chart-options 整体在 T12 重写，T10 并入 T12）
- [x] **T11** viewer 迁移：`chart-type-capabilities.ts` 改为 re-export core 的 isXxxLike/isCartesianChart/mapVSeedChartType（加 Chart 后缀别名），保留 CHART_TYPE_CAPABILITIES/getChartTypeCapability（字段槽位矩阵，compiler 用）；chart-spec-patch/chart-vseed 已改用 core。

### 阶段四：设计器面板与画布（chart-options 清理 + Canvas）

- [x] **T12** designer `chart-options.ts`：删 getChartXxx 兜底+双向转换+旧 isXxxLike，改用 core（commit 72a682e）。✅
- [x] **T13** designer `Canvas.tsx`：palette/title/showGrid 改读结构化字段（commit 72a682e）。✅

### 阶段五：主面板重组（规格第 3 章）

- [x] **T14** `ChartPropertyPanel.tsx`：改为 `buildChartPropertyItems()` 函数返回 items 数组，按能力矩阵 filter（commit 72a682e）。✅
- [x] **T15** `PropertyEditor.tsx`：取消 chart 包装组，spread chart items（commit 72a682e）。✅
- [x] **T16** `ChartThemePanel.tsx`：移除 emptyMessage（commit 72a682e）。✅

### 阶段六：子面板字段补齐（规格第 4 章）

> 进度：T17-T23 已完成；ChartDataPanel 完整重写，各图表子面板字段补齐并接入 FontEditor。

- [x] **T17** `ChartDataPanel.tsx`：按 dimensions/measures 能力适配槽位，删 seriesField/labelField/aggregate，多度量列表+层级维度编辑器。✅
- [x] **T18** `ChartAxesPanel.tsx`：props 加 capabilities，disabled 改用 axes===false；补 `min/max/format/labelRotate/rightY/radial`，轴标题/标签字体接 FontEditor。✅
- [x] **T19** `ChartLegendPanel.tsx`：props 加 chartType+capabilities；补 continuous 分支、markerShape/layout/maxRows/maxColumns，字体接 FontEditor。✅
- [x] **T20** `ChartLabelPanel.tsx`：content 按 capabilities.labelContent 过滤；补 position/showLeaderLine/overlapStrategy，字体接 FontEditor。✅
- [x] **T21** `ChartTypeStylePanel.tsx`：props 加 capabilities；补 radar/funnel/dualAxis 字段组。✅
- [x] **T22** `ChartTitlePanel.tsx`：主标题/副标题字体接 FontEditor，补 subtitleFont/subtitleColor。✅
- [x] **T23** `ChartThemePanel.tsx`：补 linearPalette。✅

### 阶段七：FontEditor 全项目迁移（非图表处）

- [x] **T24** `PropertyEditor.tsx:480-570`（text 组件字体组）→ FontEditor 全家桶。✅
- [x] **T25** `DesignerPropertyPanel.tsx:169-228`（表格单元格）→ FontEditor 全家桶。✅
- [x] **T26** `DesignerPropertyPanel.tsx:355-391`（表格行）→ FontEditor 全家桶。✅
- [x] **T27** `TextStyleLibraryDialog.tsx:541-544`（样式库按钮组）→ FontEditor flags only。✅
- [x] **T28** `PageSetupDialog.tsx:195-204`（水印）→ FontEditor `['family','size']`。✅

### 阶段八：性能（规格第 6 章）

- [x] **T29** ChartPropertyPanel 各 group 拆稳定 memo 子组件，父级回调 useCallback 稳定化，非目标字段更新不穿透到其它 group。✅
- [x] **T30** 完善 `phase-49-designer-render-performance.test.tsx`：断言改单字段只触发对应 group render。✅

### 阶段九：示例与测试收口

- [x] **T31** 示例模板 `business-dashboard.ts` 从 appearance/seriesField/aggregate 改为结构化字段（commit 72a682e）。✅
- [x] **T32** `phase-48-chart-property-panel.test.tsx`：工厂改结构化，删 appearance 断言与"双写"测试（commit 72a682e）。✅
- [x] **T33** `phase-48-chart-config-normalization.test.ts` 重写为结构化字段断言（通过）；`phase-41-chart-rendering.test.ts` 重写适配新 reshape（core 端通过）。✅

### 阶段十：全量验证

- [x] **T34** 三端 tsc 编译通过（core/viewer/designer，含测试）。✅
- [x] **T35** 测试：本轮聚焦验证通过：designer `phase-48-chart-property-panel.test.tsx`、`phase-49-designer-render-performance.test.tsx`；viewer `phase-48-chart-compiler.test.ts`、`phase-41-chart-rendering.test.tsx`。✅
- [x] **T36** 已提交多个检查点（616458d 规格、7cc6e7c core+viewer 归一、72a682e designer 面板重组、71be976 FontEditor 接入图表+text 字体组）。✅

## 剩余任务（后续代理接手）

> 更新于本轮未提交改动之后。上方 T1-T36 已全部收口，当前无本任务清单内未完成项。

### 已收口

1. React.act 环境问题已不再复现于本轮图表相关 designer/viewer `.tsx` 聚焦测试。
2. ChartAxesPanel / ChartLegendPanel / ChartLabelPanel / ChartTypeStylePanel / ChartTitlePanel / ChartThemePanel 字段补齐完成。
3. FontEditor 全项目迁移完成。
4. 性能优化 T29-T30 完成，已用 phase-49 覆盖“更新 chart title 不重渲染其它 chart group”。

### 已知限制

- ChartDataPanel 多度量编辑器使用了 chartValueField/chartAggregate 等现有 i18n 键，未新增"系列名/轴"专用键；dualAxis 的 axis 切换 UI 本轮未做（仅保留 left/right 默认分配）。
- 示例 business-dashboard.ts 把原 seriesField='category'/'storeName' 的多系列图降级为单度量（新模型多系列由多度量推导，需数据层配合）；如需还原多系列效果，改为多度量绑定。
- viewer chart-data.ts 的 buildChartDataset 仍按旧字段名（category/value/series）输出，依赖 layout-band reshape 后的 point；sankey/hierarchical 的新字段（source/target/path）尚未在 VSeed 映射中消费（chart-vseed.ts 未加 sankey/hierarchical 分支）。

## 接手说明

- 任何一步遇到规格未覆盖的细节，以规格文档为准；规格与现状冲突时，规格优先（用户已确认一次性破坏性改）。
- T4 与 T8 有循环依赖（normalize 要用能力矩阵裁剪 binding，能力矩阵要放 core）。建议先做 T8（建能力矩阵），再做 T4。
- 阶段二（T3-T7）是破坏性改动，中途 tsc 会大面积报错属正常，需四端改完才能编译通过。建议 T3→T6→T5→T4→T7→T12→T13 顺序，最后一起编译。
- 每完成一项，把上面 `[ ]` 改成 `[x]` 并提交本文件，方便其他代理看进度。
