import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "../db/index.js";

dotenv.config();

const PORT = process.env.PORT || 8000;

// ============================================
// Server Initialization
// ============================================
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Startup Failed:", error.message);
    // Exit the process if DB connection fails
    // An app without its DB is a zombie
    process.exit(1);
  });