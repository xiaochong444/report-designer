# Report Designer

[English](./README.md) | [使用说明](./docs/user-guide/README.zh-CN.md)

Report Designer 是一个可嵌入 React 应用的报表设计器、预览器和打印/PDF 工具集。它面向业务系统里的单据、报表和打印模板：用户可以在浏览器里可视化设计模板，绑定 JSON 数据，预览分页结果，并把打印、PDF 导出或静默打印流程集成到 ERP、CRM、WMS、零售和后台管理系统中。

## 产品截图

### 设计器

![报表设计器截图](./docs/assets/designer-preview.png)

### 打印预览

![打印预览截图](./docs/assets/print-preview.png)

## 产品特点

- 可视化报表设计：提供画布、标尺、报表树、组件面板、属性面板、页眉页脚和数据带等编辑能力。
- 面向业务单据的组件能力：支持文本、富文本、表格、条码、二维码、图表、页码、水印和常见版式元素。
- 数据驱动渲染：支持 JSON 数据字典、表达式、分组、汇总、条件格式和事件脚本。
- 所见即所得的预览链路：浏览器预览、分页、打印和 PDF 输出尽量保持一致。
- 多种输出方式：支持浏览器打印、PDF 导出，并提供 Chrome 扩展打印集成方案。
- 可嵌入现有系统：核心、设计器、预览器拆分为 npm 包，可以直接集成到已有 React 产品中。
- 中英文界面：适合中文业务系统，也能覆盖中英文混合团队或国际化场景。

## 使用场景

当你的产品需要“可编辑、可预览、可打印”的业务文档时，Report Designer 会比较适合：

- ERP/WMS 单据：采购单、入库单、出库单、调拨单、拣货单、库存报表。
- 零售和会员系统：销售日报、会员消费单、收银小票、商品吊牌、价签。
- 财务和运营场景：合同模板、结算单、对账单、经营看板和业务汇总报表。
- SaaS 后台：让租户或实施人员配置自己的打印模板，不需要每次修改模板都重新发版。
- 受控桌面环境：需要 PDF 导出、浏览器打印，或需要配合 Chrome 扩展完成静默打印。

## 包结构

| 包名 | 说明 |
| --- | --- |
| `@report-designer/core` | 模板模型、数据字典、表达式引擎、分页、布局、渲染、事件、图表、表格和共享运行时能力。 |
| `@report-designer/designer` | React 可视化设计器组件和设计器状态。 |
| `@report-designer/viewer` | React 预览组件、DOM 渲染、打印辅助函数、PDF 导出和 Chrome 扩展打印集成。 |
| `@report-designer/example` | 本地 Vite 示例应用，包含多种模板和集成示例。 |

## 快速开始

```bash
pnpm install
pnpm --filter @report-designer/example dev
```

打开 Vite 输出的本地地址，选择示例模板，在预览和设计器之间切换，修改模板后返回预览即可看到渲染结果。

## 在你的应用中安装

`@report-designer/core`、`@report-designer/designer`、`@report-designer/viewer` 把 React、React DOM、Ant Design 和 Zustand 声明为 **peer dependencies（对等依赖）**，它们不会被打包进发布包，需要你在自己的应用中手动安装。这样 Report Designer 可以复用你应用已有的版本，而不是重复安装一份。

```bash
pnpm add @report-designer/core @report-designer/designer @report-designer/viewer
pnpm add react react-dom antd zustand
```

如果你只使用 `core` 包（例如在服务端渲染报表），则不需要 Ant Design 和 Zustand，只需要 `core` 和 React。

| 包名 | 必须手动安装的对等依赖 |
| --- | --- |
| `@report-designer/core` | 无 |
| `@report-designer/designer` | `react`、`react-dom`、`antd@^6`、`zustand@^5` |
| `@report-designer/viewer` | `react`、`react-dom`、`antd@^6` |

```tsx
import { useState } from 'react';
import type { ReportTemplate } from '@report-designer/core';
import { Designer } from '@report-designer/designer';
import { Viewer } from '@report-designer/viewer';

function ReportWorkspace({ initialTemplate, data }: { initialTemplate: ReportTemplate; data: unknown }) {
  const [template, setTemplate] = useState(initialTemplate);

  return (
    <>
      <Designer template={template} data={data} onTemplateChange={setTemplate} />
      <Viewer template={template} data={data} />
    </>
  );
}
```

实际接入方式取决于你的产品形态：可以只接设计器、只接预览器，也可以做成“编辑模板 -> 预览 -> 打印/PDF”的完整工作台。后续使用文档会放在 [使用说明](./docs/user-guide/README.md) 中。

## Chrome 扩展与静默打印

Report Designer 内置 Chrome 打印桥接方案，适合 Web 应用需要把打印任务发送到受控打印机、并尽量减少人工确认步骤的场景。

打印桥接方案包含：

- Chrome 扩展：[`extensions/chrome-silent-print`](./extensions/chrome-silent-print/README.md)。

典型流程：

1. 预览器把报表渲染为打印文档或 PDF 任务。
2. `@report-designer/viewer` 将任务发送给 Chrome 扩展。
3. Chrome 扩展通过 Chrome `printing` API 提交 PDF。
4. Chrome 将任务发送到配置好的打印机。

```tsx
<Viewer
  template={template}
  data={data}
  printOptions={{
    adapter: 'chrome-extension',
    chromeExtension: {
      backend: 'chromePrinting',
      printerId: 'printer-01',
      silent: true,
    },
  }}
/>
```

这条链路适合门店收银台、仓库工作站、柜台打印、企业受控桌面等组织统一管理打印机的环境。普通浏览器场景仍可以使用标准浏览器打印和 PDF 导出。

## 使用说明

- [快速上手](./docs/user-guide/getting-started.zh-CN.md)
- [设计器](./docs/user-guide/designer.zh-CN.md)
- [数据绑定](./docs/user-guide/data-binding.zh-CN.md)
- [表达式](./docs/user-guide/expressions.zh-CN.md)
- [自定义变量和函数](./docs/user-guide/custom-expressions.zh-CN.md)
- [事件脚本](./docs/user-guide/events.zh-CN.md)
- [预览与打印](./docs/user-guide/preview-and-print.zh-CN.md)
- [PDF 导出](./docs/user-guide/pdf-export.zh-CN.md)
- [Chrome 扩展](./docs/user-guide/chrome-extension.zh-CN.md)
- [静默打印](./docs/user-guide/silent-printing.zh-CN.md)
- [模板管理](./docs/user-guide/templates.zh-CN.md)
- [API 参考](./docs/user-guide/api-reference.zh-CN.md)
- [常见问题](./docs/user-guide/faq.zh-CN.md)

## 本地开发

```bash
pnpm install
pnpm build
pnpm test
```

常用包级命令：

```bash
pnpm --filter @report-designer/core test
pnpm --filter @report-designer/designer test
pnpm --filter @report-designer/viewer test
pnpm --filter @report-designer/example dev
```

## 发布状态

当前包版本为 `0.1.0`。项目正在为 GitHub 和 npm 发布做准备，第一个稳定版本发布前 API 仍可能调整。
