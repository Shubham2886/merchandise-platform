# INTERVIEW_PREP.md — MerchCraft Assessment (Personal Notes)

Not for submission. This is your prep doc for defending this project in the interview — architecture reasoning,
trade-offs, and likely questions with model answers.

---

## 1. Two-Minute Project Pitch (say this out loud first)

> "It's a full-stack MERN order management platform for a custom merchandise business — think 'design your own
> t-shirt' with a full checkout, payment, and fulfillment pipeline behind it. The interesting part isn't the
> CRUD — it's the **order lifecycle**: every order moves through a fixed 10-stage workflow from `ORDER_PLACED`
> to `DELIVERED`, and I modeled that as an explicit state machine on the backend so an order can never skip a
> stage or go backwards, no matter what the client sends. I also built the payment and shipping integrations as
> mock gateways that mirror Razorpay's and Shiprocket's real request/response contracts, so swapping in the real
> SDK later is a one-file change, not a rewrite."

That last sentence is your best line — it signals you think about *maintainability*, not just "does it work."

---

## 2. Architecture Walkthrough (file-by-file, what to point at)

| Concern | File | What to say |
|---|---|---|
| Order state machine | `backend/src/utils/orderWorkflow.js` | "Pure function, no DB/Express dependency — `canTransition(current, next)` returns `{ok, reason}`. Unit-testable in isolation, reused by both `orderController` and `shippingController`." |
| Auth | `backend/src/middleware/auth.js` + `authController.js` | Access token in memory, refresh token in httpOnly cookie, rotation on every refresh. |
| Error handling | `middleware/errorHandler.js` + `utils/ApiError.js` | Single error shape for every response; converts Mongoose validation/cast/duplicate-key errors automatically. |
| Data snapshotting | `models/Order.js` (`orderItemSchema`) | Order items store `name`, `unitPrice` etc. as a snapshot, not a live populate — historical orders don't change if a product is edited/deleted later. |
| Mock gateway contract | `controllers/paymentController.js`, `controllers/shippingController.js` | Same shape as the real Razorpay/Shiprocket flow (`create` → `verify`/`track`) so it's a drop-in swap later. |

---

## 3. The Order Workflow State Machine — deep dive

This is the part most likely to get probed hard, since it's the "hard" requirement in the brief
("Admin cannot skip workflow steps").

```js
const ORDER_STAGES = [
  "ORDER_PLACED", "PAYMENT_VERIFIED", "DESIGN_APPROVED", "PRINTING_IN_PROGRESS",
  "QUALITY_CHECK", "PACKED", "SHIPMENT_CREATED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED",
];
```

- `canTransition(current, next)` only allows `next === ORDER_STAGES[currentIndex + 1]`, or `CANCELLED` if
  `currentIndex < indexOf("PRINTING_IN_PROGRESS")`.
- This is enforced **only in the backend** (`orderController.updateOrderStatus`) — the frontend UI only ever
  offers the single valid next button, but that's UX, not security. **The real enforcement is server-side.**
  Say this explicitly if asked "how do you know a user can't skip a stage" — never rely on the client.
- `timeline` array on the `Order` document stores `{status, at, note}` for every transition — this is what
  powers the "✓ Order Placed / ✓ Payment Verified / ○ Shipped..." tracking UI in the spec.

