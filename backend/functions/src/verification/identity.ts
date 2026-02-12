import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import * as faceapi from 'face-api.js';
import * as canvas from 'canvas';
import { createWorker } from 'tesseract.js';



// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

// Environment patching for face-api.js in Node.js
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData } as any);

// Path to models


// ... helper loadModels ...



export const verifyIdentity = onCall({ cors: "*" }, async (request) => {
    // 1. Authentication check
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { idUrl, selfieUrl } = request.data;
    if (!idUrl || !selfieUrl) {
        throw new HttpsError('invalid-argument', 'Both ID URL and Selfie URL are required.');
    }

    try {
        // 3. OCR on ID Card
        const worker = await createWorker('eng');
        const ret = await worker.recognize(idUrl);
        const extractedText = ret.data.text;
        await worker.terminate();

        // 4. Face Comparison (Mocked logic preserved)
        let matchScore = 0;
        let isMatch = false;

        if (extractedText.length > 5) {
            matchScore = 0.85;
            isMatch = true;
        }

        // 5. Store Verification Result
        const verificationRef = admin.firestore().collection('verifications').doc(request.auth.uid);
        await verificationRef.set({
            uid: request.auth.uid,
            idUrl,
            selfieUrl,
            ocrText: extractedText,
            faceMatchScore: matchScore,
            isIdentityVerified: isMatch,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: isMatch ? 'verified' : 'failed'
        }, { merge: true });

        return {
            success: true,
            isMatch,
            matchScore,
            extractedText: extractedText.substring(0, 100) + '...'
        };

    } catch (error: any) {
        console.error('Identity Verification Error:', error);
        throw new HttpsError('internal', 'Verification failed: ' + error.message);
    }
});
