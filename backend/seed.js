// Run with: node seed.js
// Creates an admin account and a few sample tables so you can demo the app immediately.
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Table from "./models/Table.js";

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected. Seeding data...");

  const adminEmail = "admin@restaurant.com";
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      name: "Restaurant Admin",
      email: adminEmail,
      password: "admin123",
      role: "admin",
    });
    console.log(`Admin created -> email: ${adminEmail} | password: admin123`);
  } else {
    console.log("Admin already exists, skipping.");
  }

  const tableCount = await Table.countDocuments();
  if (tableCount === 0) {
    await Table.insertMany([
      { label: "Table 1", capacity: 2, location: "indoor" },
      { label: "Table 2", capacity: 2, location: "indoor" },
      { label: "Table 3", capacity: 4, location: "indoor" },
      { label: "Table 4", capacity: 4, location: "outdoor" },
      { label: "Table 5", capacity: 6, location: "outdoor" },
      { label: "Rooftop 1", capacity: 4, location: "rooftop" },
      { label: "Rooftop 2", capacity: 8, location: "rooftop" },
      { label: "Private Room", capacity: 10, location: "private" },
    ]);
    console.log("Sample tables created.");
  } else {
    console.log("Tables already exist, skipping.");
  }

  console.log("Seeding complete.");
  process.exit(0);
};

run().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
