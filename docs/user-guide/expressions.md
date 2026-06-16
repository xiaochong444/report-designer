# Expressions

Expressions are string-based formulas used throughout Report Designer to compute values dynamically. They power text content, visibility conditions, filter expressions, and more.

## Syntax

Expressions are plain strings evaluated at render time. The expression engine supports:

### Literals

| Type | Example |
| --- | --- |
| Number | `42`, `3.14`, `-100` |
| String | `'hello'`, `"world"` |
| Boolean | `true`, `false` |
| Null | `null` |

### Field References

Reference data source fields using the format `{field.path}`:

```
{customer.name}
{items.amount}
{items.orderDate}
```

Nested field access is also supported:

```
{customer.address.city}
{items.name}
```

### Operators

| Category | Operators | Example |
| --- | --- | --- |
| Arithmetic | `+`, `-`, `*`, `/` | `{items.quantity} * {items.price}` |
| Comparison | `==`, `!=`, `<`, `>`, `<=`, `>=` | `{items.amount} > 1000` |
| Logical | `&&`, `||`, `!` | `{items.amount} > 0 && {items.status} == 'active'` |
| String concat | `+` | `{customer.firstName} + ' ' + {customer.lastName}` |
| Parentheses | `()` for grouping | `({items.a} + {items.b}) * {items.c}` |

### Conditional Expression

Use `IF(condition, trueValue, falseValue)` or `IIF(condition, trueValue, falseValue)`:

```
IF({items.amount} > 1000, 'VIP', 'Standard')
IF(ISNULL({items.discount}), 0, {items.discount})
```

### Nested IF

```
IF({items.status} == 'completed', 'Done', IF({items.status} == 'pending', 'Pending', 'Unknown'))
```

## Built-in Functions

### String Functions

| Function | Description | Example |
| --- | --- | --- |
| `CONCAT(a, b, ...)` | Concatenate strings | `CONCAT({customer.first}, ' ', {customer.last})` |
| `SUBSTRING(str, start, length)` | Extract substring | `SUBSTRING({items.code}, 0, 3)` |
| `UPPER(str)` | Convert to uppercase | `UPPER({items.name})` |
| `LOWER(str)` | Convert to lowercase | `LOWER({items.name})` |
| `LEN(str)` | String length | `LEN({items.name})` |
| `TRIM(str)` | Trim whitespace | `TRIM({items.name})` |
| `LEFT(str, n)` | Left n characters | `LEFT({items.code}, 2)` |
| `RIGHT(str, n)` | Right n characters | `RIGHT({items.code}, 4)` |
| `FORMAT(value, pattern)` | Format value | `FORMAT({items.amount}, '0.00')` |

### Math Functions

| Function | Description | Example |
| --- | --- | --- |
| `ABS(n)` | Absolute value | `ABS({items.amount})` |
| `ROUND(n, decimals)` | Round to decimals | `ROUND({items.amount}, 2)` |
| `FLOOR(n)` | Round down | `FLOOR({items.amount})` |
| `CEIL(n)` | Round up | `CEIL({items.amount})` |
| `MAX(a, b, ...)` | Maximum value | `MAX({items.a}, {items.b})` |
| `MIN(a, b, ...)` | Minimum value | `MIN({items.a}, {items.b})` |
| `POWER(base, exp)` | Power | `POWER({items.base}, 2)` |
| `SQRT(n)` | Square root | `SQRT({items.value})` |

### Aggregate Functions

| Function | Description | Example |
| --- | --- | --- |
| `SUM({field.path})` | Sum of all values | `SUM({items.amount})` |
| `AVG({field.path})` | Average of all values | `AVG({items.amount})` |
| `COUNT({field.path})` | Count of values | `COUNT({items.id})` |
| `COUNTDISTINCT({field.path})` | Count distinct values | `COUNTDISTINCT({items.customerId})` |
| `MIN({field.path})` | Minimum value | `MIN({items.amount})` |
| `MAX({field.path})` | Maximum value | `MAX({items.amount})` |
| `SUMIF({field.path}, condition)` | Conditional sum | `SUMIF({items.amount}, {items.status} == 'completed')` |
| `COUNTIF({field.path}, condition)` | Conditional count | `COUNTIF({items.id}, {items.status} == 'completed')` |
| `RUNNINGSUM({field.path})` | Running/cumulative sum | `RUNNINGSUM({items.amount})` |

### Date Functions

| Function | Description | Example |
| --- | --- | --- |
| `TODAY()` | Current date | `TODAY()` |
| `NOW()` | Current date and time | `NOW()` |
| `YEAR(date)` | Extract year | `YEAR({items.orderDate})` |
| `MONTH(date)` | Extract month | `MONTH({items.orderDate})` |
| `DAY(date)` | Extract day | `DAY({items.orderDate})` |
| `DATEADD(date, unit, value)` | Add to date | `DATEADD({items.date}, 'day', 7)` |
| `DATEDIFF(date1, date2)` | Difference in days | `DATEDIFF({items.shipDate}, {items.orderDate})` |

### Other Functions

| Function | Description | Example |
| --- | --- | --- |
| `ISNULL(value)` | Check if null | `ISNULL({items.discount})` |
| `COALESCE(a, b, ...)` | Return first non-null | `COALESCE({items.name}, 'N/A')` |
| `PAGE()` | Current page number | `PAGE()` |
| `TOTALPAGES()` | Total page count | `TOTALPAGES()` |
| `ROWINDEX()` | Current row index (in data band) | `ROWINDEX()` |

## Chinese Money Formatting

The expression engine includes a built-in Chinese uppercase currency formatter:

```
RMBUPPER({items.amount})
// → "壹仟贰佰元整"
```

## Page and Position Functions

These functions are available during rendering (not in the designer):

| Function | Description |
| --- | --- |
| `PAGE()` | Returns the current page number (1-based). |
| `TOTALPAGES()` | Returns the total number of pages. |
| `ROWINDEX()` | Returns the current row number within a data band (1-based). |

## Expression Editor

The designer provides an inline expression editor and a full Monaco-based expression editor:

- **Inline editor** — appears in the property panel for expression fields.
- **Monaco editor** — full-featured editor with syntax highlighting and autocomplete (accessed via the "Edit Expression" button).

### Expression Extensions

You can extend the expression editor catalog with custom variables, functions, and format snippets, and pass the matching runtime variables/functions to the viewer or renderer.

For the complete setup, see [Custom Variables and Functions](./custom-expressions.md).

## Expression Validation

Expressions are validated in the designer:

- **Syntax errors** — missing parentheses, invalid operators, etc.
- **Type mismatches** — using a string where a number is expected.
- **Unknown fields** — referencing fields not defined in the data source.

## Common Patterns

### Conditional Formatting in Expressions

```
// Show discount only if amount > 500
IF({items.amount} > 500, FORMAT({items.discount}, '0.00') + '%', '')
```

### Null Handling

```
// Show "N/A" if field is null
IF(ISNULL({items.shipDate}), 'N/A', FORMAT({items.shipDate}, 'yyyy-MM-dd'))
```

### Page Number in Footer

```
'Page ' + PAGE() + ' of ' + TOTALPAGES()
```

### Running Total

```
RUNNINGSUM({items.amount})
```
