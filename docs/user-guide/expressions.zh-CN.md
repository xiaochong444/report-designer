# 表达式

表达式是基于字符串的公式，在 Report Designer 中广泛用于动态计算值。它们驱动文本内容、可见性条件、过滤表达式等。

## 语法

表达式是在渲染时求值的纯字符串。表达式引擎支持：

### 字面量

| 类型 | 示例 |
| --- | --- |
| 数字 | `42`、`3.14`、`-100` |
| 字符串 | `'hello'`、`"world"` |
| 布尔 | `true`、`false` |
| 空值 | `null` |

### 字段引用

使用 `{field.path}` 格式引用数据源字段：

```
{customer.name}
{items.amount}
{items.orderDate}
```

也支持嵌套字段访问：

```
{customer.address.city}
{items.name}
```

### 运算符

| 类别 | 运算符 | 示例 |
| --- | --- | --- |
| 算术 | `+`、`-`、`*`、`/` | `{items.quantity} * {items.price}` |
| 比较 | `==`、`!=`、`<`、`>`、`<=`、`>=` | `{items.amount} > 1000` |
| 逻辑 | `&&`、`||`、`!` | `{items.amount} > 0 && {items.status} == 'active'` |
| 字符串拼接 | `+` | `{customer.firstName} + ' ' + {customer.lastName}` |
| 括号 | `()` 用于分组 | `({items.a} + {items.b}) * {items.c}` |

### 条件表达式

使用 `IF(condition, trueValue, falseValue)` 或 `IIF(condition, trueValue, falseValue)`：

```
IF({items.amount} > 1000, 'VIP', 'Standard')
IF(ISNULL({items.discount}), 0, {items.discount})
```

### 嵌套 IF

```
IF({items.status} == 'completed', 'Done', IF({items.status} == 'pending', 'Pending', 'Unknown'))
```

## 内置函数

### 字符串函数

| 函数 | 说明 | 示例 |
| --- | --- | --- |
| `CONCAT(a, b, ...)` | 拼接字符串 | `CONCAT({customer.first}, ' ', {customer.last})` |
| `SUBSTRING(str, start, length)` | 提取子串 | `SUBSTRING({items.code}, 0, 3)` |
| `UPPER(str)` | 转大写 | `UPPER({items.name})` |
| `LOWER(str)` | 转小写 | `LOWER({items.name})` |
| `LEN(str)` | 字符串长度 | `LEN({items.name})` |
| `TRIM(str)` | 去除空白 | `TRIM({items.name})` |
| `LEFT(str, n)` | 左侧 n 个字符 | `LEFT({items.code}, 2)` |
| `RIGHT(str, n)` | 右侧 n 个字符 | `RIGHT({items.code}, 4)` |
| `FORMAT(value, pattern)` | 格式化值 | `FORMAT({items.amount}, '0.00')` |

### 数学函数

| 函数 | 说明 | 示例 |
| --- | --- | --- |
| `ABS(n)` | 绝对值 | `ABS({items.amount})` |
| `ROUND(n, decimals)` | 四舍五入 | `ROUND({items.amount}, 2)` |
| `FLOOR(n)` | 向下取整 | `FLOOR({items.amount})` |
| `CEIL(n)` | 向上取整 | `CEIL({items.amount})` |
| `MAX(a, b, ...)` | 最大值 | `MAX({items.a}, {items.b})` |
| `MIN(a, b, ...)` | 最小值 | `MIN({items.a}, {items.b})` |
| `POWER(base, exp)` | 幂运算 | `POWER({items.base}, 2)` |
| `SQRT(n)` | 平方根 | `SQRT({items.value})` |

### 聚合函数

