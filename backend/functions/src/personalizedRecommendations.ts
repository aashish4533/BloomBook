import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {
  getFirestore,
  DocumentData,
  Firestore,
  QuerySnapshot,
} from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface LibrarianRecommendation {
  id: string;
  title: string;
  author: string;
  genre: string;
  summary: string;
  relevance: string;
  difficulty: string;
  bloom_score: number;
}

function bookAvailable(data: DocumentData): boolean {
  if (data.isSold === true) return false;
  if (data.listingStatus === "sold" || data.listingStatus === "reserved") return false;
  if (data.status != null && data.status !== "" && data.status !== "active") return false;
  return true;
}

async function loadUserReadingProfile(
  db: Firestore,
  uid: string
): Promise<{
  profileLines: string[];
  categoryCounts: Record<string, number>;
  authorSet: Set<string>;
}> {
  const profileLines: string[] = [];
  const categoryCounts: Record<string, number> = {};
  const authorSet = new Set<string>();
  const bookIdsForCategory = new Set<string>();

  const bumpCat = (c?: string) => {
    if (!c || typeof c !== "string") return;
    const k = c.trim();
    if (!k) return;
    categoryCounts[k] = (categoryCounts[k] || 0) + 1;
  };

  const wl = await db.collection("wishlists").where("userId", "==", uid).limit(40).get();
  for (const d of wl.docs) {
    const w = d.data();
    profileLines.push(
      `Wishlist (${w.type || "buy"}): "${w.title || "?"}" by ${w.author || "unknown"}`
    );
    if (w.author) authorSet.add(String(w.author).toLowerCase().trim());
    if (w.bookId) bookIdsForCategory.add(String(w.bookId));
  }

  let purchasesSnap: QuerySnapshot;
  try {
    purchasesSnap = await db
      .collection("purchases")
      .where("buyerId", "==", uid)
      .orderBy("timestamp", "desc")
      .limit(25)
      .get();
  } catch {
    purchasesSnap = await db
      .collection("purchases")
      .where("buyerId", "==", uid)
      .limit(25)
      .get();
  }
  for (const d of purchasesSnap.docs) {
    const p = d.data();
    profileLines.push(
      `Purchased: "${p.bookTitle || p.title || "?"}" by ${p.author || "unknown"}`
    );
    if (p.author) authorSet.add(String(p.author).toLowerCase().trim());
    if (p.bookId) bookIdsForCategory.add(String(p.bookId));
  }

  try {
    const rRenter = await db.collection("rentals").where("renterId", "==", uid).limit(25).get();
    for (const d of rRenter.docs) {
      const r = d.data();
      profileLines.push(
        `Rented (borrower): "${r.bookTitle || "?"}" by ${r.author || "unknown"}`
      );
      if (r.author) authorSet.add(String(r.author).toLowerCase().trim());
      if (r.bookId) bookIdsForCategory.add(String(r.bookId));
    }
    const rLender = await db.collection("rentals").where("lenderId", "==", uid).limit(25).get();
    for (const d of rLender.docs) {
      const r = d.data();
      profileLines.push(
        `Rental listed (lender): "${r.bookTitle || "?"}" by ${r.author || "unknown"}`
      );
      if (r.author) authorSet.add(String(r.author).toLowerCase().trim());
      if (r.bookId) bookIdsForCategory.add(String(r.bookId));
    }
  } catch (e) {
    logger.warn("rentals profile load failed", e);
  }

  let salesSnap: QuerySnapshot;
  try {
    salesSnap = await db
      .collection("sales")
      .where("sellerId", "==", uid)
      .orderBy("date", "desc")
      .limit(15)
      .get();
  } catch {
    salesSnap = await db.collection("sales").where("sellerId", "==", uid).limit(15).get();
  }
  for (const d of salesSnap.docs) {
    const s = d.data();
    profileLines.push(
      `Sold: "${s.bookTitle || s.title || "?"}" by ${s.author || "unknown"}`
    );
    if (s.author) authorSet.add(String(s.author).toLowerCase().trim());
    if (s.bookId) bookIdsForCategory.add(String(s.bookId));
  }

  const ids = [...bookIdsForCategory].slice(0, 40);
  if (ids.length > 0) {
    const refs = ids.map((id) => db.collection("books").doc(id));
    const bookSnaps = await db.getAll(...refs);
    for (const snap of bookSnaps) {
      if (!snap.exists) continue;
      const b = snap.data()!;
      bumpCat(b.category as string | undefined);
    }
  }

  return { profileLines, categoryCounts, authorSet };
}

type Candidate = { id: string; rec: Record<string, unknown> };

async function loadCandidateBooks(db: Firestore, maxCandidates: number): Promise<Candidate[]> {
  const snap = await db.collection("books").orderBy("createdAt", "desc").limit(150).get();
  const out: Candidate[] = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    if (!bookAvailable(data)) continue;
    out.push({
      id: doc.id,
      rec: {
        id: doc.id,
        title: data.title,
        author: data.author || "Unknown",
        category: data.category || "General",
        price: data.price,
        condition: data.condition,
      },
    });
    if (out.length >= maxCandidates) break;
  }
  return out;
}

