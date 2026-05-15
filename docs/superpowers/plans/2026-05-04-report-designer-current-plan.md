# 报表设计器 v2 实现计划（对标 the reference report designer）

> 基于 the reference report designer Web Designer 功能对比，补充和完善现有计划。

**当前状态：** 基础框架已搭建，核心模型/表达式/命令/渲染引擎基本完成，设计器有基本画布交互，但距离 the reference designer 级别还缺少大量功能细节。

---

## 一、现状 vs the reference designer 对比

### 1. 画布交互

| 功能 | the reference designer | 当前状态 | 差距 |
|------|-----------|---------|------|
| 拖拽移动组件 | ✅ | ✅ | 无 |
| 8方向缩放 | ✅ | ✅ | 无 |
| 框选/多选 | ✅ | ✅ | 无 |
| Ctrl+点击多选 | ✅ | ✅ | 无 |
| 键盘微移 (Arrow) | ✅ | ✅ | 无 |
| 键盘快捷键 (Del/Copy/Paste/Undo) | ✅ | ✅ | 无 |
| 右键菜单 | ✅ | ✅ | 基本功能 |
| 网格显示 | ✅ | ✅ | 无 |
| 吸附到网格 | ✅ | ❌ | **缺少开关** |
| 标尺 | ✅ | ✅ | 有标尺但不能拖出参照线 |
| 参照线(从标尺拖出) | ✅ | ❌ | **完全缺失** |
| 参照线删除 | ✅ | ❌ | **完全缺失** |
| 吸附到参照线 | ✅ | ❌ | **完全缺失** |
| 智能对齐线 | ✅ | ✅ | 基本实现 |
| 缩放 (Ctrl+Wheel) | ✅ | ✅ | 无 |
| 缩放控制条 | ✅ | ✅ | 无 |
| 缩放预设 (适应页宽/整页) | ✅ | ❌ | **缺失** |
| 空格+拖拽平移画布 | ✅ | ❌ | **缺失** |
| 双击编辑文本 | ✅ | ✅ | 无 |
| 组件对齐工具 | ✅ | ❌ | **完全缺失** |
| 组件等间距分布 | ✅ | ❌ | **完全缺失** |
| 组件大小统一 | ✅ | ❌ | **完全缺失** |
| 组件层级 (置顶/置底) | ✅ | ❌ | **完全缺失** |
| 组件锁定 | ✅ | ❌ | **完全缺失** |
| 组件组合/取消组合 | ✅ | ❌ | **完全缺失** |
| Tab 键切换选中组件 | ✅ | ❌ | **缺失** |
| 拖拽时显示尺寸提示 | ✅ | ❌ | **缺失** |

### 2. 组件类型

| 组件 | the reference designer | 当前状态 | 差距 |
|------|-----------|---------|------|
| 文本 (Text) | ✅ | ✅ | 属性不全 |
| 图片 (Image) | ✅ | ✅ | 仅占位符 |
| 条码 (Barcode) | ✅ | ✅ | 仅占位符 |
| 表格 (Table) | ✅ | ✅ | 仅占位符 |
| 复选框 (Checkbox) | ✅ | ✅ | 仅占位符 |
| 富文本 (RichText) | ✅ | ✅ | 仅占位符 |
| 子报表 (Subreport) | ✅ | ✅ | 仅占位符 |
| 面板 (Panel) | ✅ | ✅ | 仅占位符 |
| 线条 (Line) | ✅ | ❌ | **缺失** |
| 矩形/形状 (Shape) | ✅ | ❌ | **缺失** |
| 图表 (Chart) | ✅ | ❌ | **缺失** (v2后期) |
| 交叉表 (CrossTab) | ✅ | ❌ | **缺失** (v2后期) |
| 页码 (PageNumber) | ✅ | ❌ | **缺失** |
| 当前日期 (DateTime) | ✅ | ❌ | **缺失** |

### 3. 属性面板

