
const admin = require('firebase-admin');

// Configure environment for emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'book-bloom-emulator';

admin.initializeApp({
    projectId: 'book-bloom-emulator'
});

const db = admin.firestore();
const auth = admin.auth();

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'password123'; // Simple password for local dev
const ADMIN_UID = 'admin-user-id';

async function seedAdmin() {
    console.log(`Seeding admin user: ${ADMIN_EMAIL}...`);

    try {
        // 1. Create or Update Auth User
        try {
            await auth.createUser({
                uid: ADMIN_UID,
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                displayName: 'System Admin',
                emailVerified: true
            });
            console.log('✅ Auth user created.');
        } catch (error) {
            if (error.code === 'auth/uid-already-exists' || error.code === 'auth/email-already-exists') {
                console.log('ℹ️ Auth user already exists. Updating password...');
                await auth.updateUser(ADMIN_UID, {
                    password: ADMIN_PASSWORD,
                    emailVerified: true
                });
                console.log('✅ Auth user updated.');
            } else {
                throw error;
            }
        }

        // 2. Create Firestore Admin Document
        console.log('Creating Firestore user document...');
        await db.collection('users').doc(ADMIN_UID).set({
            email: ADMIN_EMAIL,
            role: 'admin', // KEY: This grants permission based on firestore.rules
            firstName: 'System',
            lastName: 'Admin',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log('✅ Firestore admin document created/updated.');
        console.log('\n----------------------------------------');
        console.log('🎉 Admin Setup Complete!');
        console.log(`Email:    ${ADMIN_EMAIL}`);
        console.log(`Password: ${ADMIN_PASSWORD}`);
        console.log('----------------------------------------\n');

    } catch (error) {
        console.error('❌ Error seeding admin:', error);
    }
}

seedAdmin();
