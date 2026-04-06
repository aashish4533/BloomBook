import { onDocumentCreated, onDocumentDeleted, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const STATS_DOC = "_metadata/global_stats";

// Users
export const analyticsOnUserCreated = onDocumentCreated("users/{userId}", async () => {
    const db = getFirestore();
    return db.doc(STATS_DOC).set({ totalUsers: FieldValue.increment(1) }, { merge: true });
});

export const analyticsOnUserDeleted = onDocumentDeleted("users/{userId}", async () => {
    const db = getFirestore();
    return db.doc(STATS_DOC).set({ totalUsers: FieldValue.increment(-1) }, { merge: true });
});

// Books
export const analyticsOnBookCreated = onDocumentCreated("books/{bookId}", async (event) => {
    const db = getFirestore();
    const data = event.data?.data();
    const isActive = data?.status === 'active' ? 1 : 0;
    return db.doc(STATS_DOC).set({
        totalBooks: FieldValue.increment(1),
        activeBooks: FieldValue.increment(isActive),
    }, { merge: true });
});

export const analyticsOnBookDeleted = onDocumentDeleted("books/{bookId}", async (event) => {
    const db = getFirestore();
    const data = event.data?.data();
    const isActive = data?.status === 'active' ? -1 : 0;
    return db.doc(STATS_DOC).set({
        totalBooks: FieldValue.increment(-1),
        activeBooks: FieldValue.increment(isActive),
    }, { merge: true });
});

export const analyticsOnBookUpdated = onDocumentUpdated("books/{bookId}", async (event) => {
    const db = getFirestore();
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return null;

    if (before.status !== 'active' && after.status === 'active') {
        return db.doc(STATS_DOC).set({ activeBooks: FieldValue.increment(1) }, { merge: true });
    }
    if (before.status === 'active' && after.status !== 'active') {
        return db.doc(STATS_DOC).set({ activeBooks: FieldValue.increment(-1) }, { merge: true });
    }
    return null;
});

// Tuition Requests
export const analyticsOnTuitionRequestCreated = onDocumentCreated("tuition_requests/{requestId}", async () => {
    const db = getFirestore();
    return db.doc(STATS_DOC).set({ totalTuitionRequests: FieldValue.increment(1) }, { merge: true });
});

export const analyticsOnTuitionRequestDeleted = onDocumentDeleted("tuition_requests/{requestId}", async () => {
    const db = getFirestore();
    return db.doc(STATS_DOC).set({ totalTuitionRequests: FieldValue.increment(-1) }, { merge: true });
});

// Rentals
export const analyticsOnRentalCreated = onDocumentCreated("rentals/{rentalId}", async () => {
    const db = getFirestore();
    return db.doc(STATS_DOC).set({ totalRentals: FieldValue.increment(1) }, { merge: true });
});

export const analyticsOnRentalDeleted = onDocumentDeleted("rentals/{rentalId}", async () => {
    const db = getFirestore();
    return db.doc(STATS_DOC).set({ totalRentals: FieldValue.increment(-1) }, { merge: true });
});
