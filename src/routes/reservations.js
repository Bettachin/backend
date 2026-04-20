const express = require("express");
const auth = require("../middleware/auth");
const Reservation = require("../models/Reservation");
const Boat = require("../models/Boat");
const syncTrips = require("../utils/tripSync");

const router = express.Router();

const toMinutes = (t) => {
  if (!t || typeof t !== "string" || !t.includes(":")) return 0;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

function isOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

const isAdminRole = (role) =>
  ["main_admin", "sub_admin", "admin", "subadmin"].includes(role);

// conflict check
router.post("/check", auth, async (req, res) => {
  try {
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
  } catch (e) {
    console.error("[RESERVATIONS/check] failed:", e);
    res.status(500).json({ message: "Failed to check reservation conflict", error: e.message });
  }
});

// create reservation
router.post("/", auth, async (req, res) => {
  try {
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
      rejectNote: "",
    });

    res.json(created);
  } catch (e) {
    console.error("[RESERVATIONS/create] failed:", e);
    res.status(500).json({ message: "Failed to create reservation", error: e.message });
  }
});

// list reservations
router.get("/", auth, async (req, res) => {
  try {
    // ✅ don't let syncTrips crash reservations page
    try {
      await syncTrips();
    } catch (syncErr) {
      console.error("[RESERVATIONS/list] syncTrips failed:", syncErr);
    }

    const isAdmin = isAdminRole(req.user.role);
    const filter = isAdmin ? {} : { userId: req.user.id };

    const list = await Reservation.find(filter)
      .populate("boatId", "name")
      .sort({ createdAt: -1 });

    res.json(
      list.map((r) => ({
        _id: r._id,
        date: r.date || "",
        startTime: r.startTime || "",
        endTime: r.endTime || "",
        passengers: typeof r.passengers === "number" ? r.passengers : 0,
        status: r.status || "pending",
        rejectNote: r.rejectNote || "",
        boat: r.boatId
          ? {
              id: r.boatId._id || null,
              name: r.boatId.name || "Unknown Boat",
            }
          : null,
        createdAt: r.createdAt || null,
      }))
    );
  } catch (e) {
    console.error("[RESERVATIONS/list] failed:", e);
    res.status(500).json({ message: "Failed to load reservations", error: e.message });
  }
});

// approve / reject
router.patch("/:id", auth, async (req, res) => {
  try {
    const { status, rejectNote } = req.body;

    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    const isAdmin = isAdminRole(req.user.role);
    const isOwner = reservation.userId.toString() === req.user.id;

    // -----------------------------
    // 👤 USER ACTION (CANCEL ONLY)
    // -----------------------------
    if (!isAdmin) {
      if (!isOwner) {
        return res.status(403).json({ message: "Not your reservation" });
      }

      if (!["pending", "approved"].includes(reservation.status)) {
        return res.status(400).json({ message: "Cannot cancel this reservation" });
      }

      reservation.status = "rejected"; // treat as cancelled
      reservation.rejectNote = "Cancelled by user";

      await reservation.save();
      return res.json(reservation);
    }

    // -----------------------------
    // 👑 ADMIN ACTION (APPROVE / REJECT)
    // -----------------------------
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    reservation.status = status;
    reservation.rejectNote = status === "rejected" ? (rejectNote || "") : "";

    await reservation.save();

    res.json(reservation);
  } catch (e) {
    console.error("[RESERVATIONS/update] failed:", e);
    res.status(500).json({ message: "Failed to update reservation", error: e.message });
  }
});

// delete rejected reservation only
router.delete("/:id", auth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    const isAdmin = isAdminRole(req.user.role);
    const isOwner = reservation.userId.toString() === req.user.id;

    // 👤 USER CAN ONLY DELETE THEIR OWN REJECTED RESERVATIONS
    if (!isAdmin) {
      if (!isOwner) {
        return res.status(403).json({ message: "Not your reservation" });
      }

      if (reservation.status !== "rejected") {
        return res.status(400).json({ message: "Only rejected reservations can be deleted" });
      }

      await Reservation.findByIdAndDelete(req.params.id);
      return res.json({ message: "Deleted successfully" });
    }

    // 👑 ADMIN CAN DELETE ANY REJECTED RESERVATION
    if (reservation.status !== "rejected") {
      return res.status(400).json({ message: "Only rejected reservations can be deleted" });
    }

    await Reservation.findByIdAndDelete(req.params.id);

    res.json({ message: "Deleted successfully" });
  } catch (e) {
    console.error("[RESERVATIONS/delete] failed:", e);
    res.status(500).json({ message: "Failed to delete reservation", error: e.message });
  }
});

module.exports = router;