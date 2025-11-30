# BookBloom - Complete Interaction Flow Diagram

## 🗺️ Visual Navigation Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NAVBAR (Fixed Top)                          │
│ Logo │ Home │ Buy │ Rent │ Sell │ Communities │ Search │ 🔔 │ Profile│
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                            HOME SCREEN                              │
│                                                                     │
│  ┌──────────────────────────────────────────────────────┐          │
│  │  Hero: Welcome + Search Bar → [Advanced Search]      │          │
│  └──────────────────────────────────────────────────────┘          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────┐          │
│  │  Featured Books Carousel                             │          │
│  │  [Book 1] → [Book 2] → [Book 3] → [More...]          │          │
│  │  Click → Marketplace (filtered)                      │          │
│  └──────────────────────────────────────────────────────┘          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────┐          │
│  │  Personalized Recommendations (AI)                   │          │
│  │  Based on: History + Wishlist + Communities          │          │
│  │  [Recommended Book Cards...]                         │          │
│  └──────────────────────────────────────────────────────┘          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────┐          │
│  │  Communities Spotlight                               │          │
│  │  [Community 1] [Community 2] [Community 3]           │          │
│  │  Click → Community Details                           │          │
│  └──────────────────────────────────────────────────────┘          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────┐          │
│  │  Announcements Banner                                │          │
│  │  [Announcement 1] [Announcement 2] [Announcement 3]  │          │
│  │  Click → Full Announcements Page                     │          │
│  └──────────────────────────────────────────────────────┘          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    MOBILE BOTTOM TAB (5 Tabs)                       │
│   [🏠 Home]  [🔍 Search]  [❤️ Wishlist]  [📦 Sell]  [👤 Profile]    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete User Flows

### **FLOW 1: Guest User → Book Purchase → Delivery Tracking**

```
START: Home (Not Logged In)
│
├── Click "Featured Book Card"
│   └── Navigate to: Marketplace (Book Details)
│       │
│       ├── View: Book images, description, seller profile
│       ├── See: Helping materials (Videos, Notes)
│       │   ├── Click "Watch Preview" → VideoPlayer Modal
│       │   └── Click "View Sample" → NotesViewer Modal
│       │
│       └── Click "Buy Now"
│           │
│           └── Trigger: Login Required Modal
│               │
│               ├── Click "Sign Up"
│               │   └── SignUpForm Modal
│               │       └── Fill: Name, Email, Password
│               │           └── Success → Auto Login
│               │               │
│               │               └── Resume: Buy Flow
│               │
│               └── PaymentGateway Modal Opens
│                   ├── Select: Credit Card | PayPal
│                   ├── Enter: Card Details
│                   │   ├── Card Number: XXXX XXXX XXXX XXXX (formatted)
│                   │   ├── Name: John Doe
│                   │   ├── Expiry: MM/YY (auto-format)
│                   │   └── CVV: ••• (masked)
│                   │
│                   ├── Click: "Pay $XX.XX"
│                   │   └── Processing Animation (2s)
│                   │
│                   └── Success Modal
│                       ├── Show: Transaction ID
│                       ├── Show: Order Summary
│                       └── Click: "View Delivery Tracking"
│                           │
│                           └── Navigate to: DeliveryTracking Page
│                               ├── Timeline: 4-Stage Progress
│                               │   ├── ✓ Order Confirmed
│                               │   ├── ✓ Package Prepared
│                               │   ├── 🔵 Out for Delivery (Active)
│                               │   └── ⚪ Delivered (Pending)
│                               │
│                               ├── Live Map: Route visualization
│                               ├── Courier Info: Name, Phone, Tracking #
│                               └── Actions: Report Issue, Change Address
│
END: User receives book
```

---

### **FLOW 2: Seller Listing Book with Barcode Scanner**

