const express = require("express");
const auth = require("../middleware/auth");
const Reservation = require("../models/Reservation");

const router = express.Router();

// ✅ List reservations
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

module.exports = router;