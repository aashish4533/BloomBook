const { setGlobalOptions } = require("firebase-functions/v2");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Global options for all v2 functions in this codebase
setGlobalOptions({
    maxInstances: 10,
    region: "us-central1" // You can change this to your preferred region
});

// A simple test function for BookBloom
exports.checkStatus = onRequest((request, response) => {
    logger.info("Status check requested", { structuredData: true });
    response.send("BookBloom Backend is Online!");
});