| 属性分类 | the reference designer | 当前状态 | 差距 |
|---------|-----------|---------|------|
| 位置尺寸 (X/Y/W/H) | ✅ | ✅ | 无 |
| 文本内容/表达式 | ✅ | ✅ | 基本实现 |
| 字体 (族/大小/粗/斜/下划/色) | ✅ | ✅ | 缺删除线 |
| 文本对齐 (水平/垂直) | ✅ | ✅ | 缺垂直 |
| 边框 (4边独立/样式/宽/色) | ✅ | ❌ | **完全缺失** |
| 背景色 | ✅ | ❌ | **缺失** |
| 内边距 (Padding) | ✅ | ❌ | **缺失** |
| CanGrow / CanShrink | ✅ | ✅ | 仅CanGrow |
| 数据绑定 (DataSource+Field) | ✅ | ❌ | **完全缺失** |
| 格式化字符串 | ✅ | ❌ | **完全缺失** |
| 条件格式 | ✅ | ❌ | **完全缺失** |
| 超链接 | ✅ | ❌ | **缺失** |
| 可见性条件 | ✅ | ❌ | **缺失** |
| PrintOn (奇偶页) | ✅ | ❌ | **缺失** |
| 组件名称 | ✅ | ❌ | **缺失** |

### 4. 工具栏 (Ribbon)

| 功能 | the reference designer | 当前状态 | 差距 |
|------|-----------|---------|------|
| 新建/打开/保存 | ✅ | ❌ | 按钮在但无功能 |
| 撤销/重做 | ✅ | ✅ | 无 |
| 剪切/复制/粘贴 | ✅ | 部分 | 缺剪切 |
| 删除 | ✅ | ✅ | 无 |
| 字体控制 | ✅ | 部分 | 缺字体系列下拉 |
| 对齐控制 | ✅ | 部分 | 仅3个按钮 |
| 组件插入 | ✅ | ❌ | **缺失** |
| 边框控制 | ✅ | ❌ | **缺失** |
| 页面设置 | ✅ | ❌ | **缺失** |
| 视图开关 (网格/标尺/参照线/吸附) | ✅ | ❌ | **完全缺失** |
| 缩放预设 | ✅ | ❌ | **缺失** |
| 预览 | ✅ | ❌ | **缺失** |
| 打印/导出 | ✅ | ❌ | **缺失** |

### 5. 数据字典

| 功能 | the reference designer | 当前状态 | 差距 |
|------|-----------|---------|------|
| 数据源列表 | ✅ | ✅ | 只读展示 |
| 字段列表 | ✅ | ✅ | 只读展示 |
| 拖拽字段到画布创建组件 | ✅ | ❌ | **完全缺失** |
| 添加/编辑/删除数据源 | ✅ | ❌ | **缺失** |
| 计算字段 | ✅ | ❌ | **缺失** |
| 参数 (Parameters) | ✅ | ❌ | **缺失** |
| 数据源关系 | ✅ | ❌ | **缺失** |

### 6. 报表结构

| 功能 | the reference designer | 当前状态 | 差距 |
|------|-----------|---------|------|
| 多页面 | ✅ | ✅ | 类型定义有 |
| 页面设置 (尺寸/方向/边距) | ✅ | ❌ | **缺失** |
| Band 添加/删除 | ✅ | ❌ | **缺失** |
| Band 排序 | ✅ | ❌ | **缺失** |
| GroupHeader/Footer | ✅ | ✅ | 类型定义有，设计器不支持 |
| ColumnHeader/Footer | ✅ | ❌ | **缺失** |
| Child Band | ✅ | ❌ | **缺失** |
| 报表树节点拖拽重排 | ✅ | ❌ | **缺失** |

### 7. 表达式编辑器

| 功能 | the reference designer | 当前状态 | 差距 |
|------|-----------|---------|------|
| 文本输入 | ✅ | ✅ | 简单input |
| 字段选择器 | ✅ | ❌ | **完全缺失** |
| 语法高亮 | ✅ | ❌ | **缺失** |
| 函数列表 | ✅ | ❌ | **缺失** |
| 实时预览 | ✅ | ❌ | **缺失** |
| 弹窗编辑器 | ✅ | ❌ | **缺失** |

### 8. 查看器/导出

| 功能 | the reference designer | 当前状态 | 差距 |
|------|-----------|---------|------|
| 页面渲染 | ✅ | 部分 | 基本框架 |
| 翻页 | ✅ | ✅ | 无 |
| 缩放 | ✅ | ✅ | 无 |
| PDF 导出 | ✅ | ✅ | 基本实现 |
| 打印 | ✅ | ✅ | 基本实现 |
| Excel 导出 | ✅ | ❌ | **缺失** |
| HTML 导出 | ✅ | ❌ | **缺失** |
| 图片导出 (PNG/SVG) | ✅ | ❌ | **缺失** |
| CSV 导出 | ✅ | ❌ | **缺失** |

---

## 二、实现优先级

