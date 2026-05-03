# Logged-in surfaces: semantic color token audit

## Scope

Authenticated route UI reviewed:

- Primary navigation (sidebar + top header)
- Cards (dashboard stat cards, ongoing course cards, analytics cards)
- Badges/chips (category badges, trend chips, analytics chips)
- Progress labels and progress bars
- Icon strokes (all `Icon` components inherit `currentColor`)

## Semantic tokens (approved)

| Token | Light value | Dark value | Purpose |
| --- | --- | --- | --- |
| `text-primary` | `#0f172a` | `#f8fafc` | Headings/body primary text |
| `text-secondary` | `#334155` | `#cbd5e1` | Supporting text/UI labels |
| `surface-muted` | `#e2e8f0` | `#1e293b` | Neutral chips and muted containers |
| `accent-strong` | `#1d4ed8` | `#60a5fa` | Emphasis text/icons/progress value labels |

## WCAG contrast verification

Measured against common authenticated surfaces:

| Pair | Ratio | Target | Status |
| --- | --- | --- | --- |
| `text-primary` on white | `17.85:1` | `>= 4.5:1` body | Pass |
| `text-secondary` on white | `10.35:1` | `>= 4.5:1` body | Pass |
| `text-primary` on dark base `#020617` | `19.28:1` | `>= 4.5:1` body | Pass |
| `text-secondary` on dark base `#020617` | `13.59:1` | `>= 4.5:1` body | Pass |
| `accent-strong` on `surface-muted` (light) | `5.44:1` | `>= 3:1` large/UI labels | Pass |
| `accent-strong` on `surface-muted` (dark) | `5.75:1` | `>= 3:1` large/UI labels | Pass |

## Inventory of tokenized foreground/background pairs

| Area | Foreground token | Background token/surface |
| --- | --- | --- |
| Sidebar nav items | `text-secondary` / `accent-strong` for active | Base sidebar surface (`bg-white`, `dark:bg-slate-900`) with hover `surface-muted` |
| Header actions and labels | `text-primary`, `text-secondary`, `accent-strong` | Header glass surface (`bg-white/*`, `dark:bg-slate-900/*`) |
| Dashboard card body copy | `text-primary`, `text-secondary` | Card surfaces (`bg-white`, `dark:bg-slate-800`) |
| Dashboard chips/badges | `accent-strong` | `surface-muted` |
| Progress labels | `text-secondary` + `accent-strong` percentage | Progress row/card background |
| Analytics chips | `accent-strong` | `surface-muted` |
| Icon strokes | Inherit `text-primary`, `text-secondary`, or `accent-strong` via `currentColor` | Parent surface |

## Usage guidance for future authenticated screens

1. Use `text-primary` for all default body/headline text.
2. Use `text-secondary` for helper labels, metadata, inactive nav labels, and secondary icon strokes.
3. Use `surface-muted` for neutral chips and subtle emphasis containers.
4. Use `accent-strong` for active states, chart labels, progress highlights, and action emphasis.
5. Avoid ad-hoc `text-slate-*` and `bg-*-100/900` combos in authenticated surfaces unless a semantic token cannot express the intent.
