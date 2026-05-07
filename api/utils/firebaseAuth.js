import admin from './firebaseAdmin.js';

export function getBearerToken(req) {
    const header = req.headers.authorization || req.headers.Authorization;

    if (!header || typeof header !== 'string') {
        return null;
    }

    if (!header.startsWith('Bearer ')) {
        return null;
    }

    return header.slice(7).trim();
}

export async function requireFirebaseUser(req) {
    const token = getBearerToken(req);

    if (!token) {
        const error = new Error('Missing Authorization bearer token');
        error.statusCode = 401;
        throw error;
    }

    const decodedToken = await admin.auth().verifyIdToken(token);

    if (decodedToken.email_verified === false) {
        const error = new Error('Email verification required');
        error.statusCode = 403;
        throw error;
    }

    return decodedToken;
}