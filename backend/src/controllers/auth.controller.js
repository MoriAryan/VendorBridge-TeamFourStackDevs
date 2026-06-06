import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { ActivityLog } from "../models/activityLog.model.js";
import jwt from "jsonwebtoken";

// ─────────────────────────────────────────────────────────────
// Cookie options — httpOnly + secure as required by AI_RULES.md
// ─────────────────────────────────────────────────────────────
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};

// ─────────────────────────────────────────────────────────────
// Helper: Generate both tokens and set cookies
// ─────────────────────────────────────────────────────────────
const generateAndSetTokens = async (user, res) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Save refresh token hash to DB for revocation capability
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days
  });

  return { accessToken, refreshToken };
};

// =====================================================================
// REGISTER
// POST /api/v1/auth/register
// =====================================================================
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, companyName, gstNumber, phone, country } =
    req.body;

  // Validate required fields — early return pattern (AI_RULES.md Rule 4)
  if (!name?.trim()) throw new ApiError(400, "Name is required");
  if (!email?.trim()) throw new ApiError(400, "Email is required");
  if (!password) throw new ApiError(400, "Password is required");
  if (password.length < 6)
    throw new ApiError(400, "Password must be at least 6 characters");

  // Validate role
  const allowedRoles = ["admin", "procurement_officer", "vendor", "approver"];
  const userRole = role && allowedRoles.includes(role) ? role : "procurement_officer";

  // Check duplicate email
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  // Create user — password hashed by pre-save hook (AI_RULES.md Rule 8)
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: userRole,
    companyName: companyName?.trim(),
    gstNumber: gstNumber?.trim(),
    phone: phone?.trim(),
    country: country?.trim() || "India",
  });

  // Activity tracking (Rule 7)
  await ActivityLog.create({
    action: `New user registered: ${user.name} (${user.role})`,
    entityType: "User",
    entityId: user._id,
    performedBy: user._id,
    details: { email: user.email, role: user.role },
  }).catch(() => {}); // Fire-and-forget

  // Generate tokens and set cookies
  const { accessToken } = await generateAndSetTokens(user, res);

  // Return user without sensitive fields
  const safeUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyName: user.companyName,
  };

  return res.status(201).json(
    new ApiResponse(201, { user: safeUser, accessToken }, "Account created successfully")
  );
});

// =====================================================================
// LOGIN
// POST /api/v1/auth/login
// =====================================================================
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim()) throw new ApiError(400, "Email is required");
  if (!password) throw new ApiError(400, "Password is required");

  // Fetch user with password (select: false by default, so explicitly include it)
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+password"
  );

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated");
  }

  // Compare password using schema method (fat model, skinny controller)
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Generate tokens and set cookies
  const { accessToken } = await generateAndSetTokens(user, res);

  // Activity tracking
  await ActivityLog.create({
    action: `User logged in: ${user.name}`,
    entityType: "User",
    entityId: user._id,
    performedBy: user._id,
    details: { role: user.role },
  }).catch(() => {});

  const safeUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyName: user.companyName,
  };

  return res.status(200).json(
    new ApiResponse(200, { user: safeUser, accessToken }, "Logged in successfully")
  );
});

// =====================================================================
// LOGOUT
// POST /api/v1/auth/logout
// =====================================================================
const logout = asyncHandler(async (req, res) => {
  // Clear refresh token from DB to revoke session
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

  // Clear cookies
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  return res.status(200).json(new ApiResponse(200, {}, "Logged out successfully"));
});

// =====================================================================
// REFRESH TOKEN
// POST /api/v1/auth/refresh-token
// =====================================================================
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "No refresh token provided");
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded._id).select("+refreshToken");
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token mismatch — please log in again");
  }

  const { accessToken } = await generateAndSetTokens(user, res);

  return res
    .status(200)
    .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
});

// =====================================================================
// GET CURRENT USER
// GET /api/v1/auth/me
// =====================================================================
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched"));
});

export { register, login, logout, refreshAccessToken, getCurrentUser };
