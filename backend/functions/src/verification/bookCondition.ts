import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

type SlotKey = "front" | "back" | "firstPage" | "lastPage" | "pageEdges";

const SLOT_ORDER: SlotKey[] = ["front", "back", "firstPage", "lastPage", "pageEdges"];

const SLOT_LABELS: Record<SlotKey, string> = {
  front: "Front cover of the book",
  back: "Back cover of the book",
  firstPage: "First inside page (title/opening page) of the book",
  lastPage: "Last inside page of the book",
  pageEdges: "Closed book showing the page block edges (top or bottom or fore-edge of the closed text block — not the cover)",
};

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

/** Downloads an image URL and returns a Gemini inline data part (size/type checked). */
async function fetchImageAsInlinePart(
  url: string,
  label: string
): Promise<{ inlineData: { data: string; mimeType: string } }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new HttpsError(
      "invalid-argument",
      `Could not download the ${label} image (HTTP ${res.status}).`
    );
  }

  const mimeType = res.headers.get("content-type") || "image/jpeg";
  if (!mimeType.startsWith("image/")) {
    throw new HttpsError("invalid-argument", `The ${label} file is not an image.`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new HttpsError("invalid-argument", `The ${label} image is larger than 6 MB.`);
  }

  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
}

interface ConditionVerdict {
  isBook: boolean;
  allSlotsMatch: boolean;
  condition: "New" | "Like New" | "Good" | "Fair" | "Poor";
  confidence: number;
  damageFlags: string[];
  reason: string;
  edgePhotoValid: boolean;
  libraryRisk: "none" | "low" | "medium" | "high";
  librarySignals: string[];
  needsManualReview: boolean;
}

