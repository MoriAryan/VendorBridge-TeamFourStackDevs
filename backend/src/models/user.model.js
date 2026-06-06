import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: ["admin", "procurement_officer", "vendor", "approver"],
      default: "procurement_officer",
      required: true,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    // For vendor profiles — company name, GST, contact
    companyName: {
      type: String,
      trim: true,
    },
    gstNumber: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      default: "India",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    // Vendor-specific fields
    vendorCategory: {
      type: String,
      trim: true,
      // e.g. "Furniture", "IT Hardware", "Logistics", "Construction", etc.
    },
  },
  { timestamps: true }
);

// ======================================================
// Pre-save Hook: Hash password before writing to DB
// Fat model, skinny controller — bcrypt stays in the schema
// ======================================================
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return; // Critical: avoid re-hashing on every save
  this.password = await bcrypt.hash(this.password, 10);
});

// ======================================================
// Instance Methods: Token generation and password check
// JWT logic must live in schema methods, not controllers
// ======================================================
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d" }
  );
};

export const User = mongoose.model("User", userSchema);