| 函数 | 说明 | 示例 |
| --- | --- | --- |
| `SUM({field.path})` | 求和 | `SUM({items.amount})` |
| `AVG({field.path})` | 平均值 | `AVG({items.amount})` |
| `COUNT({field.path})` | 计数 | `COUNT({items.id})` |
| `COUNTDISTINCT({field.path})` | 去重计数 | `COUNTDISTINCT({items.customerId})` |
| `MIN({field.path})` | 最小值 | `MIN({items.amount})` |
| `MAX({field.path})` | 最大值 | `MAX({items.amount})` |
| `SUMIF({field.path}, condition)` | 条件求和 | `SUMIF({items.amount}, {items.status} == 'completed')` |
| `COUNTIF({field.path}, condition)` | 条件计数 | `COUNTIF({items.id}, {items.status} == 'completed')` |
| `RUNNINGSUM({field.path})` | 累计求和 | `RUNNINGSUM({items.amount})` |

### 日期函数

| 函数 | 说明 | 示例 |
| --- | --- | --- |
| `TODAY()` | 当前日期 | `TODAY()` |
| `NOW()` | 当前日期和时间 | `NOW()` |
| `YEAR(date)` | 提取年份 | `YEAR({items.orderDate})` |
| `MONTH(date)` | 提取月份 | `MONTH({items.orderDate})` |
| `DAY(date)` | 提取日期 | `DAY({items.orderDate})` |
| `DATEADD(date, unit, value)` | 日期加减 | `DATEADD({items.date}, 'day', 7)` |
| `DATEDIFF(date1, date2)` | 天数差 | `DATEDIFF({items.shipDate}, {items.orderDate})` |

### 其他函数

| 函数 | 说明 | 示例 |
| --- | --- | --- |
| `ISNULL(value)` | 检查是否为空 | `ISNULL({items.discount})` |
| `COALESCE(a, b, ...)` | 返回第一个非空值 | `COALESCE({items.name}, 'N/A')` |
| `PAGE()` | 当前页码 | `PAGE()` |
| `TOTALPAGES()` | 总页数 | `TOTALPAGES()` |
| `ROWINDEX()` | 当前行号（在数据带中） | `ROWINDEX()` |

## 中文金额格式化

表达式引擎内置了中文大写金额转换器：

```
RMBUPPER({items.amount})
// → "壹仟贰佰元整"
```

## 页面和位置函数

这些函数在渲染时可用（在设计器中不可用）：

| 函数 | 说明 |
| --- | --- |
| `PAGE()` | 返回当前页码（从 1 开始）。 |
| `TOTALPAGES()` | 返回总页数。 |
| `ROWINDEX()` | 返回数据带内的当前行号（从 1 开始）。 |

## 表达式编辑器

设计器提供内联表达式编辑器和完整的 Monaco 表达式编辑器：

- **内联编辑器** —— 出现在属性面板的表达式字段中。
- **Monaco 编辑器** —— 功能完整的编辑器，带语法高亮和自动补全（通过"编辑表达式"按钮访问）。

### 表达式扩展

你可以扩展表达式编辑器目录，加入自定义变量、自定义函数和格式片段，并把对应的运行时变量/函数传给 Viewer 或渲染流程。

完整配置方式请查看[自定义变量和函数](./custom-expressions.zh-CN.md)。

## 表达式验证

表达式在设计器中进行验证：

- **语法错误** —— 缺少括号、无效运算符等。
- **类型不匹配** —— 在需要数字的地方使用了字符串。
- **未知字段** —— 引用了数据源中未定义的字段。

## 常见模式

### 表达式中的条件格式

```
// 仅当金额 > 500 时显示折扣
IF({items.amount} > 500, FORMAT({items.discount}, '0.00') + '%', '')
```

### 空值处理

```
// 如果字段为空则显示 "N/A"
IF(ISNULL({items.shipDate}), 'N/A', FORMAT({items.shipDate}, 'yyyy-MM-dd'))
```

### 页脚中的页码

```
'Page ' + PAGE() + ' of ' + TOTALPAGES()
```

### 累计求和

```
RUNNINGSUM({items.amount})
```
