import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Use createRequire for CJS module compatibility
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
let firestoreDb: FirebaseFirestore.Firestore;

function initializeFirebase(): FirebaseFirestore.Firestore {
    if (admin.apps.length === 0) {
        // Try to load service account from file first, then from environment variable
        let serviceAccount: any;

        const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');

        try {
            // Try loading from file using fs (ESM compatible)
            if (fs.existsSync(serviceAccountPath)) {
                const fileContent = fs.readFileSync(serviceAccountPath, 'utf-8');
                serviceAccount = JSON.parse(fileContent);
                console.log('[Firebase] Loaded service account from file');
            } else {
                throw new Error('File not found');
            }
        } catch {
            // Fall back to environment variable
            const envServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
            if (envServiceAccount) {
                serviceAccount = JSON.parse(envServiceAccount);
                console.log('[Firebase] Loaded service account from environment variable');
            } else {
                throw new Error('Firebase service account not found. Provide firebase-service-account.json or FIREBASE_SERVICE_ACCOUNT env var.');
            }
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        console.log('[Firebase] Admin SDK initialized');
    }

    return admin.firestore();
}

// Initialize
firestoreDb = initializeFirebase();

// Export Firestore instance and admin namespace
const db = firestoreDb;
const Timestamp = admin.firestore.Timestamp;

export { db, admin, Timestamp };
