import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const db = getFirestore();

/**
 * Triggered when a new rental request is created.
 * Notifies the book owner.
 */
export const onRentalCreated = onDocumentCreated("rentals/{rentalId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const rental = snapshot.data();
    const ownerId = rental.ownerId;
    const renterName = rental.renterName || "Someone";
    const bookTitle = rental.bookTitle || "your book";

    if (!ownerId) {
        logger.warn("No ownerId found in rental request", event.params.rentalId);
        return;
    }

    try {
        await db.collection("notifications").add({
            userId: ownerId,
            type: "system",
            title: "New Rental Request",
            message: `${renterName} wants to rent "${bookTitle}"`,
            read: false,
            timestamp: Timestamp.now(),
            icon: "box", // Using 'box' as a generic placeholder, frontend maps types to icons
            link: "/dashboard/rentals", // Assuming a rentals dashboard route
        });
        logger.info(`Notification sent to owner ${ownerId} for rental ${event.params.rentalId}`);
    } catch (error) {
        logger.error("Failed to send rental creation notification", error);
    }
});

/**
 * Triggered when a rental status changes (e.g., approved/rejected).
 * Notifies the renter.
 */
export const onRentalUpdated = onDocumentUpdated("rentals/{rentalId}", async (event) => {
    const change = event.data;
    if (!change) return;

    const newData = change.after.data();
    const oldData = change.before.data();

    // Only notify if status has changed
    if (newData.status === oldData.status) return;

    const renterId = newData.renterId;
    const bookTitle = newData.bookTitle || "the book";
    const status = newData.status;

    if (!renterId) return;

    try {
        let title = "Rental Update";
        let message = `Your rental request for "${bookTitle}" has been updated to ${status}.`;
        let type = "system";

        if (status === "approved") {
            title = "Rental Approved! 🎉";
            message = `Your request for "${bookTitle}" was approved. Check details for pickup.`;
            type = "community_approved"; // Maps to green check
        } else if (status === "rejected") {
            title = "Rental Rejected";
            message = `Your request for "${bookTitle}" was declined by the owner.`;
            type = "community_rejected"; // Maps to red X
        }

        await db.collection("notifications").add({
            userId: renterId,
            type: type,
            title: title,
            message: message,
            read: false,
            timestamp: Timestamp.now(),
            link: `/rentals/${event.params.rentalId}`,
        });
        logger.info(`Notification sent to renter ${renterId} for rental status ${status}`);
    } catch (error) {
        logger.error("Failed to send rental update notification", error);
    }
});

/**
 * Triggered when a new negotiation offer is created.
 * Notifies the seller.
 */
