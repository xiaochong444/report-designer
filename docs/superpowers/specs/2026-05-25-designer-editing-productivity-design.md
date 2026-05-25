# Designer Editing Productivity Design

日期：2026-05-25

## 目标

本阶段补齐设计器常用编辑生产力能力，让用户可以在画布上高效完成组件选择、复制、删除、移动、调整尺寸、对齐、分布和层级调整。吸附线、网格吸附、边距吸附暂不纳入本阶段。

## 范围

本阶段包含：

- 多选与框选的验收加固。
- 复制、剪切、粘贴、复制一份、删除。
- 键盘方向键微调，Shift + 方向键调整尺寸。
- Ctrl+A 全选当前页组件。
- Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z 撤销重做。
- 左、水平居中、右、上、垂直居中、下对齐。
- 等宽、等高、等尺寸。
- 水平分布、垂直分布。
- 置于顶层、置于底层。
- Home Ribbon 增加可见的图标化入口。
- 中英文文案与测试覆盖。

本阶段不包含：

- 自动吸附、参考线吸附、网格吸附。
- 跨 Band 拖拽改变所属 Band。
- 组件组合/取消组合。
- 锁定对象、锚定布局。
- 真实系统剪贴板互通。

## 现状与原则

现有代码已经有 `selectedComponentIds`、框选、多选、快捷键、剪贴板、对齐、分布、尺寸、层级等基础能力。问题主要集中在产品化程度：Ribbon 入口不完整，部分操作未进入命令历史，分布算法更像按左上点均匀排列而不是按对象间距均匀分布，测试覆盖不足。

本阶段不重写画布事件模型，只补齐现有 store action 的合同和 UI 入口。所有会改变模板结构或组件几何的操作必须通过 `CommandDispatcher` 记录，保证 Undo/Redo 可用。

## 行为设计

### 选择

- 单击组件：选中该组件。
- Ctrl/Command + 单击组件：切换该组件是否在当前选择中。
- 空白处拖拽：框选与框选区域相交的组件。
- Ctrl/Command + A：选中当前页所有组件。

### 剪贴板

- Ctrl/Command + C：复制当前选中组件到设计器内部剪贴板。
- Ctrl/Command + X：复制并删除当前选中组件。
- Ctrl/Command + V：把剪贴板组件粘贴到当前 Band；如果当前选中组件存在，则粘贴到第一个选中组件所在 Band，否则粘贴到当前页第一个 Data Band，再否则粘贴到当前页第一个 Band。
- Ctrl/Command + D：复制一份，并选中新组件。
- Delete / Backspace：删除当前选中组件。
- 粘贴组件默认偏移 5mm，重新生成 id 和名称，避免报表树重名。

### 微调与尺寸

- 方向键：移动 1mm。
- Alt + 方向键：移动 0.5mm。
- Ctrl/Command + 方向键：移动 5mm。
- Shift + 方向键：按同样步长调整宽高，最小尺寸 1mm。

### 对齐、分布、尺寸

对齐/分布/尺寸操作只对同一个 Band 内至少两个选中组件生效；若选中对象跨 Band，则按 Band 分组分别执行。

- 左对齐：所有组件 `x` 等于组内最小 `x`。
- 水平居中：所有组件中心点等于组内边界盒水平中心。
- 右对齐：所有组件右边等于组内最大右边。
- 上对齐：所有组件 `y` 等于组内最小 `y`。
- 垂直居中：所有组件中心点等于组内边界盒垂直中心。
- 下对齐：所有组件底边等于组内最大底边。
- 水平分布：保留最左和最右对象位置，按对象实际宽度计算中间空隙，使对象间距相等。
- 垂直分布：保留最上和最下对象位置，按对象实际高度计算中间空隙，使对象间距相等。
- 等宽、等高、等尺寸：以当前选择顺序里的第一个组件作为基准。

### 层级

- 置于顶层：所选组件的 `zOrder` 提升到同 Band 当前最大层级之后，并保持多选对象间的相对顺序。
- 置于底层：所选组件的 `zOrder` 降低到同 Band 当前最小层级之前，并保持多选对象间的相对顺序。

## UI 设计

Home Ribbon 中新增/完善这些工具组：

- 剪贴板：复制、剪切、粘贴、复制一份、删除，尽量使用图标按钮和 tooltip。
- 排列：置于顶层、置于底层。
- 对齐：左、水平居中、右、上、垂直居中、下。
- 分布：水平分布、垂直分布。
- 尺寸：等宽、等高、等尺寸。

按钮在选中数量不足时禁用：

- 复制、剪切、删除、复制一份、层级：至少 1 个组件。
- 对齐、尺寸：至少 2 个组件。
- 分布：至少 3 个组件。
- 粘贴：剪贴板非空。

## 数据与状态

继续使用 `selectedComponentIds` 和内部 `clipboard`。新增或修正 store action 时优先复用现有 `CommandDispatcher` 命令：

- `remove-component`
- `add-component`
- `move-component`
- `update-component`
- `align-components`
- `size-components`
- `bring-to-front`
- `send-to-back`

对于批量删除、粘贴、方向键移动、尺寸微调，需要确保每个变更都进入命令历史。可接受多组件操作拆成多条命令，但一次用户操作后 Undo 应能逐步还原，且不会破坏模板结构。

## 测试设计

新增 designer 聚焦测试：

- `phase-38-editing-productivity-store.test.ts`：覆盖 store 操作和 Undo/Redo。
- `phase-38-editing-productivity-ribbon.test.tsx`：覆盖 Ribbon 按钮可见、禁用状态、点击后状态变化和英文文案。
- `phase-38-editing-productivity-canvas.test.tsx`：覆盖快捷键和框选/多选关键路径。

继续运行已有快捷键、画布布局、报表树和属性面板测试，防止回归。

## 验收标准

- 多选、框选、快捷键、剪贴板、对齐、分布、尺寸、层级操作都有测试。
- 会改变模板的操作支持 Undo/Redo。
- Home Ribbon 中能直接看到并使用本阶段常用工具。
- 中英文文案完整。
- `pnpm --filter @report-designer/designer test -- phase-38-editing-productivity-store.test.ts phase-38-editing-productivity-ribbon.test.tsx phase-38-editing-productivity-canvas.test.tsx` 通过。
- `pnpm --filter @report-designer/designer build` 通过。
