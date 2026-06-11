# Postman Frontend Web UI — Design Document

---

## Overview

**Product:** Postman — API development and testing platform  
**Audience:** Backend engineers, QA engineers, API designers, DevOps teams  
**Page's single job:** Give developers a powerful but legible workspace to build, test, and document APIs — structured like an IDE, navigable like a browser.

---

## Design Tokens

### Color Palette

| Role | Name | Hex |
|---|---|---|
| Background | Deep Slate | `#1A1A2E` |
| Surface | Panel Surface | `#16213E` |
| Elevated Surface | Card / Modal | `#0F3460` |
| Primary Accent | Tangerine Orange | `#E94560` |
| Secondary Accent | Electric Violet | `#7B2FBE` |
| Success / 2xx | Mint Green | `#29C76F` |
| Warning / 4xx | Amber | `#F5A623` |
| Error / 5xx | Crimson | `#E94560` |
| Foreground Primary | Soft White | `#EAEAEA` |
| Foreground Secondary | Slate Gray | `#9AA5B4` |
| Border | Quiet Line | `#2D3748` |

> **Palette rationale:** Postman's orange brand is well-known, but here the accent is pushed toward tangerine-red (`#E94560`) — distinct from any REST-client default palette. The navy base (`#1A1A2E → #16213E`) gives depth and avoids the flat charcoal most dev-tool UIs default to. The violet secondary creates a clear two-accent system: orange for active state / danger, violet for collections / environments.

---

### Typography

| Role | Typeface | Weight / Size |
|---|---|---|
| Headlines / Workspace Title | `DM Sans` | Bold, 22–32px |
| UI Labels / Nav / Tabs | `DM Sans` | Medium, 13–15px |
| Request / Response Body | `Cascadia Code` | Regular, 13px, ligatures on |
| Status Codes / Methods | `DM Mono` | SemiBold, 12px, uppercase |
| Metadata / Timestamps | `DM Sans` | Regular, 11px, `#9AA5B4` |

> **Type rationale:** `DM Sans` is geometric and neutral enough to not compete with dense API data, but has more personality than Inter at large sizes. `Cascadia Code` for request bodies gives the code areas a distinct register from the chrome. `DM Mono` caps for HTTP methods (GET, POST) creates reliable visual anchors that read instantly.

---

## Layout System

### Grid

- Base grid: **flexible 3-pane layout** (Sidebar / Request panel / Response panel)
- Left sidebar: `240px` fixed (collections, history, environments)
- Center pane: `~45%` flexible (request builder)
- Right pane: `~45%` flexible (response viewer)
- Gutter: `0` between panes (resizable dividers)
- Spacing scale: `4 / 8 / 12 / 16 / 24 / 32 / 48px`

### ASCII Wireframe — Main Workspace

```
┌─────────────────────────────────────────────────────────────────┐
│  ■ POSTMAN   [Workspaces ▾] [Explore]  [New] [Import]  [@user]  │  ← Topnav (52px)
├────────────┬────────────────────────────┬────────────────────────┤
│ Sidebar    │  Request Builder           │  Response Viewer        │
│ ─────────  │  ─────────────────────    │  ────────────────────   │
│ Collections│  [GET ▾] https://api…  [Send]  Status: 200 OK 142ms │
│ ├ Users API│                            │  ─────────────────────  │
│ │ ├ GET /  │  Params  Headers  Body     │  Body  Headers  Cookies │
│ │ ├ POST / │  ─────────────────────    │  ─────────────────────  │
│ │ └ PUT /  │  Key          Value        │  {                      │
│ ├ Auth     │  ──────────── ──────────   │    "id": 1,             │
│ │ └ /login │  Authorization  Bearer…   │    "name": "Alice",     │
│            │                            │    "role": "admin"      │
│ Environments│  ─────────────────────── │  }                      │
│ ─────────  │  Body (raw JSON)           │                         │
│ Dev  ●     │  {                         │  ─────────────────────  │
│ Staging    │    "email": "a@b.com"      │  Time: 142ms            │
│ Production │  }                         │  Size: 320 B            │
└────────────┴────────────────────────────┴────────────────────────┘
```

### ASCII Wireframe — Collection Runner

```
┌─────────────────────────────────────────────────────────────────┐
│  ◀ Back to Workspace          Collection Runner                 │
├─────────────────────────────────────────────────────────────────┤
│  Users API                    Run Order               [Run ▶]   │
│  ─────────────────────────    ─────────────────────────────     │
│  Environment:  Dev ▾          ☑ GET /users                      │
│  Iterations:   [ 5 ]          ☑ POST /users                     │
│  Delay (ms):   [ 200 ]        ☑ PUT /users/:id                  │
│                               ☑ DELETE /users/:id               │
│  Data file: [Choose file]                                        │
├─────────────────────────────────────────────────────────────────┤
│  Results                                                         │
│  ● GET /users         200 OK   ✓ 3 tests passed    141ms        │
│  ● POST /users        201 OK   ✓ 2 tests passed     98ms        │
│  ✗ PUT /users/:id     404 Not Found  ✗ 1 test failed  55ms      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### Top Navigation Bar
- **Height:** 52px
- **Background:** `#0F3460`
- **Logo:** Postman icon + wordmark, `#EAEAEA`
- **Workspace switcher:** pill button, `#16213E` bg, `#2D3748` border, `DM Sans Medium`
- **[New] button:** `#E94560` background, white text, `6px` radius

