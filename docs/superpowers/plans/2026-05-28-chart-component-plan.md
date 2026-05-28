# 图表组件实施计划

**Spec**：`docs/superpowers/specs/2026-05-28-chart-component-design.md`  
**目标**：用 VChart 增加基础图表组件，并完成预览、打印、PDF、设计器属性配置、示例和测试闭环。

## 阶段 1：模型和绑定

- 在 core 模板模型中增加 `ChartComponent`
- 增加图表类型、变种、绑定、图例、坐标轴、标签、外观类型
- 增加默认 normalize，兼容缺失字段
- 在 layout 中把 `ChartComponent` 转成 `RenderChart`
- 实现 JSON 数据绑定：
  - 普通数据源数组
  - 当前行内数组字段
  - 类目字段
  - 多值字段
  - 系列字段
  - 排序
  - sum/avg/count/min/max 聚合

## 阶段 2：渲染和导出

- 安装 `@visactor/react-vchart`
- viewer DOM 预览渲染 VChart
- print HTML 渲染图表静态占位和可快照内容
- PDF 导出先使用确定性矢量兜底绘制基础图形，后续可替换为 VChart 图片快照
- 保证缺字段、空数据、非法值不崩溃

## 阶段 3：设计器

- 左侧组件面板增加图表
- 画布渲染图表预览
- 属性面板增加：
  - 图表类型和变种
  - 数据源、数组路径、类目字段、值字段、系列字段
  - 排序和聚合
  - 标题、图例、坐标轴、网格、标签、调色板
  - 基础外观
- 中英文文案补齐

## 阶段 4：示例与验证

- 增加图表示例模板
- 示例默认包含柱状、折线、饼图
- 增加 core/viewer/designer 测试
- 运行 `pnpm test`
- 运行 `pnpm build`
- 运行 `git diff --check`
- 浏览器打开示例做冒烟验证
- 提交代码

## 验收标准

- 图表可以拖到画布并选中编辑
- 图表可以绑定 JSON 数据源字段
- 点、线、柱、面积、饼至少有一个可见示例
- 预览中能看到图表
- 打印 HTML 中保留图表内容
- PDF 导出不丢图表
- 中英文切换后图表相关属性不残留中文或英文

