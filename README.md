# MerchCraft — Custom Merchandise E-commerce & Order Management Platform

A full-stack MERN application for a custom merchandise business. Customers can browse products, customize
merchandise (size/color/print type/print location/artwork upload), check out through a mock payment gateway,
and track their order through a 10-stage fulfillment workflow. Admins manage products, categories, orders,
payments, and view a sales dashboard.

Built for the **MERN Full Stack Developer Assessment** brief.

---

## Tech Stack

**Frontend:** React 19 (Vite), React Router v6, Context API, Tailwind CSS v4, Axios
**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT (access + refresh rotation)
**Payments:** Mock gateway with a Razorpay-style contract (`create` → `verify`)
**Shipping:** Mock provider with a Shiprocket-style contract (`create shipment` → `track`)
**File uploads:** Multer (product images / customer design artwork)

---

## Project Structure

```
merchandise-platform/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection
│   │   ├── models/          # Mongoose schemas
│   │   ├── controllers/     # Route handlers / business logic
│   │   ├── routes/          # Express routers
│   │   ├── middleware/      # auth, error handling, validation
│   │   ├── utils/           # ApiError, ApiResponse, asyncHandler, order workflow state machine
│   │   ├── seed/            # Demo data seeder
│   │   ├── app.js
│   │   └── server.js
│   ├── uploads/              # Uploaded product images / design files (served statically)
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios instance with JWT + refresh interceptor
│   │   ├── context/           # AuthContext, CartContext
│   │   ├── components/        # Navbar, ProductCard, OrderTimeline, ProtectedRoute
│   │   ├── pages/              # Customer pages
│   │   └── pages/admin/        # Admin panel pages
│   ├── .env.example
│   └── Dockerfile
├── docker-compose.yml
├── README.md                  # this file
└── INTERVIEW_PREP.md          # personal interview-prep notes (not part of the submission)
```

---

## 1. Prerequisites

- Node.js 18+ and npm
- MongoDB running locally (`mongodb://127.0.0.1:27017`) **or** a MongoDB Atlas connection string
- (Optional) Docker + Docker Compose, if you prefer running everything in containers

---

## 2. Environment Variables

### Backend (`backend/.env`) — copy from `backend/.env.example`

| Variable | Description | Example |
|---|---|---|
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `CLIENT_URL` | Frontend origin (for CORS) | `http://localhost:5173` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/merch_platform` |
| `JWT_ACCESS_SECRET` | Secret for short-lived access tokens | long random string |
| `JWT_REFRESH_SECRET` | Secret for long-lived refresh tokens | long random string |
| `JWT_ACCESS_EXPIRES` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRES` | Refresh token lifetime | `7d` |
| `PAYMENT_MODE` | `mock` (default) or `razorpay` if wired up later | `mock` |
| `SHIPPING_MODE` | `mock` (default) or `shiprocket` if wired up later | `mock` |
| `UPLOAD_DIR` | Local folder for uploaded files | `uploads` |
| `MAX_FILE_SIZE_MB` | Max upload size | `5` |

### Frontend (`frontend/.env`) — copy from `frontend/.env.example`

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API | `http://localhost:5000/api/v1` |

---

## 3. Database Setup

1. Start MongoDB locally, or create a free MongoDB Atlas cluster and copy its connection string into `MONGO_URI`.
2. No manual schema setup is needed — Mongoose creates collections/indexes automatically on first write.
3. Run the seed script to populate demo categories, products, and users (see below).

---

## 4. Setup & Run (Local, without Docker)

### Backend

```bash
cd backend
cp .env.example .env      # then edit values if needed
npm install
npm run seed               # populates demo categories, products, admin & customer accounts
npm run dev                 # starts on http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # starts on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## 5. Setup & Run (Docker)

```bash
docker compose up --build
```

This starts MongoDB, the backend (port 5000), and the frontend (port 5173) together. After the containers are
up, seed the database once:

```bash
docker compose exec backend npm run seed
```

---

## 6. Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@merchstore.com` | `Admin@123` |
| Customer | `customer@merchstore.com` | `Customer@123` |

(Created automatically by `npm run seed`.)

---

## 7. API Documentation

