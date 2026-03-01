const express = require("express");
const Reservation = require("../models/Reservation");
const Boat = require("../models/Boat");
const auth = require("../middleware/auth");

const router = express.Router();

// Create reservation (GPS NOT required)
router.post("/", auth, async (req, res) => {
  const { boatId, date, startTime, endTime, passengers } = req.body;

  const boat = await Boat.findById(boatId);
  if (!boat) return res.status(404).json({ message: "Boat not found" });

  if (boat.status !== "available") {
    return res.status(400).json({ message: "Boat is not available" });
  }

  if (passengers > boat.maxPassengers) {
    return res.status(400).json({ message: `Max passengers is ${boat.maxPassengers}` });
  }

  const created = await Reservation.create({
    userId: req.user.id,
    boatId,
    date,
    startTime,
    endTime,
    passengers,
    status: "pending"
  });

  res.json(created);
});

module.exports = router;