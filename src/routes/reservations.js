const express = require("express");
const auth = require("../middleware/auth");
const Reservation = require("../models/Reservation");
const Boat = require("../models/Boat");

const router = express.Router();

const toMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

function isOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

// ✅ POST /api/reservations/check  (auth required)
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
    return isOverlap(s, e, rs, re);
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

// ✅ POST /api/reservations  (create reservation, auth required)
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

  // conflict check
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
    return isOverlap(s, e, rs, re);
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

// ✅ GET /api/reservations  (admin sees all, user sees own)
router.get("/", auth, async (req, res) => {
  const isAdmin = ["main_admin", "sub_admin"].includes(req.user.role);
  const filter = isAdmin ? {} : { userId: req.user.id };

  const list = await Reservation.find(filter)
    .populate("boatId", "name")
    .sort({ createdAt: -1 });

  res.json(
    list.map((r) => ({
      _id: r._id,
      date: r.date,
      startTime: r.startTime,
      endTime: r.endTime,
      passengers: r.passengers,
      status: r.status,
      boat: r.boatId ? { id: r.boatId._id, name: r.boatId.name } : null,
      createdAt: r.createdAt,
    }))
  );
});

// ✅ PATCH /api/reservations/:id  (approve/reject, admin only)
router.patch("/:id", auth, async (req, res) => {
  const isAdmin = ["main_admin", "sub_admin"].includes(req.user.role);
  if (!isAdmin) return res.status(403).json({ message: "Forbidden" });

  const { status } = req.body;
  if (!["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const updated = await Reservation.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).populate("boatId", "name");

  if (!updated) return res.status(404).json({ message: "Reservation not found" });

  res.json({
    _id: updated._id,
    date: updated.date,
    startTime: updated.startTime,
    endTime: updated.endTime,
    passengers: updated.passengers,
    status: updated.status,
    boat: updated.boatId ? { id: updated.boatId._id, name: updated.boatId.name } : null,
    createdAt: updated.createdAt,
  });
});

module.exports = router;