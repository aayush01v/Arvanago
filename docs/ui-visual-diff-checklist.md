# UI Visual Diff Checklist (Authenticated Consistency Pass)

Use this checklist before merging visual changes that touch authenticated experience components.

## Screen matrix
- [ ] Light mode authenticated: `/dashboard`, `/explore`, `/settings`
- [ ] Dark mode authenticated: `/dashboard`, `/explore`, `/settings`
- [ ] Light mode unauthenticated: `/`, `/login`
- [ ] Dark mode unauthenticated: `/`, `/login`

## Token compliance
- [ ] Corner radius maps to tokens (`rounded-2xl` surfaces, `rounded-xl` interactive, `rounded-full` pill)
- [ ] Card elevation maps to `uiTokens.elevation.card`
- [ ] Icon stroke width defaults to `1.75` and active uses `2`
- [ ] Chip height remains `32px` via `h-8`

## Component parity
- [ ] `Card` variants (surface/glass/muted) match in light and dark themes
- [ ] `Chip` active and idle states remain legible in both themes
- [ ] `NavItem` active/inactive + hover states are consistent in Sidebar and mobile nav usage
- [ ] `HeaderAction` icon sizing + hit area are consistent in Header and settings/back actions

## Auth flow checkpoints
- [ ] Login redirect → `/dashboard` keeps header/sidebar tokenized styles
- [ ] Deep links under auth routes preserve shared component variants
- [ ] Guest routes do not regress where tokenized shared components are reused
