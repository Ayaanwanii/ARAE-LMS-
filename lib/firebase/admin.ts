import type { Firestore } from 'firebase-admin/firestore';
import type { App } from 'firebase-admin/app';
import { createRequire } from 'module';

// Lazy singleton promise to handle async initialization
let adminDbPromise: Promise<Firestore> | undefined;

export async function getAdminDb(): Promise<Firestore> {
    if (adminDbPromise) return adminDbPromise;

    adminDbPromise = (async () => {
        try {
            console.log('[AdminSDK] Loading modules manually via require...');

            // Use createRequire to bypass Webpack/Turbopack import rewriting
            const require = createRequire(import.meta.url);
            const { initializeApp, getApps, cert, getApp } = require('firebase-admin/app');
            const { getFirestore } = require('firebase-admin/firestore');

            console.log('[AdminSDK] Initializing...');
            const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
            const serviceAccount = serviceAccountEnv
                ? JSON.parse(serviceAccountEnv)
                : undefined;

            console.log('[AdminSDK] Service Account Present:', !!serviceAccount);

            let adminApp: App;

            // Note: We use the imported functions from the require call
            if (!getApps().length) {
                console.log('[AdminSDK] No existing apps. Initializing new app.');
                const options: any = {
                    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
                };

                if (serviceAccount) {
                    console.log('[AdminSDK] Using explicit service account credential.');
                    options.credential = cert(serviceAccount);
                } else {
                    console.log('[AdminSDK] Using Application Default Credentials (ADC).');
                }

                adminApp = initializeApp(options);
                console.log('[AdminSDK] App initialized successfully.');
            } else {
                console.log('[AdminSDK] Using existing app.');
                adminApp = getApp();
            }

            const db = getFirestore(adminApp);
            console.log('[AdminSDK] Firestore initialized.');
            return db as Firestore;
        } catch (error) {
            console.error('[AdminSDK] Initialization Error:', error);
            // Reset promise so retry ensures fresh attempt
            adminDbPromise = undefined;
            throw new Error('Failed to initialize Firebase Admin SDK');
        }
    })();

    return adminDbPromise;
}
