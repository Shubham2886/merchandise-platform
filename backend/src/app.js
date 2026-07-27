const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const { errorHandler, notFound } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const shippingRoutes = require("./routes/shippingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

// --- Global middleware ---
app.use(helmet({ crossOriginResourcePolicy: false })); // sets secure HTTP headers; disabled CORP so /uploads images load cross-origin
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // required so the httpOnly refresh-token cookie is sent/received
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

// Basic rate limiting on auth endpoints to slow down brute-force attempts
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false });
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);

// Serve uploaded design/product images statically
app.use("/uploads", express.static(path.join(__dirname, "..", process.env.UPLOAD_DIR || "uploads")));

app.get("/api/v1/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// --- API routes ---
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/shipping", shippingRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/upload", uploadRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
