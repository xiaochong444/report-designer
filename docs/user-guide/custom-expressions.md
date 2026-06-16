# Custom Variables and Functions

Report Designer separates expression authoring from runtime execution:

- `expressionExtensions` is passed to `Designer`. It enriches the expression editor with custom function metadata, system variables, and format snippets.
- `expressionVariables` and `expressionFunctions` are passed to `Viewer`, `renderReport`, or print/PDF rendering. They provide the actual runtime values and function implementations.

Use both sides together so designers can discover the extension in the UI and rendered reports can evaluate it.

## Custom Variables

Custom variables are values injected by the host application, such as tenant name, current user, store ID, feature flags, or business date.

```tsx
const expressionVariables = {
  TenantName: 'Demo Tenant',
  StoreCode: 'SH-001',
};

<Viewer
  template={template}
  data={data}
  expressionVariables={expressionVariables}
/>
```

Use variables in expressions with braces:

```ts
'Tenant: ' + {TenantName}
IF({StoreCode} = 'SH-001', 'Shanghai', 'Other')
```

To make variables appear in the designer expression editor, register them in `expressionExtensions.variables`:

```ts
import type { ExpressionCatalogExtensions } from '@report-designer/designer';

export const expressionExtensions: ExpressionCatalogExtensions = {
  variables: [
    {
      name: '{TenantName}',
      description: {
        'en-US': 'Current tenant name injected by the host application.',
        'zh-CN': '当前租户名称，由宿主系统注入。',
      },
      previewValue: 'Demo Tenant',
    },
  ],
};

<Designer
  template={template}
  data={data}
  expressionExtensions={expressionExtensions}
/>
```

## Custom Functions

Custom functions are useful for host-specific calculations, masking, permissions, localization, and domain formatting.

```ts
import type { BuiltinFunction } from '@report-designer/core';

export const expressionFunctions: Record<string, BuiltinFunction> = {
  DISCOUNT: ([price, rate]) => Number(price) * Number(rate),
  MASKPHONE: ([phone]) => String(phone ?? '').replace(/^(\d{3})\d{4}(\d+)$/, '$1****$2'),
};
```

Pass the runtime functions to preview, print, and PDF rendering:

```tsx
<Viewer
  template={template}
  data={data}
  expressionVariables={expressionVariables}
  expressionFunctions={expressionFunctions}
/>
```

Use functions in expressions:

```ts
DISCOUNT({items.amount}, 0.9)
MASKPHONE({customer.phone})
```

## Designer Catalog Metadata

Register function metadata so the expression editor can show completions, descriptions, and insert snippets:

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
        'en-US': 'Calculates a discounted amount by rate.',
        'zh-CN': '按折扣率计算折后金额。',
      },
      examples: ['DISCOUNT({items.amount}, 0.9)'],
      evaluate: ([price, rate]) => Number(price) * Number(rate),
    },
  ],
  variables: [
    {
      name: '{TenantName}',
      description: {
        'en-US': 'Current tenant name injected by the host application.',
        'zh-CN': '当前租户名称，由宿主系统注入。',
      },
      previewValue: 'Demo Tenant',
    },
  ],
};
```

If a function includes `evaluate`, the designer preview can use it. For production preview and print, still pass `expressionFunctions` to the `Viewer` or `renderReport` call.

## End-to-End Example

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
      'en-US': 'Masks the middle four digits of a phone number.',
      'zh-CN': '隐藏手机号中间四位。',
    },
    examples: ['MASKPHONE({customer.phone})'],
    evaluate: ([phone]) => String(phone ?? '').replace(/^(\d{3})\d{4}(\d+)$/, '$1****$2'),
  }],
  variables: [{
    name: '{TenantName}',
    description: {
      'en-US': 'Current tenant name.',
      'zh-CN': '当前租户名称。',
    },
    previewValue: 'Demo Tenant',
  }],
};

const expressionFunctions: Record<string, BuiltinFunction> = {
  MASKPHONE: ([phone]) => String(phone ?? '').replace(/^(\d{3})\d{4}(\d+)$/, '$1****$2'),
};

const expressionVariables = {
  TenantName: 'Demo Tenant',
};

<Designer template={template} data={data} expressionExtensions={expressionExtensions} />
<Viewer template={template} data={data} expressionFunctions={expressionFunctions} expressionVariables={expressionVariables} />
```

## Notes

- Function names are normalized to uppercase at runtime.
- Variable names are referenced without a data source, for example `{TenantName}`.
- Keep function implementations deterministic; rendering may evaluate expressions multiple times for preview, print, and PDF.
- Do not put secrets directly into expression variables. Treat rendered output as user-visible.