```
START: Home (Logged In)
│
└── Click Navbar: "Sell"
    │
    └── SellBookFlow Opens (Full Screen)
        │
        ├── Step 1: Book Details
        │   ├── ISBN Input Field
        │   │   └── Click: "Scan Barcode" Button
        │   │       │
        │   │       └── BarcodeScanner Modal Opens
        │   │           ├── Camera View with Guidelines
        │   │           ├── Scanning Animation (moving line)
        │   │           ├── Detect Barcode
        │   │           └── Success → Auto-fill ISBN
        │   │
        │   ├── Title, Author, Publisher (auto-filled)
        │   ├── Condition: Dropdown (New, Like New, Good...)
        │   ├── Upload Photos: Drag & Drop (3-5 images)
        │   └── Description: Textarea
        │
        ├── Step 2: Listing Type
        │   └── Select: [ ] Sell  [ ] Rent  [ ] Both
        │
        ├── Step 3: Pricing
        │   ├── AI Suggested Price: $XX.XX
        │   ├── Your Price: Input
        │   ├── Rental Rates:
        │   │   ├── Daily: $X
        │   │   ├── Weekly: $XX
        │   │   └── Monthly: $XXX
        │   └── [ ] Negotiable
        │
        ├── Step 4: Helping Materials (Optional)
        │   ├── Upload Study Notes: PDF (max 10MB)
        │   │   └── Preview available to buyers
        │   └── Attach Video Lectures: MP4 (max 100MB)
        │       └── Preview available to buyers
        │
        └── Step 5: Review & Confirm
            ├── Review All Details
            ├── Terms & Conditions: [ ] I agree
            └── Click: "Submit Listing"
                │
                └── Success Modal
                    ├── Listing ID: #LST123456
                    ├── Status: Under Review (24-48hrs)
                    └── Navigate to: My Listings (User Dashboard)
│
END: Listing Live
```

---

### **FLOW 3: Advanced Search with Voice & AI Chatbot**

```
START: Click "Search" in Navbar
│
└── Navigate to: Advanced Search Page
    │
    ├── ┌─────────────────────────────────────────┐
    │   │  AI CHATBOT PANE (Left Sidebar)         │
    │   │  ┌───────────────────────────────────┐  │
    │   │  │ You: "Looking for sci-fi books"   │  │
    │   │  └───────────────────────────────────┘  │
    │   │  ┌───────────────────────────────────┐  │
    │   │  │ AI: "Here are 3 recommendations:" │  │
    │   │  │ [Book Card 1]                     │  │
    │   │  │ [Book Card 2]                     │  │
    │   │  │ [Book Card 3]                     │  │
    │   │  │ Click → Book Details              │  │
    │   │  └───────────────────────────────────┘  │
    │   └─────────────────────────────────────────┘
    │
    ├── Voice Search
    │   └── Click: 🎤 Microphone Icon
    │       │
    │       └── VoiceSearchModal Opens
    │           ├── Microphone Animation
    │           ├── "Speak now..."
    │           ├── Capture: "Looking for Python programming books"
    │           ├── Transcribe → Fill Search Query
    │           └── Auto-Search
    │
    ├── Traditional Filters
    │   ├── ISBN: Input or Scan Barcode
    │   │   └── Click: 📷 Scan → BarcodeScanner Modal
    │   │
    │   ├── Author: Text Input
    │   ├── Genre: Dropdown Multi-select
    │   ├── Price Range: [$10 -----●----- $100] Slider
    │   ├── Location: City + Radius
    │   ├── Condition: Checkboxes (New, Used, Fair...)
    │   └── Type: [ ] Buy  [ ] Rent
    │
    └── Results Grid
        ├── Sort by: [Price ▼] [Relevance] [Date]
        ├── Grid Layout: 3 Columns (Desktop)
        │   ├── [Book Card 1]
        │   │   ├── Image, Title, Author, Price
        │   │   ├── Quick Actions:
        │   │   │   ├── ❤️ Add to Wishlist
        │   │   │   ├── 💬 Chat Seller
        │   │   │   └── 👁️ View Details
        │   │   └── Click → Book Details
        │   │
        │   ├── [Book Card 2]
        │   └── [Book Card 3]
        │
        └── Pagination: [← 1 2 3 ... 10 →]
│
END: Found desired book
```

---

### **FLOW 4: Join Community → Group Chat → Post**

