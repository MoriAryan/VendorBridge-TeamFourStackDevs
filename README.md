# VendorBridge — Procurement & Vendor Management System

> Built for the virtual round of the Odoo X KSV Hackathon. Ended up being the most complicated thing any of us had ever shipped.

---

## The Story Behind This

So this whole thing started because we got selected for the virtual round of the **Odoo X KSV Hackathon** and the problem statement was around digitizing business operations. The organizers wanted something that could replace the kind of messy, manual workflows that real companies still run on — the kind of thing Odoo itself is built to solve, but we had to build our own version from scratch.

We picked procurement because it was the most obviously broken process we could think of from personal experience. Our college had a genuine version of this problem. Every semester, the administrative department would go through this exhausting cycle of calling vendors, getting quotes on WhatsApp, arguing over Excel sheets, and then eventually someone would approve something by signing a printed paper that nobody could find again six months later.

Four of us, one virtual round, and a problem that turned out to be a lot deeper than it looked on the surface. We thought it would take two weekends. It took considerably longer. But that gap between what we expected and what actually needed to happen is what taught us the most.

VendorBridge is the result. It is a full-stack web application that handles the entire procurement lifecycle inside an organization — from registering vendors and creating purchase requests, all the way to comparing quotations, approving purchases, and generating the final invoice. We did not cut corners on the workflow logic, which is probably why it became complicated. Every rule in a real procurement system is there for a reason and we tried to respect that.

---

## What problem does this actually solve

Most small and medium organizations still run procurement on a mix of emails, WhatsApp messages, Excel files, and physical paper. The problem is not that people are lazy. The problem is that there is no single place where anyone can answer basic questions like "how much did we spend last month?", "which vendor gave us the cheapest quote for computers?", or "did anyone actually approve that purchase before we paid for it?"

VendorBridge puts all of that in one place. Every action leaves a record. Every decision has a chain. Nothing can be approved without going through the right steps first.

---

## What you can actually do in this system

There are four types of users. Each one sees and can do different things.

**Procurement Officer** — This is the person who runs the show. They create the purchase requests (called RFQs), assign which vendors should quote for them, compare the incoming quotes side by side, select a winner, and then push the process forward into approval and eventually a purchase order.

**Vendor** — A supplier company registered in the system. When a procurement officer sends them an RFQ, they log in, see the items being requested, and submit their prices. They can update their quote before the deadline. Once the RFQ closes, they find out if they won or not.

**Manager / Approver** — After a vendor is selected, the purchase needs to be approved before money is committed. Managers review the quotation summary and either approve or reject with comments. There is a multi-level approval chain — L1 review followed by L2 approval, which mirrors how real organizations work.

**Admin** — Can do everything. Manages users, blocks vendors who misbehave, monitors the entire system, and accesses reports.

The key thing is that none of these roles can do each other's jobs. A vendor cannot approve something. A manager cannot submit a quotation. These are not just UI restrictions — the backend enforces them.

---

## The procurement lifecycle

This is the backbone of the whole system and it took us the longest to get right. Every entity in the system flows through this chain:

```
Register Vendors
     ↓
Create RFQ (Request for Quotation)
     ↓
Assign Vendors to the RFQ
     ↓
Vendors Submit Quotations
     ↓
Compare All Quotations Side by Side
     ↓
Select the Winning Vendor
     ↓
Approval Workflow (L1 → L2)
     ↓
Generate Purchase Order
     ↓
Generate Invoice
     ↓
Activity Logs & Reports
```

No stage can be skipped. You cannot generate a purchase order without an approved quotation. You cannot have a quotation without an RFQ. These are hard constraints in the database layer, not just the frontend.

---

## Tech stack

We kept it straightforward. The backend is Node.js with Express, the database is MongoDB through Mongoose, and the frontend is React with Vite. No TypeScript — we were moving fast and everyone on the team was more comfortable with plain JavaScript. Styling is all vanilla CSS with a neumorphic soft-UI design system we built ourselves.

**Backend**

- Node.js + Express for the REST API
- MongoDB + Mongoose for data storage
- JWT (access tokens + refresh tokens via httpOnly cookies) for authentication
- Aggregation pipelines for all complex queries — no populate() anywhere
- Activity logging built into every controller

**Frontend**

- React 18 with Vite
- React Router v6 for navigation
- Axios with request/response interceptors for auth token handling
- Vanilla CSS with custom properties — no Tailwind, no component libraries

**Authentication**

Stateless JWT access tokens (15 min expiry) combined with database-stored refresh tokens via httpOnly cookies. Role is baked into the token so every API endpoint can enforce permissions without an extra database hit.

---

## Pages and what they do

**Login / Register** — Standard auth pages. After login, the system routes you to your role's default view.

