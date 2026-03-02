const express = require("express");
const auth = require("../middleware/auth");
const SOS = require("../models/SOS");
const Boat = require("../models/Boat");

const router = express.Router();

// User sends SOS
router.post("/", auth, async (req, res) => {
  const { boatId, message, raw, filtered } = req.body;

  if (!boatId) return res.status(400).json({ message: "boatId is required" });

  const boat = await Boat.findById(boatId);
  if (!boat) return res.status(404).json({ message: "Boat not found" });

  const event = await SOS.create({
    userId: req.user.id,
    boatId,
    message: message || "",
    raw: raw || null,
    filtered: filtered || null,
    status: "active",
  });

  res.json({ ok: true, eventId: event._id });
});

module.exports = router;