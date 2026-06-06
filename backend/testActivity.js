import mongoose from "mongoose";
import dotenv from "dotenv";
import { logActivity } from "./src/services/activityLogger.js";
import path from "path";

dotenv.config({ path: path.resolve("../.env") });

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    const mockUserId = new mongoose.Types.ObjectId();
    const mockCompanyId = new mongoose.Types.ObjectId();

    await logActivity({
      userId: mockUserId,
      companyId: mockCompanyId,
      actionType: "RFQ_CREATED",
      entityType: "RFQ",
      entityId: "RFQ-200",
      description: "System created RFQ-200 for Development Laptops (Real DB Entry)"
    });

    await logActivity({
      userId: mockUserId,
      companyId: mockCompanyId,
      actionType: "VENDOR_INVITED",
      entityType: "RFQ",
      entityId: "RFQ-200",
      description: "System invited Dell HQ to RFQ-200 (Real DB Entry)"
    });

    console.log("Mock activities logged to actual DB successfully.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

test();
