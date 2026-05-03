import admin from 'firebase-admin';

let adminInitError = null;

// Prevent initializing the app multiple times in serverless environments
if (!admin.apps.length) {
    try {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        
        // Fallback for local development
        const fs = await import('fs');
        const path = await import('path');
        const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');

        if (privateKey) {
            privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
            admin.initializeApp({
                credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
            });
        } else if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('[firebaseAdmin] Initialized using serviceAccountKey.json');
        } else {
            console.warn('[firebaseAdmin] Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY env vars and serviceAccountKey.json not found.');
            console.warn('[firebaseAdmin] /api/create-order will return 500 until these are configured.');
        }
    } catch (error) {
        console.error('Firebase Admin initialization error', error);
        adminInitError = error;
    }
}

export const db = admin.apps.length ? admin.firestore() : null;
export const dbError = adminInitError;
export default admin;