### Left Sidebar
- **Width:** `240px`, resizable to `180px–320px`
- **Background:** `#16213E`
- **Section headers:** `DM Sans Medium`, `10px`, uppercase, `#9AA5B4`, `8px` letter-spacing
- **Collection items:** `36px` row height, `DM Sans Regular 13px`
  - Hover: `#1A1A2E` background
  - Active: left border `3px solid #7B2FBE`, text `#EAEAEA`
- **Folder expand/collapse:** `8px` chevron icon, `200ms` rotation transition

### HTTP Method Badge

| Method | Background | Text |
|---|---|---|
| GET | `#1a3a2e` | `#29C76F` |
| POST | `#1e2a1a` | `#84CC16` |
| PUT | `#2a1f1a` | `#F5A623` |
| PATCH | `#2a1e1a` | `#FB923C` |
| DELETE | `#3a1a1a` | `#E94560` |

- Font: `DM Mono SemiBold`, 11px, uppercase
- Padding: `3px 8px`, border-radius `4px`
- Width: `56px` fixed (prevents layout shift when switching methods)

### URL Bar
- **Background:** `#0D1117` (distinct from panel — signals "input zone")
- **Border:** `1px solid #2D3748`, focus `#7B2FBE`
- **Height:** `36px`, radius `6px`
- **[Send] button:** `#E94560`, width `80px`, `DM Sans SemiBold`
- **Method dropdown:** attached left, `#1A1A2E`, `1px solid #2D3748`

### Request / Response Tabs
- Tab bar height: `36px`, `background: #16213E`
- Active tab: `border-bottom: 2px solid #E94560`, text `#EAEAEA`
- Inactive tab: `#9AA5B4`, hover `#EAEAEA`
- Tabs: Params, Headers, Body, Auth, Pre-request Script, Tests

### Response Status Pill

| Status Range | Color |
|---|---|
| 2xx | `#29C76F` |
| 3xx | `#F5A623` |
| 4xx | `#FB923C` |
| 5xx | `#E94560` |

- Font: `DM Mono SemiBold`, 12px
- Format: `200 OK · 142 ms · 320 B`
- Positioned top-right of response panel

### JSON Viewer (Response Body)
- Background: `#0D1117`
- Line numbers: `#4A5568`, 40px gutter
- Key color: `#7B2FBE` (violet — matches environments accent)
- String value: `#29C76F`
- Number / boolean: `#F5A623`
- Null: `#E94560`
- Collapse toggles: `▶ / ▼` inline, `10px`

### Resizable Pane Dividers
- `4px` wide hit area, `2px` visible line `#2D3748`
- Hover: line color `#7B2FBE`, cursor `col-resize`
- No label — behavior is discoverable by convention

---

## Buttons

| Variant | Background | Border | Text |
|---|---|---|---|
| Primary (Send) | `#E94560` | none | `#FFFFFF` |
| Secondary | `#16213E` | `#2D3748` | `#EAEAEA` |
| Ghost | transparent | `#2D3748` | `#9AA5B4` |
| Destructive | `#3a1a1a` | `#E94560` | `#E94560` |
| Environment | `#2a1e3a` | `#7B2FBE` | `#C084FC` |

- Border radius: `6px`
- Focus ring: `2px solid #7B2FBE`, `2px offset`

---

## Signature Element

**Semantic color per HTTP method — carried throughout the entire workspace.**  
The GET / POST / PUT / DELETE method colors are not confined to the badge: they bleed into the tab indicator, the active sidebar item border, and the response status context. When you run a DELETE request, the entire active row in the sidebar takes on a subtle crimson left-border. The effect is a workspace that speaks the language of HTTP natively — color isn't decoration, it's protocol.

---

## Motion & Interaction

| Trigger | Behavior | Duration |
|---|---|---|
| [Send] button click | spinner replaces label, response fades in | `200ms` |
| Sidebar folder toggle | height animation, chevron rotation | `150ms ease` |
| Pane resize drag | live layout reflow | `0ms` (instant) |
| Tab switch | underline slides | `120ms ease` |
| Environment switch | toast confirmation, variable values refresh | `250ms` |
| Test pass / fail row | checkmark / X icon fades in with color | `180ms` |

---

## Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| `> 1440px` | Full 3-pane layout |
| `1024px – 1440px` | Response panel collapses to tab below request |
| `768px – 1024px` | Sidebar collapses to icon rail |
| `< 768px` | Single pane, tabbed navigation between collections / request / response |

> Postman is primarily a desktop tool. Mobile at `< 768px` is view-only (response inspection), not full authoring.

---

## Accessibility

- All HTTP method colors meet WCAG AA against their dark backgrounds
- Focus order: Sidebar → URL bar → Tab bar → Editor → Response
- Keyboard shortcuts documented in tooltips: `Ctrl/⌘ + Enter` to send
- `aria-label` on all icon-only controls (method dropdown, collapse toggle)
- `prefers-reduced-motion`: transitions set to `0ms`
- Response JSON viewer: keyboard-navigable tree, `Enter` to expand/collapse nodes

---

## Design Decisions Log

| Decision | Rationale |
|---|---|
| Navy base over charcoal | `#1A1A2E` has depth without being flat; distinguishes Postman from VS Code dark theme defaults |
| Method-semantic color system | HTTP methods have established meaning; color reinforces protocol literacy rather than imposing a new system |
| Violet for collections / environments | Creates a two-accent system — orange = action/danger, violet = organization/state |
| `DM Mono` for method badges | Guarantees uniform width, prevents layout shift on method switch |
| Zero-gutter resizable panes | Postman is a tool, not a page; panel-based layout signals "workspace" not "website" |
| Cascadia Code for body content | Distinct from UI chrome, signals "this is code territory" |