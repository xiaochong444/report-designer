# 自定义变量和函数

Report Designer 将表达式的“编辑体验”和“运行时求值”分开处理：

- `expressionExtensions` 传给 `Designer`，用于扩展表达式编辑器里的自定义函数元数据、系统变量和格式片段。
- `expressionVariables` 和 `expressionFunctions` 传给 `Viewer`、`renderReport` 或打印/PDF 渲染流程，提供真正参与求值的变量值和函数实现。

建议两侧一起配置：设计人员能在 UI 中发现扩展项，报表预览、打印和导出时也能正确求值。

## 自定义变量

自定义变量由宿主系统注入，适合放租户名称、当前用户、门店编号、功能开关、业务日期等上下文。

```tsx
const expressionVariables = {
  TenantName: '演示租户',
  StoreCode: 'SH-001',
};

<Viewer
  template={template}
  data={data}
  expressionVariables={expressionVariables}
/>
```

在表达式里用花括号引用变量：

```ts
'租户：' + {TenantName}
IF({StoreCode} = 'SH-001', '上海', '其他')
```

如果希望变量出现在设计器表达式编辑器中，还需要注册到 `expressionExtensions.variables`：

```ts
import type { ExpressionCatalogExtensions } from '@report-designer/designer';

export const expressionExtensions: ExpressionCatalogExtensions = {
  variables: [
    {
      name: '{TenantName}',
      description: {
        'zh-CN': '当前租户名称，由宿主系统注入。',
        'en-US': 'Current tenant name injected by the host application.',
      },
      previewValue: '演示租户',
    },
  ],
};

<Designer
  template={template}
  data={data}
  expressionExtensions={expressionExtensions}
/>
```

## 自定义函数

自定义函数适合处理业务计算、脱敏、权限判断、本地化和领域格式化。

```ts
import type { BuiltinFunction } from '@report-designer/core';

export const expressionFunctions: Record<string, BuiltinFunction> = {
  DISCOUNT: ([price, rate]) => Number(price) * Number(rate),
  MASKPHONE: ([phone]) => String(phone ?? '').replace(/^(\d{3})\d{4}(\d+)$/, '$1****$2'),
};
```

把运行时函数传给预览、打印和 PDF 渲染：

```tsx
<Viewer
  template={template}
  data={data}
  expressionVariables={expressionVariables}
  expressionFunctions={expressionFunctions}
/>
```

在表达式中调用函数：

```ts
DISCOUNT({items.amount}, 0.9)
MASKPHONE({customer.phone})
```

## 设计器目录元数据

注册函数元数据后，表达式编辑器可以显示自动补全、说明和插入片段：

```ts
export const expressionExtensions: ExpressionCatalogExtensions = {
  functions: [
    {
      name: 'DISCOUNT',
      category: 'number',
      signature: 'DISCOUNT(price, rate)',
      detail: 'DISCOUNT(price, rate)',
      insertText: 'DISCOUNT(${1:price}, ${2:rate})',
      description: {
        'zh-CN': '按折扣率计算折后金额。',
        'en-US': 'Calculates a discounted amount by rate.',
      },
      examples: ['DISCOUNT({items.amount}, 0.9)'],
      evaluate: ([price, rate]) => Number(price) * Number(rate),
    },
  ],
  variables: [
    {
      name: '{TenantName}',
      description: {
        'zh-CN': '当前租户名称，由宿主系统注入。',
        'en-US': 'Current tenant name injected by the host application.',
      },
      previewValue: '演示租户',
    },
  ],
};
```

如果函数提供了 `evaluate`，设计器预览可以使用它。正式预览、打印和导出时，仍建议把 `expressionFunctions` 传给 `Viewer` 或 `renderReport`。

## 完整示例

```tsx
import { Designer } from '@report-designer/designer';
import { Viewer } from '@report-designer/viewer';
import type { BuiltinFunction } from '@report-designer/core';
import type { ExpressionCatalogExtensions } from '@report-designer/designer';

const expressionExtensions: ExpressionCatalogExtensions = {
  functions: [{
    name: 'MASKPHONE',
    category: 'text',
    signature: 'MASKPHONE(phone)',
    detail: 'MASKPHONE(phone)',
    insertText: 'MASKPHONE(${1:phone})',
    description: {
      'zh-CN': '隐藏手机号中间四位。',
      'en-US': 'Masks the middle four digits of a phone number.',
    },
    examples: ['MASKPHONE({customer.phone})'],
    evaluate: ([phone]) => String(phone ?? '').replace(/^(\d{3})\d{4}(\d+)$/, '$1****$2'),
  }],
  variables: [{
    name: '{TenantName}',
    description: {
      'zh-CN': '当前租户名称。',
      'en-US': 'Current tenant name.',
    },
    previewValue: '演示租户',
  }],
};

const expressionFunctions: Record<string, BuiltinFunction> = {
  MASKPHONE: ([phone]) => String(phone ?? '').replace(/^(\d{3})\d{4}(\d+)$/, '$1****$2'),
};

const expressionVariables = {
  TenantName: '演示租户',
};

<Designer template={template} data={data} expressionExtensions={expressionExtensions} />
<Viewer template={template} data={data} expressionFunctions={expressionFunctions} expressionVariables={expressionVariables} />
```

## 注意事项

- 运行时会把函数名规范化为大写。
- 变量不带数据源前缀，例如 `{TenantName}`。
- 函数实现应保持确定性；预览、打印和 PDF 导出可能多次求值。
- 不要把敏感信息直接放入表达式变量，渲染结果默认对用户可见。

