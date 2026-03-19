import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Neural Library Guide - Bloom Intelligence Matrix
 * Processes user queries through the Gemini Engine while enforcing platform rules.
 */
export const generateAssistantResponse = onCall(
  { secrets: ["GEMINI_API_KEY"] },
  async (request) => {
    // 1. Validation Logic
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Atmospheric re-entry requires authentication.");
    }

    const { prompt, history } = request.data;
    if (!prompt) {
      throw new HttpsError("invalid-argument", "Missing cognitive input (prompt).");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new HttpsError("failed-precondition", "Gemini API Key missing from Secret Manager.");
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // 2. System Instructions (Rule Enforcement Protocol)
      const systemInstructions = `
        CORE IDENTITY: You are the "BloomBook AI Assistant," a specialized guide for the Web-Based Platform for Book Reselling and Renting.
        TOPICAL RESTRICTION: Limit all responses to: buying, selling, renting books, the "Hire a Tutor" module, and helping materials (video lectures/solved exercises).
        OUT-OF-SCOPE HANDLING: If a query is unrelated to BookBloom (e.g., cooking, coding, other industries), politely decline and redirect to platform services.
        ACADEMIC BOUNDARIES: Support is permitted for tutors and helping materials only.
        EXCLUDED: Do not discuss mobile apps, external price comparisons (Amazon), or your underlying tech stack (Firebase, Node.js, React).
        LANGUAGE: English only. Tone: Professional, helpful, and community-focused.
      `;

      // 3. Cognitive Processing
      const chat = model.startChat({
        history: history || [],
        generationConfig: { maxOutputTokens: 500 },
      });

      // Combine instructions with user prompt for strict adherence
      const result = await chat.sendMessage(`${systemInstructions}\n\nUser Query: ${prompt}`);
      const response = await result.response;

      return { text: response.text() };
    } catch (error) {
      logger.error("Bloom Intelligence Matrix error:", error);
      throw new HttpsError("internal", "Neural synchronization failed. Please try again.");
    }
  }
);
