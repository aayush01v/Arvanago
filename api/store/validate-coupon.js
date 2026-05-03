import { db } from '../utils/firebaseAdmin.js';

// Validates a coupon code against a set of cart items without creating an order.
// Returns discount info so the frontend can show inline previews.
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { couponCode, items } = req.body;
    if (!couponCode || !items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'couponCode and items are required' });
    }

    try {
        const snap = await db.collection('coupons')
            .where('code', '==', couponCode.toUpperCase().trim())
            .limit(1).get();

        if (snap.empty) return res.status(404).json({ error: 'Coupon not found' });

        const doc = snap.docs[0];
        const c = doc.data();
        const now = new Date().toISOString();

        if (c.isActive === false) return res.status(400).json({ error: 'Coupon is inactive' });
        if (c.expiryDate && c.expiryDate < now) return res.status(400).json({ error: 'Coupon has expired' });
        if (c.maxUses && (c.usageCount || 0) >= c.maxUses) return res.status(400).json({ error: 'Coupon usage limit reached' });

        const scope = c.applicableTo || 'courses';
        if (scope !== 'store' && scope !== 'all') {
            return res.status(400).json({ error: 'Coupon is not valid for store purchases' });
        }

        // Determine which product IDs this coupon applies to
        const cartProductIds = items.map(i => i.productId);

        if (c.productId) {
            // Product-specific coupon — reject if the targeted product isn't in the cart
            if (!cartProductIds.includes(c.productId)) {
                return res.status(400).json({
                    error: 'This coupon is only valid for a specific product that is not in your cart.'
                });
            }
        }

        const appliesTo = c.productId ? [c.productId] : cartProductIds;

        return res.status(200).json({
            valid: true,
            discountType: c.discountType,
            discountValue: c.discountValue,
            productId: c.productId || null,  // null means whole cart
            appliesTo,
            label: c.productId
                ? `${c.discountValue}${c.discountType === 'percentage' ? '%' : '₹'} off on specific product`
                : `${c.discountValue}${c.discountType === 'percentage' ? '%' : '₹'} off on all store items`
        });
    } catch (e) {
        console.error('validate-coupon error', e);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
