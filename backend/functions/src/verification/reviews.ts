import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp();
}

export const addReview = onCall({ cors: "*" }, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { tutorId, rating, text } = request.data;
    if (!tutorId || !rating || !text) {
        throw new HttpsError('invalid-argument', 'Tutor ID, rating, and text are required.');
    }

    try {
        let sentimentScore = 0;
        const lowerText = text.toLowerCase();
        let positiveCount = 0;
        let negativeCount = 0;
        const positiveWords = ['great', 'excellent', 'good', 'amazing', 'helpful'];
        const negativeWords = ['bad', 'poor', 'terrible', 'unhelpful', 'rude'];

        positiveWords.forEach(word => { if (lowerText.includes(word)) positiveCount++; });
        negativeWords.forEach(word => { if (lowerText.includes(word)) negativeCount++; });

        if (positiveCount > negativeCount) sentimentScore = 0.8;
        else if (negativeCount > positiveCount) sentimentScore = -0.8;
        else sentimentScore = 0;

        const reviewRef = admin.firestore().collection('reviews').doc();
        await reviewRef.set({
            tutorId,
            studentId: request.auth.uid,
            rating,
            text,
            sentimentScore,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        const tutorRef = admin.firestore().collection('tutors').doc(tutorId);
        await admin.firestore().runTransaction(async (transaction) => {
            const tutorDoc = await transaction.get(tutorRef);
            if (!tutorDoc.exists) {
                transaction.set(tutorRef, {
                    ratingSum: rating,
                    reviewCount: 1,
                    averageRating: rating
                }, { merge: true });
            } else {
                const data = tutorDoc.data();
                const newSum = (data?.ratingSum || 0) + rating;
                const newCount = (data?.reviewCount || 0) + 1;
                const newAvg = newSum / newCount;
                transaction.update(tutorRef, {
                    ratingSum: newSum,
                    reviewCount: newCount,
                    averageRating: newAvg
                });
            }
        });

        return { success: true, sentimentScore };

    } catch (error: any) {
        console.error('Review Submission Error:', error);
        throw new HttpsError('internal', error.message);
    }
});