export const verifyBookCondition = onCall(
  { cors: true, secrets: ["GEMINI_API_KEY"], timeoutSeconds: 90, memory: "512MiB" },
  async (request): Promise<ConditionVerdict> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in to verify book condition.");
    }

    const images = request.data?.images as Partial<Record<SlotKey, string>> | undefined;
    if (!images) {
      throw new HttpsError("invalid-argument", "Missing images payload.");
    }

    for (const slot of SLOT_ORDER) {
      const url = images[slot];
      if (!url || typeof url !== "string" || !/^https?:\/\//i.test(url)) {
        throw new HttpsError("invalid-argument", `Missing or invalid ${slot} image URL.`);
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new HttpsError(
        "failed-precondition",
        "Condition verifier is not configured (GEMINI_API_KEY secret missing)."
      );
    }

    try {
      const imageParts = await Promise.all(
        SLOT_ORDER.map((slot) =>
          fetchImageAsInlinePart(images[slot] as string, SLOT_LABELS[slot])
        )
      );

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 512,
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              isBook: { type: SchemaType.BOOLEAN },
              allSlotsMatch: { type: SchemaType.BOOLEAN },
              condition: {
                type: SchemaType.STRING,
                format: "enum",
                enum: ["New", "Like New", "Good", "Fair", "Poor"],
              },
              confidence: { type: SchemaType.NUMBER },
              damageFlags: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
              reason: { type: SchemaType.STRING },
              edgePhotoValid: { type: SchemaType.BOOLEAN },
              libraryRisk: {
                type: SchemaType.STRING,
                format: "enum",
                enum: ["none", "low", "medium", "high"],
              },
              librarySignals: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
              needsManualReview: { type: SchemaType.BOOLEAN },
            },
            required: [
              "isBook",
              "allSlotsMatch",
              "condition",
              "confidence",
              "damageFlags",
              "reason",
              "edgePhotoValid",
              "libraryRisk",
              "librarySignals",
              "needsManualReview",
            ],
          },
        },
      });

      const prompt = `You are a book condition inspector for a second-hand book marketplace.
You are given 5 images of the SAME physical book in this exact order:
1. Front cover
2. Back cover
3. First inside page (title or opening page)
4. Last inside page
5. Page edges photo: the CLOSED book photographed so the viewer sees the top or bottom or fore-edge of the PAGE BLOCK (the cut edges of the paper). This is NOT the spine, NOT the front/back cover face, and NOT an open spread.

Your job — condition & authenticity:
- Verify all 5 photos show a real book (not a screenshot, stock photo, random object, or non-book item).
- Verify each photo matches its expected slot. For slot 5 specifically: set "edgePhotoValid" to true ONLY if the image clearly shows the closed book's page edges (you can see the thickness of the text block; optional: ink stamps or discoloration along the edge). If slot 5 shows only covers, spine only, an open book, or unrelated objects, set "edgePhotoValid" to false and "allSlotsMatch" to false.
- Grade overall condition: New, Like New, Good, Fair, Poor (same criteria as usual used books).
- "damageFlags": torn, waterDamage, writing, highlighting, stains, yellowing, spineDamage, creasedCorners, fadedCover — or empty.
- "confidence" 0.0–1.0 for the condition grade.
- "reason": 1–2 sentences on condition.

Library / institutional ownership (use ALL images, especially inside covers, edges, and any barcodes):
- Look for text or stamps such as: "Property of", "Library", "Discard", "Withdrawn", "Date Due", call numbers, library pockets, security strips, institutional stamps on page edges or inside cover.
- Barcodes: a commercial ISBN barcode on the back cover is normal. A separate Codabar/Code 39 style label or non-ISBN library barcode, or a barcode clearly on a "Date Due" card, suggests library circulation — raise risk.
- A relatively clean, uniform page edge with no stamps often suggests a personal copy; visible edge stamps or strong library markings suggest institutional property.
- Set "libraryRisk": none (no concern), low (weak/ambiguous cues), medium (credible library cues), high (clear library property or strong institutional markings).
- "librarySignals": short English phrases listing what you noticed (e.g. "red stamp on fore-edge", "PROPERTY OF stamp inside cover", "pocket for date due card").
- Set "needsManualReview" to true if libraryRisk is medium or high, OR if you are uncertain about barcode type, OR if photos are too poor to rule out library theft. Otherwise false.

Be strict on edgePhotoValid and library assessment; lower confidence when images are blurry or dark.`;

      const result = await model.generateContent([prompt, ...imageParts]);
      const raw = result.response.text();

      let parsed: ConditionVerdict;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        logger.error("Failed to parse Gemini JSON:", raw, err);
        throw new HttpsError("internal", "Could not parse verification response.");
      }

      const condition = parsed.condition;
      const allowed: ConditionVerdict["condition"][] = [
        "New",
        "Like New",
        "Good",
        "Fair",
        "Poor",
      ];
      if (!allowed.includes(condition)) {
        parsed.condition = "Fair";
      }

      parsed.confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));
      parsed.damageFlags = Array.isArray(parsed.damageFlags) ?
        parsed.damageFlags.filter((d) => typeof d === "string").slice(0, 10) :
        [];
      parsed.reason = typeof parsed.reason === "string" ? parsed.reason.slice(0, 500) : "";

      const risks: ConditionVerdict["libraryRisk"][] = ["none", "low", "medium", "high"];
      const lr = parsed.libraryRisk;
      parsed.libraryRisk = risks.includes(lr as ConditionVerdict["libraryRisk"]) ?
        (lr as ConditionVerdict["libraryRisk"]) :
        "low";
      parsed.librarySignals = Array.isArray(parsed.librarySignals) ?
        parsed.librarySignals.filter((s) => typeof s === "string").map((s) => s.slice(0, 120)).slice(0, 15) :
        [];
      parsed.edgePhotoValid = Boolean(parsed.edgePhotoValid);
      if (parsed.libraryRisk === "medium" || parsed.libraryRisk === "high") {
        parsed.needsManualReview = true;
      } else {
        parsed.needsManualReview = Boolean(parsed.needsManualReview);
      }

      return parsed;
    } catch (error: unknown) {
      if (error instanceof HttpsError) throw error;
      logger.error("verifyBookCondition failed:", (error as Error)?.message ?? error);
      throw new HttpsError(
        "internal",
        "Condition verification failed. Please try again with clearer photos."
      );
    }
  }
);
