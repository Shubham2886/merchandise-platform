const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// Short-lived access token (sent in JSON, kept in memory on the client)
const signAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" });

// Long-lived refresh token (sent as httpOnly cookie, used to mint new access tokens)
const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d" });

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// POST /auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, "An account with this email already exists.");

  // Never trust client-supplied role blindly for privilege escalation in a public
  // register endpoint; only allow 'admin' if explicitly seeded/created by another admin.
  const user = await User.create({ name, email, password, phone, role: role === "admin" ? "customer" : "customer" });

  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  user.refreshTokens = [refreshToken];
  await user.save();

  res.cookie("refreshToken", refreshToken, cookieOptions);
  res.status(201).json(new ApiResponse(201, { user: user.toSafeObject(), accessToken }, "Registered successfully"));
});

// POST /auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password +refreshTokens");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  user.refreshTokens = [...(user.refreshTokens || []), refreshToken].slice(-5); // cap stored tokens per user
  await user.save();

  res.cookie("refreshToken", refreshToken, cookieOptions);
  res.status(200).json(new ApiResponse(200, { user: user.toSafeObject(), accessToken }, "Login successful"));
});

// POST /auth/refresh - rotates refresh token, issues a new access token
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, "No refresh token provided.");

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token.");
  }

  const user = await User.findById(decoded.id).select("+refreshTokens");
  if (!user || !user.refreshTokens.includes(token)) {
    throw new ApiError(401, "Refresh token not recognized (possibly reused/revoked).");
  }

 const newRefreshToken = signRefreshToken(user._id);

await User.findByIdAndUpdate(user._id, {
  $pull: { refreshTokens: token },
});

await User.findByIdAndUpdate(user._id, {
  $push: {
    refreshTokens: {
      $each: [newRefreshToken],
      $slice: -5,
    },
  },
});

  res.cookie("refreshToken", newRefreshToken, cookieOptions);
  res.status(200).json(new ApiResponse(200, { accessToken: signAccessToken(user._id) }, "Token refreshed"));
});

// POST /auth/logout
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token && req.user) {
    req.user.refreshTokens = (req.user.refreshTokens || []).filter((t) => t !== token);
    await req.user.save();
  }
  res.clearCookie("refreshToken", cookieOptions);
  res.status(200).json(new ApiResponse(200, null, "Logged out"));
});

// GET /auth/me
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user.toSafeObject()));
});

module.exports = { register, login, refresh, logout, getMe };