按 **P0(必须) > P1(重要) > P2(完善) > P3(增强)** 分级：

### P0 — 核心交互缺失（设计器不可用）

1. 参照线系统（从标尺拖出、删除、吸附）
2. 吸附到网格开关
3. 组件对齐工具（左/右/居中/顶/底/中等）
4. 组件层级控制（置顶/置底）
5. 属性面板完善（边框、背景色、Padding、组件名称）
6. 数据绑定（字段到组件的表达式绑定）
7. 拖拽数据字段到画布自动创建组件
8. 工具栏功能连接（保存/页面设置/视图开关/组件插入）

### P1 — 重要功能缺失（影响日常使用）

9. 组件大小统一/等间距分布
10. 组件锁定
11. Band 添加/删除/排序
12. 页面设置对话框
13. 格式化字符串
14. 表达式编辑弹窗（字段选择器+函数列表）
15. 线条/形状组件
16. 页码/日期组件
17. 拖拽时显示尺寸提示
18. 缩放预设（适应页宽/整页）
19. 条件格式规则

### P2 — 完善体验

20. 计算字段
21. 报表参数
22. 条件可见性
23. 超链接
24. Excel/HTML/图片导出
25. 组件组合/取消组合
26. 空格+拖拽平移画布
27. Tab键切换选中组件
28. 剪切功能
29. 撤销/重做按钮状态同步

### P3 — 高级功能

30. 图表组件
31. 交叉表组件
32. 数据源关系
33. 报表树拖拽重排
34. PrintOn 奇偶页控制
35. 组件样式主题

---

## 三、详细实现任务

### Task A: 参照线系统 + 吸附开关

**目标：** 从标尺拖出参照线，可移动/删除，吸附到参照线

**文件：**
- `packages/designer/src/components/Canvas.tsx` — 修改

**实现要点：**
- 标尺区域添加 mousedown 监听，拖拽时创建一条跟随鼠标的参照线
- 参照线存储为 `userGuideLines: { id, dir, positionMm }[]`
- 参照线渲染在画布最外层（不在 page 的 scale 容器内），使用 `position: absolute` + `left/top` 基于 page 的 visual rect
- 坐标转换：标尺 mouseDown 时，用 `pageRef.current.getBoundingClientRect()` 获取 page 视觉位置，`clientX/Y - pageRect.left/top` 得到视觉像素，`/ zoom` 得到实际像素，`pxToMm()` 得到 mm
- 参照线拖拽时同样使用 `pageRef.getBoundingClientRect()` 实时计算
- 释放时：如果 positionMm < 0 或超出页面范围，删除该参照线
- 双击参照线删除
- moveComponent 时吸附到参照线（threshold 5px）
- 添加 `snapToGrid` 和 `showGuides` 开关到 store

**关键：** 参照线必须渲染在 page **外层**（不受 scale 影响），坐标用 `mmToPx(posMm) * zoom` 计算视觉位置

### Task B: 组件对齐/大小/层级

**目标：** 多选组件后可对齐、统一大小、调整层级

**文件：**
- `packages/designer/src/store/designer-store.ts` — 添加 alignComponents, sizeComponents, bringToFront, sendToBack
- `packages/core/src/command-engine/index.ts` — 注册新命令
- `packages/designer/src/components/Canvas.tsx` — 键盘快捷键
- `packages/designer/src/components/RibbonToolbar.tsx` — 工具栏按钮

**对齐操作：**
- 左对齐：所有选中组件的 x = min(x)
- 右对齐：所有选中组件的 x + width = max(x + width)
- 水平居中：所有 x = avg(minX, maxX)
- 顶部对齐：y = min(y)
- 底部对齐：y + height = max(y + height)
- 垂直居中：y = avg(minY, maxY)
- 水平等间距：(maxRight - minLeft) / (n-1)
- 垂直等间距：(maxBottom - minTop) / (n-1)

**大小统一：**
- 等宽：width = 第一个选中组件的 width
- 等高：height = 第一个选中组件的 height
- 等大小：width + height

**层级：**
- zOrder 属性添加到 ReportComponent
- 置顶：zOrder = max + 1
- 置底：zOrder = min - 1

### Task C: 属性面板完善

**目标：** 补齐边框、背景色、Padding、组件名称、垂直对齐等属性

**文件：**
- `packages/designer/src/components/PropertyEditor.tsx` — 重写
- `packages/core/src/template-model/types.ts` — 确认类型完整

