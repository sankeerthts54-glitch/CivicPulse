const fs = require('fs');
const dotenv = require('dotenv');
const { initializeApp } = require('firebase/app');
const { getFirestore, writeBatch, doc, GeoPoint } = require('firebase/firestore');

// Load env vars
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadData() {
  console.log('Reading seed data...');
  const rawData = fs.readFileSync('../data/seed/seed_feedback.json', 'utf8');
  const records = JSON.parse(rawData);
  console.log(`Uploading ${records.length} records to Firestore project: ${firebaseConfig.projectId}...`);

  let batch = writeBatch(db);
  let count = 0;

  for (const record of records) {
    const docRef = doc(db, 'feedback', record.feedbackId);
    
    // Format location if exists
    let locationData = null;
    if (record.location && record.location.lat) {
       locationData = { lat: record.location.lat, lng: record.location.lng };
    }

    batch.set(docRef, {
      ...record,
      location: locationData // simplified location object for client SDK
    });

    count++;

    // Firestore batch limit is 500
    if (count % 400 === 0) {
      await batch.commit();
      console.log(`  Committed ${count} / ${records.length}...`);
      batch = writeBatch(db);
    }
  }

  if (count % 400 !== 0) {
    await batch.commit();
  }

  console.log('✅ Upload complete! Database is populated.');
  process.exit(0);
}

uploadData().catch(err => {
  console.error('❌ Error uploading data:', err);
  process.exit(1);
});
