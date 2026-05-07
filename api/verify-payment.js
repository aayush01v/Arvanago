import crypto from 'crypto';
import admin, { db } from './utils/firebaseAdmin.js';

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

        if (!secret) {
            console.error('RAZORPAY_KEY_SECRET is not set');
            return res.status(500).json({ error: 'Server configuration error' });
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
            const userRef = db.collection('users').doc(userId);
            const courseDoc = await courseRef.get();
            const coursePrice = Number(courseDoc.data()?.price || 0);

            const batch = db.batch();
            batch.set(paymentRef, {
                userId,
                courseId,
                amount: Number.isFinite(coursePrice) ? Math.max(coursePrice, 0) : 0,
                status: 'paid',
                source: 'course',
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
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