```
START: Home → Click "Explore Communities"
│
└── Navigate to: Communities Browse
    │
    ├── Browse Communities Grid
    │   ├── Filters: Topic, Size, Activity
    │   ├── Search: Community name
    │   └── Community Cards
    │       ├── Name, Description
    │       ├── 1.2K Members, 45 Posts/day
    │       └── Click: "View Details"
    │
    └── Navigate to: Community Details
        │
        ├── Header
        │   ├── Cover Image, Name, Description
        │   ├── 1.2K Members, Created Jan 2023
        │   └── Click: "Join Community" Button
        │       │
        │       └── Auth Required?
        │           ├── If No → Join Success
        │           └── If Yes → Login Modal → Join
        │
        ├── Now a Member → New Options Appear
        │   ├── Tab: Posts Feed
        │   │   ├── Create New Post Button
        │   │   │   └── Modal: Text + Image Upload
        │   │   │       └── Submit → Post appears in feed
        │   │   │
        │   │   └── Existing Posts
        │   │       ├── Like, Comment, Share
        │   │       └── Click User → View Profile
        │   │
        │   ├── Tab: Members (234)
        │   │   ├── Avatar Grid
        │   │   ├── Online Status: 🟢
        │   │   └── Click User → Send Message
        │   │
        │   └── Click: "💬 Group Chat" Button
        │       │
        │       └── Navigate to: GroupChat Page
        │           │
        │           ├── Chat Interface
        │           │   ├── Messages: User avatars, timestamps
        │           │   ├── Typing indicator: "Sarah is typing..."
        │           │   ├── Read receipts: ✓✓
        │           │   └── Online members: 12 active
        │           │
        │           ├── Input Area
        │           │   ├── Text field
        │           │   ├── Emoji picker: 😀
        │           │   ├── Media upload: 📷 📁
        │           │   └── Send button
        │           │
        │           ├── Message Types
        │           │   ├── Text: "Hey everyone!"
        │           │   ├── Image: Uploaded photo preview
        │           │   ├── File: PDF, DOCX attachments
        │           │   └── Reactions: ❤️ 👍 😂
        │           │
        │           └── Actions
        │               ├── Pin message (admin)
        │               ├── Delete message (admin/own)
        │               ├── @Mention user
        │               └── Reply to thread
        │
        END: Active community participation
```

---

### **FLOW 5: Book Tuition → Pay → Access Materials**

```
START: Navbar → Click "Tuition"
│
└── Navigate to: Tuition Hub
    │
    ├── Browse Tutors
    │   ├── Filters: Subject, Price, Rating, Availability
    │   ├── Sort: Top Rated, Most Booked, Price
    │   └── Tutor Cards
    │       ├── Profile: Photo, Name, Bio
    │       ├── Subjects: Math, Physics, Chemistry
    │       ├── Rating: ⭐⭐⭐⭐⭐ (4.8) - 234 reviews
    │       ├── Rate: $45/hr
    │       └── Click: "View Profile"
    │
    └── Navigate to: Tutor Details
        │
        ├── Profile Tab
        │   ├── Full Bio, Education, Experience
        │   ├── Teaching Style, Specializations
        │   └── Student Reviews (pagination)
        │
        ├── Schedule Tab
        │   ├── Calendar Picker
        │   │   ├── Available slots: Green
        │   │   ├── Booked slots: Gray
        │   │   └── Select: Date & Time
        │   │
        │   ├── Duration: [30min] [1hr] [2hr]
        │   ├── Session Type: [One-time] [Package of 5]
        │   └── Special Requirements: Textarea
        │
        └── Click: "Book Session" Button
            │
            └── PaymentGateway Modal Opens
                ├── Amount: $45.00
                ├── Type: Tuition
                ├── Item: "1-hour Math Session with Dr. Sarah"
                ├── Enter Payment Details
                └── Success → Booking Confirmed
                    │
                    └── Navigate to: Session Dashboard
                        │
                        ├── Session Info
                        │   ├── Date: Jan 20, 2024 at 3:00 PM
                        │   ├── Duration: 1 hour
                        │   ├── Meeting Link: Zoom/Teams
                        │   └── Add to Calendar: .ics download
                        │
                        ├── Access Materials
                        │   ├── Click: "📺 Watch Recorded Lectures"
                        │   │   └── VideoPlayer Modal Opens
                        │   │       ├── Play/Pause, Volume, Progress
                        │   │       ├── Playback Speed: 0.5x - 2x
                        │   │       ├── Subtitles/Captions
                        │   │       ├── Quality: 720p, 1080p, 4K
                        │   │       └── Download (if allowed)
                        │   │
                        │   └── Click: "📄 View Study Notes"
                        │       └── NotesViewer Modal Opens
                        │           ├── PDF Navigation: Page 1 of 15
                        │           ├── Zoom: 50% - 200%
                        │           ├── Search within document
                        │           ├── Highlight & Annotate
                        │           ├── Print document
                        │           └── Download PDF
                        │
                        ├── Live Session (on scheduled time)
                        │   ├── Video Call Interface
                        │   ├── Screen Sharing
                        │   ├── Interactive Whiteboard
                        │   ├── Chat Sidebar
                        │   └── Session Recording
                        │
                        └── Post-Session
                            ├── Leave Review & Rating
                            ├── Request Follow-up
                            └── Book Next Session
│
END: Learning complete
```

