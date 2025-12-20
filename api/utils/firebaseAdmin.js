import admin from 'firebase-admin';

// Prevent initializing the app multiple times in serverless environments
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Handle private key newlines correctly
                privateKey: process.env.FIREBASE_PRIVATE_KEY
                    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                    : undefined,
            }),
        });
    } catch (error) {
        console.error('Firebase Admin initialization error', error);
    }
}

export const db = admin.firestore();
export default admin;