**新增属性组：**
```
[名称] name: string
[位置] x, y, width, height
[外观] backgroundColor, opacity
[边框] border: { top/right/bottom/left: { style, width, color } }
[内边距] padding: { top, right, bottom, left }
[字体] font: { family, size, bold, italic, underline, strikethrough, color }
[对齐] textAlign, verticalAlign
[数据] dataSource, dataField, format
[行为] canGrow, canShrink, visible, printOn
[超链接] hyperlink
```

### Task D: 数据绑定 + 字段拖拽

**目标：** 从数据字典拖拽字段到画布，自动创建绑定组件

**文件：**
- `packages/designer/src/components/LeftPanel.tsx` — DataDictionary 添加拖拽
- `packages/designer/src/components/Canvas.tsx` — 接收字段拖放
- `packages/designer/src/components/PropertyEditor.tsx` — 数据属性编辑

**实现：**
- DataDictionary 中字段节点添加 `draggable`，`dataTransfer.setData('fieldBinding', JSON.stringify({dataSourceId, fieldName, fieldType}))`
- Canvas onDrop 检测 `fieldBinding`，根据字段类型自动创建组件：
  - string → Text, text: `{DataSource.Field}`
  - number → Text, text: `{DataSource.Field}`, textAlign: 'right', format: '#,##0.00'
  - date → Text, text: `{DataSource.Field}`, format: 'yyyy-MM-dd'
  - boolean → Checkbox
- 属性面板添加 dataSource + dataField 下拉选择
- 添加 format 字符串选择器

### Task E: 工具栏功能实现

**目标：** 让工具栏所有按钮都有实际功能

**文件：**
- `packages/designer/src/components/RibbonToolbar.tsx` — 重写
- `packages/designer/src/components/PageSetupDialog.tsx` — 新建
- `packages/designer/src/store/designer-store.ts` — 添加状态

**功能清单：**
- 保存：`JSON.stringify(template)` + 下载
- 页面设置：弹窗编辑页面尺寸、方向、边距
- 视图开关：网格显示、标尺显示、参照线显示、吸附到网格（4个toggle）
- 组件插入：下拉菜单选择组件类型，点击画布放置
- 边框：4边独立控制（样式/颜色），快速预设（全边框、无边框等）
- 缩放预设：50%, 75%, 100%, 150%, 200%, 适应页宽, 适应整页
- 预览：切换到 Viewer 模式
- 剪切：Ctrl+X

### Task F: 表达式编辑弹窗

**目标：** 专业表达式编辑器，含字段选择器和函数列表

**文件：**
- `packages/designer/src/components/ExpressionEditor.tsx` — 新建
- `packages/designer/src/components/FieldPicker.tsx` — 新建

**功能：**
- 弹窗式编辑器（Modal）
- 左侧：字段选择器树（数据源→字段），点击插入到光标位置
- 右侧：函数分类列表（字符串/数值/日期/逻辑/聚合），点击插入
- 中间：文本输入区域
- 底部：实时预览（用示例数据求值）
- 支持 `{DataSource.Field}` 语法高亮

### Task G: Band 管理 + 页面设置

**目标：** 可视化管理 Band 和页面

**文件：**
- `packages/designer/src/components/BandManager.tsx` — 新建
- `packages/designer/src/components/PageSetupDialog.tsx` — 新建
- `packages/core/src/command-engine/index.ts` — 注册 add-band, remove-band, reorder-band

**Band 操作：**
- 添加 Band：选择类型 → 插入到指定位置
- 删除 Band：右键菜单或工具栏
- Band 排序：上下移动
- Band 数据源绑定

**页面设置：**
- 页面尺寸：A4/Letter/自定义
- 方向：纵向/横向
- 边距：上下左右
- 列数和列间距

### Task H: 线条/形状/页码/日期组件

**目标：** 补充常用组件类型

**文件：**
- `packages/core/src/template-model/types.ts` — 添加类型
- `packages/designer/src/components/Canvas.tsx` — 渲染
- `packages/designer/src/components/LeftPanel.tsx` — 面板

**新增组件：**
- Line: { x1, y1, x2, y2, color, width, style }
- Shape: { shapeType: 'rectangle'|'ellipse'|'roundRect'|'triangle', fillColor, borderColor, borderWidth }
- PageNumber: { format: '1'|'1/N'|'Page 1 of N', font }
- DateTime: { format: 'yyyy-MM-dd HH:mm:ss', font }

