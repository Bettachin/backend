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

    await syncTrips();

    const trips = await TripLog.find({ status: "active" }).sort({ startedAt: -1 });
    res.json(trips);
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

    await syncTrips();

    const trips = await TripLog.find({ status: "completed" }).sort({ endedAt: -1 });
    res.json(trips);
  } catch (e) {
    console.error("[TRIPS/history] failed:", e);
    res.status(500).json({ message: "Failed to load trip history", error: e.message });
  }
});

// manual end trip if needed
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

    await Boat.findByIdAndUpdate(trip.boatId, {
      status: "available",
    });

    res.json({
      message: "Trip ended successfully",
      trip,
    });
  } catch (e) {
    console.error("[TRIPS/end] failed:", e);
    res.status(500).json({ message: "Failed to end trip", error: e.message });
  }
});

module.exports = router;