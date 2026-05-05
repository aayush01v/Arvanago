import crypto from 'crypto';
import admin, { db } from './utils/firebaseAdmin.js';
import Razorpay from 'razorpay';

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
            const keyId = process.env.RAZORPAY_KEY_ID;
            if (!keyId) {
                return res.status(500).json({ error: 'Server configuration error' });
            }

            const razorpay = new Razorpay({ key_id: keyId, key_secret: secret });
            const order = await razorpay.orders.fetch(razorpay_order_id);
            const trustedUserId = order?.notes?.userId;
            const trustedCourseId = order?.notes?.courseId;

            if (!trustedUserId || trustedUserId === 'guest' || !trustedCourseId) {
                return res.status(400).json({ success: false, error: 'Order metadata missing or invalid' });
            }

            if (userId && userId !== trustedUserId) {
                return res.status(400).json({ success: false, error: 'User mismatch detected' });
            }

            if (courseId && courseId !== trustedCourseId) {
                return res.status(400).json({ success: false, error: 'Course mismatch detected' });
            }

            // ALLOCATE COURSE TO USER HERE
            if (db) {
                try {
                    const userRef = db.collection('users').doc(trustedUserId);
                    await userRef.update({
                        enrolledCourses: admin.firestore.FieldValue.arrayUnion(trustedCourseId),
                        ongoingCourses: admin.firestore.FieldValue.arrayUnion(trustedCourseId)
                    });
                } catch (dbError) {
                    console.error('Failed to update user profile in Firestore:', dbError);
                }
            }

            res.status(200).json({ success: true, message: 'Payment verified successfully and course allocated' });
        } else {
            res.status(400).json({ success: false, error: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
