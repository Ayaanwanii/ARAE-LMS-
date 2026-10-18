
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ranks = [
    { name: 'Novice', min: 0, max: 9, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200', icon: 'N', order: 1 },
    { name: 'Explorer', min: 10, max: 29, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200', icon: 'E', order: 2 },
    { name: 'Achiever', min: 30, max: 59, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-200', icon: 'A', order: 3 },
    { name: 'Master', min: 60, max: null, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200', icon: 'M', order: 4 },
];

async function initRanks() {
    console.log('Checking ranks collection...');
    const ranksRef = collection(db, 'ranks');
    const snapshot = await getDocs(ranksRef);

    if (!snapshot.empty) {
        console.log('Ranks collection already has documents. Skipping initialization.');
        return;
    }

    console.log('Initializing ranks...');
    for (const rank of ranks) {
        await addDoc(ranksRef, rank);
        console.log(`Added rank: ${rank.name}`);
    }
    console.log('Done.');
}

initRanks().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