All endpoints are prefixed with `/api/v1`. Protected routes require `Authorization: Bearer <accessToken>`.

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a new customer |
| POST | `/auth/login` | Public | Login, returns access token + sets refresh-token cookie |
| POST | `/auth/refresh` | Public (cookie) | Rotates refresh token, returns new access token |
| POST | `/auth/logout` | Auth | Revokes refresh token |
| GET  | `/auth/me` | Auth | Current user profile |

### Products
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/products` | Public | List/search/filter products (`search, category, minPrice, maxPrice, size, color, printType, sort, page, limit`) |
| GET | `/products/:id` | Public | Product detail |
| POST | `/products` | Admin | Create product |
| PUT | `/products/:id` | Admin | Update product |
| DELETE | `/products/:id` | Admin | Soft-delete (deactivate) product |

### Categories
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/categories` | Public | List active categories |
| POST | `/categories` | Admin | Create category |
| PUT | `/categories/:id` | Admin | Update category |
| DELETE | `/categories/:id` | Admin | Deactivate category |

### Cart
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/cart` | Customer | Get current cart + computed totals |
| POST | `/cart` | Customer | Add item (with size/color/printType/printLocation/designUrl/quantity) |
| PUT | `/cart/:itemId` | Customer | Update item quantity |
| DELETE | `/cart/:itemId` | Customer | Remove item |

### Orders
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/orders` | Customer | Checkout — converts cart into an order (`shippingAddress` required) |
| GET | `/orders` | Auth | Customer: own orders. Admin: all orders (`status, page, limit` filters) |
| GET | `/orders/:id` | Auth | Order detail (owner or admin only) |
| PATCH | `/orders/:id/status` | Auth | Advance workflow (admin, next-stage only) or cancel (owner/admin, pre-printing only) |

### Payments (mock, Razorpay-style contract)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/payments/create` | Customer | Create a payment intent for an order |
| POST | `/payments/verify` | Customer | Verify/simulate payment result, advances order to `PAYMENT_VERIFIED` on success |
| GET | `/payments` | Admin | View all payment records |

### Shipping (mock, Shiprocket-style contract)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/shipping/create` | Admin | Creates a shipment for a `PACKED` order, advances to `SHIPMENT_CREATED` |
| GET | `/shipping/:trackingId` | Public | Track a shipment by tracking number |

### Admin
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/admin/dashboard` | Admin | Sales dashboard metrics |
| GET | `/admin/customers` | Admin | List customers |

### Uploads
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/upload` | Auth | Upload a product image / design artwork file (`multipart/form-data`, field `file`) |

---

## 8. Order Workflow

Orders move through a fixed, non-skippable 10-stage lifecycle, enforced server-side in
`backend/src/utils/orderWorkflow.js`:

```
ORDER_PLACED → PAYMENT_VERIFIED → DESIGN_APPROVED → PRINTING_IN_PROGRESS →
QUALITY_CHECK → PACKED → SHIPMENT_CREATED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
```

- Customers may cancel only while the order is at `ORDER_PLACED`, `PAYMENT_VERIFIED`, or `DESIGN_APPROVED`
  (i.e. before printing starts).
- Admins can only move an order to the **immediate next** stage — skipping stages (e.g. `ORDER_PLACED → DELIVERED`)
  is rejected with a `400`.
- `PACKED → SHIPMENT_CREATED` happens via `POST /shipping/create`, which also generates a mock tracking number
  and courier assignment.

---

## 9. Notes on Design Decisions

- **Soft deletes** for products/categories (`isActive: false`) so historical orders keep referencing valid data
  even after a product is "deleted".
- **Order line items are snapshotted** (name, price, customization) at checkout time, so later product edits
  never change historical order records.
- **JWT strategy:** short-lived access token kept in memory on the frontend (not localStorage, to reduce XSS
  exposure) + long-lived refresh token in an httpOnly cookie, with rotation and multi-device revocation support.
- **Mock payment/shipping gateways** are built with the same request/response contract as Razorpay and
  Shiprocket, so swapping in real SDKs later only touches `paymentController.js` / `shippingController.js`.

---

## 10. Known Limitations / Next Steps

- Stock decrement on checkout is not wrapped in a MongoDB multi-document transaction (would require a replica
  set); documented as a improvement for high-concurrency production use.
- No automated test suite included (bonus item, not implemented due to time constraints).
- Real payment/shipping gateway integration, coupons, wishlist, and email notifications are left as bonus
  extensions per the assessment brief.