---

### **FLOW 6: Activity Tracking & Personalized Recommendations**

```
START: Logged In User → Navbar: Profile
│
└── Navigate to: User Dashboard
    │
    ├── Tab: Activity History ✨
    │   │
    │   ├── Stats Cards (Top)
    │   │   ├── 🔵 23 Books Viewed
    │   │   ├── 🟣 15 Searches Performed
    │   │   ├── 🟢 8 Transactions
    │   │   └── 🔴 5 Communities Joined
    │   │
    │   ├── Tab: All Activity
    │   │   └── Mixed Feed (chronological)
    │   │       ├── [10 min ago] Viewed "Dune" - $16.99
    │   │       ├── [1 hr ago] Searched "sci-fi dystopia" - 28 results
    │   │       ├── [2 hrs ago] Purchased "1984" - $12.50
    │   │       ├── [1 day ago] Joined "Book Club"
    │   │       └── [2 days ago] Rented "Foundation" - $5/week
    │   │
    │   ├── Tab: Views
    │   │   └── Grid of Browsed Books
    │   │       ├── [Book Card] The Great Gatsby - $12.99
    │   │       │   ├── Thumbnail image
    │   │       │   ├── Author: F. Scott Fitzgerald
    │   │       │   ├── Viewed: 2 hours ago
    │   │       │   └── Click → Re-visit details
    │   │       │
    │   │       ├── [Book Card] 1984 - $11.99
    │   │       └── [Book Card] To Kill a Mockingbird - $13.50
    │   │
    │   ├── Tab: Searches
    │   │   └── List of Queries
    │   │       ├── "classic literature" - 45 results - 3 hrs ago
    │   │       ├── "science fiction" - 28 results - 1 day ago
    │   │       ├── "python programming" - 67 results - 2 days ago
    │   │       └── Click query → Re-run search
    │   │
    │   └── Tab: Transactions
    │       └── Order History
    │           ├── [Order #TXN123456] - Purchased
    │           │   ├── Book: "Dune" by Frank Herbert
    │           │   ├── Amount: $16.50
    │           │   ├── Date: 1 week ago
    │           │   ├── Status: ✅ Completed
    │           │   └── Actions: [View Receipt] [Track Delivery]
    │           │
    │           ├── [Order #TXN123455] - Rental
    │           │   ├── Book: "The Hobbit" by J.R.R. Tolkien
    │           │   ├── Amount: $5.99/week
    │           │   ├── Due: 5 days remaining
    │           │   ├── Status: 🔵 Active
    │           │   └── Actions: [Extend] [Return Early]
    │           │
    │           └── [Order #TXN123454] - Tuition
    │               ├── Session: Advanced Math with Dr. Sarah
    │               ├── Amount: $45.00
    │               ├── Date: 3 weeks ago
    │               ├── Status: ✅ Completed
    │               └── Actions: [View Materials] [Leave Review]
    │
    └── Personalized Recommendations Section ✨
        │
        ├── Recommendation Engine (AI)
        │   ├── Input Data:
        │   │   ├── Views: "Dune", "1984", "Foundation"
        │   │   ├── Searches: "sci-fi", "dystopia", "classic"
        │   │   ├── Wishlist: 5 fantasy books
        │   │   ├── Purchases: 3 science fiction
        │   │   └── Communities: "Sci-Fi Lovers", "Book Club"
        │   │
        │   └── Output: Personalized Suggestions
        │       ├── "Because you liked Dune..."
        │       │   ├── [Book] Dune Messiah - $18.99
        │       │   ├── [Book] Children of Dune - $17.50
        │       │   └── [Book] God Emperor of Dune - $16.99
        │       │
        │       ├── "Popular in Sci-Fi Lovers community..."
        │       │   ├── [Book] The Martian - $14.99
        │       │   ├── [Book] Project Hail Mary - $19.99
        │       │   └── [Book] Ender's Game - $12.99
        │       │
        │       └── "Based on your search history..."
        │           ├── [Book] Brave New World - $11.99
        │           ├── [Book] Fahrenheit 451 - $10.99
        │           └── [Book] The Handmaid's Tale - $13.50
        │
        └── Actions on Recommendations
            ├── ❤️ Add to Wishlist
            ├── 🛒 Buy Now
            ├── 👁️ View Details
            └── 🚫 Not Interested (improves future recommendations)
│
END: Personalized experience
```

