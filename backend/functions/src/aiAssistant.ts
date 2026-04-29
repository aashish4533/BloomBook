import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {
  GoogleGenerativeAI,
  SchemaType,
  type FunctionDeclaration,
  type FunctionCall,
} from "@google/generative-ai";

import { getFirestore } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { BOOKBLOOM_SITE_GUIDE_FOR_AI } from "./bookbloomSiteGuide";

const ASSISTANT_TOOLS: FunctionDeclaration[] = [
  {
    name: "searchInventory",
    description:
      "Search BloomBook marketplace for active book listings by title, author, topic, or keywords. Call this whenever the user asks if a book exists, wants a price, or needs recommendations from current stock.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        keywords: {
          type: SchemaType.STRING,
          description: "Keywords to match against title and author (e.g. 'Harry Potter', 'calculus').",
        },
        limit: {
          type: SchemaType.NUMBER,
          description: "Maximum listings to return (default 18, max 25).",
        },
      },
      required: ["keywords"],
    },
  },
  {
    name: "searchTutors",
    description:
      "Search BloomBook tutors by subject, specialization, or name when the user asks about tutoring or Learning Orbits.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        keywords: {
          type: SchemaType.STRING,
          description: "Keywords for subject, topic, or tutor name.",
        },
        limit: {
          type: SchemaType.NUMBER,
          description: "Maximum tutors to return (default 12, max 20).",
        },
      },
      required: ["keywords"],
    },
  },
];

/** Splits and normalizes search keywords for inventory/tutor matching. */
function tokenizeKeywords(keywords: string): string[] {
  return keywords
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^\p{L}\p{N}-]/gu, ""))
    .filter((t) => t.length > 1)
    .slice(0, 8);
}

/** Queries active book listings and returns a text summary for the model. */
async function runSearchInventory(
  db: Firestore,
  keywords: string,
  maxResults: number
): Promise<string> {
  const terms = tokenizeKeywords(keywords);
  if (!terms.length) {
    return "No searchable keywords provided.";
  }
  const cap = Math.min(Math.max(Math.floor(maxResults) || 18, 1), 25);

  let snapshot;
  try {
    snapshot = await db
      .collection("books")
      .where("isSold", "==", false)
      .orderBy("createdAt", "desc")
      .limit(150)
      .get();
  } catch (error) {
    logger.warn("searchInventory: books query failed", error);
    return "Could not read inventory (database error).";
  }

  const lines: string[] = [];
  for (const docSnap of snapshot.docs) {
    const b = docSnap.data();
    const title = String(b.title ?? "").toLowerCase();
    const author = String(b.author ?? "").toLowerCase();
    const hay = `${title} ${author}`;
    if (!terms.some((t) => hay.includes(t))) continue;

    const availability = b.status || "Available";
    lines.push(
      `- ID: ${docSnap.id}, Title: "${b.title}", Author: ${b.author || "Unknown"}, Price: Rs.${b.price ?? "—"}, Availability: ${availability} for ${b.type || "Sale/Rent"}`
    );
    if (lines.length >= cap) break;
  }

  if (!lines.length) {
    return `No active listings matched "${keywords}".`;
  }
  return lines.join("\n");
}

/** Queries tutors and returns a text summary for the model. */
async function runSearchTutors(
  db: Firestore,
  keywords: string,
  maxResults: number
): Promise<string> {
  const terms = tokenizeKeywords(keywords);
  if (!terms.length) {
    return "No searchable keywords provided.";
  }
  const cap = Math.min(Math.max(Math.floor(maxResults) || 12, 1), 20);

  let snapshot;
  try {
    snapshot = await db.collection("tutors").limit(120).get();
  } catch (error) {
    logger.warn("searchTutors: tutors query failed", error);
    return "Could not read tutors (database error).";
  }

  const lines: string[] = [];
  for (const docSnap of snapshot.docs) {
    const t = docSnap.data();
    const name = String(t.name ?? "").toLowerCase();
    const subject = String(t.subject ?? "").toLowerCase();
    const spec = String(t.specialization ?? "").toLowerCase();
    const bio = String(t.bio ?? "").toLowerCase();
    const hay = `${name} ${subject} ${spec} ${bio}`;
    if (!terms.some((term) => hay.includes(term))) continue;

    const rate = t.hourlyRate ?? "—";
    const verified = t.verified === true || String(t.verificationStatus ?? "") === "Verified";
    lines.push(
      `- Tutor ID: ${docSnap.id}, Name: "${t.name || "Tutor"}", Subject: ${t.subject || "—"}, Specialization: ${t.specialization || "—"}, Hourly: Rs.${rate}, Verified: ${verified}`
    );
    if (lines.length >= cap) break;
  }

  if (!lines.length) {
    return `No tutors matched "${keywords}".`;
  }
  return lines.join("\n");
}

