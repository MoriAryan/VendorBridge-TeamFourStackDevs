import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

/**
 * Auth Middleware — Verifies the incoming JWT token.
 * Checks both cookies and Authorization header (Bearer token).
 * Attaches req.user for downstream controllers.
 */
export const verifyJWT = asyncHandler(async (req, _, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized — No access token provided");
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired access token");
  }

  const user = await User.findById(decodedToken?._id).select(
    "-password -refreshToken"
  );

  if (!user) {
    throw new ApiError(401, "Unauthorized — User not found");
  }

  req.user = user;
  next();
});

/**
 * Role Guard Middleware factory.
 * Usage: requireRole("admin", "procurement_officer")
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized — Not authenticated"));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Forbidden — Requires one of these roles: ${roles.join(", ")}`
        )
      );
    }
    next();
  };
};