---

### **FLOW 7: Admin Dashboard - Manage Platform**

```
START: Admin Login (2FA)
│
└── Navigate to: Admin Dashboard (Dark Theme)
    │
    ├── ┌──────────────────────────────────────────────┐
    │   │  OVERVIEW TAB                                │
    │   │  ┌────────────────────────────────────────┐  │
    │   │  │ Platform Stats (Today)                 │  │
    │   │  │ Revenue: $12,450 │ Orders: 234 │ Users:│  │
    │   │  │ Active: 1,234 │ New Books: 45          │  │
    │   │  └────────────────────────────────────────┘  │
    │   │  ┌────────────────────────────────────────┐  │
    │   │  │ Revenue Chart (Last 30 days)           │  │
    │   │  │ [Line graph showing growth trend]      │  │
    │   │  └────────────────────────────────────────┘  │
    │   │  ┌────────────────────────────────────────┐  │
    │   │  │ Recent Activity Feed                   │  │
    │   │  │ • New user: john@example.com           │  │
    │   │  │ • Book listed: "Dune" by @seller123    │  │
    │   │  │ • Payment: $45 - TXN123456             │  │
    │   │  └────────────────────────────────────────┘  │
    │   └──────────────────────────────────────────────┘
    │
    ├── ┌──────────────────────────────────────────────┐
    │   │  USERS MANAGEMENT TAB                        │
    │   │  ┌────────────────────────────────────────┐  │
    │   │  │ Search: [_________] | Filter: [All ▼] │  │
    │   │  └────────────────────────────────────────┘  │
    │   │  ┌────────────────────────────────────────┐  │
    │   │  │ Table (Paginated)                      │  │
    │   │  │ ┌──────────────────────────────────┐   │  │
    │   │  │ │Name│Email│Role│Status│Joined│Actions││
    │   │  │ ├──────────────────────────────────┤   │  │
    │   │  │ │John│john@│User│Active│Jan 15│⋮  ││   │  │
    │   │  │ │Sarah│sara│Admin│Active│Jan 10│⋮ ││   │  │
    │   │  │ │Mike│mike│User│Banned│Jan 5│⋮   ││   │  │
    │   │  │ └──────────────────────────────────┘   │  │
    │   │  └────────────────────────────────────────┘  │
    │   │  Actions Menu (⋮):                           │
    │   │  ├── View Profile → User details modal      │
    │   │  ├── Edit → Edit user modal                 │
    │   │  ├── Suspend → Confirmation modal           │
    │   │  ├── Delete → Confirmation modal            │
    │   │  └── View Activity → Activity log           │
    │   └──────────────────────────────────────────────┘
    │
    ├── ┌──────────────────────────────────────────────┐
    │   │  BOOKS MANAGEMENT TAB                        │
    │   │  Table: Title │ Seller │ Price │ Status     │
    │   │  Actions:                                    │
    │   │  ├── Approve → Live listing                 │
    │   │  ├── Reject → Notify seller                 │
    │   │  ├── Edit → Modify details                  │
    │   │  ├── Delete → Permanent removal             │
    │   │  └── Flag → Mark inappropriate              │
    │   └──────────────────────────────────────────────┘
    │
    ├── ┌──────────────────────────────────────────────┐
    │   │  ANNOUNCEMENTS CRUD TAB                      │
    │   │  ┌────────────────────────────────────────┐  │
    │   │  │ [+ Create New Announcement]            │  │
    │   │  │ ┌────────────────────────────────────┐ │  │
    │   │  │ │ Modal: Create Announcement         │ │  │
    │   │  │ │ Title: [________________]          │ │  │
    │   │  │ │ Content: [Rich Text Editor______] │ │  │
    │   │  │ │ Image: [Upload or URL]             │ │  │
    │   │  │ │ Target: [All] [Students] [Sellers] │ │  │
    │   │  │ │ Publish: [Now] [Schedule: __/__]   │ │  │
    │   │  │ │ Expiry: [Never] [Set Date: __/__]  │ │  │
    │   │  │ │ [Cancel] [Save Draft] [Publish]    │ │  │
    │   │  │ └────────────────────────────────────┘ │  │
    │   │  └────────────────────────────────────────┘  │
    │   │  ┌────────────────────────────────────────┐  │
    │   │  │ Existing Announcements Table           │  │
    │   │  │ ID │ Title │ Published │ Status │ ⋮   │  │
    │   │  │ 1  │ Sale! │ Jan 15    │ Live   │ ⋮   │  │
    │   │  │ 2  │ Event │ Jan 10    │ Draft  │ ⋮   │  │
    │   │  │ 3  │ Update│ Jan 5     │ Expired│ ⋮   │  │
    │   │  │                                        │  │
    │   │  │ Actions (⋮):                           │  │
    │   │  │ ├── Edit → Edit modal                  │  │
    │   │  │ ├── Delete → Confirmation              │  │
    │   │  │ ├── Publish/Unpublish → Toggle         │  │
    │   │  │ └── Duplicate → Copy & edit            │  │
    │   │  └────────────────────────────────────────┘  │
    │   └──────────────────────────────────────────────┘
    │
    └── ┌──────────────────────────────────────────────┐
        │  REPORTS & ANALYTICS TAB                     │
        │  ├── Revenue Reports (CSV export)            │
        │  ├── User Growth Charts                      │
        │  ├── Popular Books (Top 100)                 │
        │  ├── Community Engagement Metrics            │
        │  └── Transaction Logs (Searchable)           │
        └──────────────────────────────────────────────┘
│
END: Platform managed
```

