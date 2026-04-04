import admin from 'firebase-admin';

// Prevent initializing the app multiple times in serverless environments
if (!admin.apps.length) {
    try {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY
            ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            : undefined;

        if (!projectId || !clientEmail || !privateKey) {
            console.warn('[firebaseAdmin] Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY env vars.');
            console.warn('[firebaseAdmin] /api/create-order will return 500 until these are set in .env');
        } else {
            admin.initializeApp({
                credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
            });
        }
    } catch (error) {
        console.error('Firebase Admin initialization error', error);
    }
}

export const db = admin.apps.length ? admin.firestore() : null;
export default admin;