/** Runs the tool named in a Gemini function call and returns a JSON-serializable result. */
async function dispatchToolCall(
  db: Firestore,
  call: FunctionCall
): Promise<object> {
  const args = (call.args || {}) as { keywords?: string; limit?: number };
  const kw = String(args.keywords ?? "").trim();

  if (call.name === "searchInventory") {
    const text = await runSearchInventory(db, kw, args.limit ?? 18);
    return { result: text };
  }
  if (call.name === "searchTutors") {
    const text = await runSearchTutors(db, kw, args.limit ?? 12);
    return { result: text };
  }
  return { error: `Unknown tool: ${call.name}` };
}

/** System prompt: identity, boundaries, and embedded site map for the assistant. */
function buildSystemInstructions(): string {
  return `
        CORE IDENTITY: You are the "BloomBook AI Assistant," a specialized guide for the Web-Based Platform for Book Reselling and Renting.
        TOPICAL FOCUS: Buying, selling, renting, and exchanging books; the "Hire a Tutor" module; and study materials (video lectures / solved exercises) on the platform.
        CONVERSATION & BOUNDARIES: Be friendly and conversational—reply warmly to greetings, thanks, and brief chit-chat. If the user asks for something clearly outside BloomBook (other retailers, unrelated homework in other domains, etc.), gently steer back: you help with books, rentals, exchanges, tutors, and materials on BloomBook only—offer concrete next steps on the platform.
        PRIVACY: Never disclose or discuss implementation details (frameworks, databases, cloud vendors, or internal architecture).
        CONTENT: Do not write long unrelated essays, poems, or arbitrary code. Stay a platform guide.
        WEBSITE NAVIGATION: Use the SITE MAP below to answer where features live (URLs/paths). This is the authoritative map of BookBloom pages—not a live crawl of third-party sites.
        DATA TRUTH: For books in stock or tutor availability you MUST call searchInventory / searchTutors and base factual claims on tool results. Never invent prices, IDs, or listings. If tools return no rows, say honestly that nothing matched and suggest refining keywords or browsing the marketplace.
        ACADEMIC NAVIGATOR (TUTORS): When the user wants tutoring, ask for Subject, Level (e.g. Metric/Inter/O-Level), and preferred format (online/physical). Mention tutor verification ("Neural Stability Gate") and suggest helping materials where relevant. Refer to tutoring sessions as "Learning Orbits."
        PRODUCT TAGS: When recommending a book that appears in searchInventory results, include [Product: FIRESTORE_DOCUMENT_ID] right after the title so the UI can show a cart card.

        ${BOOKBLOOM_SITE_GUIDE_FOR_AI}
      `;
}

/**
 * Neural Library Guide - Bloom Intelligence Matrix
 * Processes user queries through the Gemini Engine while enforcing platform rules.
 */
export const generateAssistantResponse = onCall(
  { cors: true, secrets: ["GEMINI_API_KEY"] },
  async (request) => {
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
        throw new HttpsError(
          "failed-precondition",
          "Atmospheric Distortion: Neural Core (GEMINI_API_KEY) missing from Secret Manager."
        );
      }

      const db = getFirestore();
      const genAI = new GoogleGenerativeAI(apiKey);

      const systemInstructions = buildSystemInstructions();

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: systemInstructions,
        tools: [{ functionDeclarations: ASSISTANT_TOOLS }],
      });

      const rawHistory = Array.isArray(history) ? history : [];
      const cleanHistory = rawHistory.filter(
        (h: { role?: string; parts?: { text?: string }[] }) =>
          h?.role && h?.parts?.[0]?.text
      );

      const chat = model.startChat({
        history: cleanHistory,
        generationConfig: { maxOutputTokens: 800 },
      });

      let result = await chat.sendMessage(prompt);
      let response = result.response;

      const maxToolRounds = 8;
      for (let round = 0; round < maxToolRounds; round++) {
        const calls = response.functionCalls();
        if (!calls?.length) break;

        const parts = [];
        for (const call of calls) {
          const toolResult = await dispatchToolCall(db, call);
          parts.push({
            functionResponse: {
              name: call.name,
              response: toolResult,
            },
          });
        }

        result = await chat.sendMessage(parts);
        response = result.response;
      }

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
