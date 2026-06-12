import crypto from 'crypto';
import Razorpay from 'razorpay';
import admin, { db } from './utils/firebaseAdmin.js';
import { requireFirebaseUser } from './utils/firebaseAuth.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, courseId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const secret = process.env.RAZORPAY_KEY_SECRET;
        const keyId = process.env.RAZORPAY_KEY_ID;

        if (!secret || !keyId) {
            console.error('RAZORPAY_KEY_SECRET is not set');
            return res.status(500).json({ error: 'Server configuration error' });
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

        const orderCourseId = order?.notes?.courseId;
        const orderUserId = order?.notes?.userId;

        if (!orderCourseId || !orderUserId) {
            return res.status(400).json({ error: 'Payment order is missing enrollment metadata' });
        }

        if (orderCourseId !== courseId || orderUserId !== decodedUser.uid || (userId && userId !== decodedUser.uid)) {
            return res.status(403).json({ error: 'Payment metadata does not match the authenticated user or course' });
        }

        if (order.status !== 'created' && order.status !== 'attempted' && order.status !== 'paid') {
            return res.status(400).json({ error: 'Payment order is not in a valid state' });
        }

        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generated_signature === razorpay_signature) {
            if (!db || !userId || !courseId) {
                return res.status(400).json({ success: false, error: 'Missing purchase metadata' });
            }

            const paymentRef = db.collection('course_payments').doc(razorpay_payment_id);
            const paymentDoc = await paymentRef.get();
            if (paymentDoc.exists) {
                return res.status(200).json({ success: true, message: 'Payment already processed' });
            }

            const courseRef = db.collection('courses').doc(courseId);
            const userRef = db.collection('users').doc(decodedUser.uid);
            const courseDoc = await courseRef.get();
            const coursePrice = Number(courseDoc.data()?.price || 0);

            if (!courseDoc.exists) {
                return res.status(404).json({ success: false, error: 'Course not found' });
            }

            const batch = db.batch();
            batch.set(paymentRef, {
                userId: decodedUser.uid,
                courseId,
                amount: Number.isFinite(Number(order.amount)) ? Math.max(Number(order.amount) / 100, 0) : Math.max(coursePrice, 0),
                status: 'paid',
                source: 'course',
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                razorpayAmount: order.amount,
                currency: order.currency,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            batch.update(userRef, {
                enrolledCourses: admin.firestore.FieldValue.arrayUnion(courseId),
                ongoingCourses: admin.firestore.FieldValue.arrayUnion(courseId)
            });
            await batch.commit();

            res.status(200).json({ success: true, message: 'Payment verified successfully and course allocated' });
        } else {
            res.status(400).json({ success: false, error: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
