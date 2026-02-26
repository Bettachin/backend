const express = require("express");
const Reservation = require("../models/Reservation");
const auth = require("../middleware/auth");

const router = express.Router();

const toMinutes = (t) => {
  const [h, m] = String(t).split(":").map(Number);
  return h * 60 + m;
};

const overlaps = (aStart, aEnd, bStart, bEnd) => {
  // overlap if start < otherEnd AND end > otherStart
  return aStart < bEnd && aEnd > bStart;
};

// POST /api/reservations/check
router.post("/check", auth, async (req, res) => {
  const { boatId, date, startTime, endTime } = req.body;
  if (!boatId || !date || !startTime || !endTime) {
    return res.status(400).json({ message: "boatId, date, startTime, endTime required" });
  }

  const reqStart = toMinutes(startTime);
  const reqEnd = toMinutes(endTime);
  if (reqEnd <= reqStart) {
    return res.status(400).json({ message: "Invalid time range" });
  }

  // Find existing reservations for same boat + date that are pending/approved
  const existing = await Reservation.find({
    boatId,
    date,
    status: { $in: ["pending", "approved"] },
  });

  for (const r of existing) {
    const rStart = toMinutes(r.startTime);
    const rEnd = toMinutes(r.endTime);
    if (overlaps(reqStart, reqEnd, rStart, rEnd)) {
      return res.json({
        conflict: true,
        conflictWith: {
          _id: r._id,
          startTime: r.startTime,
          endTime: r.endTime,
          status: r.status,
        },
      });
    }
  }

  return res.json({ conflict: false });
});

module.exports = router;
