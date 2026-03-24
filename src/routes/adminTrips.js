const express = require("express");
const auth = require("../middleware/auth");
const TripLog = require("../models/TripLog");
const Boat = require("../models/Boat");
const syncTrips = require("../utils/tripSync");

const router = express.Router();

const isAdminRole = (role) =>
  ["main_admin", "sub_admin", "admin", "subadmin"].includes(role);

// Active trips only
router.get("/", auth, async (req, res) => {
  try {
    if (!isAdminRole(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // don't let sync failure crash endpoint
    try {
      await syncTrips();
    } catch (syncErr) {
      console.error("[TRIPS/active] syncTrips failed:", syncErr);
    }

    const trips = await TripLog.find({ status: "active" }).sort({ startedAt: -1 });

    res.json(
      trips.map((t) => ({
        _id: t._id,
        reservationId: t.reservationId || null,
        userId: t.userId || null,
        boatId: t.boatId || null,
        boatName: t.boatName || "Unknown Boat",
        date: t.date || "",
        plannedStartTime: t.plannedStartTime || "",
        plannedEndTime: t.plannedEndTime || "",
        passengers: typeof t.passengers === "number" ? t.passengers : 0,
        startedAt: t.startedAt || null,
        endedAt: t.endedAt || null,
        status: t.status || "active",
        createdAt: t.createdAt || null,
      }))
    );
  } catch (e) {
    console.error("[TRIPS/active] failed:", e);
    res.status(500).json({ message: "Failed to load active trips", error: e.message });
  }
});

// Trip history only
router.get("/history", auth, async (req, res) => {
  try {
    if (!isAdminRole(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      await syncTrips();
    } catch (syncErr) {
      console.error("[TRIPS/history] syncTrips failed:", syncErr);
    }

    const trips = await TripLog.find({ status: "completed" }).sort({ endedAt: -1, createdAt: -1 });

    res.json(
      trips.map((t) => ({
        _id: t._id,
        reservationId: t.reservationId || null,
        userId: t.userId || null,
        boatId: t.boatId || null,
        boatName: t.boatName || "Unknown Boat",
        date: t.date || "",
        plannedStartTime: t.plannedStartTime || "",
        plannedEndTime: t.plannedEndTime || "",
        passengers: typeof t.passengers === "number" ? t.passengers : 0,
        startedAt: t.startedAt || null,
        endedAt: t.endedAt || null,
        status: t.status || "completed",
        createdAt: t.createdAt || null,
      }))
    );
  } catch (e) {
    console.error("[TRIPS/history] failed:", e);
    res.status(500).json({ message: "Failed to load trip history", error: e.message });
  }
});

// End active trip manually
router.patch("/end/:tripId", auth, async (req, res) => {
  try {
    if (!isAdminRole(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const trip = await TripLog.findById(req.params.tripId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (trip.status !== "active") {
      return res.status(400).json({ message: "Trip is already completed" });
    }

    trip.status = "completed";
    trip.endedAt = new Date();
    await trip.save();

    if (trip.boatId) {
      await Boat.findByIdAndUpdate(trip.boatId, {
        status: "available",
      });
    }

    res.json({
      message: "Trip ended successfully",
      trip: {
        _id: trip._id,
        boatName: trip.boatName || "Unknown Boat",
        date: trip.date || "",
        plannedStartTime: trip.plannedStartTime || "",
        plannedEndTime: trip.plannedEndTime || "",
        passengers: typeof trip.passengers === "number" ? trip.passengers : 0,
        startedAt: trip.startedAt || null,
        endedAt: trip.endedAt || null,
        status: trip.status,
      },
    });
  } catch (e) {
    console.error("[TRIPS/end] failed:", e);
    res.status(500).json({ message: "Failed to end trip", error: e.message });
  }
});

module.exports = router;