---

## 🔔 Notification System Flow

```
┌──────────────────────────────────────────────────┐
│  NOTIFICATION BELL (Navbar - Logged In Users)   │
│  🔔 [3] ← Badge count (animated)                 │
└──────────────────────────────────────────────────┘
                    │
                    │ Click
                    ▼
┌──────────────────────────────────────────────────┐
│  NOTIFICATION DROPDOWN                           │
│  ┌────────────────────────────────────────────┐  │
│  │ Notifications [3 new] [Mark all read]     │  │
│  ├────────────────────────────────────────────┤  │
│  │ 📦 Order Shipped (NEW)                     │  │
│  │ Your order #TXN123 is on the way!          │  │
│  │ 5 minutes ago [👁️ Mark Read] [🗑️ Delete]   │  │
│  ├────────────────────────────────────────────┤  │
│  │ 💬 New Message (NEW)                       │  │
│  │ Sarah: "Is the book still available?"      │  │
│  │ 1 hour ago [👁️] [🗑️]                      │  │
│  ├────────────────────────────────────────────┤  │
│  │ 👥 New Community Post (NEW)                │  │
│  │ John posted in "Science Fiction Lovers"    │  │
│  │ 2 hours ago [👁️] [🗑️]                     │  │
│  ├────────────────────────────────────────────┤  │
│  │ 🔔 Price Drop Alert                        │  │
│  │ A book in your wishlist is 20% off!        │  │
│  │ 1 day ago (read) [🗑️]                      │  │
│  ├────────────────────────────────────────────┤  │
│  │ [Clear All Notifications] [⚙️ Settings]    │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER ACTIONS                         │
│  (Browse, Search, Buy, Sell, Chat, Join Community, etc.)   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         APP STATE                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ • currentPage: PageType                               │  │
│  │ • userRole: 'user' | 'admin' | null                   │  │
│  │ • selectedBookId, selectedCommunityId                 │  │
│  │ • chatContext, paymentContext                         │  │
│  │ • Modal states (payment, scanner, video, notes, etc.) │  │
│  │ • isLoading, showError, errorMessage                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENT RENDERING                      │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌────────┐  │
│  │  Navbar   │  │   Main    │  │  Modals   │  │ Footer │  │
│  │  (Fixed)  │  │  Content  │  │ (Overlay) │  │(Fixed) │  │
│  └───────────┘  └───────────┘  └───────────┘  └────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTIONS                        │
│  • Click navigation → setCurrentPage()                      │
│  • Form submit → API call (mock) → Update state            │
│  • Modal trigger → showModal = true                         │
│  • Error occurs → showErrorModal = true                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND INTEGRATION (Future)                   │
│  • Authentication: JWT tokens, sessions                     │
│  • Database: Supabase CRUD operations                       │
│  • Real-time: WebSocket connections for chat               │
│  • File Upload: S3/Cloudinary for images/videos/PDFs       │
│  • Payment: Stripe/PayPal API calls                         │
│  • Notifications: Push via FCM/OneSignal                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Interaction Patterns

### **Pattern 1: Modal Overlay System**
```
Trigger Action → showModal = true → Modal Renders → User Interacts
    ↓                                                      ↓
