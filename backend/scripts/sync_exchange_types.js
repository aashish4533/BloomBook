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
    projectId: 'bookbloom-2026'
  });
  console.log('Initialized with default project ID');
}

async function syncBookTypes() {
  const db = admin.firestore();
  const booksRef = db.collection('books');
  const snapshot = await booksRef.get();
  
  let batch = db.batch();
  let count = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    let availableFor = data.availableFor || [];
    let needsUpdate = false;

    // Sync Exchange
    if ((data.type === 'exchange' || data.type === 'both') && !availableFor.includes('exchange')) {
      if (!availableFor.includes('exchange')) {
        availableFor.push('exchange');
        needsUpdate = true;
      }
    }
    // Sync Sale
    if ((data.type === 'sell' || data.type === 'both') && !availableFor.includes('sale')) {
      if (!availableFor.includes('sale')) {
        availableFor.push('sale');
        needsUpdate = true;
      }
    }
    // Sync Rent
    if (data.type === 'rent' && !availableFor.includes('rent')) {
      if (!availableFor.includes('rent')) {
        availableFor.push('rent');
        needsUpdate = true;
      }
    }

    // Also check for exchangePreferences as an indicator
    if (data.exchangePreferences && !availableFor.includes('exchange')) {
      availableFor.push('exchange');
      needsUpdate = true;
    }

    if (needsUpdate) {
      batch.update(doc.ref, { availableFor });
      count++;
      console.log(`Syncing ${data.title || doc.id}: [${availableFor.join(', ')}]`);
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Successfully synced 'availableFor' array for ${count} books.`);
  } else {
    console.log('No books found requiring sync.');
  }
}

syncBookTypes().catch(err => {
  console.error('Critical Error:', err);
  process.exit(1);
});
