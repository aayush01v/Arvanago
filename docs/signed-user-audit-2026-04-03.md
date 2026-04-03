# Signed-in User Rigorous Audit (2026-04-03)

## Scope
Focused QA audit for **logged-in (signed) users** across:
- Feature access and auth gating
- Usability and reliability
- Performance/build health
- Security posture

## Test Execution
1. Production build check (`npm run build`)
2. Type-safety check (`npx tsc --noEmit`)
3. Dependency vulnerability check (`npm audit --omit=dev`)
4. Static auth/route/security review of:
   - `App.tsx`
   - `components/ProtectedRoute.tsx`
   - `services/authService.ts`
   - `components/MarkdownPreview.tsx`
   - `components/CanvasRenderer.tsx`
   - `firestore.rules`

## Findings

### A) Features (Signed-in Flows)
- ✅ Auth-gated pages are protected through `ProtectedRoute` for dashboard, learnings, notes, explore, leaderboard, chat, profile, settings, and lecture routes.
- ✅ Course detail route wrapper correctly redirects enrolled users from `/courses/:courseId` to `/courses/:courseId/learn`.
- ⚠️ Email-unverified users are force-signed-out immediately in auth state handling. This is secure, but can feel abrupt without contextual UX.

### B) Usability
- ⚠️ There is a stale debug comment in course routing: `DEBUG: IGNORE ENROLLMENT CHECK TO TEST PAYMENT`, while enrollment logic is active. This can mislead future maintainers.
- ⚠️ Build was blocked by a missing CSS import reference and a syntax error in auth service (fixed in this audit).

### C) Performance
- ⚠️ Bundle profile shows several large JS chunks (`vendor`, `firebase`, `index`, `charts`) that may impact first-load performance on slower devices.
- ⚠️ Vite reports static+dynamic import duplication for key modules (`firebase.ts`, `firestoreService.ts`, etc.), reducing code-splitting effectiveness.

### D) Security
- 🔴 `MarkdownPreview` renders raw HTML via `rehypeRaw` without sanitization. If untrusted content is rendered, this is a potential XSS vector.
- 🔴 `CanvasRenderer` also enables `rehypeRaw` while rendering markdown content; similarly risky with untrusted data.
- ⚠️ Firestore rules currently allow public reads on `/users/{userId}` and permit any authenticated user to update only `followers` field. This may be intentional for social features, but should be verified against privacy and abuse controls.
- ⚠️ `npm audit` endpoint returned HTTP 403 in this environment, so dependency advisory verification could not be completed.

## Fixes Applied During Audit
1. Resolved auth syntax error (`services/authService.ts`) to restore successful build pipeline.
2. Removed broken missing CSS import (`index.css`) to restore CSS transform/build.

## Recommended Next Actions
1. Add sanitization policy for markdown-rendered HTML (e.g., sanitize before render or disallow raw HTML).
2. Tighten Firestore rules for user profile visibility and follower update abuse controls (rate-limit/Cloud Function mediation).
3. Add CI gates: `vite build`, `tsc --noEmit`, and linting.
4. Investigate chunk splitting and dependency optimization to reduce initial payload for signed-in users.
