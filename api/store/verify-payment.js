import crypto from 'crypto';
import admin, { db } from '../utils/firebaseAdmin.js';

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

        if (!secret) {
            console.error('RAZORPAY_KEY_SECRET is not set');
            return res.status(500).json({ error: 'Server configuration error' });
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
                const orderRef = db.collection('store_orders').doc();
                
                // Track the new order
                const orderSnapshot = {
                    userId,
                    items,
                    totalAmount,
                    status: 'paid', // Admin can physically mark 'shipped' later.
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                };

                if (shippingAddress) {
                    orderSnapshot.shippingAddress = shippingAddress;
                }

                batch.set(orderRef, orderSnapshot);

                // Safely decrement stock for each item using a batched write
                for (const item of items) {
                    const productRef = db.collection('products').doc(item.productId);
                    batch.update(productRef, {
                        stock: admin.firestore.FieldValue.increment(-item.quantity)
                    });
                }

                if (couponId) {
                    const couponRef = db.collection('coupons').doc(couponId);
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
