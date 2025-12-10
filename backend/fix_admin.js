
const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.GCLOUD_PROJECT = 'book-bloom-emulator';

admin.initializeApp({
  projectId: 'book-bloom-emulator'
});

const db = admin.firestore();

async function fixAdminPermissions() {
  console.log('Fixing admin permissions...');
  
  // 1. List all users in 'users' collection
  const usersSnapshot = await db.collection('users').get();
  
  if (usersSnapshot.empty) {
    console.log('No users found in Firestore "users" collection.');
    // Check Auth users? (Can't easily check Auth in emulator without Auth Admin SDK knowing the port, usually 9099)
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    try {
        const listUsersResult = await admin.auth().listUsers(10);
        listUsersResult.users.forEach((userRecord) => {
            console.log('Found Auth user:', userRecord.uid, userRecord.email);
            // Create Firestore doc if missing
            db.collection('users').doc(userRecord.uid).set({
                email: userRecord.email,
                role: 'admin',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log(`Granted admin role to Auth user ${userRecord.email}`);
        });
    } catch (e) {
        console.error('Error listing auth users:', e);
    }
  } else {
    usersSnapshot.forEach(async (doc) => {
      const userData = doc.data();
      console.log(`User ${doc.id}: role=${userData.role}`);
      
      if (userData.role !== 'admin') {
        console.log(`Updating user ${doc.id} to admin...`);
        await doc.ref.update({ role: 'admin' });
        console.log('Updated.');
      } else {
        console.log(`User ${doc.id} is already admin.`);
      }
    });
  }
}

fixAdminPermissions().then(() => {
  console.log('Done.');
  // terminate?
}).catch(console.error);
