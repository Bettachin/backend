const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    console.log("ADMIN LOGIN BODY:", req.body);

    if (!username || !password) {
      return res.status(400).json({ message: "username and password are required" });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!["main_admin", "sub_admin"].includes(user.role)) {
      return res.status(403).json({ message: "Not an admin account" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing");
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    const token = jwt.sign(
      {
        id: String(user._id),
        username: user.username,
        role: user.role,
        name: user.name || user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: String(user._id),
        username: user.username,
        name: user.name || user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("ADMIN LOGIN ERROR:", err);
    return res.status(500).json({
      message: "Admin login failed",
      error: err.message,
    });
  }
});

router.patch("/change-password", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Missing token" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }

    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (!["main_admin", "sub_admin"].includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Current password incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: "Password updated" });
  } catch (err) {
    console.error("ADMIN CHANGE PASSWORD ERROR:", err);
    return res.status(500).json({
      message: "Change password failed",
      error: err.message,
    });
  }
});

module.exports = router;