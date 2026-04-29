/**
 * Curated map of BookBloom routes for the AI assistant (not a live crawl).
 * Keep in sync with App.tsx routes.
 */
export const BOOKBLOOM_SITE_GUIDE_FOR_AI = `
BOOKBLOOM WEBSITE MAP (answer "where do I…" using these paths from the site root):
- / — Home
- /marketplace — Browse books (sale/rent listings)
- /book/{id} — Single book details (use a real listing id from inventory when you mention [Product: id])
- /sell — Sell / list a book for sale
- /rent — Rent flow: borrow a book or lend yours
- /exchange — List or find exchange listings
- /tuition — Hire a tutor (Tuition Hub)
- /tutor-verification — Tutor verification / skill test flow
- /notes — Study notes hub
- /communities — Community groups; /communities/create — create; /communities/{id} — group; /communities/{id}/chat — group chat
- /chat — Private messages; /chat/{chatId} — specific conversation
- /assistant — This AI assistant page
- /search — Advanced search
- /wishlist — Wishlist
- /announcements — Announcements
- /about, /contact, /help, /terms — Static info pages
- /dashboard — User hub (nested: reservations, purchases, sales, rentals, wishlist, communities, chats, exchanges, negotiations, notifications)
- /admin/dashboard — Admin (staff only): books, rentals, transactions, communities, notes, tuition, announcements, settings

When directing users, give concrete paths like "Open /marketplace" or "Go to /rent and choose Lend a Book." Do not invent URLs off this site.
`.trim();
