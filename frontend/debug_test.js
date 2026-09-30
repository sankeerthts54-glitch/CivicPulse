const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, limit } = require('firebase/firestore');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

const db = getFirestore(app);

async function test() {
  console.log('1. Testing Firestore read...');
  try {
    const snap = await getDocs(query(collection(db, 'feedback'), limit(3)));
    console.log('   Firestore OK - docs found:', snap.size);
    snap.forEach(d => console.log('   Sample:', d.data().state, d.data().category, d.data().status));
  } catch (e) {
    console.error('   Firestore FAILED:', e.message);
    process.exit(1);
  }

  console.log('\n2. Testing Gemini API...');
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent('Say "OK" in one word.');
    console.log('   Gemini OK:', result.response.text().trim());
  } catch (e) {
    console.error('   Gemini FAILED:', e.message);
    process.exit(1);
  }

  console.log('\nAll tests passed!');
  process.exit(0);
}

test();
