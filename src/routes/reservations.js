const express = require("express");
const auth = require("../middleware/auth");
const Reservation = require("../models/Reservation");
const Boat = require("../models/Boat");

const router = express.Router();

const toMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// Create reservation (NO GPS required)
router.post("/", auth, async (req, res) => {
  const { boatId, date, startTime, endTime, passengers } = req.body;

  if (!boatId || !date || !startTime || !endTime || !passengers) {
    return res.status(400).json({ message: "Missing fields" });
  }
  if (toMinutes(endTime) <= toMinutes(startTime)) {
    return res.status(400).json({ message: "End time must be later than start time" });
  }

  const boat = await Boat.findById(boatId);
  if (!boat) return res.status(404).json({ message: "Boat not found" });

  if (boat.status !== "available") {
    return res.status(400).json({ message: "Boat is not available" });
  }

  const limit = boat.maxPassengers || 4;
  if (passengers > limit) {
    return res.status(400).json({ message: `Max passengers is ${limit}` });
  }

  // conflict check: any overlapping reservation that isn't rejected
  const existing = await Reservation.find({
    boatId,
    date,
    status: { $ne: "rejected" },
  });

  const s = toMinutes(startTime);
  const e = toMinutes(endTime);

  const conflictWith = existing.find((r) => {
    const rs = toMinutes(r.startTime);
    const re = toMinutes(r.endTime);
    return s < re && e > rs; // overlap
  });

  if (conflictWith) {
    return res.status(409).json({
      message: "Schedule conflict",
      conflictWith: {
        startTime: conflictWith.startTime,
        endTime: conflictWith.endTime,
        status: conflictWith.status,
      },
    });
  }

  const created = await Reservation.create({
    userId: req.user.id,
    boatId,
    date,
    startTime,
    endTime,
    passengers,
    status: "pending",
  });

  res.json(created);
});

// conflict check endpoint used by mobile
router.post("/check", auth, async (req, res) => {
  const { boatId, date, startTime, endTime } = req.body;

  if (!boatId || !date || !startTime || !endTime) {
    return res.status(400).json({ message: "Missing fields" });
  }
  if (toMinutes(endTime) <= toMinutes(startTime)) {
    return res.json({ conflict: false });
  }

  const existing = await Reservation.find({
    boatId,
    date,
    status: { $ne: "rejected" },
  });

  const s = toMinutes(startTime);
  const e = toMinutes(endTime);

  const conflictWith = existing.find((r) => {
    const rs = toMinutes(r.startTime);
    const re = toMinutes(r.endTime);
    return s < re && e > rs;
  });

  if (conflictWith) {
    return res.json({
      conflict: true,
      conflictWith: {
        startTime: conflictWith.startTime,
        endTime: conflictWith.endTime,
        status: conflictWith.status,
      },
    });
  }

  res.json({ conflict: false });
});

module.exports = router;