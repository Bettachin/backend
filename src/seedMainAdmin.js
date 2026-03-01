require("dotenv").config();
const bcrypt = require("bcrypt");
const connectDB = require("./config/db");
const User = require("./models/User");

async function seed() {
  try {
    await connectDB();

    const username = process.env.MAIN_ADMIN_USER || "admin";
    const password = process.env.MAIN_ADMIN_PASS || "admin123";

    const existing = await User.findOne({ role: "main_admin" });

    if (existing) {
      console.log("Main admin already exists:", existing.username);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      username,
      password: hashed,
      role: "main_admin"
    });

    console.log("✅ Main admin created successfully!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();