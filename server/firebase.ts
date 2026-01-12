import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Initialize Firebase Admin SDK
let firestoreDb: admin.firestore.Firestore | null = null;
let firebaseTimestamp: typeof admin.firestore.Timestamp;

function getServiceAccountPath(): string {
    // In production (CJS bundle), __dirname might work differently
    // Try multiple possible paths
    const possiblePaths = [
        path.join(process.cwd(), 'firebase-service-account.json'),
        path.join(process.cwd(), '..', 'firebase-service-account.json'),
        '/app/firebase-service-account.json', // Railway container path
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            return p;
        }
    }
    return '';
}

function initializeFirebase(): admin.firestore.Firestore {
    if (admin.apps.length === 0) {
        let serviceAccount: admin.ServiceAccount | null = null;

        // Try environment variable first (production)
        const envServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (envServiceAccount) {
            try {
                serviceAccount = JSON.parse(envServiceAccount);
                console.log('[Firebase] Loaded service account from environment variable');
            } catch (e) {
                console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT env var');
            }
        }

        // Fall back to file (development)
        if (!serviceAccount) {
            const serviceAccountPath = getServiceAccountPath();
            if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
                try {
                    const fileContent = fs.readFileSync(serviceAccountPath, 'utf-8');
                    serviceAccount = JSON.parse(fileContent);
                    console.log('[Firebase] Loaded service account from file:', serviceAccountPath);
                } catch (e) {
                    console.error('[Firebase] Failed to load service account from file');
                }
            }
        }

        if (!serviceAccount) {
            throw new Error('Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT env var or provide firebase-service-account.json file.');
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        console.log('[Firebase] Admin SDK initialized');
    }

    return admin.firestore();
}

// Initialize on first import
firestoreDb = initializeFirebase();
firebaseTimestamp = admin.firestore.Timestamp;

// Export Firestore instance and Timestamp
const db = firestoreDb;
const Timestamp = firebaseTimestamp;

export { db, admin, Timestamp };