### Task I: 拖拽增强 + 交互细节

**目标：** 拖拽时的视觉反馈和尺寸提示

**文件：**
- `packages/designer/src/components/Canvas.tsx` — 修改

**功能：**
- 拖拽时显示尺寸提示框（宽×高 mm）
- Resize 时显示尺寸提示
- 拖拽时半透明预览
- 空格+拖拽平移画布
- Tab 键切换选中组件
- 缩放预设：适应页宽 `zoom = containerWidth / pageWidth`，适应整页 `zoom = min(containerWidth/pageWidth, containerHeight/pageHeight)`

### Task J: 条件格式

**目标：** 基于条件的样式覆盖

**文件：**
- `packages/core/src/template-model/types.ts` — ConditionRule 已定义
- `packages/designer/src/components/ConditionRuleEditor.tsx` — 新建
- `packages/designer/src/components/PropertyEditor.tsx` — 添加入口

**功能：**
- 条件规则列表管理
- 每条规则：条件表达式 + 样式覆盖（字体颜色/背景色/粗体等）
- 渲染时按条件应用

---

## 四、实现顺序

```
Phase 1 (P0): 核心交互补全
  Task A: 参照线系统 + 吸附开关
  Task B: 组件对齐/大小/层级
  Task C: 属性面板完善
  Task D: 数据绑定 + 字段拖拽
  Task E: 工具栏功能实现

Phase 2 (P1): 重要功能
  Task F: 表达式编辑弹窗
  Task G: Band 管理 + 页面设置
  Task H: 线条/形状/页码/日期组件
  Task I: 拖拽增强 + 交互细节
  Task J: 条件格式

Phase 3 (P2): 完善体验
  Task K: 计算字段 + 参数
  Task L: 导出增强 (Excel/HTML/图片)
  Task M: 组件组合/锁定
  Task N: 超链接 + 可见性条件

Phase 4 (P3): 高级功能
  Task O: 图表组件
  Task P: 交叉表组件
  Task Q: 数据源关系
  Task R: 样式主题系统
```

---

## 五、参照线实现方案（详细）

参照线是之前尝试失败的功能，需要特别详细的方案。

### 核心设计原则

1. **参照线渲染在 page 外层**，不受 `transform: scale(zoom)` 影响
2. **坐标存储为 mm**，渲染时乘以 zoom 转换为视觉像素
3. **拖拽计算使用 `pageRef.getBoundingClientRect()`**，这个返回的是经过 scale 后的视觉尺寸

### 渲染位置

```
containerRef (滚动容器)
  └─ inner wrapper (position: relative)
       ├─ Ruler (水平)
       ├─ Ruler (垂直)
       ├─ pageRef (transform: scale(zoom), transformOrigin: top left)
       │    ├─ bands
       │    └─ components
       └─ 参照线层 (position: absolute, 覆盖 page 区域, pointer-events: none)
            ├─ 水平参照线 (pointer-events: auto on the line itself)
            └─ 垂直参照线
```

### 坐标转换

```
// mm → 视觉像素（用于渲染参照线位置）
visualPx = mmToPx(positionMm) * zoom + pageMarginLeft

// 鼠标 → mm（用于拖拽时计算位置）
const pageRect = pageRef.current.getBoundingClientRect()
const visualPx = e.clientY - pageRect.top  // 水平参照线
const actualPx = visualPx / zoom           // 反算回未缩放
const mm = pxToMm(actualPx)                // 转为 mm
```

### 交互流程

1. **mousedown on ruler** → 创建一条参照线，初始位置为鼠标对应位置
2. **mousemove** → 参照线跟随鼠标移动（实时计算 mm 位置）
3. **mouseup** → 如果 positionMm < 0 或超出页面，删除；否则固定
4. **mousedown on existing guide** → 进入拖拽模式
5. **double-click on guide** → 删除
6. **吸附** → moveComponent 时检查所有 userGuideLines，position 在阈值内则吸附

### Mode 扩展

```typescript
| { type: 'guide-drag'; guideId: string; dir: 'horizontal' | 'vertical' }
```

### Store 扩展

```typescript
userGuideLines: { id: string; dir: 'horizontal' | 'vertical'; positionMm: number }[]
addGuideLine: (dir, positionMm) => void
removeGuideLine: (id: string) => void
updateGuideLine: (id: string, positionMm: number) => void
snapToGrid: boolean
showGrid: boolean
showRulers: boolean
showGuideLines: boolean
```
