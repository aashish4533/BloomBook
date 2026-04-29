import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { getFirestore, FieldValue, DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore";

/** Normalizes title and author for wishlist key comparison. */
function normalizeMatchKey(title: unknown, author: unknown): string {
  const norm = (s: unknown) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  return `${norm(title)}|${norm(author)}`;
}

/** Returns a normalized ISBN string or empty if too short. */
function normalizeIsbn(isbn: unknown): string {
  const s = String(isbn || "").replace(/[\s-]/g, "").toLowerCase();
  return s.length >= 10 ? s : "";
}

/** True if a new book document should trigger wishlist match notifications. */
function shouldNotifyNewListing(data: DocumentData): boolean {
  if (data.isSold === true) return false;
  if (data.listingStatus === "sold" || data.listingStatus === "reserved") return false;
  if (data.status != null && data.status !== "" && data.status !== "active") return false;
  return true;
}

/** Derives wishlist mode labels (buy/rent/exchange) from listing fields. */
function listingModeLabels(data: DocumentData): string[] {
  const af = data.availableFor as string[] | undefined;
  const modes: string[] = [];
  if (af?.includes("sale")) modes.push("buy");
  if (af?.includes("rent")) modes.push("rent");
  if (af?.includes("exchange")) modes.push("exchange");
  if (modes.length > 0) return [...new Set(modes)];
  const t = data.type as string | undefined;
  if (t === "sell") return ["buy"];
  if (t === "rent") return ["rent"];
  if (t === "exchange") return ["exchange"];
  if (t === "both") return ["buy", "rent"];
  return [];
}

/** Human-readable phrase for notification body from mode list. */
function formatModesForMessage(modes: string[]): string {
  if (modes.length === 0) return "the marketplace";
  if (modes.length === 1) {
    if (modes[0] === "buy") return "purchase (buy)";
    if (modes[0] === "rent") return "rent";
    return "exchange";
  }
  return modes
    .map((m) => (m === "buy" ? "buy" : m === "rent" ? "rent" : "exchange"))
    .join(", ");
}

/**
 * When a new book listing is created, notify users whose wishlist matches title/author or ISBN.
 */
export const onBookCreatedWishlistMatch = onDocumentCreated(
  "books/{bookId}",
  async (event) => {
    const bookId = event.params.bookId;
    const snap = event.data;
    if (!snap) return;

    const book = snap.data();
    if (!shouldNotifyNewListing(book)) {
      return;
    }

    const sellerId = String(book.userId || "");
    if (!sellerId) {
      logger.warn("onBookCreatedWishlistMatch: missing userId", bookId);
      return;
    }

    const modes = listingModeLabels(book);
    if (modes.length === 0) {
      return;
    }

    const title = String(book.title || "");
    const author = String(book.author || "");
    const matchKey = normalizeMatchKey(title, author);
    const isbnNorm = normalizeIsbn(book.isbn);

    if (!matchKey || matchKey === "|") {
      logger.warn("onBookCreatedWishlistMatch: empty match key", bookId);
      return;
    }

    const db = getFirestore();
    const notifiedUserIds = new Set<string>();

    const sendForDoc = async (wishDoc: QueryDocumentSnapshot) => {
      const w = wishDoc.data();
      const uid = String(w.userId || "");
      if (!uid || uid === sellerId) return;
      if (notifiedUserIds.has(uid)) return;
      notifiedUserIds.add(uid);

      const modeStr = formatModesForMessage(modes);
      try {
        await db.collection("notifications").add({
          userId: uid,
          type: "wishlist_match",
          title: "Wishlist match: new listing",
          message: `"${title}" by ${author || "Unknown"} is now listed for ${modeStr}. Open to view the listing.`,
          read: false,
          timestamp: FieldValue.serverTimestamp(),
          bookId,
        });
      } catch (e) {
        logger.error("wishlist match notification failed", uid, e);
      }
    };

    try {
      const byKey = await db.collection("wishlists").where("matchKey", "==", matchKey).get();
      for (const d of byKey.docs) {
        await sendForDoc(d);
      }

      if (isbnNorm) {
        const byIsbn = await db.collection("wishlists").where("isbnNorm", "==", isbnNorm).get();
        for (const d of byIsbn.docs) {
          await sendForDoc(d);
        }
      }
    } catch (e) {
      logger.error("onBookCreatedWishlistMatch query failed", e);
    }
  }
);
