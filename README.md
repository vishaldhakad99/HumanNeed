# HumanNeed — Multi-Vendor E-Commerce Marketplace

> **"Everything You Need, All in One Place."**

**HumanNeed** is a production-grade, highly secure, scalable multi-vendor Indian e-commerce marketplace built on the MERN stack (MongoDB Atlas, Express.js, React 18, Node.js). It combines the trusted usability of platforms like Flipkart and Amazon with an original brand identity, modern design system, and strict enterprise security.

---

## 🚀 Key Highlights & Philosophy

1. **Zero Dummy Data Guarantee**: Clean database start. No fake products, simulated reviews, or invented sales numbers. Empty states guide customers, sellers, and administrators gracefully until real data is published.
2. **Cryptographic Payment Integrity**: Razorpay payment gateway integration with server-side order calculation, HMAC-SHA256 signature verification, webhook validation, and Cash on Delivery (COD) support.
3. **Multi-Vendor Isolation**: Role-based access control (Customer, Seller, Admin). Strict seller isolation ensures sellers can only access and fulfill their own order items and inventory.
4. **Automated Test Coverage**: 100% passing automated test suite covering authentication, RBAC authorization, atomic inventory decrement/replenishment, order pricing engine, and payment cryptography.
5. **Modern Responsive Design**: Built with Vite, Tailwind CSS, Lucide icons, and Redux Toolkit. Fully responsive across desktop, tablet, and mobile with zero horizontal scrolling.

---

## 🎨 Brand Identity & Color Palette

- **Deep Navy Blue:** `#14213D` (Primary Brand & Navigation)
- **Royal Blue:** `#2563EB` (Primary Call to Action & Highlights)
- **Soft Orange:** `#F59E0B` (Accents, Deals & Star Ratings)
- **Pure White:** `#FFFFFF` (Cards & Surfaces)
- **Light Canvas:** `#F7F8FC` (Contrast Background)
- **Dark Text:** `#111827` (Headings & High-contrast text)
- **Muted Text:** `#6B7280` (Secondary details)
- **Success Green:** `#16A34A` (In stock, Delivered, Paid)
- **Error Red:** `#DC2626` (Out of stock, Cancelled, Alerts)

---

## 🏗️ System Architecture

```
HumanNeed/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection, Env validation, Razorpay client
│   │   ├── models/          # 15+ Mongoose Schemas (User, Product, Order, Seller, etc.)
│   │   ├── controllers/     # Modular business logic controllers
│   │   ├── routes/          # REST endpoints with rate limiters and auth guards
│   │   ├── middleware/      # Auth, Role RBAC, Zod Validator, Helmet, Multer, Audit
│   │   ├── services/        # Order service, Payment service, Analytics engine
│   │   ├── validators/      # Zod validation schemas
│   │   ├── utils/           # Standard API response, API error, JWT tokens, Logger
│   │   ├── app.js           # Express app with security headers & middlewares
│   │   └── server.js        # HTTP server with Socket.io & graceful shutdown
│   ├── tests/               # Automated test suites (Jest + Supertest)
│   ├── uploads/             # Product and avatar image uploads
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── assets/          # HumanNeedLogo SVG and brand vector assets
│   │   ├── components/      # Common UI, Product cards, Cart, Modals, Skeletons
│   │   ├── pages/
│   │   │   ├── customer/    # HomePage, ShopPage, ProductDetail, Cart, Checkout, Dashboard
│   │   │   ├── seller/      # SellerRegister, SellerDashboard, Products, Orders
│   │   │   └── admin/       # AdminDashboard, Users, Sellers, Orders, Categories, Coupons, Audit
│   │   ├── redux/           # Redux Toolkit slices (auth, cart, wishlist, compare, ui)
│   │   ├── services/        # Axios client with interceptors & auto token refresh
│   │   ├── App.jsx          # Route hierarchy with role guards
│   │   ├── main.jsx         # Entrypoint
│   │   └── index.css        # Tailwind directives and custom design tokens
│   ├── public/              # Favicon and static assets
│   ├── index.html           # SEO meta tags & Razorpay checkout script
│   ├── tailwind.config.js   # HumanNeed color tokens & extended shadows
│   └── package.json
└── README.md
```

---

## 🔒 Security Measures Implemented

- **Password Hashing**: BCrypt with 12 salt rounds.
- **JWT Authentication**: Short-lived access token + Refresh token rotation stored in HTTP-only cookies.
- **No Password Leaks**: `select: false` on password hash, with `toSafeObject()` sanitization.
- **Role-Based Access Control (RBAC)**: Backend-enforced authorization guards on all Seller and Admin routes. Frontend route checks mirror backend enforcement.
- **Cryptographic Signature Verification**: HMAC-SHA256 timing-safe comparison on Razorpay order payments and webhooks.
- **Rate Limiting**: Tiered limiters for general API, brute-force protection on authentication endpoints, and live search endpoints.
- **Server-Side Price Calculation**: Order amounts and coupon discounts are calculated strictly on the backend. Frontend prices are never trusted.
- **Atomic Stock Management**: MongoDB atomic `$inc` decrements on order confirmation and increments on order cancellation to prevent overselling.
- **Security Headers**: Configured via Helmet.
- **CORS Protection**: Origin-locked to configured client domains.

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+ or v22+)
- MongoDB Atlas cluster URL or local MongoDB instance

### 1. Backend Setup
```bash
cd backend

# Copy environment variables
cp .env.example .env

# Edit .env with your MongoDB Atlas URI and Razorpay keys (optional for test mode)
```

Example `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/humanneed?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_minimum_32_characters_long
JWT_REFRESH_SECRET=super_secret_refresh_jwt_key_minimum_32_characters_long
FRONTEND_URL=http://localhost:5173

# Optional: Set Razorpay test keys for online payments
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
```

Run tests to verify backend integrity:
```bash
npm test
```

Start backend development server:
```bash
npm run dev
# Server runs on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend

# Start frontend development server
npm run dev
# App runs on http://localhost:5173
```

---

## 💳 Razorpay Payment Gateway Setup

HumanNeed natively integrates Razorpay:
- **Test Mode**: Obtain your test credentials (`rzp_test_...`) from [dashboard.razorpay.com](https://dashboard.razorpay.com) -> Settings -> API Keys.
- Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend/.env`.
- If keys are omitted, the application displays a friendly test configuration notice and permits immediate checkout via **Cash on Delivery (COD)**.

---

## 🧪 Testing Results

All 4 test suites pass with 100% green status:
- `tests/payment_and_order.test.js`: Validates cryptographic HMAC-SHA256 signature verification and atomic inventory reservation.
- `tests/seller_and_admin.test.js`: Validates unapproved seller protection, admin verification approval, and cross-seller data isolation.
- `tests/auth.test.js`: Validates registration, duplicate email rejection, weak password rejection, and JWT session handling.
- `tests/pricing_and_cart.test.js`: Validates subtotal, percentage coupons with maximum discount caps, fixed coupons, and free delivery thresholds.

---

## 🚢 Production Deployment

- **Frontend (Vercel)**:
  - Framework: Vite
  - Build command: `npm run build`
  - Output directory: `dist`
  - Environment variable: `VITE_API_BASE_URL` (if not using proxy).
- **Backend (Render / Railway)**:
  - Environment: Node
  - Build command: `npm install`
  - Start command: `node src/server.js`
  - Configure environment variables from `.env.example`.

---

© 2026 HumanNeed Marketplace Private Limited. Built with pride for Indian e-commerce.