**Q: Why an array of fixed strings instead of a separate `OrderStatus` collection / numeric enum?**
A: The workflow is fixed and known at compile time (it's specified in the assessment brief, not user-configurable).
A string enum in Mongoose + one array in a util file is simpler than a DB-driven state machine, and gives me
readable diffs and log output. If the business needed configurable/branching workflows per product category,
I'd model it differently — e.g., a `WorkflowTemplate` collection.

**Q: What if two admins update the same order at the same time (race condition)?**
A: Right now it's read-modify-write with Mongoose, so there's a narrow race window. In production I'd either
(a) use a MongoDB transaction with `findOneAndUpdate` conditioned on the *current* status (optimistic
concurrency: `Order.findOneAndUpdate({_id, status: current}, {status: next})` and check `matchedCount`), or
(b) put a version/`__v` check. Good to mention proactively — shows you know the gap.

---

## 4. Auth Deep Dive (JWT access + refresh rotation)

- **Access token**: 15 min expiry, signed with `JWT_ACCESS_SECRET`, sent in `Authorization: Bearer` header,
  kept **in memory only** on the frontend (a JS variable in `axios.js`), never localStorage — reduces XSS token
  theft blast radius (an XSS payload can still call authenticated APIs while the tab is open, but can't
  exfiltrate a token that persists after reload).
- **Refresh token**: 7 day expiry, signed with a *separate* secret, stored **httpOnly, sameSite=lax cookie** —
  JS can't read it, so XSS can't steal it directly. CSRF risk is mitigated by `sameSite=lax` (blocks cross-site
  POST) plus the fact that the refresh endpoint alone doesn't perform state-changing actions.
- **Rotation**: every call to `/auth/refresh` issues a *new* refresh token and removes the old one from
  `user.refreshTokens[]`. If a stolen refresh token is replayed after the legitimate client has already rotated
  it, the stolen one is no longer in the array → rejected. (Classic refresh-token-rotation-detects-theft
  pattern — mention this if asked about token security, it's a strong signal.)
- **Why store `refreshTokens` as an array on the user, not a single field?** Supports multiple concurrent
  sessions/devices; logout only removes *that* session's token, not all of them.

**Q: Why not just use one long-lived JWT and skip refresh tokens entirely?**
A: A single long-lived token can't be revoked without a server-side blocklist (defeats the "stateless JWT"
benefit) or by shortening its life so much that users get logged out constantly. Splitting into short-lived
access + rotatable refresh gets you both: fast, stateless auth checks on every request (verify signature,
done — no DB hit) and the ability to fully revoke a session (delete the refresh token) within its own request
cost.

**Q: Where's authorization (RBAC) enforced?**
A: `middleware/auth.js` → `authorize(...roles)` — checked at the route level for admin-only routes (products,
categories write ops, admin dashboard), and additionally *inside* controllers where the same route serves both
roles differently (e.g. `orderController.updateOrderStatus` — customer can cancel their own order, only admin
can advance the workflow; that "same endpoint, different rules" is handled with an explicit ownership +
role check inside the controller, not just route-level middleware).

---

## 5. Payment & Shipping — "mock but production-shaped"

This project uses a **mock payment gateway** and **mock shipping provider**, built deliberately to mirror the
real providers' contracts:

**Payment flow (mirrors Razorpay):**
```
POST /payments/create  { orderId }        → returns { paymentId, amount, currency }   (like razorpay.orders.create)
[client "completes" payment via provider's checkout UI — here, a button]
POST /payments/verify  { paymentId, simulateResult }  → verifies, updates Order status
```
In real Razorpay, `verify` would check an **HMAC signature** (`razorpay_signature`) computed from
`order_id|payment_id` using the secret key, instead of trusting `simulateResult` from the client. I documented
this in the code comment. **If asked "how would you secure this for real," say: verify the signature
server-side using the webhook/signature the gateway sends, never trust a client-asserted "success."**

**Shipping flow (mirrors Shiprocket):**
```
POST /shipping/create  { orderId }   → creates Shipment doc, generates trackingNumber, moves order PACKED → SHIPMENT_CREATED
GET  /shipping/:trackingId           → public tracking lookup
```

**Q: Why build mocks instead of just hardcoding a `status: "paid"` on the order?**
A: Two reasons. (1) The brief explicitly lists Payment ID / Transaction ID / status / date as required fields
to store — a real `Payment` collection with those fields is closer to what's actually asked for than a
hardcoded flag. (2) It keeps the architecture "pluggable" — the day I add the real Razorpay SDK, only
`paymentController.js` changes; `Order`, `orderController`, and the frontend checkout flow don't need to know
the gateway changed.

---

## 6. Data Modeling Choices (be ready to justify each)

- **Product ↔ Order**: Orders store a **snapshot** of product data (`name`, `unitPrice`, customization) rather
  than just an ObjectId ref. Why: if a product's price changes or it's deleted after checkout, historical
  orders and invoices must not change retroactively. This is a very common real-world e-commerce interview
  question — always mention "snapshot vs. live reference" trade-off.
- **Soft delete** (`isActive: false`) on `Product` and `Category` instead of hard delete — preserves referential
  integrity for existing orders/carts and allows "undelete."
- **Cart is per-user, one document, embedded items array** (not one doc per item) — cart reads/writes are
  always scoped to a single user and a small item count, so embedding avoids extra queries/joins. Would
  reconsider if carts could have hundreds of items (unlikely for this domain).
- **`Cart.subtotal` computed as a virtual**, not stored — always derived fresh from `unitPrice * quantity`,
  avoids a stale cached total bug class entirely.
- **Order tax/shipping computed server-side** (`cartController.computeTotals`) and reused in `orderController`
  — never trust a client-submitted total. Standard e-commerce security point, mention proactively.

---

## 7. Likely Interview Questions & Model Answers

**Q: Walk me through what happens end-to-end when a customer checks out.**
A: 1) Frontend calls `POST /orders` with `shippingAddress`. 2) Backend loads the user's cart, re-validates
stock and product availability for every line item (never trusts cached frontend cart totals), snapshots each
item, computes tax/shipping/total server-side, creates the `Order` at `ORDER_PLACED`, decrements product stock,
clears the cart. 3) Frontend immediately calls `POST /payments/create` to get a mock `paymentId`. 4) User
"pays" (mock UI), frontend calls `POST /payments/verify`; on success the order transitions to
`PAYMENT_VERIFIED` via the workflow state machine, and a timeline entry is appended. 5) Admin then advances
the order through the remaining stages from the admin panel, each transition re-validated server-side.

