# Atlas Viewer UI

Dashboard-style viewer for Atlas run outputs. Aligned with vendor/situation-monitor layout and components.

**Product logic**: Telegram cover card is the entry point; Web Dashboard is the primary surface. No TG preview panel in the UI.

## Parity References (vendor/situation-monitor)

Design/interaction parity with `vendor/situation-monitor`:

| Atlas component | Mirrored from | What mirrored |
|-----------------|---------------|---------------|
| `Panel.svelte` | `vendor/situation-monitor/src/lib/components/common/Panel.svelte` | Panel header, title row, count badge, loading/error states |
| `DistributionPanel.svelte` | `vendor/situation-monitor` bar-style layout | Bar chart grid, label + track + value, click-to-drill |
| `DashboardView.svelte` layout | `vendor/situation-monitor/src/lib/components/layout/Dashboard.svelte` | dashboard-grid, column layout, panel slots |
| `Header.svelte` | `vendor/situation-monitor/src/lib/components/layout/Header.svelte` | Header structure, logo, meta items, sticky top |

## New Additions (not in situation-monitor)

- **Radar Categories** (6): 技术突破、社会现象、金融与资本、政策与治理、安全事故、能源/环境
- **Civilization tags** (8 factions): Vinge/Compute, Banks/Governance, Antimemetics, TedChiang/Language, Egan, Watts, Simulation, Religion/Meaning
- **5D scoring**: Compute, Governance, Narrative, Behavior, Capability (0–2 each)
- **Chinese summary** (summary_zh): per-item ≤80 chars
- **TG cover card**: `tg_cover_card_zh.txt` artifact (for sending only; Telegram is entry point; Web Dashboard is primary surface)
- **Sources & KOL panel**: per-category recommended sources and KOLs

## 验收 Checklist (Manual)

- [ ] **首屏**：Radar Categories 左侧栏 + Sources/KOL 面板 + KPI + Civilization + Source Health + Distribution
- [ ] **栏目化**：点击 Radar Category 更新 Distribution、Drilldown 按栏目过滤
- [ ] **Items 945 条时搜索过滤不卡顿**：目标 <300ms，控制台输出 `[atlas] filter/search`、`[atlas] paginate render`（仅 debug 模式）
- [ ] **ui-smoke runs 不出现**：默认列表隐藏 ui-smoke-*，仅 ?debug=1 可见
- [ ] **缺失 civilization 文件时**：显示 "Civilization layer missing" banner，不崩溃
- [ ] **缺失 acceptance_report / audit / tg 文件时不崩溃**：显示友好提示 "Not configured" 或 "No acceptance/audit"

## 布局结构

- **Header**：Atlas Civilization Situation Monitor、run_id（可复制）、Last updated、Coverage(x/y)、Verdict、Items
- **Radar Categories**：左侧栏，6 栏目，点击筛选
- **Sources & KOL**：该栏目下推荐信源和 KOL 卡片
- **KPI Cards**：Item count、Structural (≥7)、Top civ tag、Sources、AI-only reject
- **Civilization Panel**：8 tags 条形图（structural count），点击 drill-down
- **Five-D Distribution Panel**：各 tag 的 5D 平均分
- **Source Health Panel**：每个 source 小卡，status + reason，点击 drill-down
- **Distribution Panel**：按 source 的 item 数条形图（支持栏目过滤），点击 drill-down
- **Raw items / Audit / Evidence (Advanced)**：二级 tab，Evidence 默认折叠

## Input Pack

默认目录：`environment/input_pack/`。支持 `ai_radar_sources.(pdf|txt|md|yaml|json)` 和 `ai_kols.(pdf|txt|md|yaml|json)`。可通过 `INPUT_PACK_DIR` 覆盖路径。

## 数据来源

- `/api/atlas`：runs 列表
- `/api/atlas/<run_id>/*`：render_meta.json、atlas-fetch/*、civilization/*、audit/*；rendered_text.txt、tg/* 仅在 Evidence 展开时加载

## 性能

- Items 过滤/搜索使用 `$derived.by`，分页 50 条/页
- 945+ 条时目标 <300ms，控制台有 `[atlas] filter/search` 日志
