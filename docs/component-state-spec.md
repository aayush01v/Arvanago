# Shared Component State Spec

This spec defines required states for interactive UI components and maps each state to reusable primitives in `components/ui`.

## Required States (all interactive primitives)

| State | Behavior |
| --- | --- |
| Default | Stable surface, readable text, no animations running continuously. |
| Hover | Subtle elevation/color change; no layout change. |
| Pressed | Reduced elevation and slight scale feedback. |
| Focus-visible | 3px high-contrast ring, always visible for keyboard users. |
| Disabled | Lower opacity and no pointer interactions. |
| Loading | Pointer interactions disabled and loading affordance shown. |
| Error | Border/surface shifts to error color token. |

## Primitive Inventory

- `Button` (`components/ui/Button.tsx`): supports default/hover/pressed/focus-visible/disabled/loading/error states.
- `Input` (`components/ui/Input.tsx`): supports default/hover/focus-visible/disabled/loading/error states.
- `Card` (`components/ui/Card.tsx`): supports default/hover/pressed/loading/error for interactive cards.
- `NavItem` (`components/ui/NavItem.tsx`): supports default/hover/pressed/focus-visible/disabled/active states.
- `TabButton` (`components/ui/TabButton.tsx`): supports default/hover/pressed/focus-visible/disabled/selected states.
- `Skeleton` (`components/ui/Skeleton.tsx`): loading placeholder with fixed dimensions to prevent layout shift.

## Accessibility + Focus

- Always apply `.ui-focus-ring` to keyboard-focusable controls.
- Focus ring color token: `--focus-ring-color: #1d4ed8`.
- Ring includes offset and background halo to maintain contrast in light and dark themes.

## Motion System

- Timing tokens in CSS:
  - `--motion-duration-fast: 160ms`
  - `--motion-duration-standard: 240ms`
  - `--motion-duration-slow: 360ms`
- Easing tokens:
  - `--motion-easing-standard`
  - `--motion-easing-emphasized`
- Framer motion mirrors these tokens in `utils/motion.ts`.
- Reduced motion fallback uses `@media (prefers-reduced-motion: reduce)` to minimize animation/transition duration and remove transform-heavy hover motion.

## Enforcement

- New feature work should compose from `components/ui/*` primitives.
- Ad-hoc state styling should be avoided; if a state is missing, extend a primitive once and reuse.