function fallbackFromCandidates(
  candidates: Candidate[],
  categoryCounts: Record<string, number>,
  authorSet: Set<string>
): LibrarianRecommendation[] {
  if (candidates.length === 0) return [];

  const ranked = candidates.map((c) => {
    const cat = String(c.rec.category || "");
    let score = 0;
    const entries = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
    if (entries.length > 0) {
      const top = entries[0][0];
      if (cat === top) score += 10;
      else if (entries.some(([k]) => k === cat)) score += 5;
    }
    const auth = String(c.rec.author || "").toLowerCase().trim();
    if (auth && authorSet.has(auth)) score += 4;
    score += Math.random();
    return { c, score };
  });
  ranked.sort((a, b) => b.score - a.score);

  return ranked.slice(0, 5).map((row, i) => {
    const c = row.c;
    const cat = String(c.rec.category || "General");
    return {
      id: c.id,
      title: String(c.rec.title || "Book"),
      author: String(c.rec.author || "Unknown"),
      genre: cat,
      summary: `Listed on BookBloom — ${String(c.rec.condition || "Good")} condition. Rs. ${c.rec.price ?? "—"}.`,
      relevance:
        Object.keys(categoryCounts).length > 0
          ? `Picked to match your categories and history on BookBloom.`
          : "A fresh listing you might like on the marketplace.",
      difficulty: "Intermediate",
      bloom_score: Math.min(95, 72 + (i + 1) * 4),
    };
  });
}

function parseGeminiJson(text: string): LibrarianRecommendation[] | null {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as { recommendations?: LibrarianRecommendation[] };
    if (!Array.isArray(parsed.recommendations)) return null;
    return parsed.recommendations;
  } catch {
    return null;
  }
}

/**
 * Personalized marketplace recommendations from wishlist + purchase/rental/sale history.
 * Uses Gemini when GEMINI_API_KEY is configured; otherwise ranks candidates locally.
 */
export const getAntigravityRecommendations = onCall(
  { cors: true, secrets: ["GEMINI_API_KEY"] },
  async (request) => {
    try {
      const db = getFirestore();
      const uid = request.auth?.uid;

      const candidates = await loadCandidateBooks(db, 80);
      if (candidates.length === 0) {
        return { recommendations: [] as LibrarianRecommendation[] };
      }

      let categoryCounts: Record<string, number> = {};
      let authorSet = new Set<string>();
      let profileLines: string[] = [];

      if (uid) {
        const profile = await loadUserReadingProfile(db, uid);
        categoryCounts = profile.categoryCounts;
        authorSet = profile.authorSet;
        profileLines = profile.profileLines;
      }

      const profileText =
        profileLines.length > 0
          ? profileLines.join("\n")
          : "No wishlist or transaction history yet — suggest broadly appealing listings.";

      const idSet = new Set(candidates.map((c) => c.id));
      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
          const candidateJson = JSON.stringify(candidates.map((c) => c.rec));
          const prompt = `You are the BookBloom book recommendations assistant. Recommend books from the candidate list ONLY.

User profile (wishlist + past purchases, rentals, and sales as seller):
${profileText}

Candidate books (use ONLY these exact "id" values — each recommendation must copy id, title, author from the matching candidate):
${candidateJson}

Respond with ONLY valid JSON (no markdown fences), shape:
{"recommendations":[{"id":"","title":"","author":"","genre":"","summary":"","relevance":"","difficulty":"","bloom_score":0}]}

Rules:
- Exactly 5 recommendations (or fewer if fewer than 5 candidates).
- Every "id" MUST appear in the candidate list above.
- "genre" should reflect the book's category (non-fiction vs fiction style ok).
- "summary":1-2 sentences, under 320 characters, about why it fits this user.
- "relevance": one short phrase tying to their wishlist or history.
- "difficulty": one of: Beginner, Intermediate, Advanced Science
- "bloom_score": integer 60-98`;

          const result = await model.generateContent(prompt);
          const text = result.response.text();
          const parsed = parseGeminiJson(text);
          if (parsed && parsed.length > 0) {
            const cleaned = parsed
              .filter((r) => r && typeof r.id === "string" && idSet.has(r.id))
              .slice(0, 5);
            if (cleaned.length > 0) {
              const byId = new Map(candidates.map((c) => [c.id, c]));
              const merged: LibrarianRecommendation[] = cleaned.map((r) => {
                const cand = byId.get(r.id)!;
                return {
                  id: r.id,
                  title: String(cand.rec.title || r.title),
                  author: String(cand.rec.author || r.author),
                  genre: String(r.genre || cand.rec.category || "General"),
                  summary: String(r.summary || "").slice(0, 400),
                  relevance: String(r.relevance || "").slice(0, 200),
                  difficulty: ["Beginner", "Intermediate", "Advanced Science"].includes(String(r.difficulty))
                    ? String(r.difficulty)
                    : "Intermediate",
                  bloom_score: Math.min(98, Math.max(60, Number(r.bloom_score) || 75)),
                };
              });
              return { recommendations: merged };
            }
          }
        } catch (e) {
          logger.warn("Gemini recommendations failed, using fallback", e);
        }
      }

      const recommendations = fallbackFromCandidates(candidates, categoryCounts, authorSet);
      return { recommendations };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("getAntigravityRecommendations failed:", message, error);
      throw new HttpsError("internal", `Failed to get recommendations: ${message}`);
    }
  }
);
