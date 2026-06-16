# Chrome 扩展

Report Designer 提供 Chrome 扩展，用于在受控环境中把 Viewer 生成的 PDF 打印任务发送给 Chrome 打印 API。

## 架构

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Web 应用    │────▶│ Chrome 扩展      │────▶│ Chrome Printing │
│  (Viewer)    │  JS │  (Service Worker)│  PDF│ API / 打印机    │
└──────────────┘     └──────────────────┘     └─────────────────┘
```

## 组件

位于 `extensions/chrome-silent-print/`：

- **background.js** —— 接收打印请求并调用 `chrome.printing.submitJob`。
- **content-script.js** —— 在网页和扩展 Service Worker 之间转发消息。
- **manifest.json** —— 声明 `printing`、`storage` 和页面访问权限。
- **options.html / options.js** —— 配置允许发起打印请求的网页来源。

## 安装

1. 打开 Chrome，进入 `chrome://extensions/`。
2. 启用**开发者模式**。
3. 点击**加载已解压的扩展程序**，选择 `extensions/chrome-silent-print/` 目录。
4. 打开扩展选项页；如果 Web 应用不是 localhost 或 `file://`，把它的 origin 加入允许列表。
5. 通过 Chrome 打印机设置或企业管理策略配置目标打印机。

## 在 Viewer 中使用

```tsx
import { Viewer } from '@report-designer/viewer';

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

### ChromeExtensionPrintOptions

| 选项 | 类型 | 说明 |
| --- | --- | --- |
| `backend` | `'chromePrinting'` | 使用 Chrome 打印 API。默认就是该后端。 |
| `printerId` | `string` | Chrome 打印 API 或企业打印机策略中的目标打印机 ID。 |
| `copies` | `number` | 可选的打印份数。 |
| `silent` | `boolean` | 请求由扩展打印，业务页面不再打开浏览器打印对话框。 |
| `offset` | `{ xMm?: number; yMm?: number }` | 可选的打印偏移元数据。 |

## 通信通道

- **网页 -> 扩展**：`window.postMessage`，通道为 `report-designer.chrome-print`。
- **扩展 -> Chrome 打印**：使用 `chrome.printing.submitJob` 提交 PDF。
- **扩展 -> 网页**：通过 `window.postMessage` 返回打印任务结果或错误。

## 部署说明

- 旧的 Windows 打印辅助程序已不再使用。
- 如果需要零点击的业务打印，建议通过 Chrome 企业策略部署扩展和打印机配置。
- 普通桌面场景仍可以不安装扩展，直接使用浏览器打印或 PDF 导出。

## 卸载

1. 进入 `chrome://extensions/`。
2. 点击 Report Designer 扩展上的**移除**。
