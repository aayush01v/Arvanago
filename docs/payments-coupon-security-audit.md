# Payments & Admin Coupon Security Audit

Date: 2026-05-05

## Scope
- Course payment APIs: `api/create-order.js`, `api/verify-payment.js`
- Store payment APIs: `api/store/create-order.js`, `api/store/verify-payment.js`
- Store coupon validation: `api/store/validate-coupon.js`
- Checkout clients: `hooks/useRazorpayEnrollment.ts`, `components/store/CartDrawer.tsx`

## Findings (before fixes)
1. **Course enrollment could trust client identity/course metadata during verify flow.**
   - Impact: A successful signature plus tampered request body could potentially attempt enrollment updates for arbitrary `userId`/`courseId`.
2. **Store verify endpoint trusted client-provided order contents and totals.**
   - Impact: An attacker could send altered `items`, `totalAmount`, or `couponId` on verification.
3. **Store verify had weak replay/idempotency controls.**
   - Impact: Duplicate verify calls could re-process the same order path.

## Hardening applied
1. **Course orders now carry trusted metadata in Razorpay notes (`userId`, `courseId`) and verify reads from Razorpay order instead of trusting body fields.**
2. **Store create-order now persists a server-side order intent (`store_order_intents/{orderId}`) containing validated items, amount, shipping, and coupon usage id.**
3. **Store verify now fetches Razorpay order for user binding, loads the server-stored intent, and writes order/stock/coupon updates from trusted intent only.**
4. **Store verify now marks intent as `paid` to enforce idempotency on repeated verify calls.**

## Residual recommendations
- Move to signed Firebase ID token verification in APIs (instead of relying on `userId` body) for stronger caller auth.
- Add webhook-based reconciliation (`payment.captured`) as a secondary source of truth.
- Add structured security logs (order id, uid, coupon id, amount) for anomaly detection.