**Vendors** — Lists all registered supplier companies with their GST number, category, and status. You can search, filter by status (Active, Inactive, Blocked), add new vendors, and change their status. Each vendor has a detail page showing their profile, which RFQs they are assigned to, and quick edit capability.

**RFQs** — The RFQ list shows all requests with status filters (Draft, Open, Closed, Expired). Creating an RFQ is a multi-step wizard — basic details first, then line items (what you need and how much), then vendor assignment and file attachments. You can save as draft or publish immediately.

**RFQ Detail** — Shows everything about one RFQ. The assigned vendors, the line items, a live count of how many quotations have come in, and a procurement timeline that tracks which stages are done. When two or more quotations exist, a "Compare & Select" button appears.

**Quotations** — Procurement officers see all the quotations received for an RFQ, ranked cheapest first. Vendors see their own submission form where they fill in unit prices for each item, add tax percentage, delivery timeline, payment terms, and notes. The total is calculated live as they type.

**Quotation Comparison** — This was the most fun page to build. It puts all vendor quotations side by side in a grid. The cheapest overall bid is highlighted. The item-level table shows each item with all vendor prices, and green highlighting marks the cheapest option per line. Selecting a winner from this page marks all other quotations as rejected and closes the RFQ in one action.

**Approvals, Purchase Orders, Invoices** — The workflow continues from here into approval chains, PO generation, and invoice management with tax calculations. These modules follow the same lifecycle rules.

---

## How to run this locally

You will need Node.js (v18 or above) and a MongoDB connection string. We used MongoDB Atlas for development.

Clone the repo and install dependencies for both parts:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

Create a `.env` file in the `backend` folder:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=some_long_random_secret
REFRESH_TOKEN_SECRET=another_long_random_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
CORS_ORIGIN=http://localhost:5173
```

Then start both servers in separate terminals:

```bash
# Terminal 1 — Backend (runs on port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (runs on port 5173)
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser. Register an account and you are in.

---

## API overview

All endpoints live under `/api/v1/`. Authentication is required for everything except `/auth/register` and `/auth/login`.

```
POST   /auth/register          — create account
POST   /auth/login             — get tokens
POST   /auth/logout            — clear session
POST   /auth/refresh-token     — refresh access token

GET    /vendors                — list vendors
POST   /vendors                — add vendor
GET    /vendors/active         — active vendors only (for dropdowns)
GET    /vendors/:id            — vendor profile
PATCH  /vendors/:id            — update vendor
PATCH  /vendors/:id/status     — change status

GET    /rfqs                   — list RFQs
POST   /rfqs                   — create RFQ
GET    /rfqs/stats             — dashboard counts
GET    /rfqs/:id               — single RFQ with vendor and line item detail
PATCH  /rfqs/:id               — update RFQ (draft only)
DELETE /rfqs/:id               — cancel RFQ

GET    /quotations             — list by RFQ (?rfqId=xxx)
POST   /quotations             — submit quotation
GET    /quotations/compare     — comparison matrix (?rfqId=xxx)
GET    /quotations/count       — count for a specific RFQ
GET    /quotations/:id         — single quotation
PATCH  /quotations/:id/select  — select as winner
```

---

## Team

This was built as our submission for the virtual round of the **Odoo X KSV Hackathon** by a team of four students. The hackathon framing pushed us to take the problem seriously rather than building a toy project — Odoo is a real ERP platform used by actual businesses, so building something in the same space with similar goals meant we had to think about real constraints, not just demo-friendly shortcuts.

Each person owned a module end to end — backend logic, frontend UI, validation, and documentation for their section.

The project pushed us to think about real-world business constraints in software. Things like "what happens if two people submit a quotation at the same time" or "how do you make sure the approval chain is followed and not bypassed" are not questions that come up in tutorial projects. They came up here.

---

## What we learned

The hardest part was not the code. It was understanding the actual domain. Procurement systems have rules that exist because real organizations got burned without them. Understanding why a rule existed — not just implementing it mechanically — made the codebase significantly better.

Some specific technical things we ran into:

Mongoose v8 changed how middleware works. Pre-save hooks that used to pass a `next` callback now need to be async and return a Promise. We spent an embarrassing amount of time debugging this.

MongoDB aggregation pipelines are powerful but unforgiving. A single typo in an option name (like `preserveNullAndEmpty` instead of `preserveNullAndEmptyArrays`) silently fails in some versions and throws a 500 in others. Always test with real data.

JWT in a web context is more nuanced than "put the token in localStorage." Short-lived access tokens with httpOnly cookie refresh tokens is meaningfully more secure and worth the extra implementation effort.

---

## License

MIT. Use it, learn from it, break it, build something better.