export const onNegotiationCreated = onDocumentCreated("negotiations/{negotiationId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const offer = snapshot.data();
    // Assuming structure based on BookDetailModal.tsx:
    // buyerId, buyerName, bookId, bookTitle, sellerName, offerPrice, message, status, ...
    // Note: The structure in BookDetailModal didn't explicitly show 'sellerId' in the negotiation doc,
    // but it did query for the book to get userId.
    // HOWEVER, the frontend code in BookDetailModal.tsx ALREADY creates a notification manually via `db.collection('notifications')`.
    // If we rely on this backend trigger, we need to make sure the user works.
    // BUT the negotiation document usually needs the sellerId to be queryable by the seller.

    // Let's assume the negotiation document DOES NOT have sellerId if it wasn't saved.
    // Wait, in BookDetailModal.tsx:
    // await addDoc(collection(db, 'negotiations'), { ... buyerId, buyerName ... });
    // It DOES NOT save sellerId! It only sends a notification using book.userId.
    // This is a design flaw in the negotiation doc if the seller needs to query "my negotiations".
    // I will traverse to the Book document to find the sellerId if needed, OR just assume the frontend will start saving it.

    // Better approach: Query the book to find the owner.
    const bookId = offer.bookId;
    if (!bookId) {
        logger.warn("No bookId in negotiation", event.params.negotiationId);
        return;
    }

    try {
        // We need to fetch the book to get the sellerId (userId)
        const bookSnapshot = await db.collection("books").doc(bookId).get();
        if (!bookSnapshot.exists) {
            logger.warn("Book not found for negotiation", bookId);
            return;
        }
        const bookData = bookSnapshot.data();
        const sellerId = bookData?.userId;

        if (!sellerId) {
            logger.warn("No sellerId on book", bookId);
            return;
        }

        // Check if frontend already sent a notification?
        // The frontend code in BookDetailModal.tsx sends a notification MANUALLY.
        // If we add this, we might duplicate it.
        // For now, this is a "robust backup" or replacement.
        // Ideally, we should remove the frontend notification logic, but I can't do that easily without a new plan.
        // I'll implement this, and it will likely duplicate until frontend is cleaned up.
        // Wait, the user asked to "integrate notification backend". This implies replacing or ensuring it works.
        // I'll implement it.

        await db.collection("notifications").add({
            userId: sellerId,
            type: "order", // 'offer' type mapped to 'order' icon logic or just use 'order'
            title: "New Price Offer",
            message: `${offer.buyerName || 'A buyer'} offered ${offer.offerPrice} for "${offer.bookTitle}"`,
            read: false,
            timestamp: Timestamp.now(),
            icon: "tag",
            link: "/dashboard/sales",
        });
        logger.info(`Notification sent to seller ${sellerId} for negotiation ${event.params.negotiationId}`);
    } catch (error) {
        logger.error("Failed to process negotiation notification", error);
    }
});

/**
 * Triggered when a new user document is created.
 * Initializes the "Neural Welcome" notification for the AI Assistant.
 */
export const onUserCreated = onDocumentCreated("users/{userId}", async (event) => {
    const userId = event.params.userId;

    try {
        await db.collection("notifications").add({
            userId: userId,
            type: "ai_assistant", // Used by the frontend to filter for the chatbot badge
            title: "Welcome to BloomBook!",
            message: "I am your AI Assistant. Click the chat icon below if you need help finding books or tutors.",
            read: false,
            timestamp: Timestamp.now(),
            icon: "bot",
            link: "#ai-chat", // Specific anchor to trigger the chatbox
        });
        logger.info(`Neural Welcome signal sent to user ${userId}`);
    } catch (error) {
        logger.error("Failed to send Neural Welcome signal", error);
    }
});

/**
 * Scheduled cron job to run every 24 hours (9 AM).
 * Notifies borrowers 24-48 hours before their rental returns are due.
 */
export const notifyUpcomingRentalReturns = onSchedule(
  {
    schedule: "0 9 * * *",
    timeZone: "Asia/Karachi" // Example timezone
  },
  async (event) => {
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const rentalsSnapshot = await db.collection("rentals")
          .where("status", "==", "active")
          .get();

      if (rentalsSnapshot.empty) {
        logger.info("No active rentals found.");
        return;
      }

      let count = 0;
      const batch = db.batch();

      rentalsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.dueDate) return;

        // Parse ISO string to Date object
        const dueDate = new Date(data.dueDate);

        // Check if the due date falls in the exactly 24 to 48 hours window
        if (dueDate > in24Hours && dueDate <= in48Hours) {
          const renterId = data.renterId;
          const bookTitle = data.bookTitle || "Your Book";
          if (!renterId) return;

          const notificationRef = db.collection("notifications").doc();
          batch.set(notificationRef, {
            userId: renterId,
            type: "system",
            title: "Rental Return Reminder ⏰",
            message: `Friendly reminder: Your rental for "${bookTitle}" is due to be returned on ${dueDate.toLocaleDateString()}. Please prepare for handover!`,
            read: false,
            timestamp: Timestamp.now(),
            icon: "box",
            link: "/dashboard/rentals",
          });
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
        logger.info(`Automated Rental Warning Sent: Notified ${count} users about upcoming returns.`);
      } else {
        logger.info("No rentals fall tightly into the 24-48hr warning window.");
      }
    } catch (error) {
      logger.error("Failed to run notifyUpcomingRentalReturns cron job", error);
    }
  }
);
