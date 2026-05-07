import admin, { db } from '../utils/firebaseAdmin.js';
import { requireFirebaseUser } from '../utils/firebaseAuth.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { courseId } = req.body;

    if (!courseId) {
        return res.status(400).json({ error: 'Course ID is required' });
    }

    try {
        if (!db) {
            return res.status(500).json({ error: 'Firebase Admin is not configured' });
        }

        const decodedUser = await requireFirebaseUser(req);
        const courseRef = db.collection('courses').doc(courseId);
        const courseDoc = await courseRef.get();

        if (!courseDoc.exists) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const courseData = courseDoc.data();
        const coursePrice = Number(courseData?.price ?? 0);
        const isFreeCourse = courseData?.isFree === true || coursePrice <= 0;

        if (!isFreeCourse) {
            return res.status(400).json({ error: 'Paid courses must be enrolled through payment verification' });
        }

        const userRef = db.collection('users').doc(decodedUser.uid);
        await userRef.set(
            {
                enrolledCourses: admin.firestore.FieldValue.arrayUnion(courseId),
                ongoingCourses: admin.firestore.FieldValue.arrayUnion(courseId),
            },
            { merge: true },
        );

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Failed to enroll user in free course:', error);
        const statusCode = error?.statusCode || 500;
        return res.status(statusCode).json({ error: error?.message || 'Failed to enroll in course' });
    }
}