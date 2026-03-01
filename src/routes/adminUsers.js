const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");

const router = express.Router();

/*
  GET all users
  Only MAIN ADMIN can access
*/
router.get("/", auth, requireRole("main_admin"), async (req, res) => {
  const users = await User.find().select("_id email role createdAt");
  res.json(users);
});

/*
  DELETE user
  Only MAIN ADMIN
*/
router.delete("/:id", auth, requireRole("main_admin"), async (req, res) => {
  const { id } = req.params;

  // Prevent deleting yourself
  if (req.user.id === id) {
    return res.status(400).json({ message: "You cannot delete your own account." });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Prevent deleting main admin
  if (user.role === "main_admin") {
    return res.status(403).json({ message: "Cannot delete main admin." });
  }

  await user.deleteOne();

  res.json({ message: "User deleted successfully." });
});

module.exports = router;