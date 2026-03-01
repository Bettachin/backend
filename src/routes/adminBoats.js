const express = require("express");
const Boat = require("../models/Boat");
const auth = require("../middleware/auth");
const router = express.Router();

router.patch("/:id/status", auth, async (req, res) => {
  if (!["main_admin", "sub_admin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { status } = req.body;
  if (!["available", "unavailable"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const boat = await Boat.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!boat) return res.status(404).json({ message: "Boat not found" });

  res.json(boat);
});

module.exports = router;