# Phase 16: Dictionary, Band Selection, and Expression Editor Design

## Goal

Polish the designer shell so the left-side resource navigation and expression editing flow feel closer to Stimulsoft Reports. This phase focuses on high-frequency editing surfaces rather than rendering logic.

## Scope

1. Make `Band` selection a first-class interaction from both the report tree and the canvas.
2. Redesign the `Dictionary` tab into a compact searchable tree with data-source and field hierarchy.
3. Redesign the expression editor into a three-column shell:
   - left category rail
   - center large editor
   - right searchable insertion tree
4. Keep the interaction model compatible with existing JSON-only data sources and existing property editing behavior.

## Interaction Design

### Report Tree and Band Selection

- Selecting a band from the report tree must clear component selection.
- Clicking an empty area of a band on the canvas must select that band and expose band properties in the right panel.
- The property panel title must switch to `Band` when a band is selected.

### Dictionary

- Replace the loose tree and add-data button with a denser explorer-style tree.
- Provide a larger search box at the top with the placeholder `搜索数据源和字段`.
- Show top-level groups for:
  - 数据源
  - 变量
  - 系统变量
  - 函数
  - 资源
- Data fields stay draggable so they can still create bound controls on drop.

### Expression Editor

- Replace the tabs-and-quick-buttons layout with a Stimulsoft-like three-column layout.
- Left rail categories:
  - 表达式
  - 数据列
  - 系统变量
  - 聚合
  - HTML
- Center editor keeps a large text area and a lightweight validation affordance.
- Right browser shows searchable grouped items:
  - 数据源
  - 变量
  - 系统变量
  - 函数
  - 格式
  - 资源
- Switching left categories resets the right-side search so users do not land in an empty browser unintentionally.

## Compatibility Constraints

- Use current Ant Design 6 APIs only.
- Keep the existing expression insertion behavior compatible with totals, report/page aggregate helpers, and JSON field bindings.
- Do not change pagination, rendering, or print output in this phase.

## Verification

- Designer tests cover:
  - report-tree band selection
  - dictionary search filtering
  - expression editor layout and insertion flow
- Browser verification checks:
  - dictionary search field visible and filtering
  - canvas band click selects `Band`
