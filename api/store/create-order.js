import Razorpay from 'razorpay';
import admin, { db, dbError } from '../utils/firebaseAdmin.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { items, currency = 'INR', receipt, shippingAddress, couponCode, userId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
    }

    try {
        if (!db) {
            return res.status(500).json({ error: `Firebase Admin issue: ${dbError?.message || dbError}` });
        }

        let subtotal = 0;
        let requiresShipping = false;
        const validItems = [];

        // ─── STEP 1: Validate every item from the database (NEVER trust client prices) ───
        const productRefs = [];
        for (const item of items) {
            if (!item.productId || typeof item.quantity !== 'number' || item.quantity < 1) {
                return res.status(400).json({ error: 'Invalid item in cart' });
            }
            productRefs.push(db.collection('products').doc(item.productId));
        }

        const productDocs = await db.getAll(...productRefs);
        const productDocsMap = new Map();
        productDocs.forEach(doc => {
            if (doc.exists) {
                productDocsMap.set(doc.id, doc);
            }
        });

        for (const item of items) {
            const productDoc = productDocsMap.get(item.productId);

            if (!productDoc) {
                return res.status(404).json({ error: `Product not found: ${item.productId}` });
            }

            const productData = productDoc.data();
            
            let price = Number(productData.price);
            let variantName = '';

            // Extract override price if variant is specified
            if (item.variantLabel && productData.variants) {
                const variantMatch = productData.variants.find(v => v.label === item.variantLabel);
                if (variantMatch) {
                    price = Number(variantMatch.price);
                    variantName = variantMatch.label;
                } else {
                    return res.status(400).json({ error: `Invalid variant ${item.variantLabel} for product: ${productData.name}` });
                }
            }

            const stock = Number(productData.stock);

            if (isNaN(price) || price < 0) {
                return res.status(400).json({ error: `Invalid price for product: ${productData.name || item.productId}` });
            }
            if (!productData.isPublished) {
                return res.status(400).json({ error: `Product is not available: ${productData.name || item.productId}` });
            }
            if (stock < item.quantity) {
                return res.status(400).json({ error: `Insufficient stock for: ${productData.name}` });
            }

            if (productData.type === 'physical') requiresShipping = true;

            subtotal += price * item.quantity;
            validItems.push({
                productId: item.productId,
                name: productData.name,
                variantLabel: variantName || undefined,
                quantity: item.quantity,
                priceAtPurchase: price // locked from DB
            });
        }

        if (requiresShipping && (!shippingAddress || shippingAddress.trim().length < 10)) {
            return res.status(400).json({ error: 'A valid shipping address is required for physical items.' });
        }

        // ─── STEP 2: Coupon validation (100% server-side, no trust from client) ───
        let discountAmount = 0;
        let appliedCouponId = null;
        let couponData = null;

        if (couponCode && typeof couponCode === 'string') {
            const couponQuery = await db.collection('coupons')
                .where('code', '==', couponCode.toUpperCase().trim())
                .limit(1)
                .get();

            if (couponQuery.empty) {
                return res.status(400).json({ error: `Invalid coupon code: ${couponCode}` });
            }

            const couponDoc = couponQuery.docs[0];
            couponData = couponDoc.data();
            const now = new Date().toISOString();

            // Security checks — all server-side
            if (couponData.isActive === false) {
                return res.status(400).json({ error: 'This coupon is no longer active.' });
            }
            if (couponData.expiryDate && couponData.expiryDate < now) {
                return res.status(400).json({ error: 'This coupon has expired.' });
            }
            if (couponData.maxUses && (couponData.usageCount || 0) >= couponData.maxUses) {
                return res.status(400).json({ error: 'This coupon has reached its usage limit.' });
            }

            // Scope check: coupon must be valid for store
            const scope = couponData.applicableTo || 'courses'; // default old coupons were courses-only
            if (scope !== 'store' && scope !== 'all') {
                return res.status(400).json({ error: 'This coupon is not valid for store purchases.' });
            }

            // Product-specific restriction check
            if (couponData.productId) {
                const appliesToProduct = validItems.some(i => i.productId === couponData.productId);
                if (!appliesToProduct) {
                    return res.status(400).json({ error: 'This coupon is only valid for a specific product not in your cart.' });
                }
                // Apply discount only to matching product lines
                for (const item of validItems) {
                    if (item.productId === couponData.productId) {
                        const lineTotal = item.priceAtPurchase * item.quantity;
                        if (couponData.discountType === 'percentage') {
                            discountAmount += lineTotal * (Math.min(couponData.discountValue, 100) / 100);
                        } else {
                            discountAmount += Math.min(couponData.discountValue, lineTotal);
                        }
                    }
                }
            } else {
                // Apply to entire cart
                if (couponData.discountType === 'percentage') {
                    discountAmount = subtotal * (Math.min(couponData.discountValue, 100) / 100);
                } else {
                    discountAmount = Math.min(couponData.discountValue, subtotal);
                }
            }

            appliedCouponId = couponDoc.id;
        }

        // ─── STEP 3: Compute final amount (server-side, tamper-proof) ───
        const totalAmount = Math.max(0, subtotal - discountAmount);

        if (totalAmount <= 0 && !couponCode) {
            // Free cart without coupon shouldn't reach here
            return res.status(400).json({ error: 'Total must be greater than zero.' });
        }

        // If coupon makes total exactly 0, handle as free order (no Razorpay needed)
        // But we MUST securely log the order here because we bypass verify-payment completely
        if (totalAmount === 0) {
            const batch = db.batch();
            const orderRef = db.collection('store_orders').doc();
            
            const orderSnapshot = {
                userId: req.body.userId || 'guest',
                items: validItems,
                totalAmount: 0,
                status: 'paid', // Flag as "paid" since effectively free
                razorpayOrderId: 'free_coupon_order',
                razorpayPaymentId: 'COUPON_APPLIED',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };

            if (shippingAddress) {
                orderSnapshot.shippingAddress = shippingAddress;
            }

            batch.set(orderRef, orderSnapshot);

            for (const item of validItems) {
                const productRef = db.collection('products').doc(item.productId);
                batch.update(productRef, {
                    stock: admin.firestore.FieldValue.increment(-item.quantity)
                });
            }

            if (appliedCouponId) {
                const couponRef = db.collection('coupons').doc(appliedCouponId);
                batch.update(couponRef, {
                    usageCount: admin.firestore.FieldValue.increment(1)
                });
            }

            await batch.commit();

            return res.status(200).json({
                free: true,
                calculatedItems: validItems,
                requiresShipping,
                subtotal,
                discountAmount,
                totalAmount: 0,
                appliedCouponId: appliedCouponId || null
            });
        }

        // ─── STEP 4: Create Razorpay order with the server-computed amount ───
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            return res.status(500).json({ error: 'Payment gateway not configured.' });
        }

        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const order = await razorpay.orders.create({
            amount: Math.round(totalAmount * 100), // paise — server computed only
            currency,
            receipt: receipt || `rcpt_store_${Date.now()}`,
            notes: { orderType: 'store', couponApplied: appliedCouponId || 'none', userId: userId || 'guest' }
        });

        await db.collection('store_order_intents').doc(order.id).set({
            userId: userId || 'guest',
            items: validItems,
            totalAmount,
            shippingAddress: shippingAddress || null,
            couponId: appliedCouponId || null,
            status: 'created',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Return the order with secure server-computed summary
        return res.status(200).json({
            ...order,
            calculatedItems: validItems,
            requiresShipping,
            subtotal,
            discountAmount,
            totalAmount,
            appliedCouponId: appliedCouponId || null
        });

    } catch (error) {
        console.error('Error creating store order:', error?.error ?? error);
        const message = error?.error?.description || error?.message || 'Failed to create order.';
        return res.status(500).json({ error: message });
    }
}
