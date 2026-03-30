const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Path to service account credentials
const serviceAccountPath = path.join(__dirname, '../credentials.json');

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Initialized with credentials.json');
} else {
  // Fallback for emulators or if credentials are missing
  admin.initializeApp({
    projectId: 'bookbloom-2026' // Adjust to your actual project ID
  });
  console.log('Initialized with default project ID (check FIRESTORE_EMULATOR_HOST if using local)');
}

async function fixCurrency() {
  const db = admin.firestore();
  const booksRef = db.collection('books');
  const snapshot = await booksRef.get();
  
  let batch = db.batch();
  let count = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    let needsUpdate = false;
    let updates = {};

    // Condition: Price < 500 (likely USD mock data)
    if (data.price !== undefined && data.price < 500) {
      updates.price = data.price * 280;
      needsUpdate = true;
    }
    
    // Condition: Rent Price < 200 (likely USD mock data)
    if (data.rentPrice !== undefined && data.rentPrice < 200) {
      updates.rentPrice = data.rentPrice * 280;
      needsUpdate = true;
    }

    if (needsUpdate) {
      batch.update(doc.ref, updates);
      count++;
      console.log(`Queueing update for ${data.title}: ${JSON.stringify(updates)}`);
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Successfully converted currency for ${count} books.`);
  } else {
    console.log('No books found requiring currency conversion.');
  }
}

fixCurrency().catch(err => {
  console.error('Critical Error:', err);
  process.exit(1);
});