**Q: How would you prevent overselling if two customers check out the last unit at the same time?**
A: Current implementation does `Product.findByIdAndUpdate({$inc: {stock: -qty}})` after order creation — not
atomic with the availability check, so there's a race window. Correct fix: a single atomic update with a
guard condition, e.g. `Product.findOneAndUpdate({_id, stock: {$gte: qty}}, {$inc:{stock: -qty}})` and check
the returned doc is non-null before committing the order — that's atomic at the MongoDB document level. I'd
also wrap the whole checkout (multiple products) in a Mongo session/transaction for all-or-nothing semantics.
Be ready to say you know this is a gap in the current build — it shows maturity, not weakness.

**Q: Why Context API instead of Redux/Zustand?**
A: The shared state here is small and low-frequency-updating — auth user + cart. Context + `useState` is
enough and avoids the boilerplate/bundle cost of Redux for two contexts. I'd reach for Zustand or Redux Toolkit
if the app grew multiple independently-updating global slices (e.g. real-time notifications, complex filters
persisted across routes) where Context's "everything under a provider re-renders" behavior becomes a
performance problem.

**Q: How do you handle the "Customer can cancel order only before printing starts" rule?**
A: `canCancel(status)` checks `ORDER_STAGES.indexOf(status) < ORDER_STAGES.indexOf("PRINTING_IN_PROGRESS")`.
Enforced in `orderController.updateOrderStatus` for both self-service customer cancellation and admin-initiated
cancellation, so there's one source of truth instead of duplicating the rule in two code paths.

**Q: What's your error handling strategy?**
A: Every controller is wrapped in `asyncHandler` so rejected promises reach Express's error middleware instead
of crashing the process or needing try/catch everywhere. Errors are either a deliberate `ApiError(statusCode,
message)` thrown in a controller, or a raw Mongoose/JWT error that `errorHandler.js` normalizes into the same
`{success:false, message, errors}` shape — so the frontend has exactly one error contract to handle everywhere.

