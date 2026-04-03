# WCAG 2.2 AA Contrast Audit (Authenticated Core UI)

This audit covers typography/icon color pairs used in authenticated core components:

- `NavItem` (`components/Sidebar.tsx`, `components/admin/AdminSidebar.tsx`)
- `Card` and `Stat` (`components/Dashboard.tsx`)
- `Button` (`components/Dashboard.tsx`, `components/admin/AdminSidebar.tsx`)

## AA thresholds used

- Normal text/icons: **4.5:1**
- Large text: **3:1**

## Tokenized semantic colors

- `text-primary`
- `text-secondary`
- `surface-muted`
- `border-subtle`

Defined in `tailwind.config.js` via CSS variables set in `index.css`.

## Validation contexts

- Light
- Dark
- Reduced brightness mobile simulation (`:root.reduced-brightness`)

## Automated check

Run:

```bash
npm run contrast:check
```

This script validates all core component pairs and exits non-zero on any AA failure.
