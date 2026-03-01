const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");

const router = express.Router();

// Admin login (no public registration)
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
});

// Change own password (main/sub can do this)
router.patch("/change-password", auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id);
  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) return res.status(400).json({ message: "Current password incorrect" });

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ message: "Password updated" });
});

// Create sub-admin (ONLY main admin)
router.post("/subadmins", auth, requireRole("main_admin"), async (req, res) => {
  const { username, password } = req.body;

  const exists = await User.findOne({ username });
  if (exists) return res.status(409).json({ message: "Username already exists" });

  const hashed = await bcrypt.hash(password, 10);
  const sub = await User.create({ username, password: hashed, role: "sub_admin" });

  res.json({ id: sub._id, username: sub.username, role: sub.role });
});

// List sub-admins (ONLY main admin)
router.get("/subadmins", auth, requireRole("main_admin"), async (req, res) => {
  const subs = await User.find({ role: "sub_admin" }).select("_id username role createdAt");
  res.json(subs);
});

module.exports = router;