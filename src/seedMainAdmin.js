require("dotenv").config();
const bcrypt = require("bcrypt");
const connectDB = require("./config/db");
const User = require("./models/User");

async function run() {
  await connectDB();

  const username = "admin";
  const password = "admin123";
  const hash = await bcrypt.hash(password, 10);

  let user = await User.findOne({ username });

  if (user) {
    user.password = hash;
    user.role = "main_admin";
    if (!user.name) user.name = "Main Admin";
    await user.save();
    console.log("✅ Admin updated");
    process.exit(0);
  }

  await User.create({
    username,
    password: hash,
    role: "main_admin",
    name: "Main Admin",
  });

  console.log("✅ Admin created");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});