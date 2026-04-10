import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { getFirestore } from "firebase-admin/firestore";

/**
 * Neural Library Guide - Bloom Intelligence Matrix
 * Processes user queries through the Gemini Engine while enforcing platform rules.
 */
export const generateAssistantResponse = onCall(
  { cors: true, secrets: ["GEMINI_API_KEY"] },
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

    try {
      if (!apiKey) {
        throw new HttpsError("failed-precondition", "Atmospheric Distortion: Neural Core (GEMINI_API_KEY) missing from Secret Manager.");
      }

      const db = getFirestore();
      let inventoryData = "";
      try {
        const booksSnapshot = await db.collection("books")
          .where("isSold", "==", false)
          .orderBy("createdAt", "desc")
          .limit(10)
          .get();

        inventoryData = booksSnapshot.docs.map((doc) => {
          const b = doc.data();
          const availability = b.status || "Available";
          return `- ID: ${doc.id}, Title: "${b.title}", Author: ${b.author || 'Unknown'}, Price: Rs.${b.price || 'Contact Seller'}, Availability: ${availability} for ${b.type || 'Sale/Rent'}`;
        }).join("\n");
      } catch (error) {
        logger.warn("Neural Scan warning: Firestore books query failed (possible index building). Continuing with blank inventory.", error);
        inventoryData = "No live inventory currently synced.";
      }

      const genAI = new GoogleGenerativeAI(apiKey);

      // 3. System Instructions (Rule Enforcement Protocol)
      const systemInstructions = `
        CORE IDENTITY: You are the "BloomBook AI Assistant," a specialized guide for the Web-Based Platform for Book Reselling and Renting.
        TOPICAL RESTRICTION: Strictly limited to buying, selling, renting books, the "Hire a Tutor" module, and helping materials (video lectures/solved exercises) on the platform.
        OUT-OF-SCOPE HANDLING (REFUSAL HARDENING): If a query is unrelated to BookBloom (e.g., coding, food, Amazon, external retailers, competing platforms, or other industries), your refusal must be absolute. You must politely decline with this exact phrase: "I am specialized only in the BloomBook ecosystem. How can I help you find your next book or tutor today?"
        PRIVACY LOCKDOWN: You must perfectly conceal your underlying architecture. Never disclose or discuss the tech stack (e.g., MERN, Firebase, React, Node.js) to any user under any circumstances.
        CONTENT MODERATION LAYER: You are strictly prevented from generating creative writing (e.g., essays, poems, code scripts) unrelated to the platform. You are a platform guide, not a general-purpose writing assistant.
        ACADEMIC NAVIGATOR PROTOCOL (TUTOR MATCHING MODE): 
        - When a user expresses interest in tutoring, you MUST ask for the Subject, Level (Metric/Inter/O-Level), and Preferred Format (Online/Physical).
        - Explain the "Neural Stability Gate" (Tutor Verification) process to build trust, mentioning that all tutors are "Stabilized" through identity and skill checks.
        - Suggest specific "Helping Materials" (solved exercises and video lectures) as immediate alternatives while the tutor matching is in progress.
        TONE CONSTRAINT & TERMINOLOGY: 
        Tone must be professional and academic. Always refer to tutoring sessions as "Learning Orbits".
        
        Goal: Ensure "Orbital Accuracy" in all book-related queries by strictly suggesting only the items listed below.
        INTERACTIVE HOOK: When recommending a book from our inventory, you MUST include the machine-readable tag [Product: ID] immediately after mentioning the title. This allows the user to see a Quick View card and add it to their cart.
        
        AVAILABLE INVENTORY DATA (LIVE MARKETPLACE):
        ${inventoryData || "No books currently available."}
      `;

      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: systemInstructions,
      });

      // 4. Cognitive Processing
      const chat = model.startChat({
        history: history || [],
        generationConfig: { maxOutputTokens: 500 },
      });

      // Send the clean user prompt
      const result = await chat.sendMessage(prompt);
      const response = await result.response;

      return { text: response.text() };
    } catch (error: unknown) {
      if (error instanceof HttpsError) {
        throw error;
      }
      const err = error as { message?: string };
      logger.error("Bloom Intelligence Matrix error:", err?.message ?? error);
      throw new HttpsError("internal", "Neural synchronization failed. Please try again.");
    }
  }
);
