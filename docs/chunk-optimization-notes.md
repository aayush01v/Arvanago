# Chunk Splitting & Dependency Optimization (Signed-in UX)

## What was changed now

1. **Route-level lazy loading restored in `App.tsx`**
   - Most page-level routes are now loaded with `React.lazy`, so signed-in users no longer download every route bundle up front.
2. **Firebase split into smaller vendor chunks in `vite.config.ts`**
   - Firebase now emits separate chunks for auth/firestore/storage/core.

## Why this helps signed-in users

- Signed-in users hit `/dashboard` and related routes quickly; lazy routes defer admin/blog/preview payloads.
- Firestore-heavy code paths no longer force auth/storage payloads to block initial interactivity.

## Follow-up opportunities

1. **Preload only likely next routes** from dashboard (e.g. my-learnings, profile) on idle.
2. **Dynamic import heavyweight markdown/code-rendering features** where they are only needed.
3. **Audit oversized dependencies**
   - `framer-motion`, `react-syntax-highlighter`, and some Firebase modules are likely top contributors.
4. **Track bundle budgets in CI**
   - Add `vite build --report` or plugin analyzer and fail when signed-in critical path exceeds budget.
