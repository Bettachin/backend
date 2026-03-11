const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");

const router = express.Router();

// Admin login (only main_admin / sub_admin can log in here)
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is missing on server" });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!["main_admin", "sub_admin"].includes(user.role)) {
      return res.status(403).json({ message: "Not an admin account" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (e) {
    console.error("Admin login failed:", e);
    return res.status(500).json({ message: "Admin login failed", error: e.message });
  }
});

// Change own password
router.patch("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ message: "Current password incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated" });
  } catch (e) {
    console.error("Change password failed:", e);
    res.status(500).json({ message: "Change password failed", error: e.message });
  }
});

// Create sub-admin
router.post("/subadmins", auth, requireRole("main_admin"), async (req, res) => {
  try {
    const { username, password } = req.body;

    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ message: "Username already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const sub = await User.create({ username, password: hashed, role: "sub_admin" });

    res.json({ id: sub._id, username: sub.username, role: sub.role });
  } catch (e) {
    console.error("Create subadmin failed:", e);
    res.status(500).json({ message: "Create subadmin failed", error: e.message });
  }
});

// List sub-admins
router.get("/subadmins", auth, requireRole("main_admin"), async (req, res) => {
  try {
    const subs = await User.find({ role: "sub_admin" }).select("_id username role createdAt");
    res.json(subs);
  } catch (e) {
    console.error("List subadmins failed:", e);
    res.status(500).json({ message: "List subadmins failed", error: e.message });
  }
});

module.exports = router;