**Q: How would you add real email notifications (bonus feature mentioned in the brief)?**
A: I'd add a `notifications` service using something like Nodemailer + a transactional provider (SES/Resend),
triggered from the same place timeline entries are pushed in `orderController`/`paymentController` — probably
via a small event emitter or a queue (BullMQ, which I've used in other projects) so email sending doesn't block
the request/response cycle.

**Q: This is a monolith — how would you split it into microservices if it needed to scale?**
A: Natural service boundaries: **Catalog** (products/categories), **Order & Cart**, **Payments**, **Shipping**,
**Notifications** — each with its own DB, communicating over events (Kafka/RabbitMQ, which I've built demo
projects with) for things like "order paid → trigger shipping label," rather than direct synchronous calls,
so a shipping provider outage doesn't block checkout.

**Q: What would you test first if you had one more day?**
A: Unit tests for `orderWorkflow.canTransition`/`canCancel` (pure functions, highest ROI, no mocking needed),
then integration tests for the checkout → payment → status-transition happy path and the "skip a stage" /
"cancel after printing starts" rejection paths, since those are the explicit business rules in the brief.

---

## 8. Weak-Area Refresher (things to re-check before the call, based on your other prep docs)

You've flagged these as relative weak spots before — quick reminders specific to *this* project:

- **PostgreSQL/SQL**: this project used MongoDB, so if asked "why Mongo here, why Postgres elsewhere," answer:
  Mongo fits well when the schema is naturally document-shaped and nested (an order with embedded line items,
  a cart with embedded items) and you don't need multi-table joins/transactions across many entities. Postgres
  wins when you need strong relational integrity, complex joins/reporting, or multi-row transactions — e.g. a
  ledger/accounting system. Be ready to say which you'd pick for *this* domain if asked ("I'd actually consider
  Postgres for `Order`/`Payment` given the transactional nature of money, and keep `Product` catalog in Mongo" —
  a nuanced answer plays well).
- **Transactions**: Mongoose supports multi-document ACID transactions via `mongoose.startSession()` +
  `session.withTransaction()` — practice saying this out loud, since the checkout race-condition question above
  will likely come up.
- **TypeScript**: this project is plain JS. If asked why: matched the brief's explicit tech list, and time-boxed
  to 5–7 days. If pushed further: I'd add strict types for the API request/response DTOs first (highest
  bug-catching ROI), converting incrementally rather than a big-bang rewrite.

---

## 9. Things You Should Say Proactively (shows seniority even if not asked)

1. "Totals are always recomputed server-side, never trusted from the client" — one of the top 3 things
   interviewers look for in e-commerce backend candidates.
2. "Order line items are snapshotted, not live-joined" — same.
3. "The workflow rule is enforced server-side; the UI just reflects it" — security-mindset signal.
4. "The mock payment/shipping layers are built to the real providers' contract shape" — engineering-for-change
   signal.
5. Name the one known gap yourself (stock race condition) before they find it — controls the narrative.

---

## 10. Quick Command Reference (for the live demo if asked to run it)

```bash
# Backend
cd backend && npm install && npm run seed && npm run dev

# Frontend (separate terminal)
cd frontend && npm install && npm run dev

# Demo logins
Admin:    admin@merchstore.com / Admin@123
Customer: customer@merchstore.com / Customer@123
```

Suggested live demo flow: register/login as customer → browse products → open a product → customize
(size/color/print type/upload a design) → add to cart → checkout → simulate successful payment → show order
tracking timeline → log in as admin → advance the order through PRINTING_IN_PROGRESS → PACKED → create
shipment → show it now appears as SHIPMENT_CREATED with a tracking number → try to skip a stage from Postman/
curl to prove server-side enforcement (this is a great "let me show you" moment).
