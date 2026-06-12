import crypto from 'crypto';
import admin, { db } from '../utils/firebaseAdmin.js';
import Razorpay from 'razorpay';
import { requireFirebaseUser } from '../utils/firebaseAuth.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, items, totalAmount, shippingAddress, couponId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !items) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const secret = process.env.RAZORPAY_KEY_SECRET;
        const keyId = process.env.RAZORPAY_KEY_ID;

        if (!secret || !keyId) {
            console.error('RAZORPAY_KEY_SECRET is not set');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        if (!db) {
            return res.status(500).json({ error: 'Firebase Admin is not configured' });
        }

        const decodedUser = await requireFirebaseUser(req);
        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: secret,
        });

        const order = await razorpay.orders.fetch(razorpay_order_id);

        if (!order) {
            return res.status(404).json({ error: 'Payment order not found' });
        }

        if (order?.notes?.orderType !== 'store') {
            return res.status(400).json({ error: 'Payment order does not belong to the store flow' });
        }

        if (order?.notes?.userId !== decodedUser.uid || (userId && userId !== decodedUser.uid)) {
            return res.status(403).json({ error: 'Payment metadata does not match the authenticated user' });
        }

        const pendingOrderSnapshot = await db.collection('store_orders').doc(razorpay_order_id).get();

        if (!pendingOrderSnapshot.exists) {
            return res.status(404).json({ error: 'Pending store order not found' });
        }

        const pendingOrder = pendingOrderSnapshot.data();

        if (pendingOrder.userId !== decodedUser.uid) {
            return res.status(403).json({ error: 'Pending store order does not belong to the authenticated user' });
        }

        if (Math.round(Number(pendingOrder.totalAmount) * 100) !== Number(order.amount)) {
            return res.status(400).json({ error: 'Payment amount does not match the server order total' });
        }

        if (!Array.isArray(pendingOrder.items) || pendingOrder.items.length === 0) {
            return res.status(400).json({ error: 'Pending store order is missing item data' });
        }

        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generated_signature === razorpay_signature) {
            // Allocate store order securely
            if (db) {
                const existingOrder = await db.collection('store_orders').where('razorpayPaymentId', '==', razorpay_payment_id).limit(1).get();
                if (!existingOrder.empty) {
                    return res.status(200).json({ success: true, message: 'Store payment already processed' });
                }

                const batch = db.batch();
                const orderRef = db.collection('store_orders').doc(razorpay_order_id);
                
                // Track the new order
                const orderSnapshot = {
                    userId: decodedUser.uid,
                    items: pendingOrder.items,
                    totalAmount: pendingOrder.totalAmount,
                    status: 'paid', // Admin can physically mark 'shipped' later.
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                    appliedCouponId: pendingOrder.couponId || null,
                    shippingAddress: pendingOrder.shippingAddress || shippingAddress || null,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                };

                batch.set(orderRef, orderSnapshot);

                // Safely decrement stock for each item using a batched write
                for (const item of pendingOrder.items) {
                    const productRef = db.collection('products').doc(item.productId);
                    batch.update(productRef, {
                        stock: admin.firestore.FieldValue.increment(-item.quantity)
                    });
                }

                if (pendingOrder.couponId) {
                    const couponRef = db.collection('coupons').doc(pendingOrder.couponId);
                    batch.update(couponRef, {
                        usageCount: admin.firestore.FieldValue.increment(1)
                    });
                }

                try {
                    await batch.commit();
                } catch (dbError) {
                    console.error('Failed to commit store order to Firestore:', dbError);
                }
            }

            res.status(200).json({ success: true, message: 'Store payment verified successfully and order logged' });
        } else {
            res.status(400).json({ success: false, error: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Error verifying store payment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
