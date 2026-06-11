# GitHub Frontend Web UI — Design Document

---

## Overview

**Product:** GitHub — code collaboration platform  
**Audience:** Software developers, open-source contributors, engineering teams  
**Page's single job:** Provide a fast, information-dense workspace where code is the hero — readable, navigable, and actionable at every level.

---

## Design Tokens

### Color Palette

| Role | Name | Hex |
|---|---|---|
| Background | Canvas Dark | `#0D1117` |
| Surface | Elevated Surface | `#161B22` |
| Border | Subtle Border | `#30363D` |
| Primary Accent | Electric Lime | `#3FB950` |
| Link / Interactive | Blue Link | `#58A6FF` |
| Danger / Delete | Soft Red | `#F85149` |
| Foreground Primary | Muted White | `#E6EDF3` |
| Foreground Secondary | Dimmed Gray | `#8B949E` |

> **Palette rationale:** GitHub's dark mode is its native habitat. `#0D1117` is GitHub's actual canvas — no approximations. The electric lime accent is pulled from diff-view "added lines", making the brand's own tooling vocabulary the visual language.

---

### Typography

| Role | Typeface | Weight / Size |
|---|---|---|
| Display / Headlines | `JetBrains Mono` | Bold, 28–40px |
| Body / UI Labels | `Inter` | Regular/Medium, 14–16px |
| Code Snippets | `Fira Code` | Regular, 13px, ligatures on |
| Metadata / Timestamps | `Inter` | Regular, 12px, `#8B949E` |

> **Type rationale:** Using a monospace display face (`JetBrains Mono`) for headings is the aesthetic risk — it blurs the line between "content" and "code," which is exactly right for GitHub. Body stays in `Inter` for legibility at small sizes.

---

## Layout System

### Grid

- Base grid: **12-column**, `1280px` max content width
- Sidebar: `240px` fixed (navigation / file tree)
- Content area: `960px` flexible
- Gutter: `24px`
- Spacing scale: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px`

### ASCII Wireframe — Repository Page

```
┌────────────────────────────────────────────────────────────┐
│  ■ GITHUB LOGO     [Search]           [+] [Notifications]  │  ← Topnav (56px)
├────────────────────────────────────────────────────────────┤
│  owner / repo-name                    [Star ★ 1.2k] [Fork] │  ← Repo header
│  ─────────────────────────────────────────────────────     │
│  [<> Code] [Issues 12] [PRs 4] [Actions] [Settings]        │  ← Repo tabs
├──────────────────────────────┬─────────────────────────────┤
│  main ▾  [+ Add file] [Code] │  About                      │
│  ─────────────────────────── │  A short description here.  │
│  📁 src              3d ago  │                             │
│  📁 tests            1d ago  │  ● MIT License              │
│  📄 README.md        6h ago  │  ★ 1,204 stars              │
│  📄 package.json    12h ago  │  👁 48 watching              │
│                              │  🍴 203 forks               │
├──────────────────────────────┴─────────────────────────────┤
│  README.md                                                  │
│  ─────────────────────────────────────────────────────     │
│  # repo-name                                               │
│  Rendered markdown content …                               │
└────────────────────────────────────────────────────────────┘
```

### ASCII Wireframe — Homepage / Dashboard

```
┌────────────────────────────────────────────────────────────┐
│  GITHUB LOGO     [Search ⌘K]         [@user] [Notifications]│
├──────────────┬─────────────────────────────────────────────┤
│ Navigation   │  Activity Feed                              │
│              │  ─────────────────────────────────────────  │
│ 🏠 Home      │  ● user pushed to main · 2m ago             │
│ 🔔 Notifs    │    3 commits in feature/auth                │
│ ✳ Explore   │                                             │
│              │  ● pr-author opened PR #42 · 15m ago        │
│ Repositories │    "Fix token expiry edge case"             │
│ ─────────    │                                             │
│ my-repo      │  ─────────────────────────────────────────  │
│ team/api     │  Recommended for you                        │
│ team/ui      │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│              │  │ repo-a ★ │  │ repo-b ★ │  │ repo-c ★ │  │
│ + New repo   │  └──────────┘  └──────────┘  └──────────┘  │
└──────────────┴─────────────────────────────────────────────┘
```

---

## Component Specifications

### Top Navigation Bar
- **Height:** 56px
- **Background:** `#161B22` with `1px solid #30363D` bottom border
- **Logo:** SVG octicon, `#E6EDF3`, 32px
- **Search bar:** `#0D1117` background, `#30363D` border, rounded `6px`, placeholder `Search or jump to… ⌘K`
- **Icons:** 20px stroke icons (bell, plus, user avatar 20px circle)

