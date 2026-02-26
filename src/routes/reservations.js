const express = require("express");
const Reservation = require("../models/Reservation");
const auth = require("../middleware/auth");

const router = express.Router();

// Create reservation (mobile)
router.post("/", auth, async (req, res) => {
  try {
    const reservation = await Reservation.create({
      ...req.body,
      userId: req.user.id
    });
    res.json(reservation);
  } catch (e) {
    res.status(400).json({ message: "Reservation create failed", error: e.message });
  }
});

// Get my reservations (mobile)
router.get("/mine", auth, async (req, res) => {
  const data = await Reservation.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(data);
});

// Admin list (web admin can use later)
router.get("/", async (req, res) => {
  const data = await Reservation.find().sort({ createdAt: -1 });
  res.json(data);
});

// Admin approve/reject
router.patch("/:id", async (req, res) => {
  const updated = await Reservation.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
});

module.exports = router;
