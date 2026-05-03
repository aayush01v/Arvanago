# Mobile App-Shell Visual QA Checklist

Use this checklist for every authenticated route to confirm the shared shell remains consistent.

## Shell spec to verify on each route

- Header height is exactly `4rem` (`h-16`).
- Left cluster is consistent:
  - menu/back action first,
  - logo lockup placement unchanged on mobile.
- Right cluster is consistent:
  - search action placement before avatar/action cluster,
  - avatar/action cluster spacing and divider unchanged.
- Drawer style is dark across themes (`bg-slate-950` family) with consistent nav label typography.
- Active nav state uses the same visual treatment (`bg-brand-primary/15` + `text-brand-primary`) in drawer and mobile bottom nav.
- Section headers (`Menu`, `Settings`) use shared uppercase microcopy token styles.

## Route-by-route pass sheet

Mark each line after visual verification in responsive/mobile viewport while logged in.

- [ ] `/dashboard` (Dashboard)
- [ ] `/my-learnings` (My Learnings)
- [ ] `/leaderboard` (Leaderboard)
- [ ] `/mynotes` (Notes)
- [ ] `/chat` (Chat)
- [ ] `/settings` (Settings)
- [ ] `/explore` (Explore Courses)
- [ ] `/profile` (Profile)

## Notes

- Validate both light and dark app themes; drawer remains the same dark variant in both.
- For nested routes (course detail/lecture), verify parent nav state behavior still matches top-level rules.