### Repository File Explorer
- Rows: `40px` tall, `hover: #161B22 → #1C2128`
- File icon + name in `#E6EDF3`, commit message in `#8B949E`, timestamp right-aligned in `#8B949E`
- Monospace font for filenames: `Fira Code`, 13px

### Code Viewer
- Background: `#0D1117`
- Line numbers: `#6E7681`, right-aligned, `48px` gutter
- Syntax highlighting follows GitHub's own token colors
- Line diff added: `background #1a3a26`, left border `3px solid #3FB950`
- Line diff removed: `background #3a1a1a`, left border `3px solid #F85149`

### Buttons

| Variant | Background | Border | Text |
|---|---|---|---|
| Primary | `#238636` | `#2EA043` | `#FFFFFF` |
| Secondary | `#21262D` | `#30363D` | `#E6EDF3` |
| Danger | `#DA3633` | `#F85149` | `#FFFFFF` |
| Ghost | transparent | transparent | `#58A6FF` |

- Border radius: `6px`
- Padding: `5px 16px` (small), `8px 20px` (default)
- Focus ring: `2px solid #58A6FF`, `2px offset`

### Labels / Badges
- Open issue: `#238636` bg, `#3FB950` border, `●` dot
- Closed: `#6E40C9` bg
- PR merged: `#6E40C9`
- PR draft: `#30363D` bg, `#8B949E` text
- Border radius: `2em` (pill)

### Notification Dot
- `8px` circle, `#F85149`, positioned `top-right` of icon
- No border — sits directly on the dark nav

---

## Signature Element

**Monospace-first typography stack.**  
Every headline across the interface renders in `JetBrains Mono Bold`. The effect is subtle on first glance — a repo name at 32px feels like code in a terminal, not a marketing page. This is intentional: GitHub is an editor, not a storefront. The moment a user's own repo name appears in display type using the same font they use to write code, the tool dissolves into the work.

---

## Motion & Interaction

| Trigger | Behavior | Duration |
|---|---|---|
| File row hover | `background` transition | `80ms ease` |
| Dropdown open | fade + `translateY(-4px → 0)` | `120ms ease-out` |
| Toast notification | slide in from top-right | `200ms ease` |
| Tab switch | underline slides (CSS transform) | `150ms ease` |
| Page load | no entrance animation — content renders inline | — |

> Less is more. GitHub's identity is speed and density, not delight animations.

---

## Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| `> 1280px` | Full 12-col layout, sidebar visible |
| `768px – 1280px` | Sidebar collapses to icon-only rail |
| `< 768px` | Single column, sidebar becomes bottom sheet |

- Code viewer: horizontal scroll on mobile, no wrapping
- File tree: collapsible accordion on mobile

---

## Accessibility

- Color contrast: all text combinations meet WCAG AA (4.5:1 minimum)
- Focus indicators: `2px solid #58A6FF` on all interactive elements
- Keyboard nav: full Tab order, `Escape` closes modals/dropdowns
- `prefers-reduced-motion`: all transitions disabled
- ARIA roles: `role="navigation"`, `role="tablist"`, `aria-current="page"` on active tab
- Icon-only buttons carry `aria-label`

---

## Design Decisions Log

| Decision | Rationale |
|---|---|
| Dark-only palette | GitHub's primary usage is evening/night coding sessions; dark is default, not an option |
| Monospace display type | Collapses boundary between UI and code — the signature risk |
| No hero animations | Density and speed are the brand promise; animations would feel like bloat |
| Green as primary accent (not blue) | Blue is reserved for links/interactive; green = "approved / added / live" — the diff language |
| 6px border radius | Matches GitHub's actual component library — technical, not bubbly |