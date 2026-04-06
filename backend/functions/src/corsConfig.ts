import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getStorage } from "firebase-admin/storage";

export const configureStorageCors = onRequest(async (req, res) => {
    try {
        const bucket = getStorage().bucket();
        await bucket.setCorsConfiguration([
            {
                origin: ["*"],
                method: ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"],
                responseHeader: ["Content-Type", "x-goog-resumable"],
                maxAgeSeconds: 3600,
            },
        ]);
        logger.info("CORS configuration set successfully");
        res.status(200).send("CORS configuration set successfully");
    } catch (error) {
        logger.error("Error setting CORS configuration", error);
        res.status(500).send("Error setting CORS configuration");
    }
});
