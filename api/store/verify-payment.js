import crypto from 'crypto';
import admin, { db } from '../utils/firebaseAdmin.js';
import Razorpay from 'razorpay';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
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
            const keyId = process.env.RAZORPAY_KEY_ID;
            if (!keyId) {
                return res.status(500).json({ error: 'Server configuration error' });
            }

            const razorpay = new Razorpay({ key_id: keyId, key_secret: secret });
            const order = await razorpay.orders.fetch(razorpay_order_id);
            const trustedUserId = order?.notes?.userId;

            if (!trustedUserId || trustedUserId === 'guest' || trustedUserId !== userId) {
                return res.status(400).json({ success: false, error: 'User mismatch detected' });
            }

            const intentRef = db.collection('store_order_intents').doc(razorpay_order_id);
            const intentSnap = await intentRef.get();
            if (!intentSnap.exists) {
                return res.status(400).json({ success: false, error: 'Order intent not found' });
            }

            const intent = intentSnap.data();
            if (intent.status === 'paid') {
                return res.status(200).json({ success: true, message: 'Payment already verified' });
            }

            // Allocate store order securely
            if (db) {
                const batch = db.batch();
                const orderRef = db.collection('store_orders').doc();
                
                // Track the new order
                const orderSnapshot = {
                    userId: trustedUserId,
                    items: intent.items,
                    totalAmount: intent.totalAmount,
                    status: 'paid', // Admin can physically mark 'shipped' later.
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                };

                if (intent.shippingAddress) {
                    orderSnapshot.shippingAddress = intent.shippingAddress;
                }

                batch.set(orderRef, orderSnapshot);

                // Safely decrement stock for each item using a batched write
                for (const item of intent.items) {
                    const productRef = db.collection('products').doc(item.productId);
                    batch.update(productRef, {
                        stock: admin.firestore.FieldValue.increment(-item.quantity)
                    });
                }

                if (intent.couponId) {
                    const couponRef = db.collection('coupons').doc(intent.couponId);
                    batch.update(couponRef, {
                        usageCount: admin.firestore.FieldValue.increment(1)
                    });
                }

                batch.update(intentRef, {
                    status: 'paid',
                    paidAt: admin.firestore.FieldValue.serverTimestamp(),
                    razorpayPaymentId: razorpay_payment_id
                });

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
