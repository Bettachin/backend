const express = require("express");
const Reservation = require("../models/Reservation");

const router = express.Router();

// Create reservation (mobile user)
router.post("/", async (req, res) => {
  try {
    const reservation = await Reservation.create(req.body);
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all reservations (admin)
router.get("/", async (req, res) => {
  try {
    const reservations = await Reservation.find();
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update reservation status (approve/reject)
router.patch("/:id", async (req, res) => {
  try {
    const updated = await Reservation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
