import Razorpay from 'razorpay';
import { db, dbError } from './utils/firebaseAdmin.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { courseId, currency = 'INR', receipt, couponCode } = req.body;

    if (!courseId) {
        return res.status(400).json({ error: 'Course ID is required' });
    }

    try {
        if (!db) {
            return res.status(500).json({ error: `Firebase Admin issue: ${dbError?.message || dbError || 'Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'}` });
        }

        // 1. Fetch real price from Firestore
        const courseRef = db.collection('courses').doc(courseId);
        const courseDoc = await courseRef.get();

        if (!courseDoc.exists) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const courseData = courseDoc.data();
        let price = Number(courseData.price);

        if (isNaN(price) || price < 0) {
            return res.status(400).json({ error: 'Invalid course price in database' });
        }

        // Apply coupon if provided
        if (couponCode) {
            const couponsSnapshot = await db.collection('coupons').where('code', '==', couponCode.toUpperCase()).get();
            if (!couponsSnapshot.empty) {
                const couponData = couponsSnapshot.docs[0].data();
                const now = new Date().toISOString();
                
                // Validate coupon
                const isActive = couponData.isActive !== false;
                const isNotExpired = !couponData.expiryDate || couponData.expiryDate > now;
                const isNotExhausted = !couponData.maxUses || (couponData.usageCount || 0) < couponData.maxUses;
                const appliesToCourse = !couponData.courseId || couponData.courseId === courseId;

                if (isActive && isNotExpired && isNotExhausted && appliesToCourse) {
                    if (couponData.discountType === 'percentage') {
                        price = price * (1 - (couponData.discountValue / 100));
                    } else {
                        price = Math.max(0, price - couponData.discountValue);
                    }
                }
            }
        }

        // 2. Initialize Razorpay — validate env vars before constructing
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            console.error('Razorpay env vars missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel.');
            return res.status(500).json({ error: 'Payment gateway not configured. Contact support.' });
        }

        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        const options = {
            amount: Math.round(price * 100), // Convert to paise
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
            notes: {
                courseId: courseId,
                courseName: courseData.title
            }
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json(order);
    } catch (error) {
        console.error('Error creating Razorpay order:', error?.error ?? error);
        const message = error?.error?.description || error?.message || 'Failed to create order. Please try again later.';
        res.status(500).json({ error: message });
    }
}
