import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";

dotenv.config();

const seed = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB.");

    const usersToUpsert = [
      {
        name: "Admin User",
        email: "admin@arya.com",
        password: "password123",
        role: "admin"
      },
      {
        name: "Procurement Officer",
        email: "po@arya.com",
        password: "password123",
        role: "procurement_officer"
      },
      {
        name: "Procurement Head",
        email: "head@arya.com",
        password: "password123",
        role: "procurement_head"
      },
      {
        name: "Finance Manager",
        email: "finance@arya.com",
        password: "password123",
        role: "finance_manager"
      },
      {
        name: "Vendor 1",
        email: "vendor1@arya.com",
        password: "password123",
        role: "vendor",
        companyName: "Acme Corp"
      }
    ];

    for (const u of usersToUpsert) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = new User(u);
        await user.save();
        console.log(`Created ${u.role}: ${u.email}`);
      } else {
        user.role = u.role;
        // Optionally update password if needed, but since we are just fixing roles:
        user.password = u.password;
        user.name = u.name;
        if (u.companyName) user.companyName = u.companyName;
        await user.save();
        console.log(`Updated ${u.role}: ${u.email}`);
      }
    }

    console.log("Seeding complete.");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding roles:", err);
    process.exit(1);
  }
};

seed();
