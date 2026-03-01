const express = require("express");
const Boat = require("../models/Boat");
const auth = require("../middleware/auth");
const router = express.Router();

// allow both main_admin and sub_admin to update boat status (your choice)
// if you want only main_admin, add requireRole("main_admin")
router.patch("/:id/status", auth, async (req, res) => {
  // if you store role in token, enforce:
  if (!["main_admin", "sub_admin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { status } = req.body;
  if (!["available", "unavailable"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const updated = await Boat.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  res.json(updated);
});

module.exports = router;