Close/Cancel ← showModal = false ← Success/Error ← Submit
```

### **Pattern 2: Authentication Gates**
```
User Action → Check: isLoggedIn? 
    ├── Yes → Proceed with action
    └── No → Show Login Modal → Success → Retry Action
```

### **Pattern 3: Payment Flow**
```
Checkout → PaymentGateway Modal → Enter Details → Process
    ↓                                                   ↓
Success Modal ← Transaction ID Generated ← API Call
    ↓
Navigate to: Order Tracking / Confirmation
```

### **Pattern 4: Real-time Updates (Simulated)**
```
User Posts → Optimistic Update (instant UI) → Server Sync (background)
    ↓                                                  ↓
UI shows immediately                          Confirmation/Error
```

---

## 📱 Mobile Responsive Patterns

### **Desktop (>1024px)**
```
┌─────────────────────────────────────────────┐
│  Navbar (Full horizontal menu)             │
├─────────────────────────────────────────────┤
│  Content Area (3-4 column grids)            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │Card 1│ │Card 2│ │Card 3│ │Card 4│       │
│  └──────┘ └──────┘ └──────┘ └──────┘       │
├─────────────────────────────────────────────┤
│  Footer (Full links)                        │
└─────────────────────────────────────────────┘
```

### **Mobile (<768px)**
```
┌─────────────────┐
│  Navbar (Logo + │
│  Hamburger)     │
├─────────────────┤
│  Content        │
│  (Single column)│
│  ┌────────────┐ │
│  │  Card 1    │ │
│  └────────────┘ │
│  ┌────────────┐ │
│  │  Card 2    │ │
│  └────────────┘ │
├─────────────────┤
│  Bottom Tab Bar │
│  [🏠][🔍][❤️][📦] │
└─────────────────┘
```

---

**Version**: 1.0.0  
**Total Flows**: 7 Major User Journeys  
**Total Interactions**: 100+ Clickable Actions  
**Modal Types**: 10+ Different Overlays  
**Responsive**: 3 Breakpoints (Mobile/Tablet/Desktop)
