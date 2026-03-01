const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

// CREATE SUB ADMIN (main admin only)
router.post("/sub-admin", auth, requireRole("main_admin"), async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Missing username/password" });
  }

  const exists = await User.findOne({ username });
  if (exists) {
    return res.status(409).json({ message: "Username already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);

  const subAdmin = await User.create({
    username,
    password: hashed,
    role: "sub_admin"
  });

  res.json({
    id: subAdmin._id,
    username: subAdmin.username,
    role: subAdmin.role
  });
});

// LIST SUB ADMINS (main only)
router.get("/sub-admins", auth, requireRole("main_admin"), async (req, res) => {
  const subs = await User.find({ role: "sub_admin" }).select("-password");
  res.json(subs);
});

module.exports = router;